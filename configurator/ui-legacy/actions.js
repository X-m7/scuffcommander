import * as modSingleAction from "./actions-modules/single-action.js";
import * as modChainAction from "./actions-modules/chain-action.js";
import * as modConditionAction from "./actions-modules/condition-action.js";
import * as modHelpers from "./actions-modules/helpers.js";
import * as modPlugins from "./actions-modules/plugins/plugins.js";
import * as modObs from "./actions-modules/plugins/obs.js";
import * as modVts from "./actions-modules/plugins/vts.js";
import * as modGeneral from "./actions-modules/plugins/general.js";

const { invoke } = window.__TAURI__.tauri;

/*
 * Functions used directly by the HTML (oninput, onload, onclick)
 */

window.loadActions = function () {
  modHelpers.loadActions();
};

window.saveAll = function () {
  invoke("save_actions")
    .then(() => {
      document.getElementById("saveAllOutput").textContent = "Actions saved";
    })
    .catch((e) => {
      document.getElementById("saveAllOutput").textContent =
        "Error occurred: " + e;
    });
};

window.chooseAction = function () {
  modHelpers.chooseAction();
};

window.saveCurrentAction = function () {
  const id = document.actionSelect.action.value;
  switch (id) {
    case "none":
      console.log("Invalid action selected");
      break;
    case "new":
      // false means do not allow overwriting
      modHelpers.addNewAction(false);
      break;
    default:
      // this case is for editing an existing action so allow overwrites
      modHelpers.addNewAction(true);
      break;
  }
};

window.chooseType = function () {
  modHelpers.chooseType();
};

window.deleteCurrentAction = function () {
  const id = document.actionSelect.action.value;
  if (id === "new" || id === "none") {
    console.log("invalid action selected");
    return;
  }

  invoke("delete_action", { id: id.substring(2) }).then(() => {
    document.actionSelect.action.value = "none";
    document.actionModify.id.value = "";
    modHelpers.loadActions();
    modHelpers.chooseAction();
  });
};

window.chooseTypeChain = function () {
  modChainAction.chooseTypeChain();
};

window.addToEndOfChain = function () {
  modChainAction.addToChain();
};

window.choosePlugin = function () {
  modPlugins.singleActionChoosePlugin();
};

window.obsChooseType = function () {
  modObs.obsSingleActionChooseType();
};

window.vtsChooseType = function () {
  modVts.vtsSingleActionChooseType();
};

window.queryChoosePlugin = function () {
  modPlugins.queryChoosePlugin();
};

window.generalChooseType = function () {
  modGeneral.generalSingleActionChooseType();
};

window.obsQueryChooseType = function () {
  modObs.obsQueryChooseType();
};

window.vtsQueryChooseType = function () {
  modVts.vtsQueryChooseType();
};

window.vtsGetCurrentModelPos = function () {
  modVts.vtsGetCurrentModelPos();
};
