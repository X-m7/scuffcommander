use actix_web::{error, get, web, App, HttpResponse, HttpServer, Responder, Result};
use derive_more::{Display, Error};
use scuffcommander::plugins::{PluginInstance, PluginStates, PluginType};
use scuffcommander::{ActionConfig, AppConfig};

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
async fn obstest(data: web::Data<PluginStates>) -> Result<impl Responder, PluginError> {
    let plugins = &*data.plugins.lock().await;
    if !plugins.contains_key(&PluginType::OBS) {
        return Err(PluginError {
            contents: "OBS plugin not configured".to_string(),
        });
    }

    match plugins.get(&PluginType::OBS).unwrap() {
        PluginInstance::OBS(obs) => {
            if let (Ok(version), Ok(scene_list)) = (obs.obs_version().await, obs.scene_list().await)
            {
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
        _ => Err(PluginError {
            contents: "Mismatched plugin type and action".to_string(),
        }),
    }
}

#[get("/vtstest")]
async fn vtstest(data: web::Data<PluginStates>) -> String {
    let plugins = &mut *data.plugins.lock().await;
    if !plugins.contains_key(&PluginType::VTS) {
        return "VTS plugin not configured".to_string();
    }

    match plugins.get_mut(&PluginType::VTS).unwrap() {
        PluginInstance::VTS(vts) => match vts.vts_version().await {
            Ok(v) => v,
            Err(e) => e,
        },
        _ => "Mismatched plugin type and action".to_string(),
    }
}

#[get("/click/{button}")]
async fn click(
    path: web::Path<String>,
    data: web::Data<PluginStates>,
    actions_data: web::Data<ActionConfig>,
) -> String {
    let button = path.into_inner();

    let plugins = &mut *data.plugins.lock().await;
    let actions = &actions_data.actions;

    if !actions.contains_key(button.as_str()) {
        return format!("Action with ID {} not configured", button);
    }

    let action = actions.get(button.as_str()).unwrap();

    if let Err(e) = action.run(plugins).await {
        return e;
    }

    "Success".to_string()
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let conf = AppConfig::from_file("config.json");
    let state = web::Data::new(PluginStates::init(conf.plugins).await);

    HttpServer::new(move || {
        App::new()
            .service(hello)
            .service(obstest)
            .service(vtstest)
            .service(click)
            .app_data(state.clone())
            .app_data(web::Data::new(ActionConfig::from_file("actions.json")))
    })
    .bind((conf.addr, conf.port))?
    .run()
    .await
}
