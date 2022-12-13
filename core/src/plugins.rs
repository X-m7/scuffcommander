pub mod general;
pub mod obs;
pub mod vts;

use derive_more::Display;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
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

// Individual mutex per plugin so one taking its time won't block the rest
pub enum PluginInstance {
    OBS(Mutex<OBSConnector>),
    VTS(Mutex<VTSConnector>),
    General,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(tag = "tag", content = "content")]
pub enum PluginQuery {
    OBS(OBSQuery),
    VTS(VTSQuery),
}

impl PluginQuery {
    pub async fn get(&self, plugin: &PluginInstance) -> Result<String, String> {
        match (self, plugin) {
            (PluginQuery::OBS(query), PluginInstance::OBS(conn)) => {
                query.run(&mut *conn.lock().await).await
            }
            (PluginQuery::VTS(query), PluginInstance::VTS(conn)) => {
                query.run(&mut *conn.lock().await).await
            }
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

impl PluginAction {
    pub async fn run(&self, plugin: &PluginInstance) -> Result<(), String> {
        match (self, plugin) {
            (PluginAction::OBS(action), PluginInstance::OBS(conn)) => {
                action.run(&mut *conn.lock().await).await
            }
            (PluginAction::VTS(action), PluginInstance::VTS(conn)) => {
                action.run(&mut *conn.lock().await).await
            }
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

// There should only be one of these (so there is only one connection to OBS, VTS etc),
// but it is both Send and Sync since the connectors have their own Mutex if they need one
pub struct PluginStates {
    pub plugins: HashMap<PluginType, PluginInstance>,
}

impl PluginStates {
    pub async fn init(conf: Vec<PluginConfig>) -> PluginStates {
        let mut plugins = HashMap::new();
        for plugin in conf {
            match plugin {
                PluginConfig::OBS(c) => {
                    plugins.insert(
                        PluginType::OBS,
                        PluginInstance::OBS(Mutex::new(OBSConnector::new(c).await)),
                    );
                }
                PluginConfig::VTS(c) => {
                    plugins.insert(
                        PluginType::VTS,
                        PluginInstance::VTS(Mutex::new(VTSConnector::new(c).await)),
                    );
                }
                PluginConfig::General => {
                    plugins.insert(PluginType::General, PluginInstance::General);
                }
            };
        }

        PluginStates { plugins }
    }
}
