pub mod general;
pub mod obs;
pub mod vts;

use super::Condition;
use tokio::sync::Mutex;
use derive_more::Display;
use serde::{Deserialize, Serialize};
use serde_json::value::Value;
use std::collections::HashMap;
use std::fmt::{Display, Formatter};

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

    // Helper method to make creating actions from frontend simpler
    // PluginInstance is required to convert certain UI friendly inputs to the required format (for
    // example VTS model name to model id)
    pub async fn from_json(
        plugin: &mut PluginInstance,
        data: Value,
    ) -> Result<PluginAction, String> {
        Ok(match plugin {
            PluginInstance::OBS(_) => PluginAction::OBS(OBSAction::from_json(data)?),
            PluginInstance::VTS(conn) => PluginAction::VTS(VTSAction::from_json(data, conn).await?),
            PluginInstance::General => PluginAction::General(GeneralAction::from_json(data)?),
        })
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

impl Condition {
    // Helper method to make creating conditions from frontend simpler
    // PluginInstance is required to convert certain UI friendly inputs to the required format (for
    // example VTS model name to model id)
    pub async fn from_json(
        plugin: &mut PluginInstance,
        data: serde_json::Value,
    ) -> Result<Condition, String> {
        if !data.is_object() {
            return Err("Invalid data input for condition".to_string());
        }

        let plugin_specific_type = &data["type"];
        let target = &data["param"];

        if plugin_specific_type.is_null() || target.is_null() {
            return Err("Invalid data input for condition".to_string());
        }

        let plugin_specific_type = plugin_specific_type.as_str().unwrap();
        let target = target.as_str().unwrap();

        let (query, target) = match plugin {
            PluginInstance::OBS(_) => {
                let (obs_query, target) = OBSQuery::from_strings(plugin_specific_type, target)?;

                (PluginQuery::OBS(obs_query), target)
            }
            PluginInstance::VTS(conn) => {
                let (vts_query, target) =
                    VTSQuery::from_strings(plugin_specific_type, target, conn).await?;

                (PluginQuery::VTS(vts_query), target)
            }
            PluginInstance::General => {
                return Err("No query types implemented for this plugin".to_string())
            }
        };

        Ok(Condition { query, target })
    }
}
