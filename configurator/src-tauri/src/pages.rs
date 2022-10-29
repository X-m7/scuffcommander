use crate::actions::ActionConfigState;
use crate::config::UIConfigState;
use scuffcommander_core::{UIButton, UIButtonType, UIPage};
use std::collections::HashSet;

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

#[tauri::command]
pub async fn delete_page(
    id: String,
    ui_state: tauri::State<'_, UIConfigState>,
) -> Result<(), String> {
    let pages = &mut ui_state.0.lock().await.pages;

    if pages.remove(&id).is_none() {
        return Err("Page with given ID not found".to_string());
    }

    Ok(())
}

async fn move_button_to_index(
    id: String,
    index_initial: usize,
    index_target: usize,
    ui_state: tauri::State<'_, UIConfigState>,
) -> Result<(), String> {
    let pages = &mut ui_state.0.lock().await.pages;

    if !pages.contains_key(&id) {
        return Err("Page with given ID not found".to_string());
    }

    let buttons = &mut pages.get_mut(&id).unwrap().buttons;

    if index_initial >= buttons.len() {
        return Err("Starting index out of bounds".to_string());
    }

    if index_target >= buttons.len() {
        return Err("Target index out of bounds".to_string());
    }

    let button = buttons.remove(index_initial);

    buttons.insert(index_target, button);

    Ok(())
}

#[tauri::command]
pub async fn move_button_up_in_page(
    id: String,
    index: usize,
    ui_state: tauri::State<'_, UIConfigState>,
) -> Result<(), String> {
    move_button_to_index(id, index, index - 1, ui_state).await
}

#[tauri::command]
pub async fn move_button_down_in_page(
    id: String,
    index: usize,
    ui_state: tauri::State<'_, UIConfigState>,
) -> Result<(), String> {
    move_button_to_index(id, index, index + 1, ui_state).await
}

#[tauri::command]
pub async fn get_page_button_data(
    id: String,
    index: usize,
    ui_state: tauri::State<'_, UIConfigState>,
) -> Result<UIButton, String> {
    let pages = &mut ui_state.0.lock().await.pages;

    if !pages.contains_key(&id) {
        return Err("Page with given ID not found".to_string());
    }

    let buttons = &pages.get(&id).unwrap().buttons;

    if index >= buttons.len() {
        return Err("Button index out of bounds".to_string());
    }

    Ok(buttons[index].clone())
}

async fn get_action_name_list_filtered(
    id: Option<String>,
    ui_state: tauri::State<'_, UIConfigState>,
    actions_state: tauri::State<'_, ActionConfigState>,
) -> Result<Vec<String>, String> {
    let mut out = Vec::new();
    let actions = &actions_state.0.lock().await.actions;

    // if ID is given get the list of actions already targeted and skip them
    if let Some(id) = id {
        let mut existing_actions = HashSet::new();
        let pages = &mut ui_state.0.lock().await.pages;
        if !pages.contains_key(&id) {
            return Err("Page with given ID not found".to_string());
        }

        for button in &pages.get(&id).unwrap().buttons {
            if let UIButton::ExecuteAction(data) = button {
                existing_actions.insert(&data.target_id);
            }
        }

        for action in actions.keys() {
            if !existing_actions.contains(action) {
                out.push(action.clone());
            }
        }
    } else {
        for action in actions.keys() {
            out.push(action.clone());
        }
    }

    Ok(out)
}

async fn get_page_name_list_filtered(
    id: Option<String>,
    ui_state: tauri::State<'_, UIConfigState>,
) -> Result<Vec<String>, String> {
    let mut out = Vec::new();
    let pages = &mut ui_state.0.lock().await.pages;

    // if ID is given get the list of actions already targeted and skip them
    if let Some(id) = id {
        if !pages.contains_key(&id) {
            return Err("Page with given ID not found".to_string());
        }

        let mut existing_pages = HashSet::new();

        // also include the current page ID (no point in a recursive link)
        existing_pages.insert(&id);

        for button in &pages.get(&id).unwrap().buttons {
            if let UIButton::OpenPage(data) = button {
                existing_pages.insert(&data.target_id);
            }
        }

        for page in pages.keys() {
            if !existing_pages.contains(page) {
                out.push(page.clone());
            }
        }
    } else {
        for page in pages.keys() {
            out.push(page.clone());
        }
    }

    Ok(out)
}

// Returns the list of actions/pages that can be targeted by a new button
// output_type should be either ExecuteAction or OpenPage
// Actions/pages already targeted by an existing button in the page with the given ID
// will be filtered out
#[tauri::command]
pub async fn get_page_or_action_name_list(
    page_id: Option<String>,
    output_type: UIButtonType,
    ui_state: tauri::State<'_, UIConfigState>,
    actions_state: tauri::State<'_, ActionConfigState>,
) -> Result<Vec<String>, String> {
    match output_type {
        UIButtonType::ExecuteAction => {
            get_action_name_list_filtered(page_id, ui_state, actions_state).await
        }
        UIButtonType::OpenPage => get_page_name_list_filtered(page_id, ui_state).await,
    }
}

#[tauri::command]
pub async fn edit_button_in_page(
    id: String,
    index: usize,
    mut data: UIButton,
    ui_state: tauri::State<'_, UIConfigState>,
) -> Result<(), String> {
    let pages = &mut ui_state.0.lock().await.pages;

    if !pages.contains_key(&id) {
        return Err("Page with the given ID does not exist".to_string());
    }

    let buttons = &mut pages.get_mut(&id).unwrap().buttons;

    if index >= buttons.len() {
        return Err("Button index out of bounds".to_string());
    }

    // Get the original image data if desired, otherwise convert the file referenced by the path in
    // img.data to Base64
    if let Some(img) = &data.get_data().img {
        if img.format == "keeporiginal" {
            data.get_mut_data().img = buttons[index].get_mut_data().img.take();
        } else {
            let path = std::path::Path::new(&img.data);
            let ext = path
                .extension()
                .ok_or_else(|| "Can't get file extension".to_string())?
                .to_str()
                .ok_or_else(|| "File extension is not valid Unicode".to_string())?;
            let raw_img_data = async_std::fs::read(path).await.map_err(|e| e.to_string())?;
            data.get_mut_data().img = Some(scuffcommander_core::Base64Image {
                format: format!("image/{}", ext),
                data: base64::encode(raw_img_data),
            });
        }
    }

    buttons[index] = data;

    Ok(())
}

// Returns true if a new page has also been created, false otherwise
#[tauri::command]
pub async fn add_new_button_to_page(
    id: String,
    data: UIButton,
    ui_state: tauri::State<'_, UIConfigState>,
) -> Result<bool, String> {
    if id.is_empty() {
        return Err("ID can't be empty".to_string());
    }

    let pages = &mut ui_state.0.lock().await.pages;

    if let std::collections::hash_map::Entry::Vacant(e) = pages.entry(id.clone()) {
        e.insert(UIPage {
            buttons: vec![data],
        });

        Ok(true)
    } else {
        pages.get_mut(&id).unwrap().buttons.push(data);

        Ok(false)
    }
}

#[tauri::command]
pub async fn rename_page(
    current_id: String,
    new_id: String,
    ui_state: tauri::State<'_, UIConfigState>,
) -> Result<(), String> {
    if current_id.is_empty() || new_id.is_empty() {
        return Err("ID can't be empty".to_string());
    }

    let pages = &mut ui_state.0.lock().await.pages;

    if pages.contains_key(&new_id) {
        return Err("A page already exists with the given ID".to_string());
    } else if !pages.contains_key(&current_id) {
        return Err("The page with the given ID does not exist".to_string());
    }

    let page = pages.remove(&current_id).unwrap();
    pages.insert(new_id.clone(), page);

    // Find occurrences of the old name and change them too
    for page in pages.values_mut() {
        for button in &mut page.buttons {
            if let UIButton::OpenPage(data) = button {
                if data.target_id == current_id {
                    data.target_id = new_id.clone();
                }
            }
        }
    }

    Ok(())
}
