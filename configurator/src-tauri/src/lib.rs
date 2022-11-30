pub mod actions;
pub mod config;
pub mod pages;
pub mod plugins;
pub mod style;

// needed to make a module here since commands can't be defined at the root directly
pub mod general {
    #[tauri::command]
    pub async fn pick_image_file() -> Result<String, String> {
        tauri::api::dialog::blocking::FileDialogBuilder::new()
            .set_title("Open Image")
            .add_filter("Supported images", &["png", "jpg"])
            .pick_file()
            .ok_or_else(|| "File dialog closed".to_string())
            .map(|x| format!("{}", x.display()))
    }
}
