# ScuffCommander

## Architecture
The server converts plain old HTTP requests to the WebSocket stuff used by OBS and VTube Studio, so all the frontend needs to do is send HTTP requests (currently it is as simple as opening `http://server:8080/click/1` to trigger the action with id "1" for example). It also generates the buttons to trigger the actions using the `server/src/page.html` Handlebars template file.

The configurator app uses the same code as the server to load the configuration files and communicate with OBS and VTube Studio, but does not expose its UI publicly like the server.

The core library and the server are both written in Rust, while the configurator is written in a mix of Rust and TypeScript.

### Key libraries used
- actix-web (as the base for the server)
- handlebars-rs (for the server to autogenerate the pages)
- tauri (as the base for the configurator)
- preact (for the configurator frontend)
- serde-json (to generate and parse the configuration files)
- obws (for OBS, only v28 supported due to using v0.10)
- vtubestudio-rs

## Compiling

### Requirements
- Rust and Cargo (tested with 1.66)
- NodeJS and npm (tested with 19.1)
- [Tauri specific dependencies for the configurator](https://tauri.app/v1/guides/getting-started/prerequisites)

### Server
Run `cargo build --release` in the `server` directory, the executable will be `server/target/release/scuffcommander-server`.

### Configurator
1. Run `npm install` in the `configurator` folder
2. Run `cargo install tauri-cli` or `npm install --save-dev @tauri-apps/cli` (see [here](https://tauri.app/v1/guides/faq#node-or-cargo) for the differences))
3. Run `cargo tauri build` in the `configurator/src-tauri` folder, the executable will be `configurator/src-tauri/target/release/scuffcommander-configurator`, with installers and such in `configurator/src-tauri/target/release/bundle`

## Running in development mode
- For the server run `cargo run` in the `server` directory
- For the configurator run `cargo tauri dev` in the `configurator` directory

## Additional notes
- If the address used is `localhost` the server will not be accessible to any other devices, to allow other devices to connect use `0.0.0.0` instead
- The configuration files are stored in the location defined in `config_dir` [here](https://github.com/dirs-dev/directories-rs#projectdirs)
