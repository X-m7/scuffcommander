#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use scuffcommander::{AppConfig, ActionConfig};
use scuffcommander::plugins::{PluginStates, PluginInstance, PluginType};
use async_std::sync::Mutex;

struct ActionConfigState(Mutex<ActionConfig>);

#[tauri::command]
async fn get_obs_scenes(plugins_data: tauri::State<'_, PluginStates>) -> Result<Vec<String>, String> {
    let mut plugins = plugins_data.plugins.lock().await;

    if let Some(PluginInstance::OBS(obs)) = plugins.get_mut(&PluginType::OBS) {
        let scenes = obs.get_scene_list().await;
        if let Err(e) = scenes {
            return Err(e);
        }

        let scenes = scenes.unwrap();
        let mut scene_names = Vec::new();
        for scene in scenes {
            scene_names.push(scene.name);
        }
        Ok(scene_names)
    } else {
        Err("OBS plugin not configured".to_string())
    }
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
        .manage(PluginStates::init(conf.plugins).await)
        .manage(ActionConfigState(Mutex::new(ActionConfig::from_file(&actions_path))))
        .invoke_handler(tauri::generate_handler![get_obs_scenes])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
