use super::UIConfigState;

#[tauri::command]
pub async fn get_page_names(
    ui_state: tauri::State<'_, UIConfigState>,
) -> Result<Vec<String>, String> {
    let mut out = Vec::new();
    let pages = &ui_state.0.lock().await.pages;

    for page in pages.keys() {
        out.push(page.clone());
    }

    Ok(out)
}

#[tauri::command]
pub async fn get_page_buttons_info(
    id: String,
    ui_state: tauri::State<'_, UIConfigState>,
) -> Result<Vec<String>, String> {
    let mut out = Vec::new();
    let pages = &ui_state.0.lock().await.pages;

    if !pages.contains_key(&id) {
        return Err("Page with given ID not found".to_string());
    }

    for button in &pages.get(&id).unwrap().buttons {
        out.push(format!("{button}"));
    }

    Ok(out)
}

#[tauri::command]
pub async fn delete_button_from_page(
    id: String,
    index: usize,
    ui_state: tauri::State<'_, UIConfigState>,
) -> Result<(), String> {
    let pages = &mut ui_state.0.lock().await.pages;

    if !pages.contains_key(&id) {
        return Err("Page with given ID not found".to_string());
    }

    pages.get_mut(&id).unwrap().buttons.remove(index);

    Ok(())
}
