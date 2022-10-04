pub mod plugins;

use async_std::fs::read_to_string;
use plugins::PluginConfig;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct AppConfig {
    pub addr: String,
    pub port: u16,
    pub plugins: PluginConfig,
}

impl AppConfig {
    pub async fn from_file(path: &str) -> AppConfig {
        serde_json::from_str(&read_to_string(path).await.unwrap_or_else(|e| {
            println!("{}", e);
            String::new()
        }))
        .unwrap_or_else(|e| {
            println!("Unable to parse config: {}", e);
            println!("Using defaults");
            AppConfig {
                addr: "localhost".to_string(),
                port: 8080,
                plugins: PluginConfig {
                    obs: None,
                    vts: None,
                },
            }
        })
    }
}
