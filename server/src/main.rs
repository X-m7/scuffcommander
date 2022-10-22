use actix_web::{get, web, App, HttpResponse, HttpServer, Responder};
use handlebars::Handlebars;

use scuffcommander_core::plugins::PluginStates;
use scuffcommander_core::{ActionConfig, AppConfig};

#[get("/")]
async fn hello() -> impl Responder {
    HttpResponse::PermanentRedirect()
        .append_header(("location", "/page/home"))
        .finish()
}

// Currently only supports putting all the actions into 1 page
// Also only takes the action IDs as the button names directly with no sorting (will use different
// struct with an array for display purposes)
#[get("/page/{page_id}")]
async fn page(
    page_id: web::Path<String>,
    hb: web::Data<Handlebars<'_>>,
    actions_data: web::Data<ActionConfig>,
) -> impl Responder {
    let id = page_id.into_inner();

    if id != "home" {
        return HttpResponse::NotFound().body("Page not found");
    }

    let data = serde_json::json!( { "actions": Vec::from_iter(actions_data.actions.keys()) } );
    let body = hb.render("page", &data).expect("Template render failed");

    HttpResponse::Ok().body(body)
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

    // Handlebars uses a repository for the compiled templates. This object must be
    // shared between the application threads, and is therefore passed to the
    // Application Builder as an atomic reference-counted pointer.
    let mut handlebars = Handlebars::new();
    handlebars
        .register_templates_directory(".html", "./templates")
        .expect("Unable to initialise Handlebars");
    let handlebars_ref = web::Data::new(handlebars);

    HttpServer::new(move || {
        App::new()
            .service(hello)
            .service(click)
            .service(page)
            .app_data(state.clone())
            .app_data(handlebars_ref.clone())
            .app_data(web::Data::new(ActionConfig::from_file("actions.json")))
    })
    .bind((conf.addr, conf.port))?
    .run()
    .await
}
