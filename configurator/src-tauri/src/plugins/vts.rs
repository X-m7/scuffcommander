use scuffcommander_core::plugins::vts::{VTSConfig, VTSConnector, VTSMoveModelInput};
use scuffcommander_core::plugins::{PluginInstance, PluginStates, PluginType};

#[tauri::command]
pub async fn test_vts_connection(conf: VTSConfig) -> Result<bool, ()> {
    let mut conn = VTSConnector::new(conf).await;

    Ok(conn.get_vts_version().await.is_ok())
}

#[tauri::command]
pub async fn get_vts_current_model_pos(
    plugins_data: tauri::State<'_, PluginStates>,
) -> Result<VTSMoveModelInput, String> {
    let plugins = &plugins_data.plugins;

    if let Some(PluginInstance::VTS(vts)) = plugins.get(&PluginType::VTS) {
        let (x, y, rotation, size) = vts.lock().await.get_current_model_position().await?;

        Ok(VTSMoveModelInput {
            x,
            y,
            rotation,
            size,
            time_sec: 0.0,
        })
    } else {
        Err("VTS plugin not configured".to_string())
    }
}

/*
 * List getters
 */

#[tauri::command]
pub async fn get_vts_expression_names(
    plugins_data: tauri::State<'_, PluginStates>,
) -> Result<Vec<String>, String> {
    let plugins = &plugins_data.plugins;

    if let Some(PluginInstance::VTS(vts)) = plugins.get(&PluginType::VTS) {
        vts.lock().await.get_expression_name_list().await
    } else {
        Err("VTS plugin not configured".to_string())
    }
}

#[tauri::command]
pub async fn get_vts_model_names(
    plugins_data: tauri::State<'_, PluginStates>,
) -> Result<Vec<String>, String> {
    let plugins = &plugins_data.plugins;

    if let Some(PluginInstance::VTS(vts)) = plugins.get(&PluginType::VTS) {
        vts.lock().await.get_model_name_list().await
    } else {
        Err("VTS plugin not configured".to_string())
    }
}

#[tauri::command]
pub async fn get_vts_hotkey_names(
    plugins_data: tauri::State<'_, PluginStates>,
) -> Result<Vec<String>, String> {
    let plugins = &plugins_data.plugins;

    if let Some(PluginInstance::VTS(vts)) = plugins.get(&PluginType::VTS) {
        vts.lock().await.get_hotkey_name_list().await
    } else {
        Err("VTS plugin not configured".to_string())
    }
}

/*
 * Conversion between display names and IDs
 */

#[tauri::command]
pub async fn get_vts_expression_name_from_id(
    id: &str,
    plugins_data: tauri::State<'_, PluginStates>,
) -> Result<String, String> {
    let plugins = &plugins_data.plugins;

    if let Some(PluginInstance::VTS(vts)) = plugins.get(&PluginType::VTS) {
        vts.lock().await.get_expression_name_from_id(id).await
    } else {
        Err("VTS plugin not configured".to_string())
    }
}

#[tauri::command]
pub async fn get_vts_expression_id_from_name(
    name: &str,
    plugins_data: tauri::State<'_, PluginStates>,
) -> Result<String, String> {
    let plugins = &plugins_data.plugins;

    if let Some(PluginInstance::VTS(vts)) = plugins.get(&PluginType::VTS) {
        vts.lock().await.get_expression_id_from_name(name).await
    } else {
        Err("VTS plugin not configured".to_string())
    }
}

#[tauri::command]
pub async fn get_vts_model_name_from_id(
    id: &str,
    plugins_data: tauri::State<'_, PluginStates>,
) -> Result<String, String> {
    let plugins = &plugins_data.plugins;

    if let Some(PluginInstance::VTS(vts)) = plugins.get(&PluginType::VTS) {
        vts.lock().await.get_model_name_from_id(id).await
    } else {
        Err("VTS plugin not configured".to_string())
    }
}

#[tauri::command]
pub async fn get_vts_model_id_from_name(
    name: &str,
    plugins_data: tauri::State<'_, PluginStates>,
) -> Result<String, String> {
    let plugins = &plugins_data.plugins;

    if let Some(PluginInstance::VTS(vts)) = plugins.get(&PluginType::VTS) {
        vts.lock().await.get_model_id_from_name(name).await
    } else {
        Err("VTS plugin not configured".to_string())
    }
}

#[tauri::command]
pub async fn get_vts_hotkey_name_from_id(
    id: &str,
    plugins_data: tauri::State<'_, PluginStates>,
) -> Result<String, String> {
    let plugins = &plugins_data.plugins;

    if let Some(PluginInstance::VTS(vts)) = plugins.get(&PluginType::VTS) {
        vts.lock().await.get_hotkey_name_from_id(id).await
    } else {
        Err("VTS plugin not configured".to_string())
    }
}

#[tauri::command]
pub async fn get_vts_hotkey_id_from_name(
    name: &str,
    plugins_data: tauri::State<'_, PluginStates>,
) -> Result<String, String> {
    let plugins = &plugins_data.plugins;

    if let Some(PluginInstance::VTS(vts)) = plugins.get(&PluginType::VTS) {
        vts.lock().await.get_hotkey_id_from_name(name).await
    } else {
        Err("VTS plugin not configured".to_string())
    }
}
