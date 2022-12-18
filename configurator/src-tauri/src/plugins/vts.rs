use std::collections::HashSet;

use crate::actions::ActionConfigState;
use crate::config::UIConfigState;
use scuffcommander_core::action::Action;
use scuffcommander_core::plugins::vts::{VTSAction, VTSConfig, VTSConnector, VTSMoveModelInput};
use scuffcommander_core::plugins::PluginAction;
use scuffcommander_core::plugins::{PluginInstance, PluginStates, PluginType};
use scuffcommander_core::ui::{ButtonData, UIButton, UIPage};

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

#[tauri::command]
pub async fn generate_buttons_for_hotkeys(
    model_id: Option<String>,
    page_id: String,
    prefix: String,
    suffix: String,
    plugins_data: tauri::State<'_, PluginStates>,
    actions_state: tauri::State<'_, ActionConfigState>,
    ui_state: tauri::State<'_, UIConfigState>,
) -> Result<(), String> {
    let hotkeys = get_vts_hotkey_ids(model_id, plugins_data).await?;

    let mut actions_temp: Vec<(String, Action)> = Vec::with_capacity(hotkeys.len());
    let mut action_name_set: HashSet<String> = HashSet::new();

    let actions = &mut actions_state.0.lock().await.actions;
    let pages = &mut ui_state.0.lock().await.pages;

    if page_id.is_empty() {
        return Err("Page ID cannot be empty".to_string());
    }

    if pages.contains_key(&page_id) {
        return Err(format!("Page with ID {page_id} already exists"));
    }

    let Some(home_page) = pages.get_mut("home") else {
        return Err("The home page appears to be missing".to_string());
    };

    for hotkey in hotkeys {
        if hotkey.1.is_empty() {
            return Err("A hotkey is present in the selected model with no name".to_string());
        }

        if action_name_set.contains(&hotkey.1) {
            return Err("Multiple hotkeys in the selected model have the same name".to_string());
        }

        action_name_set.insert(hotkey.1.clone());

        let action_id = format!("{}{}{}", prefix, hotkey.1, suffix);
        if actions.contains_key(&action_id) {
            return Err(format!("Action with ID {} already exists", hotkey.1));
        }

        actions_temp.push((
            action_id,
            Action::Single(PluginAction::VTS(VTSAction::TriggerHotkey(hotkey.0))),
        ));
    }

    let mut buttons: Vec<UIButton> = Vec::with_capacity(actions_temp.len() + 1);

    // Add button from new page to home
    buttons.push(UIButton::OpenPage(ButtonData {
        target_id: "home".to_string(),
        style_override: None,
        img: None,
    }));

    // Add buttons
    for (id, action) in actions_temp {
        actions.insert(id.clone(), action);

        buttons.push(UIButton::ExecuteAction(ButtonData {
            target_id: id,
            style_override: None,
            img: None,
        }));
    }

    // Add button from home to new page
    home_page.buttons.push(UIButton::OpenPage(ButtonData {
        target_id: page_id.clone(),
        style_override: None,
        img: None,
    }));

    pages.insert(page_id, UIPage { buttons });

    Ok(())
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

// This also includes the name of each hotkey as the second part of the tuple
async fn get_vts_hotkey_ids(
    model_id: Option<String>,
    plugins_data: tauri::State<'_, PluginStates>,
) -> Result<Vec<(String, String)>, String> {
    let plugins = &plugins_data.plugins;

    if let Some(PluginInstance::VTS(vts)) = plugins.get(&PluginType::VTS) {
        vts.lock().await.get_hotkey_id_list(model_id).await
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
