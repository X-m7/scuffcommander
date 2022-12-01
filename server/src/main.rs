use actix_web::{get, web, App, HttpResponse, HttpServer, Responder};
use directories::ProjectDirs;
use handlebars::Handlebars;

use scuffcommander_core::action::ActionConfig;
use scuffcommander_core::plugins::PluginStates;
use scuffcommander_core::ui::UIConfig;
use scuffcommander_core::AppConfig;

#[get("/")]
async fn hello() -> impl Responder {
    HttpResponse::PermanentRedirect()
        .append_header(("location", "/page/home"))
        .finish()
}

#[get("/page/{page_id}")]
async fn page(
    page_id: web::Path<String>,
    hb: web::Data<Handlebars<'_>>,
    ui_data: web::Data<UIConfig>,
) -> impl Responder {
    let id = page_id.into_inner();

    let Some(page) = ui_data.pages.get(&id) else {
        return HttpResponse::NotFound().body("Page not found");
    };

    let data = serde_json::json!( { "buttons": page.buttons, "style": ui_data.style } );
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

    let Some(action) = actions.get(button.as_str()) else {
        return format!("Action with ID {} not configured", button);
    };

    if let Err(e) = action.run(&data.plugins).await {
        return e;
    }

    "Success".to_string()
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let args: Vec<String> = std::env::args().collect();
    let dirs = ProjectDirs::from("", "", "scuffcommander");

    let config_dir_path;

    if args.len() > 1 {
        let mut path = std::path::PathBuf::new();
        path.push(&args[1]);
        config_dir_path = path;
    } else if let Some(dirs) = dirs {
        config_dir_path = dirs.config_dir().to_path_buf()
    } else {
        println!("Configuration folder required");
        return Ok(());
    }

    // to_string_lossy does not in fact return a String
    let config_dir = config_dir_path.to_string_lossy().to_string();

    std::fs::create_dir_all(&config_dir_path).expect("Unable to create config directory");

    println!("Using {config_dir} as the config folder");

    let conf = AppConfig::from_file(&format!("{config_dir}/config.json"));
    let state = web::Data::new(PluginStates::init(conf.plugins).await);

    println!(
        "Starting the server at address http://{}:{}",
        conf.addr, conf.port
    );

    // Handlebars uses a repository for the compiled templates. This object must be
    // shared between the application threads, and is therefore passed to the
    // Application Builder as an atomic reference-counted pointer.
    let mut handlebars = Handlebars::new();
    handlebars
        .register_template_string("page", String::from_utf8_lossy(include_bytes!("page.html")))
        .expect("Unable to initialise Handlebars");
    let handlebars_ref = web::Data::new(handlebars);

    HttpServer::new(move || {
        App::new()
            .service(hello)
            .service(click)
            .service(page)
            .app_data(state.clone())
            .app_data(handlebars_ref.clone())
            .app_data(web::Data::new(ActionConfig::from_file(&format!(
                "{config_dir}/actions.json"
            ))))
            .app_data(web::Data::new(UIConfig::from_file(&format!(
                "{config_dir}/ui.json"
            ))))
    })
    .bind((conf.addr, conf.port))?
    .run()
    .await
}
