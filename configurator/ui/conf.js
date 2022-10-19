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
      document.getElementById("obsCheck").textContent = "OK";
    } else {
      document.getElementById("obsCheck").textContent = "Failed";
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
      document.getElementById("vtsCheck").textContent = "OK";
    } else {
      document.getElementById("vtsCheck").textContent = "Failed";
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
        OBS: getObsData(),
      },
      {
        VTS: getVtsData(),
      },
    ],
  };
}

function saveConfig() {
  invoke("save_config", { conf: getAppConfig() })
    .then(() => {
      document.getElementById("saveOutput").textContent =
        "Configuration saved, please restart the app to apply";
    })
    .catch((e) => {
      document.getElementById("saveOutput").textContent =
        "Error occurred: " + e;
    });
}

function updateView(conf) {
  document.serverForm.addr.value = conf.addr;
  document.serverForm.port.value = conf.port;

  for (i in conf.plugins) {
    if ("OBS" in conf.plugins[i]) {
      document.obsForm.addr.value = conf.plugins[i].OBS.addr;
      document.obsForm.port.value = conf.plugins[i].OBS.port;
      document.obsForm.pw.value = conf.plugins[i].OBS.password;
    } else if ("VTS" in conf.plugins[i]) {
      document.vtsForm.addr.value = conf.plugins[i].VTS.addr;
      document.vtsForm.tokenFile.value = conf.plugins[i].VTS.token_file;
    }
  }
}

function loadConfig() {
  invoke("get_config").then((conf) => updateView(conf));
}
