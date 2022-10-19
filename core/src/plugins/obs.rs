use obws::responses::scenes::Scene;
use obws::Client;
use serde::{Deserialize, Serialize};
use serde_json::value::Value;

#[derive(Serialize, Deserialize)]
pub enum OBSQuery {
    CurrentProgramScene,
    Version,
}

impl OBSQuery {
    pub async fn run(&self, conn: &mut OBSConnector) -> Result<String, String> {
        match self {
            OBSQuery::CurrentProgramScene => conn.get_current_program_scene().await,
            OBSQuery::Version => conn.get_obs_version().await,
        }
    }
}

#[derive(Serialize, Deserialize)]
pub enum OBSAction {
    ProgramSceneChange(String),
    CheckConnection,
}

impl OBSAction {
    pub async fn run(&self, conn: &mut OBSConnector) -> Result<(), String> {
        match self {
            OBSAction::ProgramSceneChange(scene) => conn.change_current_program_scene(scene).await,
            OBSAction::CheckConnection => conn.get_obs_version().await.map(|_| ()),
        }
    }

    pub fn from_json(data: Value) -> Result<OBSAction, String> {
        if data.is_object() {
            Ok(
                match data["type"]
                    .as_str()
                    .ok_or_else(|| "OBS action type must be a string".to_string())?
                {
                    "ProgramSceneChange" => OBSAction::ProgramSceneChange(
                        data["param"]
                            .as_str()
                            .ok_or_else(|| "OBS action parameter must be a string".to_string())?
                            .to_string(),
                    ),
                    "CheckConnection" => OBSAction::CheckConnection,
                    _ => return Err("Unsupported OBS action type".to_string()),
                },
            )
        } else {
            Err("Invalid data input for OBS action".to_string())
        }
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct OBSConfig {
    pub addr: String,
    pub port: u16,
    pub password: Option<String>,
}

pub struct OBSConnector {
    client: Option<Client>,
    config: OBSConfig,
}

impl OBSConnector {
    pub async fn new(config: OBSConfig) -> OBSConnector {
        OBSConnector {
            client: Client::connect(config.addr.clone(), config.port, config.password.clone())
                .await
                .ok(),
            config,
        }
    }

    async fn check_conn(&mut self) -> bool {
        if self.client.is_none() {
            self.client = Client::connect(
                self.config.addr.clone(),
                self.config.port,
                self.config.password.clone(),
            )
            .await
            .ok();
        }

        self.client.is_some()
    }

    // Just returns the major version (so for 28.0.2 this returns "28")
    pub async fn get_obs_version(&mut self) -> Result<String, String> {
        if !self.check_conn().await {
            return Err("Unable to create OBS websocket connection".to_string());
        }

        match self.client.as_ref().unwrap().general().version().await {
            Ok(v) => Ok(v.obs_version.major.to_string()),
            Err(e) => {
                self.client = None;
                Err(e.to_string())
            }
        }
    }

    pub async fn get_scene_list(&mut self) -> Result<Vec<Scene>, String> {
        if !self.check_conn().await {
            return Err("Unable to create OBS websocket connection".to_string());
        }

        match self.client.as_ref().unwrap().scenes().list().await {
            Ok(s) => Ok(s.scenes),
            Err(e) => {
                self.client = None;
                Err(e.to_string())
            }
        }
    }

    pub async fn get_current_program_scene(&mut self) -> Result<String, String> {
        if !self.check_conn().await {
            return Err("Unable to create OBS websocket connection".to_string());
        }

        match self
            .client
            .as_ref()
            .unwrap()
            .scenes()
            .current_program_scene()
            .await
        {
            Ok(s) => Ok(s),
            Err(e) => {
                self.client = None;
                Err(e.to_string())
            }
        }
    }

    pub async fn change_current_program_scene(&mut self, scene: &str) -> Result<(), String> {
        if !self.check_conn().await {
            return Err("Unable to create OBS websocket connection".to_string());
        }

        match self
            .client
            .as_ref()
            .unwrap()
            .scenes()
            .set_current_program_scene(scene)
            .await
        {
            Ok(_) => Ok(()),
            Err(e) => {
                self.client = None;
                Err(e.to_string())
            }
        }
    }
}