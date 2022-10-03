use actix_rt::spawn;
use vtubestudio::data::StatisticsRequest;
use vtubestudio::Client;

pub struct VTSConnector {
    client: Client,
}

impl VTSConnector {
    pub async fn new(addr: &str) -> VTSConnector {
        let (client, mut new_tokens) = Client::builder()
            .auth_token(Some(
                "prev_token".to_string(),
            ))
            .url(addr)
            .authentication("VTScuffCommander", "ScuffCommanderDevs", None)
            .build_tungstenite();

        println!("auth?");

        spawn(async move {
            // This returns whenever the authentication middleware receives a new auth token.
            // We can handle it by saving it somewhere, etc.
            while let Some(token) = new_tokens.next().await {
                println!("Got new auth token: {}", token);
            }
        });

        VTSConnector { client }
    }

    pub async fn vts_version(&mut self) -> Result<String, String> {
        let resp = self.client.send(&StatisticsRequest {}).await;
        match resp {
            Ok(v) => Ok(v.vtubestudio_version),
            Err(e) => Ok(e.to_string()),
        }
    }
}
