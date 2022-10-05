pub mod plugins;

use std::fs::read_to_string;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use plugins::{PluginAction, PluginConfigs, PluginInstance, PluginType};

#[derive(Serialize, Deserialize)]
pub struct AppConfig {
    pub addr: String,
    pub port: u16,
    pub plugins: PluginConfigs,
}

impl AppConfig {
    pub fn from_file(path: &str) -> AppConfig {
        serde_json::from_str(&read_to_string(path).unwrap_or_else(|e| {
            println!("{}", e);
            String::new()
        }))
        .unwrap_or_else(|e| {
            println!("Unable to parse config: {}", e);
            println!("Using defaults");
            AppConfig {
                addr: "localhost".to_string(),
                port: 8080,
                plugins: PluginConfigs {
                    plugins: Vec::new(),
                },
            }
        })
    }
}

#[derive(Serialize, Deserialize)]
pub struct ActionConfig {
    pub actions: HashMap<String, Action>,
}

impl ActionConfig {
    pub fn from_file(path: &str) -> ActionConfig {
        serde_json::from_str(&read_to_string(path).unwrap_or_else(|e| {
            println!("{}", e);
            String::new()
        }))
        .unwrap_or_else(|e| {
            println!("Unable to parse action config: {}", e);
            println!("Using defaults");
            ActionConfig { actions: HashMap::new() }
        })
    }
}

#[derive(Serialize, Deserialize)]
pub enum Action {
    Single(PluginAction),
    Chain(Vec<PluginAction>),
}

impl Action {
    async fn run_single(
        action: &PluginAction,
        plugins: &mut HashMap<PluginType, PluginInstance>,
    ) -> Result<(), String> {
        let plugin_type = action.get_required_type();
        match plugins.get_mut(&plugin_type) {
            Some(p) => action.run(p).await,
            None => Err(format!("Plugin {} not configured", plugin_type)),
        }
    }

    pub async fn run(
        &self,
        plugins: &mut HashMap<PluginType, PluginInstance>,
    ) -> Result<(), String> {
        match self {
            Action::Single(action) => Action::run_single(action, plugins).await,
            Action::Chain(actions) => {
                for action in actions {
                    if let Err(e) = Action::run_single(action, plugins).await {
                        return Err(format!("Action chain failed: {}", e));
                    }
                }
                Ok(())
            }
        }
    }
}
