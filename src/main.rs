use actix_web::{error, get, App, HttpResponse, HttpServer, Responder, Result};
use derive_more::{Display, Error};
use scuffcommander::plugins::obs::OBSConnector;

#[get("/")]
async fn hello() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

#[derive(Debug, Display, Error)]
#[display(fmt = "plugin error: {}", contents)]
struct PluginError {
    contents: &'static str,
}

// Use default implementation for `error_response()` method
impl error::ResponseError for PluginError {}

#[get("/obstest")]
async fn obstest() -> Result<impl Responder, PluginError> {
    let obs = OBSConnector::new("localhost", 4455, Some("1234567890")).await;
    if let Err(e) = obs {
        return Err(PluginError { contents: e });
    }

    let obs_ok = obs.unwrap();

    if let (Ok(version), Ok(scene_list)) = (obs_ok.obs_version().await, obs_ok.scene_list().await) {
        Ok(HttpResponse::Ok().body(format!(
            "Hello from OBS {:?}\nScenes are: {:?}",
            version, scene_list
        )))
    } else {
        Err(PluginError {
            contents: "OBS connection lost",
        })
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| App::new().service(hello).service(obstest))
        .bind(("127.0.0.1", 8080))?
        .run()
        .await
}
