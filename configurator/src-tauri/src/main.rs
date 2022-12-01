#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use scuffcommander_configurator as app_mod;
use scuffcommander_core::action::ActionConfig;
use scuffcommander_core::plugins::PluginStates;
use scuffcommander_core::ui::UIConfig;
use scuffcommander_core::AppConfig;
use tokio::sync::Mutex;

#[tokio::main]
async fn main() {
    tauri::async_runtime::set(tokio::runtime::Handle::current());

    let args: Vec<String> = std::env::args().collect();

    if args.len() == 1 {
        println!("Configuration folder required");
        return;
    };

    // cd to config directory so relative paths (for example for the VTS token file) goes there
    std::env::set_current_dir(&args[1]).expect("Unable to open given config directory");

    let conf = AppConfig::from_file("config.json");

    tauri::Builder::default()
        .manage(app_mod::config::AppConfigState(conf.clone()))
        .manage(PluginStates::init(conf.plugins).await)
        .manage(app_mod::actions::ActionConfigState(Mutex::new(
            ActionConfig::from_file("actions.json"),
        )))
        .manage(app_mod::config::UIConfigState(Mutex::new(
            UIConfig::from_file("ui.json"),
        )))
        .manage(app_mod::config::ConfigFolder(
            std::env::current_dir()
                .expect("Invalid current dir?")
                .display()
                .to_string(),
        ))
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
            app_mod::actions::save_actions,
            app_mod::actions::delete_action,
            app_mod::actions::convert_action_to_string,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
