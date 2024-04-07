use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use tokio::fs::{read_to_string, write};
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
    EnableExpression(String),
    DisableExpression(String),
    LoadModel(String),
    MoveModel(VTSMoveModelInput),
    TriggerHotkey(String),
    SaveCurrentModelPosition(String),
    RestoreModelPosition(String, f64),
    CheckConnection,
}

impl VTSAction {
    pub async fn run(&self, conn: &mut VTSConnector) -> Result<(), String> {
        match self {
            VTSAction::ToggleExpression(expr) => conn.toggle_expression(expr).await,
            VTSAction::EnableExpression(expr) => conn.change_expression_state(expr, true).await,
            VTSAction::DisableExpression(expr) => conn.change_expression_state(expr, false).await,
            VTSAction::LoadModel(model) => conn.load_model(model).await,
            VTSAction::MoveModel(info) => conn.move_model(info).await,
            VTSAction::TriggerHotkey(hotkey) => conn.trigger_hotkey(hotkey).await,
            VTSAction::SaveCurrentModelPosition(var_id) => {
                conn.save_current_model_position(var_id).await
            }
            VTSAction::RestoreModelPosition(var_id, time_sec) => {
                conn.restore_model_position(var_id, time_sec).await
            }
            VTSAction::CheckConnection => conn.get_vts_version().await.map(|_| ()),
        }
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct VTSConfig {
    pub addr: String,
    pub token_file: String,
}

pub struct VTSConnector {
    client: Client,
    position_store: HashMap<String, VTSMoveModelInput>,
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
                    println!("Got new auth token: {token}");
                    match write(&token_file, token).await {
                        Ok(_) => println!("Saved new token to {token_file}"),
                        Err(e) => println!("Failed to save token: {e}"),
                    }
                }
            }
        });

        VTSConnector {
            client,
            position_store: HashMap::new(),
        }
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

    // Takes the current model position and stores it under var_id
    async fn save_current_model_position(&mut self, var_id: &str) -> Result<(), String> {
        let (x, y, rotation, size) = self.get_current_model_position().await?;

        let pos_struct = VTSMoveModelInput {
            x,
            y,
            rotation,
            size,
            time_sec: 0.0,
        };

        self.position_store.insert(var_id.to_string(), pos_struct);

        Ok(())
    }

    // Takes the model position stored under var_id and moves the model to said position
    // time_sec is the same as in the move model action
    async fn restore_model_position(&mut self, var_id: &str, time_sec: &f64) -> Result<(), String> {
        if let Some(mut pos_struct) = self.position_store.remove(var_id) {
            pos_struct.time_sec = *time_sec;
            return self.move_model(&pos_struct).await;
        }

        Err(format!(
            "Variable {} does not have a stored position",
            var_id
        ))
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

    pub async fn get_expression_id_from_name(&mut self, name: &str) -> Result<String, String> {
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

    pub async fn get_model_id_from_name(&mut self, name: &str) -> Result<String, String> {
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

    async fn get_hotkey_list(
        &mut self,
        model_id: Option<String>,
    ) -> Result<Vec<vtubestudio::data::Hotkey>, String> {
        let resp = self
            .client
            .send(&vtubestudio::data::HotkeysInCurrentModelRequest {
                model_id,
                live2d_item_file_name: None,
            })
            .await;
        match resp {
            Ok(r) => Ok(r.available_hotkeys),
            Err(e) => Err(e.to_string()),
        }
    }

    pub async fn get_hotkey_id_from_name(&mut self, name: &str) -> Result<String, String> {
        for hotkey in self.get_hotkey_list(None).await? {
            if name == hotkey.name {
                return Ok(hotkey.hotkey_id);
            }
        }

        Err("Hotkey with given name not found in current model".to_string())
    }

    pub async fn get_hotkey_name_from_id(&mut self, id: &str) -> Result<String, String> {
        for hotkey in self.get_hotkey_list(None).await? {
            if id == hotkey.hotkey_id {
                return Ok(hotkey.name);
            }
        }

        Err("Hotkey with given ID not found in current model".to_string())
    }

    // This also includes the name of each hotkey as the second part of the tuple
    pub async fn get_hotkey_id_list(
        &mut self,
        model_id: Option<String>,
    ) -> Result<Vec<(String, String)>, String> {
        let mut out = Vec::new();
        for hotkey in self.get_hotkey_list(model_id).await? {
            out.push((hotkey.hotkey_id, hotkey.name));
        }

        Ok(out)
    }

    pub async fn get_hotkey_name_list(&mut self) -> Result<Vec<String>, String> {
        let mut out = Vec::new();
        for hotkey in self.get_hotkey_list(None).await? {
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
