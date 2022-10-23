use super::ActionConfigState;
use async_std::sync::Mutex;
use scuffcommander_core::plugins::{PluginAction, PluginStates, PluginType};
use scuffcommander_core::Action;
use serde_json::value::Value;

pub struct TemporaryChain(pub Mutex<Vec<Action>>);

#[tauri::command]
pub async fn clear_temp_chain(temp_chain: tauri::State<'_, TemporaryChain>) -> Result<(), ()> {
    temp_chain.0.lock().await.clear();

    Ok(())
}

#[tauri::command]
pub async fn store_temp_chain(
    id: String,
    actions_state: tauri::State<'_, ActionConfigState>,
    temp_chain: tauri::State<'_, TemporaryChain>,
) -> Result<(), String> {
    let actions = &mut actions_state.0.lock().await.actions;
    if actions.contains_key(&id) {
        return Err("Action with given ID already exists".to_string());
    }

    actions.insert(id, Action::Chain(temp_chain.0.lock().await.clone()));

    Ok(())
}

// Takes a chain action ID and copies it over to the temporary chain for modification
#[tauri::command]
pub async fn copy_action_to_temp_chain(
    id: String,
    actions_state: tauri::State<'_, ActionConfigState>,
    temp_chain: tauri::State<'_, TemporaryChain>,
) -> Result<(), String> {
    let actions = &mut actions_state.0.lock().await.actions;
    if !actions.contains_key(&id) {
        return Err("Action with given ID does not exist".to_string());
    }

    let action = actions.get(&id).unwrap();

    if let Action::Chain(chain) = action {
        let _ = std::mem::replace(&mut *temp_chain.0.lock().await, chain.clone());
        Ok(())
    } else {
        Err("Action with given ID is not a chain".to_string())
    }
}

#[tauri::command]
pub async fn add_new_single_action_to_temp_chain(
    plugin_type: PluginType,
    plugin_data: Value,
    plugins_state: tauri::State<'_, PluginStates>,
    temp_chain: tauri::State<'_, TemporaryChain>,
) -> Result<(), String> {
    if let Some(plugin) = plugins_state.plugins.lock().await.get_mut(&plugin_type) {
        temp_chain.0.lock().await.push(Action::Single(
            PluginAction::from_json(plugin, plugin_data).await?,
        ));
        Ok(())
    } else {
        Err("Selected plugin has not been configured".to_string())
    }
}

#[tauri::command]
pub async fn get_temp_chain_display(
    temp_chain: tauri::State<'_, TemporaryChain>,
) -> Result<Vec<String>, ()> {
    let mut vec = Vec::new();

    for action in &*temp_chain.0.lock().await {
        vec.push(action.to_string());
    }

    Ok(vec)
}
