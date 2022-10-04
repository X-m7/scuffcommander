use actix_rt::spawn;
use async_std::fs::{read_to_string, write};
use vtubestudio::data::{ExpressionActivationRequest, ExpressionStateRequest, StatisticsRequest};
use vtubestudio::Client;

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

    pub async fn new(addr: &str) -> VTSConnector {
        let token_file = "vts_token.txt";

        let (client, mut new_tokens) = Client::builder()
            .auth_token(Self::read_token(token_file).await)
            .url(addr)
            .authentication("VTScuffCommander", "ScuffCommanderDevs", None)
            .build_tungstenite();

        spawn(async move {
            // This returns whenever the authentication middleware receives a new auth token.
            // We can handle it by saving it somewhere, etc.
            while let Some(token) = new_tokens.next().await {
                println!("Got new auth token: {}", token);
                match write(token_file, token).await {
                    Ok(_) => println!("Saved new token to {}", token_file),
                    Err(e) => println!("Failed to save token: {}", e),
                }
            }
        });

        VTSConnector { client }
    }

    pub async fn vts_version(&mut self) -> Result<String, String> {
        let resp = self.client.send(&StatisticsRequest {}).await;
        match resp {
            Ok(v) => Ok(v.vtubestudio_version),
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
            .send(&ExpressionActivationRequest {
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
            .send(&ExpressionStateRequest {
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
