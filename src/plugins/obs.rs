use obws::responses::scenes::Scene;
use obws::{Client, Version};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct OBSConfig {
    pub addr: String,
    pub port: u16,
    pub password: Option<String>,
}

pub struct OBSConnector {
    client: Client,
}

impl OBSConnector {
    pub async fn new(conf: OBSConfig) -> Result<OBSConnector, String> {
        match Client::connect(conf.addr, conf.port, conf.password).await {
            Ok(c) => Ok(OBSConnector { client: c }),
            Err(e) => Err(e.to_string()),
        }
    }

    pub async fn from_option(conf: Option<OBSConfig>) -> Option<OBSConnector> {
        // If config not present don't bother
        if let Some(c) = conf {
            // If issue when setting up connection then print error
            match OBSConnector::new(c).await {
                Ok(o) => Some(o),
                Err(e) => {
                    println!("{}", e);
                    None
                }
            }
        } else {
            None
        }
    }

    pub async fn obs_version(&self) -> Result<Version, String> {
        match self.client.general().version().await {
            Ok(v) => Ok(v.obs_version),
            Err(e) => Err(e.to_string()),
        }
    }

    pub async fn scene_list(&self) -> Result<Vec<Scene>, String> {
        match self.client.scenes().list().await {
            Ok(s) => Ok(s.scenes),
            Err(e) => Err(e.to_string()),
        }
    }

    pub async fn scene_change_current(&self, scene: &str) -> Result<(), String> {
        match self.client.scenes().set_current_program_scene(scene).await {
            Ok(_) => Ok(()),
            Err(e) => Err(e.to_string()),
        }
    }
}
