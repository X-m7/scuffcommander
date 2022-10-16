# ScuffCommander (very WIP)

## Architecture
The server converts plain old HTTP requests to the WebSocket stuff used by OBS and VTube Studio, so all the frontend needs to do is send HTTP requests (currently it is as simple as opening `http://server:8080/click/1` to trigger the action with id "1" for example).

The configurator app uses the same code as the server to load the configuration files and communicate with OBS and VTube Studio, but does not expose its UI publicly like the server.

### Key libraries used
- actix-web (for the server)
- tauri (for the configurator app)
- obws (for OBS, only v28 supported due to using the v0.10 beta)
- vtubestudio-rs

## Compiling
1. Set up Rust (tested with 1.64)
2. Run `cargo build` in the `server` folder to compile the server
3. Run `cargo build` in the `configurator/src-tauri` folder to compile the configurator

## Configuring
See the `example_conf` folder for example configuration files.

## Running

### Server
1. Run `cargo run -- <conf>` in the `server` folder, where `<conf>` is the path to the folder with `actions.json` and `config.json`
2. Open the `server/html/test.html` file in a browser
3. See if the buttons work

### Configurator
Run `cargo run -- <conf>` in the `configurator/src-tauri` folder, where `<conf>` is the path to the folder with `actions.json` and `config.json`
