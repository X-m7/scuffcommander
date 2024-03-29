use async_recursion::async_recursion;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::read_to_string;

use crate::plugins::{PluginAction, PluginInstance, PluginQuery, PluginType};

// See examples/actiongen.rs on how to generate the actions.json file
#[derive(Serialize, Deserialize)]
pub struct ActionConfig {
    pub actions: HashMap<String, Action>,
}

impl ActionConfig {
    #[must_use]
    pub fn from_file(path: &str) -> ActionConfig {
        serde_json::from_str(&read_to_string(path).unwrap_or_else(|e| {
            println!("{e}");
            String::new()
        }))
        .unwrap_or_else(|e| {
            println!("Unable to parse action config: {e}");
            println!("Using defaults");
            ActionConfig {
                actions: HashMap::new(),
            }
        })
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Condition {
    pub query: PluginQuery,
    pub target: String,
}

impl Condition {
    pub async fn check(
        &self,
        plugins: &HashMap<PluginType, PluginInstance>,
    ) -> Result<bool, String> {
        let plugin_type = self.query.get_required_type();

        let Some(plugin) = plugins.get(&plugin_type) else {
            return Err(format!("Plugin {plugin_type} not configured"));
        };

        Ok(self.query.get(plugin).await? == self.target)
    }
}

// need Box to allow recursion
#[derive(Serialize, Deserialize, Clone)]
#[serde(tag = "tag", content = "content")]
pub enum Action {
    Single(PluginAction),
    Chain(Vec<Action>),
    If(Condition, Box<Action>, Option<Box<Action>>),
}

impl Action {
    async fn run_single(
        action: &PluginAction,
        plugins: &HashMap<PluginType, PluginInstance>,
    ) -> Result<(), String> {
        let plugin_type = action.get_required_type();
        match plugins.get(&plugin_type) {
            Some(p) => action.run(p).await,
            None => Err(format!("Plugin {plugin_type} not configured")),
        }
    }

    #[async_recursion]
    #[must_use]
    pub async fn run(&self, plugins: &HashMap<PluginType, PluginInstance>) -> Result<(), String> {
        match self {
            Action::Single(action) => Action::run_single(action, plugins).await,
            Action::Chain(actions) => {
                for action in actions {
                    if let Err(e) = action.run(plugins).await {
                        return Err(format!("Action chain failed: {e}"));
                    }
                }
                Ok(())
            }
            Action::If(cond, then, else_) => {
                if cond.check(plugins).await? {
                    then.run(plugins).await?;
                } else if let Some(else_action) = else_ {
                    else_action.run(plugins).await?;
                }
                Ok(())
            }
        }
    }
}
