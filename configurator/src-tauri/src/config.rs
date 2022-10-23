pub struct ConfigFolder(pub String);
pub struct AppConfigState(pub AppConfig);

use async_std::fs::write;
use scuffcommander_core::AppConfig;

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
