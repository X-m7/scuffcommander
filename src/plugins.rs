pub mod obs;
pub mod vts;

use async_std::sync::Mutex;
use obs::{OBSConfig, OBSConnector};
use serde::{Deserialize, Serialize};
use vts::{VTSConfig, VTSConnector};

#[derive(Serialize, Deserialize)]
pub struct PluginConfig {
    pub obs: Option<OBSConfig>,
    pub vts: Option<VTSConfig>,
}

pub struct PluginState {
    pub obs: Mutex<Option<OBSConnector>>,
    pub vts: Mutex<Option<VTSConnector>>,
}

impl PluginState {
    pub async fn init(conf: PluginConfig) -> PluginState {
        PluginState {
            obs: Mutex::new(OBSConnector::from_option(conf.obs).await),
            vts: Mutex::new(VTSConnector::from_option(conf.vts).await),
        }
    }
}
