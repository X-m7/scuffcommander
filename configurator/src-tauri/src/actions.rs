pub mod chain;
pub mod condition;

use async_std::fs::write;
use async_std::sync::Mutex;
use scuffcommander_core::plugins::{PluginAction, PluginStates, PluginType};
use scuffcommander_core::{Action, ActionConfig};
use serde_json::value::Value;

pub struct ActionConfigState(pub Mutex<ActionConfig>);

#[tauri::command]
pub async fn save_actions(
    actions_state: tauri::State<'_, ActionConfigState>,
    conf_state: tauri::State<'_, super::config::ConfigFolder>,
) -> Result<(), String> {
    match write(
        format!("{}/actions.json", &conf_state.0),
        serde_json::to_string_pretty(&*actions_state.0.lock().await).expect("Not ActionConfig?"),
    )
    .await
    {
        Ok(_) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn get_actions(
    actions_state: tauri::State<'_, ActionConfigState>,
) -> Result<Vec<String>, ()> {
    let mut actions_vec = Vec::new();
    let actions = &actions_state.0.lock().await.actions;

    for action in actions.keys() {
        actions_vec.push(action.clone());
    }

    actions_vec.sort_unstable();

    Ok(actions_vec)
}

#[tauri::command]
pub async fn add_new_single_action(
    id: String,
    plugin_type: PluginType,
    plugin_data: Value,
    actions_state: tauri::State<'_, ActionConfigState>,
    plugins_state: tauri::State<'_, PluginStates>,
) -> Result<(), String> {
    if id.is_empty() {
        return Err("ID can't be empty".to_string());
    }

    if let Some(plugin) = plugins_state.plugins.lock().await.get_mut(&plugin_type) {
        let action = PluginAction::from_json(plugin, plugin_data).await?;
        let actions = &mut actions_state.0.lock().await.actions;
        if actions.contains_key(&id) {
            return Err("Action with given ID already exists".to_string());
        }
        actions.insert(id, Action::Single(action));

        Ok(())
    } else {
        Err("Selected plugin has not been configured".to_string())
    }
}

#[tauri::command]
pub async fn delete_action(
    id: String,
    actions_state: tauri::State<'_, ActionConfigState>,
) -> Result<(), String> {
    let actions = &mut actions_state.0.lock().await.actions;
    if actions.remove(&id).is_none() {
        return Err("Action with given ID does not exist".to_string());
    }

    Ok(())
}

#[tauri::command]
pub async fn load_action_details(
    id: String,
    actions_state: tauri::State<'_, ActionConfigState>,
) -> Result<Action, String> {
    let actions = &actions_state.0.lock().await.actions;

    let action = actions.get(&id);

    if action.is_none() {
        return Err("Action with given ID not found".to_string());
    }

    Ok(action.unwrap().clone())
}

#[tauri::command]
pub fn convert_action_to_string(action: Action) -> String {
    format!("{}", action)
}
