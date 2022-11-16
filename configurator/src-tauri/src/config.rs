use scuffcommander_core::AppConfig;
use tokio::fs::write;

pub struct ConfigFolder(pub String);
pub struct AppConfigState(pub AppConfig);
pub struct UIConfigState(pub tokio::sync::Mutex<scuffcommander_core::ui::UIConfig>);

#[tauri::command]
pub async fn save_ui_config(
    ui_state: tauri::State<'_, UIConfigState>,
    conf_state: tauri::State<'_, super::config::ConfigFolder>,
) -> Result<(), String> {
    match write(
        format!("{}/ui.json", &conf_state.0),
        serde_json::to_string_pretty(&*ui_state.0.lock().await).expect("Not UIConfig?"),
    )
    .await
    {
        Ok(_) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn save_config(
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
pub fn get_config(conf_state: tauri::State<'_, AppConfigState>) -> AppConfig {
    conf_state.0.clone()
}
