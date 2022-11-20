import * as modSingleAction from "./single-action.js";
import * as modChainAction from "./chain-action.js";
import * as modConditionAction from "./condition-action.js";
import * as modPlugins from "./plugins/plugins.js";
import * as modCommon from "../common.js";

const { invoke } = window.__TAURI__.tauri;

function resetAllActionDetailInputs() {
  document.chainAction.setAttribute("hidden", true);
  document.singleAction.setAttribute("hidden", true);
  document.conditionAction.setAttribute("hidden", true);
  modPlugins.singleActionResetInputs();
  modChainAction.resetChainInputs();
  modConditionAction.resetConditionInputs();
}

export function chooseAction() {
  const action = document.actionSelect.action.value;
  resetAllActionDetailInputs();
  switch (action) {
    case "none":
      document.actionModify.type.value = "none";
      document.actionModify.setAttribute("hidden", true);
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
        showActionInUi(action, action_id)
      );
      break;
  }
}

export function chooseType() {
  const type = document.actionModify.type.value;
  resetAllActionDetailInputs();
  switch (type) {
    case "none":
      break;
    case "single":
      document.singleAction.removeAttribute("hidden");
      break;
    case "chain":
      modChainAction.resetTempChain();
      document.chainAction.removeAttribute("hidden");
      break;
    case "if":
      document.conditionAction.removeAttribute("hidden");
      invoke("get_actions").then(modConditionAction.updateThenElseSelect);
      break;
    default:
      console.log("Unsupported action type");
      break;
  }
}

export function loadActions() {
  resetAllActionDetailInputs();
  invoke("get_actions").then(updateActions);
}

export function addNewAction(overwrite = false) {
  const type = document.actionModify.type.value;
  switch (type) {
    case "none":
      console.log("Invalid action type");
      break;
    case "single":
      modSingleAction.addNewSingleAction(loadActions, overwrite);
      break;
    case "chain":
      invoke("store_temp_chain", {
        id: document.actionModify.id.value,
        overwrite: overwrite,
      }).then(loadActions);
      break;
    case "if":
      modConditionAction.addNewConditionAction(loadActions, overwrite);
      break;
    default:
      console.log("Unsupported action type");
      break;
  }
}

export function updateActions(actions) {
  modCommon.resetSelectInput(document.actionSelect.action);

  const defaultOpt2 = document.createElement("option");
  defaultOpt2.value = "new";
  defaultOpt2.textContent = "Create a new action";
  document.actionSelect.action.appendChild(defaultOpt2);

  // false for 3rd param since we also need a second predefined option
  modCommon.updateSelectInput(actions, document.actionSelect.action, false);
}

// Loading a selected action
function showActionInUi(action, id) {
  switch (action.tag) {
    case "Single":
      modSingleAction.showSingleAction(action.content);
      break;
    case "Chain":
      modChainAction.showChainAction(id);
      break;
    case "If":
      modConditionAction.showConditionAction(action.content);
      break;
    default:
      console.log("Unrecognised action type");
      return;
  }

  document.actionModify.type.value = action.tag.toLowerCase();
}
