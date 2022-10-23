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
  const action = document.actionSelect.action.value;
  modHelpers.resetAllActionDetailInputs();
  switch (action) {
    case "none":
      document.actionModify.type.value = "none";
      break;
    case "new":
      document.actionModify.removeAttribute("hidden");
      document.actionModify.id.value = "";
      document.actionModify.type.value = "none";
      break;
    default:
      const action_id = action.substring(2);
      document.actionModify.removeAttribute("hidden");
      document.actionModify.id.value = action_id;
      invoke("load_action_details", { id: action_id }).then((action) =>
        modHelpers.showActionInUi(action, action_id)
      );
      break;
  }
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
  const type = document.actionModify.type.value;
  modHelpers.resetAllActionDetailInputs();
  switch (type) {
    case "none":
      break;
    case "single":
      modSingleAction.resetSingleActionInputs();
      document.singleAction.removeAttribute("hidden");
      break;
    case "chain":
      modChainAction.resetChainInputs();
      modChainAction.resetTempChain();
      document.chainAction.removeAttribute("hidden");
      break;
    default:
      console.log("Unimplemented");
      break;
  }
};

window.chooseTypeChain = function () {
  modChainAction.chooseTypeChain();
};

window.addToEndOfChain = function () {
  modChainAction.addToEndOfChain();
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
