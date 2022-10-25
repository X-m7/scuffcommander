use super::ActionConfigState;
use scuffcommander_core::plugins::{PluginStates, PluginType};
use scuffcommander_core::{Action, Condition};
use serde_json::value::Value;

pub async fn get_condition_action_from_ui(
    plugin_type: PluginType,
    plugin_data: Value,
    then_action: String,
    else_action: Option<String>,
    actions_state: &tauri::State<'_, ActionConfigState>,
    plugins_state: &tauri::State<'_, PluginStates>,
) -> Result<Action, String> {
    if let Some(plugin) = plugins_state.plugins.lock().await.get_mut(&plugin_type) {
        let condition = Condition::from_json(plugin, plugin_data).await?;
        let actions = &mut actions_state.0.lock().await.actions;

        if !actions.contains_key(&then_action) {
            return Err("Action with given ID does not exist".to_string());
        }
        let then_action = actions.get(&then_action).unwrap().clone();

        if let Some(else_action) = else_action {
            if !actions.contains_key(&else_action) {
                return Err("Action with given ID does not exist".to_string());
            }

            Ok(Action::If(
                condition,
                Box::new(then_action),
                Some(Box::new(actions.get(&else_action).unwrap().clone())),
            ))
        } else {
            Ok(Action::If(condition, Box::new(then_action), None))
        }
    } else {
        Err("Selected plugin has not been configured".to_string())
    }
}

#[tauri::command]
pub async fn add_new_condition_action(
    id: String,
    plugin_type: PluginType,
    plugin_data: Value,
    then_action: String,
    else_action: Option<String>,
    actions_state: tauri::State<'_, ActionConfigState>,
    plugins_state: tauri::State<'_, PluginStates>,
) -> Result<(), String> {
    if id.is_empty() {
        return Err("ID can't be empty".to_string());
    }

    let action = get_condition_action_from_ui(
        plugin_type,
        plugin_data,
        then_action,
        else_action,
        &actions_state,
        &plugins_state,
    )
    .await?;
    let actions = &mut actions_state.0.lock().await.actions;

    if actions.contains_key(&id) {
        return Err("Action with given ID already exists".to_string());
    }

    actions.insert(id, action);

    Ok(())
}
