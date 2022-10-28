pub mod plugins;

use async_recursion::async_recursion;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt::{Display, Formatter};
use std::fs::read_to_string;

use plugins::{PluginAction, PluginConfig, PluginInstance, PluginQuery, PluginType};

// See examples/confgen.rs on how to generate the config.json file
#[derive(Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub addr: String,
    pub port: u16,
    pub plugins: Vec<PluginConfig>,
}

impl AppConfig {
    pub fn from_file(path: &str) -> AppConfig {
        serde_json::from_str(&read_to_string(path).unwrap_or_else(|e| {
            println!("{}", e);
            String::new()
        }))
        .unwrap_or_else(|e| {
            println!("Unable to parse config: {}", e);
            println!("Using defaults");

            AppConfig {
                addr: "localhost".to_string(),
                port: 8080,
                plugins: PluginConfig::get_default_vec(),
            }
        })
    }
}

// See examples/actiongen.rs on how to generate the actions.json file
#[derive(Serialize, Deserialize)]
pub struct ActionConfig {
    pub actions: HashMap<String, Action>,
}

impl ActionConfig {
    pub fn from_file(path: &str) -> ActionConfig {
        serde_json::from_str(&read_to_string(path).unwrap_or_else(|e| {
            println!("{}", e);
            String::new()
        }))
        .unwrap_or_else(|e| {
            println!("Unable to parse action config: {}", e);
            println!("Using defaults");
            ActionConfig {
                actions: HashMap::new(),
            }
        })
    }
}

// See examples/uiconfgen.rs on how to generate the ui.json file
#[derive(Serialize, Deserialize)]
pub struct UIConfig {
    pub style: UIStyle,
    pub pages: HashMap<String, UIPage>,
}

impl UIConfig {
    pub fn from_file(path: &str) -> UIConfig {
        serde_json::from_str(&read_to_string(path).unwrap_or_else(|e| {
            println!("{}", e);
            String::new()
        }))
        .unwrap_or_else(|e| {
            println!("Unable to parse UI config: {}", e);
            println!("Using defaults");

            let mut pages = HashMap::new();
            pages.insert(
                "home".to_string(),
                UIPage {
                    buttons: Vec::new(),
                },
            );

            UIConfig {
                pages,
                style: UIStyle {
                    default_button_style: ButtonStyle {
                        width: "3cm".to_string(),
                        height: "3cm".to_string(),
                        bg_color: "#656565".to_string(),
                        fg_color: "#FFFFFF".to_string(),
                    },
                    bg_color: "#FFFFFF".to_string(),
                    fg_color: "#000000".to_string(),
                },
            }
        })
    }
}

// color is a valid CSS colour
// (although the safest format is #XXXXXX, otherwise the configurator at present will not display
// it correctly)
#[derive(Serialize, Deserialize)]
pub struct UIStyle {
    pub default_button_style: ButtonStyle,
    pub bg_color: String,
    pub fg_color: String,
}

// button width and height are CSS size strings ("1em", "2cm", "3in", "4px", etc)
#[derive(Serialize, Deserialize, Clone)]
pub struct ButtonStyle {
    pub width: String,
    pub height: String,
    pub bg_color: String,
    pub fg_color: String,
}

impl Display for ButtonStyle {
    fn fmt(&self, f: &mut Formatter) -> std::fmt::Result {
        write!(
            f,
            "width: {}, height: {}, background color: {}, text color: {}",
            self.width, self.height, self.bg_color, self.fg_color
        )
    }
}

#[derive(Serialize, Deserialize)]
pub struct UIPage {
    pub buttons: Vec<UIButton>,
}

#[derive(Serialize, Deserialize)]
pub enum UIButtonType {
    ExecuteAction,
    OpenPage,
}

#[derive(Serialize, Deserialize, Clone)]
pub enum UIButton {
    ExecuteAction(ButtonData),
    OpenPage(ButtonData),
}

impl Display for UIButton {
    fn fmt(&self, f: &mut Formatter) -> std::fmt::Result {
        let (data, button_type_str) = match self {
            UIButton::ExecuteAction(data) => (data, "Execute action"),
            UIButton::OpenPage(data) => (data, "Open page"),
        };

        write!(f, "{} with {}", button_type_str, data)
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ButtonData {
    pub target_id: String,
    pub style_override: Option<ButtonStyle>,
    pub img: Option<Base64Image>,
}

impl Display for ButtonData {
    fn fmt(&self, f: &mut Formatter) -> std::fmt::Result {
        write!(
            f,
            "ID: {}, style override: ({}) and image: ({})",
            self.target_id,
            self.style_override
                .as_ref()
                .map(|x| x.to_string())
                .unwrap_or_else(|| "None".to_string()),
            self.img
                .as_ref()
                .map(|x| x.to_string())
                .unwrap_or_else(|| "None".to_string())
        )
    }
}

// Format is the MIME type (for example PNG is "image/png")
#[derive(Serialize, Deserialize, Clone)]
pub struct Base64Image {
    pub format: String,
    pub data: String,
}

impl Display for Base64Image {
    fn fmt(&self, f: &mut Formatter) -> std::fmt::Result {
        write!(f, "MIME type: {}", self.format)
    }
}

// There is also a from_json function for this, but the implementation is in the plugins module due
// to needing access to plugin specifics
#[derive(Serialize, Deserialize, Clone)]
pub struct Condition {
    pub query: PluginQuery,
    pub target: String,
}

impl Display for Condition {
    fn fmt(&self, f: &mut Formatter) -> std::fmt::Result {
        write!(f, "{} == {}", self.query, self.target)
    }
}

impl Condition {
    pub async fn check(
        &self,
        plugins: &mut HashMap<PluginType, PluginInstance>,
    ) -> Result<bool, String> {
        let plugin_type = self.query.get_required_type();

        let plugin = plugins.get_mut(&plugin_type);
        if plugin.is_none() {
            return Err(format!("Plugin {} not configured", plugin_type));
        }

        Ok(self.query.get(plugin.unwrap()).await? == self.target)
    }
}

// need Box to allow recursion
#[derive(Serialize, Deserialize, Clone)]
#[serde(tag = "tag", content = "content")]
pub enum Action {
    Single(PluginAction),
    Chain(Vec<Action>),
    If(Condition, Box<Action>, Option<Box<Action>>),
}

impl Display for Action {
    fn fmt(&self, f: &mut Formatter) -> std::fmt::Result {
        match self {
            Action::Single(action) => write!(f, "{}", action),
            Action::Chain(chain) => write!(f, "Chain (length: {})", chain.len()),
            Action::If(cond, then, else_) => match else_ {
                Some(else_action) => {
                    write!(f, "If ({}) then ({}) else ({})", cond, then, else_action)
                }
                None => write!(f, "If ({}) then ({})", cond, then),
            },
        }
    }
}

impl Action {
    async fn run_single(
        action: &PluginAction,
        plugins: &mut HashMap<PluginType, PluginInstance>,
    ) -> Result<(), String> {
        let plugin_type = action.get_required_type();
        match plugins.get_mut(&plugin_type) {
            Some(p) => action.run(p).await,
            None => Err(format!("Plugin {} not configured", plugin_type)),
        }
    }

    #[async_recursion]
    pub async fn run(
        &self,
        plugins: &mut HashMap<PluginType, PluginInstance>,
    ) -> Result<(), String> {
        match self {
            Action::Single(action) => Action::run_single(action, plugins).await,
            Action::Chain(actions) => {
                for action in actions {
                    if let Err(e) = action.run(plugins).await {
                        return Err(format!("Action chain failed: {}", e));
                    }
                }
                Ok(())
            }
            Action::If(cond, then, else_) => {
                if cond.check(plugins).await? {
                    then.run(plugins).await?;
                } else if let Some(else_action) = else_ {
                    else_action.run(plugins).await?;
                }
                Ok(())
            }
        }
    }
}
