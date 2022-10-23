import * as modSingleAction from "./single-action.js";

const { invoke } = window.__TAURI__.tauri;

export function chooseTypeChain() {
  const type = document.chainAction.type.value;
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
}

export function addToEndOfChain() {
  const type = document.chainAction.type.value;
  switch (type) {
    case "none":
      console.log("Invalid action type");
      break;
    case "single":
      const data = modSingleAction.getSingleActionData();
      invoke("add_new_single_action_to_temp_chain", data).then(
        refreshTempChain
      );
      break;
    case "condition":
      console.log("Unimplemented");
  }
}

function clearChainView() {
  document.getElementById("chainActionList").replaceChildren();
}

export function resetTempChain() {
  invoke("clear_temp_chain").then(clearChainView);
}

export function resetChainInputs() {
  modSingleAction.resetSingleActionInputs();
  document.chainAction.type.value = "none";
}

export function showChainAction(id) {
  invoke("copy_action_to_temp_chain", { id: id }).then(refreshTempChain);
  document.chainAction.removeAttribute("hidden");
  resetChainInputs();
}

function refreshTempChain() {
  // TODO: add buttons for each action (add above, add below, delete, edit)
  invoke("get_temp_chain_display").then((actions) => {
    clearChainView();
    const uiList = document.getElementById("chainActionList");
    actions.forEach((action) => {
      let newElement = document.createElement("li");
      newElement.textContent = action;
      uiList.appendChild(newElement);
    });
  });
}
