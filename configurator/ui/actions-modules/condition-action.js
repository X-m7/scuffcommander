import * as modHelpers from "./helpers.js";

const { invoke } = window.__TAURI__.tauri;

export function resetConditionInputs() {
  document.getElementById("conditionQueryObs").setAttribute("hidden", true);
  document.getElementById("conditionQueryVts").setAttribute("hidden", true);
  document.getElementById("queryInputSelect").setAttribute("hidden", true);
  document.conditionAction.plugin.value = "none";
  document.conditionAction.typeObs.value = "none";
  document.conditionAction.typeVts.value = "none";
  document.conditionAction.inputSelect.value = "none";
  document.conditionAction.thenAction.value = "none";
  document.conditionAction.elseAction.value = "none";
}

function getPluginParam(plugin) {
  switch (plugin) {
    case "none":
      console.log("Invalid plugin type");
      return null;
    case "OBS":
      return {
        type: document.conditionAction.typeObs.value,
        // substring because it had "x-" prepended to it
        param: document.conditionAction.inputSelect.value.substring(2),
      };
    case "VTS":
      return {
        type: document.conditionAction.typeVts.value,
        // substring because it had "x-" prepended to it
        param: document.conditionAction.inputSelect.value.substring(2),
      };
  }
}

export function getConditionData() {
  const pluginType = document.conditionAction.plugin.value;
  const pluginData = getPluginParam(pluginType);
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
    pluginType: pluginType,
    pluginData: pluginData,
    thenAction: thenAction.substring(2),
    elseAction: elseAction,
  };
}

export function addNewConditionAction(then = null) {
  const data = getConditionData();
  data.id = document.actionModify.id.value;
  // once the action has been added refresh the list of actions
  invoke("add_new_condition_action", data).then(then);
}

export function updateThenElseSelect(actions) {
  modHelpers.resetSelectInput(
    document.conditionAction.thenAction,
    "Select an existing action to copy"
  );
  modHelpers.updateSelectInput(
    actions,
    document.conditionAction.thenAction,
    false
  );

  modHelpers.resetSelectInput(
    document.conditionAction.elseAction,
    "Do nothing"
  );
  modHelpers.updateSelectInput(
    actions,
    document.conditionAction.elseAction,
    false
  );
}

export function queryChoosePlugin() {
  const plugin = document.conditionAction.plugin.value;

  document.getElementById("conditionQueryObs").setAttribute("hidden", true);
  document.getElementById("conditionQueryVts").setAttribute("hidden", true);
  document.getElementById("queryInputSelect").setAttribute("hidden", true);

  switch (plugin) {
    case "none":
      break;
    case "OBS":
      document.getElementById("conditionQueryObs").removeAttribute("hidden");
      break;
    case "VTS":
      document.getElementById("conditionQueryVts").removeAttribute("hidden");
      break;
  }
}

// `then` is a function to be run after this has finished fully
// otherwise the input field(s) can end up being reset
export function obsQueryChooseType(then = null) {
  const type = document.conditionAction.typeObs.value;
  switch (type) {
    case "none":
      if (!(then instanceof Function)) {
        modHelpers.resetSelectInput(document.conditionAction.inputSelect);
        document
          .getElementById("queryInputSelect")
          .setAttribute("hidden", true);
      }
      break;
    case "CurrentProgramScene":
      invoke("get_obs_scenes")
        .then((list) =>
          modHelpers.updateSelectInput(
            list,
            document.conditionAction.inputSelect
          )
        )
        .then(then);
      document.getElementById("queryInputSelect").removeAttribute("hidden");
      break;
  }
}

// `then` is a function to be run after this has finished fully
// otherwise the input field(s) can end up being reset
export function vtsQueryChooseType(then = null) {
  const type = document.singleAction.typeVts.value;
  switch (type) {
    case "none":
      if (!(then instanceof Function)) {
        modHelpers.resetSelectInput(document.conditionAction.inputSelect);
        document
          .getElementById("queryInputSelect")
          .setAttribute("hidden", true);
      }
      break;
    case "ActiveModelId":
      invoke("get_vts_model_names")
        .then((list) =>
          modHelpers.updateSelectInput(
            list,
            document.conditionAction.inputSelect
          )
        )
        .then(then);
      document.getElementById("queryInputSelect").removeAttribute("hidden");
      break;
  }
}
