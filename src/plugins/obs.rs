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
    ) -> Result<OBSConnector, &'static str> {
        match Client::connect(addr, port, password).await {
            Ok(c) => Ok(OBSConnector { client: c }),
            Err(_) => Err("OBS connection failure"),
        }
    }

    pub async fn obs_version(&self) -> Result<Version, &'static str> {
        match self.client.general().version().await {
            Ok(v) => Ok(v.obs_version),
            Err(_) => Err("OBS connection failure"),
        }
    }

    pub async fn scene_list(&self) -> Result<Vec<Scene>, &'static str> {
        match self.client.scenes().list().await {
            Ok(s) => Ok(s.scenes),
            Err(_) => Err("OBS connection failure"),
        }
    }
}
