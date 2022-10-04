pub mod obs;
pub mod vts;

use async_std::sync::Mutex;
use obs::{OBSConfig, OBSConnector};
use vts::{VTSConfig, VTSConnector};

pub struct PluginConfig<'a> {
    pub obs: Option<OBSConfig<'a>>,
    pub vts: Option<VTSConfig<'a>>,
}

pub struct PluginState {
    pub obs: Mutex<Option<OBSConnector>>,
    pub vts: Mutex<Option<VTSConnector>>,
}

impl PluginState {
    // TODO: make this load from a file
    pub async fn init() -> PluginState {
        let conf = PluginConfig {
            obs: Some(OBSConfig {
                addr: "localhost",
                port: 4455,
                password: Some("1234567890"),
            }),
            vts: Some(VTSConfig {
                addr: "ws://localhost:8001",
                token_file: "vts_token.txt",
            }),
        };

        PluginState {
            obs: Mutex::new({
                // If config not present don't bother
                if let Some(obs_conf) = &conf.obs {
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
                if let Some(vts_conf) = &conf.vts {
                    Some(VTSConnector::new(vts_conf).await)
                } else {
                    None
                }
            }),
        }
    }
}
