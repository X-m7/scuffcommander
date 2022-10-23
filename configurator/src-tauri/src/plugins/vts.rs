use scuffcommander_core::plugins::vts::{VTSConfig, VTSConnector};
use scuffcommander_core::plugins::{PluginInstance, PluginStates, PluginType};

#[tauri::command]
pub async fn test_vts_connection(conf: VTSConfig) -> Result<bool, ()> {
    let mut conn = VTSConnector::new(conf).await;

    Ok(conn.get_vts_version().await.is_ok())
}

#[tauri::command]
pub async fn get_vts_expression_names(
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
pub async fn get_vts_model_names(
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
pub async fn get_vts_expression_name_from_id(
    id: &str,
    plugins_data: tauri::State<'_, PluginStates>,
) -> Result<String, String> {
    let mut plugins = plugins_data.plugins.lock().await;

    if let Some(PluginInstance::VTS(vts)) = plugins.get_mut(&PluginType::VTS) {
        vts.get_expression_name_from_id(id).await
    } else {
        Err("VTS plugin not configured".to_string())
    }
}

#[tauri::command]
pub async fn get_vts_model_name_from_id(
    id: &str,
    plugins_data: tauri::State<'_, PluginStates>,
) -> Result<String, String> {
    let mut plugins = plugins_data.plugins.lock().await;

    if let Some(PluginInstance::VTS(vts)) = plugins.get_mut(&PluginType::VTS) {
        vts.get_model_name_from_id(id).await
    } else {
        Err("VTS plugin not configured".to_string())
    }
}
