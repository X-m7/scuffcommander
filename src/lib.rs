pub mod plugins;

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::read_to_string;

use plugins::{PluginAction, PluginConfig, PluginInstance, PluginType};

/*
* Code to generate the example config:
*
   let mut conf = AppConfig::from_file("kek");
   conf.plugins.push(PluginConfig::OBS(OBSConfig { addr: "localhost".to_string(), port: 4455, password: Some("1234567890".to_string())}));
   conf.plugins.push(PluginConfig::VTS(VTSConfig { addr: "ws://localhost:8001".to_string(), token_file: "vts_token.txt".to_string()}));
   println!("{}", serde_json::to_string_pretty(&conf).unwrap());
*
*/
#[derive(Serialize, Deserialize)]
pub struct AppConfig {
    pub addr: String,
    pub port: u16,
    pub plugins: Vec<PluginConfig>,
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
                plugins: Vec::new(),
            }
        })
    }
}

/*
* Code to generate the example config:
*
   let mut actions = ActionConfig { actions: HashMap::new() };
   let mut chain = Vec::new();
   chain.push(PluginAction::VTS(VTSAction::ToggleExpression("Qt.exp3.json".to_string())));
   chain.push(PluginAction::VTS(VTSAction::ToggleExpression("expressiong.exp3.json".to_string())));
   actions.actions.insert("1".to_string(), Action::Single(PluginAction::OBS(OBSAction::SceneChange("Waiting".to_string()))));
   actions.actions.insert("2".to_string(), Action::Single(PluginAction::OBS(OBSAction::SceneChange("Desktop + VTS".to_string()))));
   actions.actions.insert("3".to_string(), Action::Single(PluginAction::VTS(VTSAction::ToggleExpression("Qt.exp3.json".to_string()))));
   actions.actions.insert("4".to_string(), Action::Single(PluginAction::VTS(VTSAction::ToggleExpression("expressiong.exp3.json".to_string()))));
   actions.actions.insert("5".to_string(), Action::Chain(chain));
   println!("{}", serde_json::to_string_pretty(&actions).unwrap());
*
*/
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
            ActionConfig {
                actions: HashMap::new(),
            }
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
