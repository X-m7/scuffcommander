use actix_rt::spawn;
use async_std::fs::{read_to_string, write};
use serde::{Deserialize, Serialize};
use vtubestudio::Client;

#[derive(Serialize, Deserialize)]
pub enum VTSQuery {
    ActiveModelId,
    Version,
}

impl VTSQuery {
    pub async fn run(&self, conn: &mut VTSConnector) -> Result<String, String> {
        match self {
            VTSQuery::ActiveModelId => conn.get_current_model_id().await,
            VTSQuery::Version => conn.get_vts_version().await,
        }
    }
}

#[derive(Serialize, Deserialize)]
pub enum VTSAction {
    ToggleExpression(String),
    LoadModel(String),
    CheckConnection,
}

impl VTSAction {
    pub async fn run(&self, conn: &mut VTSConnector) -> Result<(), String> {
        match self {
            VTSAction::ToggleExpression(expr) => conn.toggle_expression(expr).await,
            VTSAction::LoadModel(model) => conn.load_model(model).await,
            VTSAction::CheckConnection => conn.get_vts_version().await.map(|_| ()),
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct VTSConfig {
    pub addr: String,
    pub token_file: String,
}

pub struct VTSConnector {
    client: Client,
}

impl VTSConnector {
    async fn read_token(path: &str) -> Option<String> {
        let token = read_to_string(path).await;
        match token {
            Ok(t) => Some(t),
            Err(_) => None,
        }
    }

    pub async fn new(conf: VTSConfig) -> VTSConnector {
        let (client, mut new_tokens) = Client::builder()
            .auth_token(Self::read_token(&conf.token_file).await)
            .url(conf.addr)
            .authentication("VTScuffCommander", "ScuffCommanderDevs", None)
            .build_tungstenite();

        let token_file = conf.token_file.to_string();

        spawn(async move {
            // This returns whenever the authentication middleware receives a new auth token.
            // We can handle it by saving it somewhere, etc.
            while let Some(token) = new_tokens.next().await {
                println!("Got new auth token: {}", token);
                match write(&token_file, token).await {
                    Ok(_) => println!("Saved new token to {}", token_file),
                    Err(e) => println!("Failed to save token: {}", e),
                }
            }
        });

        VTSConnector { client }
    }

    pub async fn get_vts_version(&mut self) -> Result<String, String> {
        let resp = self
            .client
            .send(&vtubestudio::data::StatisticsRequest {})
            .await;
        match resp {
            Ok(v) => Ok(v.vtubestudio_version),
            Err(e) => Err(e.to_string()),
        }
    }

    pub async fn get_current_model_id(&mut self) -> Result<String, String> {
        let resp = self
            .client
            .send(&vtubestudio::data::CurrentModelRequest {})
            .await;
        match resp {
            Ok(v) => Ok(v.model_id),
            Err(e) => Err(e.to_string()),
        }
    }

    pub async fn load_model(&mut self, model: &str) -> Result<(), String> {
        let resp = self
            .client
            .send(&vtubestudio::data::ModelLoadRequest {
                model_id: model.to_string(),
            })
            .await;
        match resp {
            Ok(_) => Ok(()),
            Err(e) => Err(e.to_string()),
        }
    }

    pub async fn change_expression_state(
        &mut self,
        expr: &str,
        active: bool,
    ) -> Result<(), String> {
        let resp = self
            .client
            .send(&vtubestudio::data::ExpressionActivationRequest {
                expression_file: expr.to_string(),
                active,
            })
            .await;
        match resp {
            Ok(_) => Ok(()),
            Err(e) => Err(e.to_string()),
        }
    }

    pub async fn toggle_expression(&mut self, expr: &str) -> Result<(), String> {
        let current_state = self
            .client
            .send(&vtubestudio::data::ExpressionStateRequest {
                details: false,
                expression_file: Some(expr.to_string()),
            })
            .await;
        if let Err(e) = current_state {
            return Err(e.to_string());
        }

        let current_exprs = current_state.unwrap().expressions;
        if current_exprs.is_empty() {
            return Err("Expression not found in current model".to_string());
        }

        self.change_expression_state(expr, !current_exprs[0].active)
            .await
    }
}
