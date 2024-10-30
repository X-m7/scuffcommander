pub mod actions;
pub mod config;
pub mod pages;
pub mod plugins;
pub mod style;

// needed to make a module here since commands can't be defined at the root directly
pub mod general {
    use tauri_plugin_dialog::{DialogExt, FilePath};

    fn file_path_to_string(fp: FilePath) -> String {
        match fp {
            FilePath::Url(url) => url.as_str().to_string(),
            FilePath::Path(path) => format!("{}", path.display()),
        }
    }

    #[tauri::command]
    pub async fn pick_image_file(app: tauri::AppHandle) -> Result<String, String> {
        app.dialog().file()
            .set_title("Open Image")
            .add_filter(
                "Supported images",
                &[
                    "png", "jpg", "jpeg", "jfif", "pjpeg", "pjp", "avif", "gif", "webp", "bmp",
                    "ico",
                ],
            )
            .blocking_pick_file()
            .ok_or_else(|| "File dialog closed".to_string())
            .map(file_path_to_string)
    }

    #[tauri::command]
    pub async fn pick_executable_file(app: tauri::AppHandle) -> Result<String, String> {
        let mut builder = app.dialog().file();

        builder = builder.set_title("Select executable");

        // On Windows filter to exes only, elsewhere (macOS/Linux) there is no extension
        #[cfg(windows)]
        {
            builder = builder.add_filter("Executables", &["exe"]);
        }

        builder
            .blocking_pick_file()
            .ok_or_else(|| "File dialog closed".to_string())
            .map(file_path_to_string)
    }

    #[tauri::command]
    pub async fn pick_folder(app: tauri::AppHandle) -> Result<String, String> {
        app.dialog().file()
            .set_title("Select folder")
            .blocking_pick_folder()
            .ok_or_else(|| "File dialog closed".to_string())
            .map(file_path_to_string)
    }

    #[tauri::command]
    pub async fn restart_app(app_handle: tauri::AppHandle) {
        app_handle.restart();
    }
}
