#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use async_std::fs::write;
use async_std::sync::Mutex;
use scuffcommander::plugins::{PluginInstance, PluginStates, PluginType};
use scuffcommander::{ActionConfig, AppConfig};

use scuffcommander::plugins::obs::{OBSConfig, OBSConnector};
use scuffcommander::plugins::vts::{VTSConfig, VTSConnector};

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
fn get_config(conf_state: tauri::State<'_, AppConfigState>) -> AppConfig {
    conf_state.0.clone()
}

#[tokio::main]
async fn main() {
    let args: Vec<String> = std::env::args().collect();

    if args.len() == 1 {
        println!("Configuration folder required");
        return;
    };

    let conf_path = format!("{}/config.json", args[1]);
    let actions_path = format!("{}/actions.json", args[1]);

    let conf = AppConfig::from_file(&conf_path);

    tauri::Builder::default()
        .manage(AppConfigState(conf.clone()))
        .manage(PluginStates::init(conf.plugins).await)
        .manage(ActionConfigState(Mutex::new(ActionConfig::from_file(
            &actions_path,
        ))))
        .manage(ConfigFolder(args[1].clone()))
        .invoke_handler(tauri::generate_handler![
            get_obs_scenes,
            test_obs_connection,
            test_vts_connection,
            save_config,
            get_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
