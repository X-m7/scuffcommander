import * as modSingleAction from "./single-action.js";
import * as modChainAction from "./chain-action.js";

const { invoke } = window.__TAURI__.tauri;

function resetAllActionDetailInputs() {
  document.chainAction.setAttribute("hidden", true);
  document.singleAction.setAttribute("hidden", true);
  modSingleAction.resetSingleActionInputs();
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
}

export function loadActions() {
  invoke("get_actions").then(updateActions);
}

export function addNewAction() {
  const type = document.actionModify.type.value;
  switch (type) {
    case "none":
      console.log("Invalid action type");
      break;
    case "single":
      modSingleAction.addNewSingleAction(loadActions);
      break;
    case "chain":
      invoke("store_temp_chain", { id: document.actionModify.id.value }).then(
        loadActions
      );
      break;
  }
}

export function updateActions(actions) {
  document.actionSelect.action.options.length = 0;
  let defaultOpt = document.createElement("option");
  defaultOpt.value = "none";
  defaultOpt.textContent = "Select an option";
  document.actionSelect.action.appendChild(defaultOpt);

  let defaultOpt2 = document.createElement("option");
  defaultOpt2.value = "new";
  defaultOpt2.textContent = "Create a new action";
  document.actionSelect.action.appendChild(defaultOpt2);

  actions.forEach((action) => {
    let opt = document.createElement("option");
    // prepend something so we can differentiate the real options from "none" and "new"
    opt.value = "x-" + action;
    opt.textContent = action;
    document.actionSelect.action.appendChild(opt);
  });
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
    case "Condition":
      console.log("Unimplemented");
      break;
    default:
      console.log("Unrecognised action type");
      return;
  }

  document.actionModify.type.value = action.tag.toLowerCase();
}
