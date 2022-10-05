use actix_web::{error, get, web, App, HttpResponse, HttpServer, Responder, Result};
use derive_more::{Display, Error};
use scuffcommander::plugins::{PluginStates, PluginInstance, PluginType};
use scuffcommander::{AppConfig, ActionConfig};

use std::collections::HashMap;
use scuffcommander::plugins::PluginAction;
use scuffcommander::plugins::vts::VTSAction;
use scuffcommander::Action;
use scuffcommander::plugins::obs::OBSAction;
use scuffcommander::plugins::PluginConfig;
use scuffcommander::plugins::obs::OBSConfig;
use scuffcommander::plugins::vts::VTSConfig;

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
        },
        _ => Err(PluginError { contents: "Mismatched plugin type and action".to_string() })
    }

}

#[get("/vtstest")]
async fn vtstest(data: web::Data<PluginStates>) -> String {
    let plugins = &mut *data.plugins.lock().await;
    if !plugins.contains_key(&PluginType::VTS) {
        return "VTS plugin not configured".to_string();
    }

    match plugins.get_mut(&PluginType::VTS).unwrap() {
        PluginInstance::VTS(vts) => {
            match vts.vts_version().await {
                Ok(v) => v,
                Err(e) => e,
            }
        },
        _ => "Mismatched plugin type and action".to_string()
    }
}

#[get("/click/{button}")]
async fn click(path: web::Path<String>, data: web::Data<PluginStates>, actions_data: web::Data<ActionConfig>) -> String {
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

    let mut conf = AppConfig::from_file("kek");
    conf.plugins.plugins.push(PluginConfig::OBS(OBSConfig { addr: "localhost".to_string(), port: 4455, password: Some("1234567890".to_string())}));
    conf.plugins.plugins.push(PluginConfig::VTS(VTSConfig { addr: "ws://localhost:8001".to_string(), token_file: "vts_token.txt".to_string()}));
    println!("{}", serde_json::to_string_pretty(&conf).unwrap());

    let mut actions = ActionConfig { actions: HashMap::new() };
    let mut chain = Vec::new();
    chain.push(PluginAction::VTS(VTSAction::ToggleExpression("Qt.exp3.json".to_string())));
    chain.push(PluginAction::VTS(VTSAction::ToggleExpression("expressiong.exp3.json".to_string())));
    actions.actions.insert("1".to_string(), Action::Single(PluginAction::OBS(OBSAction::SceneChange("Waiting".to_string()))));
    actions.actions.insert("2".to_string(), Action::Single(PluginAction::OBS(OBSAction::SceneChange("Desktop + VTS".to_string()))));
    actions.actions.insert("3".to_string(), Action::Single(PluginAction::VTS(VTSAction::ToggleExpression("Qt.exp3.json".to_string()))));
    actions.actions.insert("4".to_string(), Action::Single(PluginAction::VTS(VTSAction::ToggleExpression("expressiong.exp3.json".to_string()))));
    actions.actions.insert("5".to_string(), Action::Chain(chain));
    println!("{}", serde_json::to_string_pretty(&actions).unwrap());

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
