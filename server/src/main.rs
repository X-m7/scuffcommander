use actix_web::{get, web, App, HttpResponse, HttpServer, Responder};
use scuffcommander_core::plugins::PluginStates;
use scuffcommander_core::{ActionConfig, AppConfig};

#[get("/")]
async fn hello() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

#[get("/click/{button}")]
async fn click(
    path: web::Path<String>,
    data: web::Data<PluginStates>,
    actions_data: web::Data<ActionConfig>,
) -> String {
    let button = path.into_inner();
    let actions = &actions_data.actions;

    if !actions.contains_key(button.as_str()) {
        return format!("Action with ID {} not configured", button);
    }

    let action = actions.get(button.as_str()).unwrap();

    if let Err(e) = action.run(&mut *data.plugins.lock().await).await {
        return e;
    }

    "Success".to_string()
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let args: Vec<String> = std::env::args().collect();

    if args.len() == 1 {
        println!("Configuration folder required");
        return Ok(());
    };

    // cd to config directory so relative paths (for example for the VTS token file) goes there
    std::env::set_current_dir(&args[1]).expect("Unable to open the given config directory");

    let conf = AppConfig::from_file("config.json");
    let state = web::Data::new(PluginStates::init(conf.plugins).await);

    HttpServer::new(move || {
        App::new()
            .service(hello)
            .service(click)
            .app_data(state.clone())
            .app_data(web::Data::new(ActionConfig::from_file("actions.json")))
    })
    .bind((conf.addr, conf.port))?
    .run()
    .await
}
