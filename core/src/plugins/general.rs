use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
#[serde(tag = "tag", content = "content")]
pub enum GeneralAction {
    Delay(f64),
}

impl GeneralAction {
    pub async fn run(&self) -> Result<(), String> {
        match self {
            GeneralAction::Delay(dur) => {
                tokio::time::sleep(
                    std::time::Duration::try_from_secs_f64(*dur).map_err(|e| e.to_string())?,
                )
                .await;
            }
        }

        Ok(())
    }
}
