pub mod action;
pub mod plugins;
pub mod ui;

use serde::{Deserialize, Serialize};
use std::fs::read_to_string;

use plugins::PluginConfig;

// See examples/confgen.rs on how to generate the config.json file
#[derive(Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub addr: String,
    pub port: u16,
    pub plugins: Vec<PluginConfig>,
}

impl AppConfig {
    #[must_use]
    pub fn from_file(path: &str) -> AppConfig {
        serde_json::from_str(&read_to_string(path).unwrap_or_else(|e| {
            println!("{e}");
            String::new()
        }))
        .unwrap_or_else(|e| {
            println!("Unable to parse config: {e}");
            println!("Using defaults");

            AppConfig {
                addr: "localhost".to_string(),
                port: 8080,
                plugins: PluginConfig::get_default_vec(),
            }
        })
    }
}
