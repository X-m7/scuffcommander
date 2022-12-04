use obws::responses::scenes::Scene;
use obws::Client;
use serde::{Deserialize, Serialize};
use std::fmt::{Display, Formatter};

// IsStreaming and IsRecording both return "true" or "false" as strings
#[derive(Serialize, Deserialize, Clone)]
pub enum OBSQuery {
    CurrentProgramScene,
    IsStreaming,
    IsRecording,
    Version,
}

impl OBSQuery {
    pub async fn run(&self, conn: &mut OBSConnector) -> Result<String, String> {
        match self {
            OBSQuery::CurrentProgramScene => conn.get_current_program_scene().await,
            OBSQuery::IsStreaming => conn.get_stream_status_string().await,
            OBSQuery::IsRecording => conn.get_record_status_string().await,
            OBSQuery::Version => conn.get_obs_version().await,
        }
    }
}

impl Display for OBSQuery {
    fn fmt(&self, f: &mut Formatter) -> std::fmt::Result {
        match self {
            OBSQuery::CurrentProgramScene => write!(f, "Current Program Scene"),
            OBSQuery::IsStreaming => write!(f, "Is Streaming"),
            OBSQuery::IsRecording => write!(f, "Is Recording"),
            OBSQuery::Version => write!(f, "Version"),
        }
    }
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(tag = "tag", content = "content")]
pub enum OBSAction {
    ProgramSceneChange(String),
    StartStream,
    StopStream,
    StartRecord,
    StopRecord,
    CheckConnection,
}

impl Display for OBSAction {
    fn fmt(&self, f: &mut Formatter) -> std::fmt::Result {
        match self {
            OBSAction::ProgramSceneChange(new_scene) => {
                write!(f, "Change program scene to {}", new_scene)
            }
            OBSAction::StartStream => {
                write!(f, "Start streaming")
            }
            OBSAction::StopStream => {
                write!(f, "Stop streaming")
            }
            OBSAction::StartRecord => {
                write!(f, "Start recording")
            }
            OBSAction::StopRecord => {
                write!(f, "Stop recording")
            }
            OBSAction::CheckConnection => write!(f, "Check connection"),
        }
    }
}

impl OBSAction {
    pub async fn run(&self, conn: &mut OBSConnector) -> Result<(), String> {
        match self {
            OBSAction::ProgramSceneChange(scene) => conn.change_current_program_scene(scene).await,
            OBSAction::StartStream => conn.start_stream().await,
            OBSAction::StopStream => conn.stop_stream().await,
            OBSAction::StartRecord => conn.start_record().await,
            OBSAction::StopRecord => conn.stop_record().await,
            OBSAction::CheckConnection => conn.get_obs_version().await.map(|_| ()),
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

    async fn get_stream_status(&mut self) -> Result<bool, String> {
        if !self.check_conn().await {
            return Err("Unable to create OBS websocket connection".to_string());
        }

        match self.client.as_ref().unwrap().streaming().status().await {
            Ok(res) => Ok(res.active),
            Err(e) => {
                self.client = None;
                Err(e.to_string())
            }
        }
    }

    async fn get_record_status(&mut self) -> Result<bool, String> {
        if !self.check_conn().await {
            return Err("Unable to create OBS websocket connection".to_string());
        }

        match self.client.as_ref().unwrap().recording().status().await {
            Ok(res) => Ok(res.active),
            Err(e) => {
                self.client = None;
                Err(e.to_string())
            }
        }
    }

    // Returns "true" or "false" as strings for the condition query system
    pub async fn get_stream_status_string(&mut self) -> Result<String, String> {
        let status = self.get_stream_status().await?;

        if status {
            Ok("true".to_string())
        } else {
            Ok("false".to_string())
        }
    }

    // Returns "true" or "false" as strings for the condition query system
    pub async fn get_record_status_string(&mut self) -> Result<String, String> {
        let status = self.get_record_status().await?;

        if status {
            Ok("true".to_string())
        } else {
            Ok("false".to_string())
        }
    }

    pub async fn start_stream(&mut self) -> Result<(), String> {
        if !self.check_conn().await {
            return Err("Unable to create OBS websocket connection".to_string());
        }

        match self.client.as_ref().unwrap().streaming().start().await {
            Ok(_) => Ok(()),
            Err(e) => {
                self.client = None;
                Err(e.to_string())
            }
        }
    }

    pub async fn stop_stream(&mut self) -> Result<(), String> {
        if !self.check_conn().await {
            return Err("Unable to create OBS websocket connection".to_string());
        }

        match self.client.as_ref().unwrap().streaming().stop().await {
            Ok(_) => Ok(()),
            Err(e) => {
                self.client = None;
                Err(e.to_string())
            }
        }
    }

    pub async fn start_record(&mut self) -> Result<(), String> {
        if !self.check_conn().await {
            return Err("Unable to create OBS websocket connection".to_string());
        }

        match self.client.as_ref().unwrap().recording().start().await {
            Ok(_) => Ok(()),
            Err(e) => {
                self.client = None;
                Err(e.to_string())
            }
        }
    }

    pub async fn stop_record(&mut self) -> Result<(), String> {
        if !self.check_conn().await {
            return Err("Unable to create OBS websocket connection".to_string());
        }

        match self.client.as_ref().unwrap().recording().stop().await {
            Ok(_) => Ok(()),
            Err(e) => {
                self.client = None;
                Err(e.to_string())
            }
        }
    }
}
