#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use directories::ProjectDirs;
use tokio::sync::Mutex;

use scuffcommander_configurator as app_mod;
use scuffcommander_core::action::ActionConfig;
use scuffcommander_core::plugins::PluginStates;
use scuffcommander_core::ui::UIConfig;
use scuffcommander_core::AppConfig;

#[tokio::main]
async fn main() {
    tauri::async_runtime::set(tokio::runtime::Handle::current());

    let args: Vec<String> = std::env::args().collect();
    let dirs = ProjectDirs::from("", "", "scuffcommander");

    let config_dir_path;

    if args.len() > 1 {
        let mut path = std::path::PathBuf::new();
        path.push(&args[1]);
        config_dir_path = path;
    } else if let Some(dirs) = dirs {
        config_dir_path = dirs.config_dir().to_path_buf()
    } else {
        println!("Configuration folder required");
        return;
    }

    // to_string_lossy does not in fact return a String
    let config_dir = config_dir_path.to_string_lossy().to_string();

    std::fs::create_dir_all(&config_dir_path).expect("Unable to create config directory");

    println!("Using {config_dir} as the config folder");

    let conf = AppConfig::from_file(&format!("{config_dir}/config.json"));

    tauri::Builder::default()
        .manage(app_mod::config::AppConfigState(conf.clone()))
        .manage(PluginStates::init(conf.plugins).await)
        .manage(app_mod::actions::ActionConfigState(Mutex::new(
            ActionConfig::from_file(&format!("{config_dir}/actions.json")),
        )))
        .manage(app_mod::config::UIConfigState(Mutex::new(
            UIConfig::from_file(&format!("{config_dir}/ui.json")),
        )))
        .manage(app_mod::config::ConfigFolder(config_dir.clone()))
        .invoke_handler(tauri::generate_handler![
            app_mod::plugins::obs::get_obs_scenes,
            app_mod::plugins::obs::test_obs_connection,
            app_mod::plugins::vts::test_vts_connection,
            app_mod::plugins::vts::get_vts_expression_names,
            app_mod::plugins::vts::get_vts_model_names,
            app_mod::plugins::vts::get_vts_hotkey_names,
            app_mod::plugins::vts::get_vts_current_model_pos,
            app_mod::plugins::vts::get_vts_expression_name_from_id,
            app_mod::plugins::vts::get_vts_model_name_from_id,
            app_mod::plugins::vts::get_vts_hotkey_name_from_id,
            app_mod::plugins::vts::get_vts_expression_id_from_name,
            app_mod::plugins::vts::get_vts_model_id_from_name,
            app_mod::plugins::vts::get_vts_hotkey_id_from_name,
            app_mod::config::save_config,
            app_mod::config::get_config,
            app_mod::config::get_config_folder,
            app_mod::config::save_ui_config,
            app_mod::pages::get_page_names,
            app_mod::pages::get_page_buttons_info,
            app_mod::pages::get_page_buttons,
            app_mod::pages::delete_button_from_page,
            app_mod::pages::delete_page,
            app_mod::pages::edit_button_in_page,
            app_mod::pages::add_new_button_to_page,
            app_mod::pages::move_button_to_index,
            app_mod::pages::get_page_button_data,
            app_mod::pages::get_page_or_action_name_list,
            app_mod::pages::rename_page,
            app_mod::general::pick_image_file,
            app_mod::style::store_ui_style,
            app_mod::style::get_ui_style,
            app_mod::actions::get_actions,
            app_mod::actions::add_new_action,
            app_mod::actions::load_action_details,
            app_mod::actions::run_action,
            app_mod::actions::save_actions,
            app_mod::actions::delete_action,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
