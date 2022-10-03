use actix_web::{get, App, HttpResponse, HttpServer, Responder};
use obws::Client;

#[get("/")]
async fn hello() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

#[get("/obstest")]
async fn obstest() -> impl Responder {
    let client = Client::connect("localhost", 4455, Some("1234567890"))
        .await
        .expect("OBS connection failure");
    let version = client
        .general()
        .version()
        .await
        .expect("OBS connection failure")
        .obs_version;
    let scene_list = client
        .scenes()
        .list()
        .await
        .expect("OBS connection failure")
        .scenes;

    HttpResponse::Ok().body(format!(
        "Hello from OBS {:?}\nScenes are: {:?}",
        version, scene_list
    ))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| App::new().service(hello).service(obstest))
        .bind(("127.0.0.1", 8080))?
        .run()
        .await
}
