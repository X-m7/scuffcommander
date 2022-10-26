import * as modSingleAction from "./single-action.js";
import * as modConditionAction from "./condition-action.js";
import * as modPlugins from "./plugins/plugins.js";

const { invoke } = window.__TAURI__.tauri;

export function chooseTypeChain() {
  const type = document.chainAction.type.value;
  switch (type) {
    case "none":
      document.singleAction.setAttribute("hidden", true);
      document.conditionAction.setAttribute("hidden", true);
      break;
    case "single":
      document.singleAction.removeAttribute("hidden");
      break;
    case "condition":
      document.conditionAction.removeAttribute("hidden");
      invoke("get_actions").then(modConditionAction.updateThenElseSelect);
      break;
    default:
      console.log("Unsupported action type");
      break;
  }
}

// if no index is given the new action will be added to the end
export function addToChain(index = null) {
  const type = document.chainAction.type.value;
  switch (type) {
    case "none":
      console.log("Invalid action type");
      break;
    case "single":
      const data = modSingleAction.getSingleActionData();
      data.index = index;
      invoke("add_new_single_action_to_temp_chain", data).then(
        refreshTempChain
      );
      break;
    case "condition":
      const data2 = modConditionAction.getConditionData();
      invoke("add_new_condition_action_to_temp_chain", {
        actionData: data2,
        index: index,
      }).then(refreshTempChain);
  }
}

function clearChainView() {
  document.getElementById("chainActionList").replaceChildren();
}

export function resetTempChain() {
  invoke("clear_temp_chain").then(clearChainView);
}

export function resetChainInputs() {
  modPlugins.singleActionResetInputs();
  document.chainAction.type.value = "none";
}

export function showChainAction(id) {
  invoke("copy_action_to_temp_chain", { id: id }).then(refreshTempChain);
  document.chainAction.removeAttribute("hidden");
  resetChainInputs();
}

export function deleteChainItem(i) {
  invoke("delete_entry_from_temp_chain", { index: i }).then(refreshTempChain);
}

function createButtonNode(text, onclick) {
  const button = document.createElement("button");
  button.textContent = text;
  button.addEventListener("click", onclick);
  button.setAttribute("type", "button");
  return button;
}

function refreshTempChain() {
  invoke("get_temp_chain_display").then((actions) => {
    clearChainView();
    const uiList = document.getElementById("chainActionList");
    for (const i in actions) {
      const newElement = document.createElement("li");
      newElement.textContent = actions[i];
      uiList.appendChild(newElement);
      const iInt = parseInt(i);
      newElement.appendChild(
        createButtonNode("Delete", () => deleteChainItem(iInt))
      );
      newElement.appendChild(
        createButtonNode("Add new action above", () => addToChain(iInt))
      );
    }
  });
}
