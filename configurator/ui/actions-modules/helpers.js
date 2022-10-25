import * as modSingleAction from "./single-action.js";
import * as modChainAction from "./chain-action.js";
import * as modConditionAction from "./condition-action.js";

const { invoke } = window.__TAURI__.tauri;

function resetAllActionDetailInputs() {
  document.chainAction.setAttribute("hidden", true);
  document.singleAction.setAttribute("hidden", true);
  document.conditionAction.setAttribute("hidden", true);
  modSingleAction.resetSingleActionInputs();
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
    case "condition":
      document.conditionAction.removeAttribute("hidden");
      invoke("get_actions").then(modConditionAction.updateThenElseSelect);
      break;
  }
}

export function loadActions() {
  resetAllActionDetailInputs();
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
    case "condition":
      modConditionAction.addNewConditionAction(loadActions);
      break;
  }
}

export function updateActions(actions) {
  resetSelectInput(document.actionSelect.action);

  const defaultOpt2 = document.createElement("option");
  defaultOpt2.value = "new";
  defaultOpt2.textContent = "Create a new action";
  document.actionSelect.action.appendChild(defaultOpt2);

  // false for 3rd param since we also need a second predefined option
  updateSelectInput(actions, document.actionSelect.action, false);
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
      // TODO: load current condition, show current actions as text
      break;
    default:
      console.log("Unrecognised action type");
      return;
  }

  document.actionModify.type.value = action.tag.toLowerCase();
}

export function resetSelectInput(
  selectElement,
  defaultContent = "Select an option"
) {
  selectElement.options.length = 0;
  const defaultOpt = document.createElement("option");
  defaultOpt.value = "none";
  defaultOpt.textContent = defaultContent;
  selectElement.appendChild(defaultOpt);
}

export function updateSelectInput(list, selectElement, resetBeforehand = true) {
  if (resetBeforehand) {
    resetSelectInput(selectElement);
  }
  list.forEach((i) => {
    const opt = document.createElement("option");
    // prepend something so we can differentiate the real options from "none"
    opt.value = "x-" + i;
    opt.textContent = i;
    selectElement.appendChild(opt);
  });
}
