import * as modHelpers from "./helpers.js";
import * as modCommon from "../common.js";
import * as modPlugins from "./plugins/plugins.js";

const { invoke } = window.__TAURI__.tauri;

export function resetConditionInputs() {
  modPlugins.conditionResetPluginInputs();
  document.conditionAction.thenAction.value = "none";
  document.conditionAction.elseAction.value = "none";
  document.getElementById("conditionCurrentThen").textContent = "None";
  document.getElementById("conditionCurrentElse").textContent = "None";
}

// output follows layout of ConditionActionData struct in the actions::condition module of backend
export function getConditionData() {
  const pluginType = document.conditionAction.plugin.value;
  const pluginData = modPlugins.queryGetPluginParam(pluginType);
  const thenAction = document.conditionAction.thenAction.value;
  if (thenAction === "none") {
    console.log("Invalid then action for condition");
    return null;
  }

  let elseAction = document.conditionAction.elseAction.value;
  if (elseAction === "none") {
    elseAction = null;
  } else {
    elseAction = elseAction.substring(2);
  }

  return {
    plugin_type: pluginType,
    plugin_data: pluginData,
    then_action: thenAction.substring(2),
    else_action: elseAction,
  };
}

export function addNewConditionAction(then = null, overwrite = false) {
  const data = getConditionData();
  // once the action has been added refresh the list of actions
  invoke("add_new_condition_action", {
    actionData: data,
    id: document.actionModify.id.value,
    overwrite: overwrite,
  }).then(then);
}

export function updateThenElseSelect(
  actions,
  currentActionThen = null,
  currentActionElse = null
) {
  modCommon.resetSelectInput(
    document.conditionAction.thenAction,
    "Select an existing action to copy"
  );
  modCommon.resetSelectInput(document.conditionAction.elseAction, "Do nothing");

  if (currentActionThen !== null) {
    invoke("convert_action_to_string", { action: currentActionThen }).then(
      (str) => {
        document.getElementById("conditionCurrentThen").textContent = str;
      }
    );
  } else {
    document.getElementById("conditionCurrentThen").textContent = "None";
  }

  if (currentActionElse !== null) {
    invoke("convert_action_to_string", { action: currentActionElse }).then(
      (str) => {
        document.getElementById("conditionCurrentElse").textContent = str;
      }
    );
  } else {
    document.getElementById("conditionCurrentElse").textContent = "None";
  }

  let actionsFiltered = actions;
  const currentAction = document.actionSelect.action.value;

  // filter out the current action since creating directly recursive conditionals does not work
  // due to modifying an existing action really being remove and recreate instead of in place
  // also incidentally blocks adding chain X with a condition also having X as then/else
  if (currentAction.startsWith("x-")) {
    actionsFiltered = actions.filter(
      (act) => act !== currentAction.substring(2)
    );
  }

  modCommon.updateSelectInput(
    actionsFiltered,
    document.conditionAction.thenAction,
    false
  );
  modCommon.updateSelectInput(
    actionsFiltered,
    document.conditionAction.elseAction,
    false
  );
}

export function showConditionAction(action) {
  modPlugins.conditionShowHelper(action[0]);
  invoke("get_actions").then((allActions) =>
    updateThenElseSelect(allActions, action[1], action[2])
  );

  modPlugins.queryChoosePlugin();
  document.conditionAction.removeAttribute("hidden");
}
