use tokio::fs::{read_to_string, write};
use serde::{Deserialize, Serialize};
use serde_json::value::Value;
use std::fmt::{Display, Formatter};
use vtubestudio::Client;

#[derive(Serialize, Deserialize, Clone)]
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

    // Helper method to convert the target string from a UI friendly format to that expected by the
    // run method (for example converting from a model name to id)
    pub async fn from_strings(
        query_type: &str,
        target: &str,
        conn: &mut VTSConnector,
    ) -> Result<(VTSQuery, String), String> {
        let query: VTSQuery =
            serde_json::from_str(&format!("\"{}\"", query_type)).map_err(|e| e.to_string())?;

        let target = match query {
            VTSQuery::ActiveModelId => conn.get_model_id_from_name(target).await?,
            VTSQuery::Version => target.to_string(),
        };

        Ok((query, target))
    }
}

impl Display for VTSQuery {
    fn fmt(&self, f: &mut Formatter) -> std::fmt::Result {
        match self {
            VTSQuery::ActiveModelId => write!(f, "Active Model ID"),
            VTSQuery::Version => write!(f, "Version"),
        }
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct VTSMoveModelInput {
    pub x: f64,
    pub y: f64,
    pub rotation: f64,
    pub size: f64,
    pub time_sec: f64,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(tag = "tag", content = "content")]
pub enum VTSAction {
    ToggleExpression(String),
    LoadModel(String),
    MoveModel(VTSMoveModelInput),
    TriggerHotkey(String),
    CheckConnection,
}

impl Display for VTSAction {
    fn fmt(&self, f: &mut Formatter) -> std::fmt::Result {
        match self {
            VTSAction::ToggleExpression(expr) => write!(f, "Toggle Expression with ID: {}", expr),
            VTSAction::LoadModel(model) => write!(f, "Load Model with ID: {}", model),
            VTSAction::MoveModel(VTSMoveModelInput {
                x,
                y,
                rotation,
                size,
                time_sec,
            }) => write!(
                f,
                "Move Model to coordinates ({}, {}), with rotation {} and size {} for {} seconds",
                x, y, rotation, size, time_sec
            ),
            VTSAction::TriggerHotkey(hotkey) => write!(f, "Trigger hotkey with ID: {}", hotkey),
            VTSAction::CheckConnection => write!(f, "Check Connection"),
        }
    }
}

impl VTSAction {
    pub async fn run(&self, conn: &mut VTSConnector) -> Result<(), String> {
        match self {
            VTSAction::ToggleExpression(expr) => conn.toggle_expression(expr).await,
            VTSAction::LoadModel(model) => conn.load_model(model).await,
            VTSAction::MoveModel(info) => conn.move_model(info).await,
            VTSAction::TriggerHotkey(hotkey) => conn.trigger_hotkey(hotkey).await,
            VTSAction::CheckConnection => conn.get_vts_version().await.map(|_| ()),
        }
    }

    // Here the inputs for actions are the names (for example LoadModel will have the model name
    // instead of ID), which will then be converted to the ID before storage
    pub async fn from_json(mut data: Value, conn: &mut VTSConnector) -> Result<VTSAction, String> {
        if !data.is_object() {
            return Err("Invalid data input for OBS action".to_string());
        }

        let output = match data["type"]
            .take()
            .as_str()
            .ok_or_else(|| "VTS action type must be a string".to_string())?
        {
            "ToggleExpression" => {
                let param = conn
                    .get_expression_id_from_name(
                        data["param"]
                            .as_str()
                            .ok_or("VTS action parameter must be a string")?,
                    )
                    .await?;

                VTSAction::ToggleExpression(param)
            }
            "LoadModel" => {
                let param = conn
                    .get_model_id_from_name(
                        data["param"]
                            .as_str()
                            .ok_or("VTS action parameter must be a string")?,
                    )
                    .await?;

                VTSAction::LoadModel(param)
            }
            "MoveModel" => {
                let info: VTSMoveModelInput = serde_json::value::from_value(data["param"].take())
                    .map_err(|e| e.to_string())?;

                VTSAction::MoveModel(info)
            }
            "TriggerHotkey" => {
                let param = conn
                    .get_hotkey_id_from_name(
                        data["param"]
                            .as_str()
                            .ok_or("VTS action parameter must be a string")?,
                    )
                    .await?;

                VTSAction::TriggerHotkey(param)
            }
            "CheckConnection" => VTSAction::CheckConnection,
            _ => return Err("Unsupported VTS action type".to_string()),
        };

        Ok(output)
    }
}

#[derive(Serialize, Deserialize, Clone)]
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
        let (client, mut events) = Client::builder()
            .auth_token(Self::read_token(&conf.token_file).await)
            .url(conf.addr)
            .authentication("VTScuffCommander", "ScuffCommanderDevs", None)
            .build_tungstenite();

        let token_file = conf.token_file.to_string();

        tokio::spawn(async move {
            // This returns whenever the authentication middleware receives a new auth token.
            // We can handle it by saving it somewhere, etc.
            while let Some(event) = events.next().await {
                if let vtubestudio::client::ClientEvent::NewAuthToken(token) = event {
                    println!("Got new auth token: {}", token);
                    match write(&token_file, token).await {
                        Ok(_) => println!("Saved new token to {}", token_file),
                        Err(e) => println!("Failed to save token: {}", e),
                    }
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

    async fn get_current_model_info(
        &mut self,
    ) -> Result<vtubestudio::data::CurrentModelResponse, String> {
        let resp = self
            .client
            .send(&vtubestudio::data::CurrentModelRequest {})
            .await;

        resp.map_err(|e| e.to_string())
    }

    pub async fn get_current_model_id(&mut self) -> Result<String, String> {
        Ok(self.get_current_model_info().await?.model_id)
    }

    // Takes the model ID as the parameter
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

    // Returns x, y, rotation, size
    pub async fn get_current_model_position(&mut self) -> Result<(f64, f64, f64, f64), String> {
        let pos = self.get_current_model_info().await?.model_position;

        Ok((pos.position_x, pos.position_y, pos.rotation, pos.size))
    }

    pub async fn move_model(&mut self, info: &VTSMoveModelInput) -> Result<(), String> {
        let resp = self
            .client
            .send(&vtubestudio::data::MoveModelRequest {
                time_in_seconds: info.time_sec,
                values_are_relative_to_model: false,
                position_x: Some(info.x),
                position_y: Some(info.y),
                rotation: Some(info.rotation),
                size: Some(info.size),
            })
            .await;
        match resp {
            Ok(_) => Ok(()),
            Err(e) => Err(e.to_string()),
        }
    }

    // Takes the expression ID/file name and whether to enable or disable the expression
    // The toggle_expression method may be more useful
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

    // Takes the expression ID/file name
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

    async fn get_expression_list(&mut self) -> Result<Vec<vtubestudio::data::Expression>, String> {
        let current_state = self
            .client
            .send(&vtubestudio::data::ExpressionStateRequest {
                details: false,
                expression_file: None,
            })
            .await;
        if let Err(e) = current_state {
            return Err(e.to_string());
        }

        Ok(current_state.unwrap().expressions)
    }

    pub async fn get_expression_name_list(&mut self) -> Result<Vec<String>, String> {
        let exprs = self.get_expression_list().await?;
        let mut out = Vec::new();

        for expr in exprs {
            out.push(expr.name);
        }

        Ok(out)
    }

    async fn get_expression_id_from_name(&mut self, name: &str) -> Result<String, String> {
        let exprs = self.get_expression_list().await?;

        for expr in exprs {
            if name == expr.name {
                return Ok(expr.file);
            }
        }

        Err("Expression with given name not found for the current model".to_string())
    }

    pub async fn get_expression_name_from_id(&mut self, id: &str) -> Result<String, String> {
        let exprs = self.get_expression_list().await?;

        for expr in exprs {
            if id == expr.file {
                return Ok(expr.name);
            }
        }

        Err("Expression with given ID not found for the current model".to_string())
    }

    async fn get_model_list(&mut self) -> Result<Vec<vtubestudio::data::Model>, String> {
        let current_state = self
            .client
            .send(&vtubestudio::data::AvailableModelsRequest {})
            .await;
        if let Err(e) = current_state {
            return Err(e.to_string());
        }

        Ok(current_state.unwrap().available_models)
    }

    pub async fn get_model_name_list(&mut self) -> Result<Vec<String>, String> {
        let models = self.get_model_list().await?;
        let mut out = Vec::new();

        for model in models {
            out.push(model.model_name);
        }

        Ok(out)
    }

    async fn get_model_id_from_name(&mut self, name: &str) -> Result<String, String> {
        let models = self.get_model_list().await?;

        for model in models {
            if name == model.model_name {
                return Ok(model.model_id);
            }
        }

        Err("No model found with the given name".to_string())
    }

    pub async fn get_model_name_from_id(&mut self, id: &str) -> Result<String, String> {
        let models = self.get_model_list().await?;

        for model in models {
            if id == model.model_id {
                return Ok(model.model_name);
            }
        }

        Err("No model found with the given ID".to_string())
    }

    async fn get_hotkey_list(&mut self) -> Result<Vec<vtubestudio::data::Hotkey>, String> {
        let resp = self
            .client
            .send(&vtubestudio::data::HotkeysInCurrentModelRequest {
                model_id: None,
                live2d_item_file_name: None,
            })
            .await;
        match resp {
            Ok(r) => Ok(r.available_hotkeys),
            Err(e) => Err(e.to_string()),
        }
    }

    async fn get_hotkey_id_from_name(&mut self, name: &str) -> Result<String, String> {
        for hotkey in self.get_hotkey_list().await? {
            if name == hotkey.name {
                return Ok(hotkey.hotkey_id);
            }
        }

        Err("Hotkey with given name not found in current model".to_string())
    }

    pub async fn get_hotkey_name_from_id(&mut self, id: &str) -> Result<String, String> {
        for hotkey in self.get_hotkey_list().await? {
            if id == hotkey.hotkey_id {
                return Ok(hotkey.name);
            }
        }

        Err("Hotkey with given ID not found in current model".to_string())
    }

    pub async fn get_hotkey_name_list(&mut self) -> Result<Vec<String>, String> {
        let mut out = Vec::new();
        for hotkey in self.get_hotkey_list().await? {
            out.push(hotkey.name);
        }

        Ok(out)
    }

    pub async fn trigger_hotkey(&mut self, id: &str) -> Result<(), String> {
        let resp = self
            .client
            .send(&vtubestudio::data::HotkeyTriggerRequest {
                hotkey_id: id.to_string(),
                item_instance_id: None,
            })
            .await;
        match resp {
            Ok(_) => Ok(()),
            Err(e) => Err(e.to_string()),
        }
    }
}
