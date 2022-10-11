use scuffcommander::plugins::obs::OBSConfig;
use scuffcommander::plugins::vts::VTSConfig;
use scuffcommander::plugins::PluginConfig;
use scuffcommander::AppConfig;
use std::io::stdin;

fn input_str(statement: &str, default: &str) -> String {
    let mut buf = String::new();
    println!("{statement}");
    stdin().read_line(&mut buf).expect("Failed to read line");
    if buf.len() <= 1 {
        buf = default.to_string();
    }

    buf
}

fn obs_setup() -> PluginConfig {
    let addr = input_str(
        "Enter OBS' websocket address (leave blank for 'localhost')",
        "localhost",
    );
    let port = input_str("Enter OBS' websocket port (leave blank for 4455)", "4455")
        .parse::<u16>()
        .expect("Invalid port number");
    let pw = input_str("Enter OBS' websocket password (leave blank for none)", "");

    let mut password = None;
    if !pw.is_empty() {
        password = Some(pw);
    }

    PluginConfig::OBS(OBSConfig {
        addr,
        port,
        password,
    })
}

fn vts_setup() -> PluginConfig {
    let addr = input_str(
        "Enter VTS' websocket URL (leave blank for 'ws://localhost:8001')",
        "ws://localhost:8001",
    );
    let token_file = input_str(
        "Enter the path to the VTS token file (leave blank for 'vts_token.txt')",
        "vts_token.txt",
    );

    PluginConfig::VTS(VTSConfig { addr, token_file })
}

fn main() {
    let addr = input_str(
        "Enter the address to bind to (leave blank for 'localhost')",
        "localhost",
    );
    let port = input_str("Enter the port to bind to (leave blank for 8080)", "8080")
        .parse::<u16>()
        .expect("Invalid port number");

    let plugins = vec![obs_setup(), vts_setup()];

    let conf = AppConfig {
        addr,
        port,
        plugins,
    };

    println!(
        "config.json:\n{}",
        serde_json::to_string_pretty(&conf).unwrap()
    );
}
