use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
#[serde(tag = "tag", content = "content")]
pub enum GeneralAction {
    Delay(f64),
}

impl GeneralAction {
    pub async fn run(&self) {
        match self {
            GeneralAction::Delay(dur) => {
                tokio::time::sleep(core::time::Duration::from_secs_f64(*dur)).await
            }
        }
    }
}
