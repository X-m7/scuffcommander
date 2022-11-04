use scuffcommander_core::plugins::obs::{OBSConfig, OBSConnector};
use scuffcommander_core::plugins::{PluginInstance, PluginStates, PluginType};

#[tauri::command]
pub async fn get_obs_scenes(
    plugins_data: tauri::State<'_, PluginStates>,
) -> Result<Vec<String>, String> {
    let mut plugins = plugins_data.plugins.lock().await;

    let Some(PluginInstance::OBS(obs)) = plugins.get_mut(&PluginType::OBS) else {
        return Err("OBS plugin not configured".to_string());
    };

    let scenes = obs.get_scene_list().await?;

    let mut scene_names = Vec::new();
    for scene in scenes {
        scene_names.push(scene.name);
    }
    Ok(scene_names)
}

#[tauri::command]
pub async fn test_obs_connection(conf: OBSConfig) -> Result<bool, ()> {
    let mut conn = OBSConnector::new(conf).await;

    Ok(conn.get_obs_version().await.is_ok())
}
