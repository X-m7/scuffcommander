#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use async_std::sync::Mutex;
use scuffcommander_configurator as app_mod;
use scuffcommander_core::plugins::PluginStates;
use scuffcommander_core::{ActionConfig, AppConfig};

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
        .manage(app_mod::config::ConfigFolder(
            std::env::current_dir()
                .expect("Invalid current dir?")
                .display()
                .to_string(),
        ))
        .manage(app_mod::actions::chain::TemporaryChain(Mutex::new(
            Vec::new(),
        )))
        .invoke_handler(tauri::generate_handler![
            app_mod::plugins::obs::get_obs_scenes,
            app_mod::plugins::obs::test_obs_connection,
            app_mod::plugins::vts::test_vts_connection,
            app_mod::plugins::vts::get_vts_expression_names,
            app_mod::plugins::vts::get_vts_model_names,
            app_mod::plugins::vts::get_vts_expression_name_from_id,
            app_mod::plugins::vts::get_vts_model_name_from_id,
            app_mod::config::save_config,
            app_mod::config::get_config,
            app_mod::actions::get_actions,
            app_mod::actions::add_new_single_action,
            app_mod::actions::load_action_details,
            app_mod::actions::save_actions,
            app_mod::actions::delete_action,
            app_mod::actions::chain::clear_temp_chain,
            app_mod::actions::chain::store_temp_chain,
            app_mod::actions::chain::copy_action_to_temp_chain,
            app_mod::actions::chain::add_new_single_action_to_temp_chain,
            app_mod::actions::chain::delete_entry_from_temp_chain,
            app_mod::actions::chain::get_temp_chain_display
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
