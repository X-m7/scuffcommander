import * as modSingleAction from "./actions-modules/single-action.js";
import * as modChainAction from "./actions-modules/chain-action.js";
import * as modHelpers from "./actions-modules/helpers.js";

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
      modHelpers.addNewAction();
      break;
    default:
      // delete the existing action, then create a new one with the updated details
      invoke("delete_action", { id: id.substring(2) }).then(
        modHelpers.addNewAction
      );
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
  modSingleAction.choosePlugin();
};

window.obsChooseType = function () {
  modSingleAction.obsChooseType();
};

window.vtsChooseType = function () {
  modSingleAction.vtsChooseType();
};
