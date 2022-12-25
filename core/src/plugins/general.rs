use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
#[serde(tag = "tag", content = "content")]
pub enum GeneralAction {
    Delay(f64),
    RunCommand(String, Vec<String>, Option<String>),
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
            GeneralAction::RunCommand(cmd, args, current_dir) => {
                let mut builder = tokio::process::Command::new(cmd);
                builder.args(args);

                if let Some(current_dir) = current_dir {
                    builder.current_dir(current_dir);
                }

                builder
                    .spawn()
                    .map_err(|e| e.to_string())?
                    .wait()
                    .await
                    .map_err(|e| e.to_string())?;
            }
        }

        Ok(())
    }
}
