const { invoke } = window.__TAURI__.tauri;

// format follows OBSConfig struct
function getObsData() {
    let addr = document.obsForm.addr.value;
    let port = document.obsForm.port.value;
    let pw = document.obsForm.pw.value;
    return { addr: addr, port: parseInt(port), password: pw };
}

function testObs() {
    invoke("test_obs_connection", { conf: getObsData() }).then((res) => {
        if (res) {
            document.getElementById("obsCheck").innerHTML = "OK";
        } else {
            document.getElementById("obsCheck").innerHTML = "Failed"
        }
    });
}

// format follows VTSConfig struct
function getVtsData() {
    let addr = document.vtsForm.addr.value;
    let file = document.vtsForm.tokenFile.value;
    return { addr: addr, token_file: file };
}

function testVts() {
    invoke("test_vts_connection", { conf: getVtsData() }).then((res) => {
        if (res) {
            document.getElementById("vtsCheck").innerHTML = "OK";
        } else {
            document.getElementById("vtsCheck").innerHTML = "Failed"
        }
    });
}

// format follows AppConfig struct
function getAppConfig() {
    let addr = document.serverForm.addr.value;
    let port = document.serverForm.port.value;

    return {
        addr: addr,
        port: parseInt(port),
        plugins: [
            {
                OBS: getObsData()
            },
            {
                VTS: getVtsData()
            }
        ]
    };
}

function saveConfig() {
    invoke("save_config", { conf: getAppConfig() }).then(() => {
        document.getElementById("saveOutput").innerHTML = "Configuration saved, please restart the app to apply";
    }).catch((e) => {
        document.getElementById("saveOutput").innerHTML = "Error occurred: " + e;
    });
}
