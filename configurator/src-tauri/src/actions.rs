use scuffcommander_core::action::{Action, ActionConfig};
use scuffcommander_core::plugins::PluginStates;
use tokio::fs::write;
use tokio::sync::Mutex;

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
pub async fn add_new_action(
    id: String,
    action: Action,
    overwrite: bool,
    actions_state: tauri::State<'_, ActionConfigState>,
) -> Result<(), String> {
    if id.is_empty() {
        return Err("ID can't be empty".to_string());
    }

    let actions = &mut actions_state.0.lock().await.actions;

    if !overwrite && actions.contains_key(&id) {
        return Err("Action with given ID already exists".to_string());
    }
    actions.insert(id, action);

    Ok(())
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

    let Some(action) = actions.get(&id) else {
        return Err("Action with given ID not found".to_string());
    };

    Ok(action.clone())
}

#[tauri::command]
pub async fn run_action(
    action: Action,
    plugins_data: tauri::State<'_, PluginStates>,
) -> Result<(), String> {
    action.run(&plugins_data.plugins).await?;

    Ok(())
}
