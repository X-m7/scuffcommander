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
            obs: Mutex::new({
                // If config not present don't bother
                if let Some(obs_conf) = conf.obs {
                    // If issue when setting up connection then print error
                    match OBSConnector::new(obs_conf).await {
                        Ok(o) => Some(o),
                        Err(e) => {
                            println!("{}", e);
                            None
                        }
                    }
                } else {
                    None
                }
            }),
            vts: Mutex::new({
                if let Some(vts_conf) = conf.vts {
                    Some(VTSConnector::new(vts_conf).await)
                } else {
                    None
                }
            }),
        }
    }
}
