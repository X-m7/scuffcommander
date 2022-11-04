use super::ActionConfigState;
use scuffcommander_core::plugins::{PluginStates, PluginType};
use scuffcommander_core::{Action, Condition};
use serde_json::value::Value;

#[derive(serde::Serialize, serde::Deserialize)]
pub struct ConditionActionData {
    pub plugin_type: PluginType,
    pub plugin_data: Value,
    pub then_action: String,
    pub else_action: Option<String>,
}

pub async fn get_condition_action_from_ui(
    action_data: ConditionActionData,
    actions_state: &tauri::State<'_, ActionConfigState>,
    plugins_state: &tauri::State<'_, PluginStates>,
) -> Result<Action, String> {
    let mut plugins = plugins_state.plugins.lock().await;

    let Some(plugin) = plugins.get_mut(&action_data.plugin_type)
    else {
        return Err("Selected plugin has not been configured".to_string());
    };

    let condition = Condition::from_json(plugin, action_data.plugin_data).await?;
    let actions = &mut actions_state.0.lock().await.actions;

    if !actions.contains_key(&action_data.then_action) {
        return Err("Action with given ID does not exist".to_string());
    }
    let then_action = actions.get(&action_data.then_action).unwrap().clone();

    let Some(else_action) = action_data.else_action else {
        return Ok(Action::If(condition, Box::new(then_action), None));
    };

    if !actions.contains_key(&else_action) {
        return Err("Action with given ID does not exist".to_string());
    }

    Ok(Action::If(
        condition,
        Box::new(then_action),
        Some(Box::new(actions.get(&else_action).unwrap().clone())),
    ))
}

#[tauri::command]
pub async fn add_new_condition_action(
    id: String,
    action_data: ConditionActionData,
    overwrite: bool,
    actions_state: tauri::State<'_, ActionConfigState>,
    plugins_state: tauri::State<'_, PluginStates>,
) -> Result<(), String> {
    if id.is_empty() {
        return Err("ID can't be empty".to_string());
    }

    let action = get_condition_action_from_ui(action_data, &actions_state, &plugins_state).await?;
    let actions = &mut actions_state.0.lock().await.actions;

    if !overwrite && actions.contains_key(&id) {
        return Err("Action with given ID already exists".to_string());
    }

    actions.insert(id, action);

    Ok(())
}
