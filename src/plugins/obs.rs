use obws::responses::scenes::Scene;
use obws::{Client, Version};

pub struct OBSConnector {
    client: Client,
}

impl OBSConnector {
    pub async fn new(
        addr: &str,
        port: u16,
        password: Option<&str>,
    ) -> Result<OBSConnector, String> {
        match Client::connect(addr, port, password).await {
            Ok(c) => Ok(OBSConnector { client: c }),
            Err(e) => Err(e.to_string()),
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
