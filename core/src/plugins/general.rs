use serde::{Deserialize, Serialize};
use serde_json::value::Value;
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

    pub fn from_json(data: Value) -> Result<GeneralAction, String> {
        if !data.is_object() {
            return Err("Invalid data input for OBS action".to_string());
        }

        let output = match data["type"]
            .as_str()
            .ok_or_else(|| "General action type must be a string".to_string())?
        {
            "Delay" => GeneralAction::Delay(
                data["param"]
                    .as_f64()
                    .ok_or_else(|| "Delay parameter must be a decimal number".to_string())?,
            ),
            _ => return Err("Unsupported General action type".to_string()),
        };

        Ok(output)
    }
}
