pub mod plugins;

use async_recursion::async_recursion;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::read_to_string;

use plugins::{PluginAction, PluginConfig, PluginInstance, PluginQuery, PluginType};

// See examples/confgen.rs on how to generate the config.json file
#[derive(Serialize, Deserialize, Clone)]
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

// See examples/actiongen.rs on how to generate the actions.json file
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
pub struct Condition {
    pub query: PluginQuery,
    pub target: String,
}

impl Condition {
    pub async fn check(
        &self,
        plugins: &mut HashMap<PluginType, PluginInstance>,
    ) -> Result<bool, String> {
        let plugin_type = self.query.get_required_type();

        let plugin = plugins.get_mut(&plugin_type);
        if plugin.is_none() {
            return Err(format!("Plugin {} not configured", plugin_type));
        }

        let query = self.query.get(plugin.unwrap()).await;
        match query {
            Ok(q) => Ok(q == self.target),
            Err(e) => Err(e),
        }
    }
}

// need Box to allow recursion
#[derive(Serialize, Deserialize)]
pub enum Action {
    Single(PluginAction),
    Chain(Vec<Action>),
    If(Condition, Box<Action>, Option<Box<Action>>),
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

    #[async_recursion]
    pub async fn run(
        &self,
        plugins: &mut HashMap<PluginType, PluginInstance>,
    ) -> Result<(), String> {
        match self {
            Action::Single(action) => Action::run_single(action, plugins).await,
            Action::Chain(actions) => {
                for action in actions {
                    if let Err(e) = action.run(plugins).await {
                        return Err(format!("Action chain failed: {}", e));
                    }
                }
                Ok(())
            }
            Action::If(cond, then, else_) => match cond.check(plugins).await {
                Ok(proceed) => {
                    if proceed {
                        then.run(plugins).await
                    } else if let Some(else_action) = else_ {
                        else_action.run(plugins).await
                    } else {
                        Ok(())
                    }
                }
                Err(e) => Err(e),
            },
        }
    }
}
