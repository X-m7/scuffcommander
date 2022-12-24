use crate::actions::ActionConfigState;
use crate::config::UIConfigState;
use scuffcommander_core::ui::{Base64Image, UIButton, UIButtonType, UIPage};
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

    out.sort_unstable();

    Ok(out)
}

#[tauri::command]
pub async fn get_page_buttons_info(
    id: String,
    ui_state: tauri::State<'_, UIConfigState>,
) -> Result<Vec<String>, String> {
    let mut out = Vec::new();
    let pages = &ui_state.0.lock().await.pages;

    let Some(pages) = pages.get(&id) else {
        return Err("Page with given ID not found".to_string());
    };

    for button in &pages.buttons {
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

    let Some(page) = pages.get_mut(&id) else {
        return Err("Page with given ID not found".to_string());
    };

    page.buttons.remove(index);

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

#[tauri::command]
pub async fn move_button_to_index(
    id: String,
    index_initial: usize,
    index_target: usize,
    ui_state: tauri::State<'_, UIConfigState>,
) -> Result<(), String> {
    let pages = &mut ui_state.0.lock().await.pages;

    let Some(page) = pages.get_mut(&id) else {
        return Err("Page with given ID not found".to_string());
    };

    let buttons = &mut page.buttons;

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
pub async fn get_page_button_data(
    id: String,
    index: usize,
    ui_state: tauri::State<'_, UIConfigState>,
) -> Result<UIButton, String> {
    let pages = &ui_state.0.lock().await.pages;

    let Some(page) = pages.get(&id) else {
        return Err("Page with given ID not found".to_string());
    };

    let buttons = &page.buttons;

    if index >= buttons.len() {
        return Err("Button index out of bounds".to_string());
    }

    Ok(buttons[index].clone())
}

#[tauri::command]
pub async fn get_page_buttons(
    id: String,
    ui_state: tauri::State<'_, UIConfigState>,
) -> Result<Vec<UIButton>, String> {
    let pages = &ui_state.0.lock().await.pages;

    let Some(page) = pages.get(&id) else {
        return Err("Page with given ID not found".to_string());
    };

    Ok(page.buttons.clone())
}

async fn get_action_name_list_filtered(
    id: Option<String>,
    global_filter: bool,
    ui_state: tauri::State<'_, UIConfigState>,
    actions_state: tauri::State<'_, ActionConfigState>,
) -> Result<Vec<String>, String> {
    let mut out = Vec::new();
    let actions = &actions_state.0.lock().await.actions;
    let pages = &ui_state.0.lock().await.pages;

    let mut existing_actions = HashSet::new();

    // Filter out either all actions that have been added in any page,
    // or just those in the current page, or don't filter at all
    if global_filter {
        for page in pages.values() {
            for button in &page.buttons {
                if let UIButton::ExecuteAction(data) = button {
                    existing_actions.insert(&data.target_id);
                }
            }
        }
    } else if let Some(id) = id {
        let Some(page) = pages.get(&id) else {
            return Err("Page with given ID not found".to_string());
        };

        for button in &page.buttons {
            if let UIButton::ExecuteAction(data) = button {
                existing_actions.insert(&data.target_id);
            }
        }
    }

    if existing_actions.is_empty() {
        for action in actions.keys() {
            out.push(action.clone());
        }
    } else {
        for action in actions.keys() {
            if !existing_actions.contains(action) {
                out.push(action.clone());
            }
        }
    }

    out.sort_unstable();

    Ok(out)
}

async fn get_page_name_list_filtered(
    id: Option<String>,
    global_filter: bool,
    ui_state: tauri::State<'_, UIConfigState>,
) -> Result<Vec<String>, String> {
    let mut out = Vec::new();
    let pages = &ui_state.0.lock().await.pages;

    let mut existing_pages = HashSet::new();

    // Filter out either all pages that have been added in any page,
    // or just those in the current page, or don't filter at all
    if global_filter {
        for page in pages.values() {
            for button in &page.buttons {
                if let UIButton::OpenPage(data) = button {
                    existing_pages.insert(&data.target_id);
                }
            }
        }

        // also include the current page ID (no point in a recursive link)
        if let Some(id) = id.as_ref() {
            existing_pages.insert(id);
        }
    } else if let Some(id) = id.as_ref() {
        let Some(page) = pages.get(id) else {
            return Err("Page with given ID not found".to_string());
        };

        // also include the current page ID (no point in a recursive link)
        existing_pages.insert(id);

        for button in &page.buttons {
            if let UIButton::OpenPage(data) = button {
                existing_pages.insert(&data.target_id);
            }
        }
    }

    if existing_pages.is_empty() {
        for page in pages.keys() {
            out.push(page.clone());
        }
    } else {
        for page in pages.keys() {
            if !existing_pages.contains(page) {
                out.push(page.clone());
            }
        }
    }

    out.sort_unstable();

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
    global_filter: bool,
    ui_state: tauri::State<'_, UIConfigState>,
    actions_state: tauri::State<'_, ActionConfigState>,
) -> Result<Vec<String>, String> {
    match output_type {
        UIButtonType::ExecuteAction => {
            get_action_name_list_filtered(page_id, global_filter, ui_state, actions_state).await
        }
        UIButtonType::OpenPage => {
            get_page_name_list_filtered(page_id, global_filter, ui_state).await
        }
    }
}

async fn get_base64image_from_path(path: &str) -> Result<Base64Image, String> {
    let path = std::path::Path::new(path);
    let raw_img_data = tokio::fs::read(path).await.map_err(|e| e.to_string())?;

    let kind = infer::get(&raw_img_data);

    let Some(kind) = kind else {
        return Err("Unable to determine selected file type".to_string());
    };

    if let infer::MatcherType::Image = kind.matcher_type() {
        Ok(Base64Image {
            format: kind.mime_type().to_string(),
            data: base64::encode(raw_img_data),
        })
    } else {
        Err("Selected file does not appear to be an image".to_string())
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

    let Some(page) = pages.get_mut(&id) else {
        return Err("Page with the given ID does not exist".to_string());
    };

    let buttons = &mut page.buttons;

    if index >= buttons.len() {
        return Err("Button index out of bounds".to_string());
    }

    // Get the original image data if desired, otherwise convert the file referenced by the path in
    // img.data to Base64
    if let Some(img) = &data.get_data().img {
        if img.format == "keeporiginal" {
            data.get_mut_data().img = buttons[index].get_mut_data().img.take();
        } else {
            data.get_mut_data().img = Some(get_base64image_from_path(&img.data).await?);
        }
    }

    buttons[index] = data;

    Ok(())
}

// Returns true if a new page has also been created, false otherwise
#[tauri::command]
pub async fn add_new_button_to_page(
    id: String,
    mut data: UIButton,
    ui_state: tauri::State<'_, UIConfigState>,
) -> Result<bool, String> {
    if id.is_empty() {
        return Err("ID can't be empty".to_string());
    }

    // convert image path from UI to the proper data (if present)
    if let Some(img) = &data.get_data().img {
        if img.format == "keeporiginal" {
            return Err("No original image to keep since this is adding a new button".to_string());
        }

        data.get_mut_data().img = Some(get_base64image_from_path(&img.data).await?);
    }

    let pages = &mut ui_state.0.lock().await.pages;

    match pages.entry(id.clone()) {
        std::collections::hash_map::Entry::Vacant(e) => {
            e.insert(UIPage {
                buttons: vec![data],
            });

            Ok(true)
        }
        std::collections::hash_map::Entry::Occupied(mut e) => {
            e.get_mut().buttons.push(data);

            Ok(false)
        }
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
    }

    let Some(page) = pages.remove(&current_id) else {
        return Err("The page with the given ID does not exist".to_string());
    };
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
