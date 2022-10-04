# ScuffCommander (very WIP)

## Architecture
Effectively converts plain old HTTP requests to the WebSocket stuff used by OBS and VTube Studio, so all the frontend needs to do is send HTTP requests (currently it is as simple as opening `http://server:8080/click/1` to trigger the action with id "1" for example).

### Key libraries used
- actix-web
- obws (for OBS, only v28 supported due to using v0.10.0-beta.3)
- vtubestudio-rs

## Compiling
1. Set up Rust (tested with 1.64)
2. Run `cargo build` to compile

## Running
1. Run `cargo run`
2. Open the `src/html/test.html` file in a browser
3. See if the buttons work
