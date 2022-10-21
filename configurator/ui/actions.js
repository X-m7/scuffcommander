import * as modSingleAction from "./actions-modules/single-action.js";
import * as modHelpers from "./actions-modules/helpers.js";

const { invoke } = window.__TAURI__.tauri;

/*
 * Functions used directly by the HTML (oninput, onload, onclick)
 */

window.loadActions = function () {
  invoke("get_actions").then(modHelpers.updateActions);
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
  switch (action) {
    case "none":
      document.actionModify.setAttribute("hidden", true);
      document.singleAction.setAttribute("hidden", true);
      document.actionModify.type.value = "none";
      break;
    case "new":
      document.actionModify.removeAttribute("hidden");
      break;
    default:
      const action_id = action.substring(2);
      document.actionModify.removeAttribute("hidden");
      document.actionModify.id.value = action_id;
      invoke("load_action_details", { id: action_id }).then(
        modHelpers.showActionInUi
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
  switch (type) {
    case "none":
      document.singleAction.setAttribute("hidden", true);
      break;
    case "single":
      document.singleAction.removeAttribute("hidden");
      break;
    default:
      console.log("Unimplemented");
      break;
  }
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
