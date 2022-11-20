import * as modButtonStyle from "./button-style.js";

const { invoke } = window.__TAURI__.tauri;

// copied from pages.js
function showMsg(msg) {
  document.getElementById("msgOutput").textContent = msg;
}

// Returns UIStyle struct
function getUiStyleStruct() {
  return {
    default_button_style: modButtonStyle.getButtonStyleStruct(),
    bg_color: document.globalColor.bgColor.value,
    fg_color: document.globalColor.fgColor.value,
  };
}

//
function loadUiStyle() {
  invoke("get_ui_style").then((style) => {
    document.globalColor.bgColor.value = style.bg_color;
    document.globalColor.fgColor.value = style.fg_color;
    modButtonStyle.loadButtonStyleData(style.default_button_style);
  });
}

/*
 * Functions used directly by the HTML (onclick, onload, oninput)
 */

window.saveUiConfig = function () {
  invoke("store_ui_style", { style: getUiStyleStruct() }).then(() => {
    invoke("save_ui_config").then(() => showMsg("Style configuration saved"));
  });
};

window.loadUiStyle = function () {
  loadUiStyle();
};
