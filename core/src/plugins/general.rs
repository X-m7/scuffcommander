use serde::{Deserialize, Serialize};
use std::fmt::{Display, Formatter};

#[derive(Serialize, Deserialize, Clone)]
#[serde(tag = "tag", content = "content")]
pub enum GeneralAction {
    Delay(f64),
}

impl Display for GeneralAction {
    fn fmt(&self, f: &mut Formatter) -> std::fmt::Result {
        match self {
            GeneralAction::Delay(dur) => write!(f, "Delay for {} seconds", dur),
        }
    }
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
