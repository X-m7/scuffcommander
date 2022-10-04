use actix_web::{error, get, web, App, HttpResponse, HttpServer, Responder, Result};
use derive_more::{Display, Error};
use scuffcommander::plugins::PluginState;

#[get("/")]
async fn hello() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

#[derive(Debug, Display, Error)]
#[display(fmt = "plugin error: {}", contents)]
struct PluginError {
    contents: String,
}

// Use default implementation for `error_response()` method
impl error::ResponseError for PluginError {}

#[get("/obstest")]
async fn obstest(data: web::Data<PluginState>) -> Result<impl Responder, PluginError> {
    let opt = &*data.obs.lock().await;
    if opt.is_none() {
        return Err(PluginError {
            contents: "OBS plugin not configured".to_string(),
        });
    }

    let obs = opt.as_ref().unwrap();

    if let (Ok(version), Ok(scene_list)) = (obs.obs_version().await, obs.scene_list().await) {
        Ok(HttpResponse::Ok().body(format!(
            "Hello from OBS {:?}\nScenes are: {:?}",
            version, scene_list
        )))
    } else {
        Err(PluginError {
            contents: "OBS connection lost".to_string(),
        })
    }
}

#[get("/vtstest")]
async fn vtstest(data: web::Data<PluginState>) -> String {
    let opt = &mut *data.vts.lock().await;
    if opt.is_none() {
        return "VTS plugin not configured".to_string();
    }

    let vts = opt.as_mut().unwrap();

    match vts.vts_version().await {
        Ok(v) => v,
        Err(e) => e,
    }
}

#[get("/click/{button}")]
async fn click(path: web::Path<String>, data: web::Data<PluginState>) -> String {
    let button = path.into_inner();
    match button.as_str() {
        "1" => {
            let opt = &*data.obs.lock().await;
            if opt.is_none() {
                return "OBS plugin not configured".to_string();
            }

            let obs = opt.as_ref().unwrap();
            match obs.scene_change_current("Waiting").await {
                Ok(_) => "Success".to_string(),
                Err(e) => e,
            }
        }
        "2" => {
            let opt = &*data.obs.lock().await;
            if opt.is_none() {
                return "OBS plugin not configured".to_string();
            }

            let obs = opt.as_ref().unwrap();
            match obs.scene_change_current("Desktop + VTS").await {
                Ok(_) => "Success".to_string(),
                Err(e) => e,
            }
        }
        "3" => {
            let opt = &mut *data.vts.lock().await;
            if opt.is_none() {
                return "VTS plugin not configured".to_string();
            }

            let vts = opt.as_mut().unwrap();
            match vts.toggle_expression("Qt.exp3.json").await {
                Ok(_) => "Success".to_string(),
                Err(e) => e,
            }
        }
        "4" => {
            let opt = &mut *data.vts.lock().await;
            if opt.is_none() {
                return "VTS plugin not configured".to_string();
            }

            let vts = opt.as_mut().unwrap();
            match vts.toggle_expression("expressiong.exp3.json").await {
                Ok(_) => "Success".to_string(),
                Err(e) => e,
            }
        }
        _ => "Unrecognised button".to_string(),
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let state = web::Data::new(PluginState::init().await);

    HttpServer::new(move || {
        App::new()
            .service(hello)
            .service(obstest)
            .service(vtstest)
            .service(click)
            .app_data(state.clone())
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
