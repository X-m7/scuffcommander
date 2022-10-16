pub mod obs;
pub mod vts;

use async_std::sync::Mutex;
use derive_more::Display;
use serde::{Deserialize, Serialize};
use serde_json::value::Value;
use std::collections::HashMap;

use obs::{OBSAction, OBSConfig, OBSConnector, OBSQuery};
use vts::{VTSAction, VTSConfig, VTSConnector, VTSQuery};

#[derive(Eq, Hash, PartialEq, Display, Serialize, Deserialize)]
pub enum PluginType {
    OBS,
    VTS,
}

pub enum PluginInstance {
    OBS(OBSConnector),
    VTS(VTSConnector),
}

#[derive(Serialize, Deserialize)]
pub enum PluginQuery {
    OBS(OBSQuery),
    VTS(VTSQuery),
}

impl PluginQuery {
    pub async fn get(&self, plugin: &mut PluginInstance) -> Result<String, String> {
        match (self, plugin) {
            (PluginQuery::OBS(query), PluginInstance::OBS(conn)) => query.run(conn).await,
            (PluginQuery::VTS(query), PluginInstance::VTS(conn)) => query.run(conn).await,
            _ => Err("Mismatched action and plugin instance".to_string()),
        }
    }

    pub fn get_required_type(&self) -> PluginType {
        match self {
            PluginQuery::OBS(_) => PluginType::OBS,
            PluginQuery::VTS(_) => PluginType::VTS,
        }
    }
}

#[derive(Serialize, Deserialize)]
pub enum PluginAction {
    OBS(OBSAction),
    VTS(VTSAction),
}

impl PluginAction {
    pub async fn run(&self, plugin: &mut PluginInstance) -> Result<(), String> {
        match (self, plugin) {
            (PluginAction::OBS(action), PluginInstance::OBS(conn)) => action.run(conn).await,
            (PluginAction::VTS(action), PluginInstance::VTS(conn)) => action.run(conn).await,
            _ => Err("Mismatched action and plugin instance".to_string()),
        }
    }

    pub fn get_required_type(&self) -> PluginType {
        match self {
            PluginAction::OBS(_) => PluginType::OBS,
            PluginAction::VTS(_) => PluginType::VTS,
        }
    }

    // Helper method to make creating actions from frontend simpler
    pub fn from_json(plugin_type: PluginType, data: Value) -> Result<PluginAction, String> {
        Ok(match plugin_type {
            PluginType::OBS => PluginAction::OBS(OBSAction::from_json(data)?),
            PluginType::VTS => PluginAction::VTS(VTSAction::from_json(data)?),
        })
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub enum PluginConfig {
    OBS(OBSConfig),
    VTS(VTSConfig),
}

// Need mutex here because there can only be one of these
// The server creates multiple threads, but there should be only one connection to OBS, VTS etc
pub struct PluginStates {
    pub plugins: Mutex<HashMap<PluginType, PluginInstance>>,
}

impl PluginStates {
    pub async fn init(conf: Vec<PluginConfig>) -> PluginStates {
        let mut plugins = HashMap::new();
        for plugin in conf {
            match plugin {
                PluginConfig::OBS(c) => {
                    plugins.insert(
                        PluginType::OBS,
                        PluginInstance::OBS(OBSConnector::new(c).await),
                    );
                }
                PluginConfig::VTS(c) => {
                    plugins.insert(
                        PluginType::VTS,
                        PluginInstance::VTS(VTSConnector::new(c).await),
                    );
                }
            };
        }

        PluginStates {
            plugins: Mutex::new(plugins),
        }
    }
}
