use actix_web::{error, get, web, App, HttpResponse, HttpServer, Responder, Result};
use derive_more::{Display, Error};
use scuffcommander::plugins::obs::OBSConnector;
use scuffcommander::plugins::vts::VTSConnector;

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
async fn obstest() -> Result<impl Responder, PluginError> {
    let obs = OBSConnector::new("localhost", 4455, Some("1234567890")).await;
    if let Err(e) = obs {
        return Err(PluginError { contents: e });
    }

    let obs = obs.unwrap();

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
async fn vtstest() -> String {
    let mut vts = VTSConnector::new("ws://localhost:8001").await;
    match vts.vts_version().await {
        Ok(v) => v,
        Err(e) => e,
    }
}

#[get("/click/{button}")]
async fn click(path: web::Path<String>) -> String {
    let button = path.into_inner();
    match button.as_str() {
        "1" => {
            let obs = OBSConnector::new("localhost", 4455, Some("1234567890")).await;
            if let Err(e) = obs {
                return e;
            }
            match obs.unwrap().scene_change_current("Waiting").await {
                Ok(_) => "Success".to_string(),
                Err(e) => e,
            }
        }
        "2" => {
            let mut vts = VTSConnector::new("ws://localhost:8001").await;
            match vts.toggle_expression("Qt.exp3.json").await {
                Ok(_) => "Success".to_string(),
                Err(e) => e,
            }
        }
        _ => "Unrecognised button".to_string(),
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| App::new().service(hello).service(obstest).service(vtstest).service(click))
        .bind(("127.0.0.1", 8080))?
        .run()
        .await
}
