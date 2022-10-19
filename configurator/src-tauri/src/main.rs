#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use async_std::fs::write;
use async_std::sync::Mutex;
use scuffcommander_core::plugins::{PluginAction, PluginInstance, PluginStates, PluginType};
use scuffcommander_core::{Action, ActionConfig, AppConfig};
use serde_json::value::Value;

use scuffcommander_core::plugins::obs::{OBSConfig, OBSConnector};
use scuffcommander_core::plugins::vts::{VTSConfig, VTSConnector};

struct ActionConfigState(Mutex<ActionConfig>);
struct AppConfigState(AppConfig);
struct ConfigFolder(String);

#[tauri::command]
async fn get_obs_scenes(
    plugins_data: tauri::State<'_, PluginStates>,
) -> Result<Vec<String>, String> {
    let mut plugins = plugins_data.plugins.lock().await;

    if let Some(PluginInstance::OBS(obs)) = plugins.get_mut(&PluginType::OBS) {
        let scenes = obs.get_scene_list().await?;

        let mut scene_names = Vec::new();
        for scene in scenes {
            scene_names.push(scene.name);
        }
        Ok(scene_names)
    } else {
        Err("OBS plugin not configured".to_string())
    }
}

// Need Result as return due to Tauri bug 2533
#[tauri::command]
async fn test_obs_connection(conf: OBSConfig) -> Result<bool, ()> {
    let mut conn = OBSConnector::new(conf).await;

    Ok(conn.get_obs_version().await.is_ok())
}

#[tauri::command]
async fn test_vts_connection(conf: VTSConfig) -> Result<bool, ()> {
    let mut conn = VTSConnector::new(conf).await;

    Ok(conn.get_vts_version().await.is_ok())
}

#[tauri::command]
async fn save_config(
    conf: AppConfig,
    conf_state: tauri::State<'_, ConfigFolder>,
) -> Result<(), String> {
    match write(
        format!("{}/config.json", &conf_state.0),
        serde_json::to_string_pretty(&conf).expect("Not AppConfig?"),
    )
    .await
    {
        Ok(_) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn save_actions(
    actions_state: tauri::State<'_, ActionConfigState>,
    conf_state: tauri::State<'_, ConfigFolder>,
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
fn get_config(conf_state: tauri::State<'_, AppConfigState>) -> AppConfig {
    conf_state.0.clone()
}

#[tauri::command]
async fn get_actions(
    actions_state: tauri::State<'_, ActionConfigState>,
) -> Result<Vec<String>, ()> {
    let mut actions_vec = Vec::new();
    let actions = &actions_state.0.lock().await.actions;

    for action in actions.keys() {
        actions_vec.push(action.clone());
    }

    Ok(actions_vec)
}

#[tauri::command]
async fn get_vts_expression_names(
    plugins_data: tauri::State<'_, PluginStates>,
) -> Result<Vec<String>, String> {
    let mut plugins = plugins_data.plugins.lock().await;

    if let Some(PluginInstance::VTS(vts)) = plugins.get_mut(&PluginType::VTS) {
        vts.get_expression_name_list().await
    } else {
        Err("VTS plugin not configured".to_string())
    }
}

#[tauri::command]
async fn get_vts_model_names(
    plugins_data: tauri::State<'_, PluginStates>,
) -> Result<Vec<String>, String> {
    let mut plugins = plugins_data.plugins.lock().await;

    if let Some(PluginInstance::VTS(vts)) = plugins.get_mut(&PluginType::VTS) {
        vts.get_model_name_list().await
    } else {
        Err("VTS plugin not configured".to_string())
    }
}

#[tauri::command]
async fn add_new_single_action(
    id: String,
    plugin_type: PluginType,
    plugin_data: Value,
    actions_state: tauri::State<'_, ActionConfigState>,
) -> Result<(), String> {
    if id.is_empty() {
        return Err("ID can't be empty".to_string());
    }

    let action = PluginAction::from_json(plugin_type, plugin_data)?;
    let actions = &mut actions_state.0.lock().await.actions;
    if actions.contains_key(&id) {
        return Err("Action with given ID already exists".to_string());
    }
    actions.insert(id, Action::Single(action));

    Ok(())
}

#[tauri::command]
async fn load_action_details(id: String, actions_state: tauri::State<'_, ActionConfigState>) -> Result<Action, String> {
    let actions = &actions_state.0.lock().await.actions;

    let action = actions.get(&id);

    if action.is_none() {
        return Err("Action with given ID not found".to_string());
    }

    Ok(action.unwrap().clone())
}

#[tokio::main]
async fn main() {
    tauri::async_runtime::set(tokio::runtime::Handle::current());

    let args: Vec<String> = std::env::args().collect();

    if args.len() == 1 {
        println!("Configuration folder required");
        return;
    };

    // cd to config directory so relative paths (for example for the VTS token file) goes there
    std::env::set_current_dir(&args[1]).expect("Unable to open given config directory");

    let conf = AppConfig::from_file("config.json");

    tauri::Builder::default()
        .manage(AppConfigState(conf.clone()))
        .manage(PluginStates::init(conf.plugins).await)
        .manage(ActionConfigState(Mutex::new(ActionConfig::from_file(
            "actions.json",
        ))))
        .manage(ConfigFolder(
            std::env::current_dir()
                .expect("Invalid current dir?")
                .display()
                .to_string(),
        ))
        .invoke_handler(tauri::generate_handler![
            get_obs_scenes,
            test_obs_connection,
            test_vts_connection,
            save_config,
            get_config,
            get_actions,
            get_vts_expression_names,
            get_vts_model_names,
            add_new_single_action,
            load_action_details,
            save_actions
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
