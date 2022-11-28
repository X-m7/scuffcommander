pub mod general;
pub mod obs;
pub mod vts;

use derive_more::Display;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt::{Display, Formatter};
use tokio::sync::Mutex;

use general::GeneralAction;
use obs::{OBSAction, OBSConfig, OBSConnector, OBSQuery};
use vts::{VTSAction, VTSConfig, VTSConnector, VTSQuery};

#[derive(Eq, Hash, PartialEq, Display, Serialize, Deserialize)]
pub enum PluginType {
    OBS,
    VTS,
    General,
}

pub enum PluginInstance {
    OBS(OBSConnector),
    VTS(VTSConnector),
    General,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(tag = "tag", content = "content")]
pub enum PluginQuery {
    OBS(OBSQuery),
    VTS(VTSQuery),
}

impl Display for PluginQuery {
    fn fmt(&self, f: &mut Formatter) -> std::fmt::Result {
        match self {
            PluginQuery::OBS(q) => write!(f, "OBS-{}", q),
            PluginQuery::VTS(q) => write!(f, "VTS-{}", q),
        }
    }
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

#[derive(Serialize, Deserialize, Clone)]
#[serde(tag = "tag", content = "content")]
pub enum PluginAction {
    OBS(OBSAction),
    VTS(VTSAction),
    General(GeneralAction),
}

impl Display for PluginAction {
    fn fmt(&self, f: &mut Formatter) -> std::fmt::Result {
        match self {
            PluginAction::OBS(a) => write!(f, "OBS-{}", a),
            PluginAction::VTS(a) => write!(f, "VTS-{}", a),
            PluginAction::General(a) => write!(f, "General-{}", a),
        }
    }
}

impl PluginAction {
    pub async fn run(&self, plugin: &mut PluginInstance) -> Result<(), String> {
        match (self, plugin) {
            (PluginAction::OBS(action), PluginInstance::OBS(conn)) => action.run(conn).await,
            (PluginAction::VTS(action), PluginInstance::VTS(conn)) => action.run(conn).await,
            (PluginAction::General(action), PluginInstance::General) => {
                action.run().await;
                Ok(())
            }
            _ => Err("Mismatched action and plugin instance".to_string()),
        }
    }

    pub fn get_required_type(&self) -> PluginType {
        match self {
            PluginAction::OBS(_) => PluginType::OBS,
            PluginAction::VTS(_) => PluginType::VTS,
            PluginAction::General(_) => PluginType::General,
        }
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub enum PluginConfig {
    OBS(OBSConfig),
    VTS(VTSConfig),
    General,
}

impl PluginConfig {
    pub fn get_default_vec() -> Vec<PluginConfig> {
        vec![PluginConfig::General]
    }
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
                PluginConfig::General => {
                    plugins.insert(PluginType::General, PluginInstance::General);
                }
            };
        }

        PluginStates {
            plugins: Mutex::new(plugins),
        }
    }
}
