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
    overwrite: bool,
) -> Result<(), String> {
    let actions = &mut actions_state.0.lock().await.actions;
    if !overwrite && actions.contains_key(&id) {
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

// if index is given the behaviour is the same as the insert method of Vec
#[tauri::command]
pub async fn add_new_single_action_to_temp_chain(
    plugin_type: PluginType,
    plugin_data: Value,
    index: Option<usize>,
    plugins_state: tauri::State<'_, PluginStates>,
    temp_chain: tauri::State<'_, TemporaryChain>,
) -> Result<(), String> {
    if let Some(plugin) = plugins_state.plugins.lock().await.get_mut(&plugin_type) {
        let action = Action::Single(PluginAction::from_json(plugin, plugin_data).await?);
        let mut temp_chain = temp_chain.0.lock().await;
        if let Some(i) = index {
            temp_chain.insert(i, action);
        } else {
            temp_chain.push(action);
        }
        Ok(())
    } else {
        Err("Selected plugin has not been configured".to_string())
    }
}

// if index is given the behaviour is the same as the insert method of Vec
#[tauri::command]
pub async fn add_new_condition_action_to_temp_chain(
    action_data: super::condition::ConditionActionData,
    index: Option<usize>,
    actions_state: tauri::State<'_, ActionConfigState>,
    plugins_state: tauri::State<'_, PluginStates>,
    temp_chain: tauri::State<'_, TemporaryChain>,
) -> Result<(), String> {
    let action =
        super::condition::get_condition_action_from_ui(action_data, &actions_state, &plugins_state)
            .await?;

    let mut temp_chain = temp_chain.0.lock().await;
    if let Some(i) = index {
        temp_chain.insert(i, action);
    } else {
        temp_chain.push(action);
    }

    Ok(())
}

#[tauri::command]
pub async fn delete_entry_from_temp_chain(
    index: usize,
    temp_chain: tauri::State<'_, TemporaryChain>,
) -> Result<(), ()> {
    temp_chain.0.lock().await.remove(index);

    Ok(())
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
