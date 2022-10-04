pub mod obs;
pub mod vts;

use async_std::sync::Mutex;
use obs::OBSConnector;
use vts::VTSConnector;

pub struct PluginState {
    pub obs: Mutex<Option<OBSConnector>>,
    pub vts: Mutex<Option<VTSConnector>>,
}

impl PluginState {
    // TODO: make this load from a file
    pub async fn init() -> PluginState {
        let obs_conn = OBSConnector::new("localhost", 4455, Some("1234567890")).await;
        let mut obs = None;
        if let Ok(o) = obs_conn {
            obs = Some(o);
        }

        let vts = VTSConnector::new("ws://localhost:8001").await;

        PluginState {
            obs: Mutex::new(obs),
            vts: Mutex::new(Some(vts)),
        }
    }
}
