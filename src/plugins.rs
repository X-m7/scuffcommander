pub mod obs;
pub mod vts;

use async_std::sync::Mutex;
use derive_more::Display;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use obs::{OBSAction, OBSConfig, OBSConnector};
use vts::{VTSAction, VTSConfig, VTSConnector};

#[derive(Eq, Hash, PartialEq, Display)]
pub enum PluginType {
    OBS,
    VTS,
}

pub enum PluginInstance {
    OBS(OBSConnector),
    VTS(VTSConnector),
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
}

#[derive(Serialize, Deserialize)]
pub struct PluginConfigs {
    pub plugins: Vec<PluginConfig>,
}

#[derive(Serialize, Deserialize)]
pub enum PluginConfig {
    OBS(OBSConfig),
    VTS(VTSConfig),
}

pub struct PluginStates {
    pub plugins: Mutex<HashMap<PluginType, PluginInstance>>,
}

impl PluginStates {
    pub async fn init(conf: PluginConfigs) -> PluginStates {
        let mut plugins = HashMap::new();
        for plugin in conf.plugins {
            match plugin {
                PluginConfig::OBS(c) => match OBSConnector::new(c).await {
                    Ok(o) => {
                        plugins.insert(PluginType::OBS, PluginInstance::OBS(o));
                    }
                    Err(e) => {
                        println!("OBS plugin init error: {}", e);
                    }
                },
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
