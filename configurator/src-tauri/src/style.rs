use crate::config::UIConfigState;
use scuffcommander_core::UIStyle;

#[tauri::command]
pub async fn store_ui_style(
    style: UIStyle,
    ui_state: tauri::State<'_, UIConfigState>,
) -> Result<(), ()> {
    ui_state.0.lock().await.style = style;

    Ok(())
}

#[tauri::command]
pub async fn get_ui_style(ui_state: tauri::State<'_, UIConfigState>) -> Result<UIStyle, ()> {
    Ok(ui_state.0.lock().await.style.clone())
}
