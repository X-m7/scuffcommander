use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt::{Display, Formatter};
use std::fs::read_to_string;

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
#[derive(Serialize, Deserialize, Clone)]
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

impl UIButton {
    pub fn get_data(&self) -> &ButtonData {
        match self {
            UIButton::ExecuteAction(data) => data,
            UIButton::OpenPage(data) => data,
        }
    }

    pub fn get_mut_data(&mut self) -> &mut ButtonData {
        match self {
            UIButton::ExecuteAction(data) => data,
            UIButton::OpenPage(data) => data,
        }
    }
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
