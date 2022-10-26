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

export function updateThenElseSelect(
  actions,
  currentActionThen = null,
  currentActionElse = null
) {
  modHelpers.resetSelectInput(
    document.conditionAction.thenAction,
    "Select an existing action to copy"
  );
  modHelpers.resetSelectInput(
    document.conditionAction.elseAction,
    "Do nothing"
  );

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

  modHelpers.updateSelectInput(
    actions,
    document.conditionAction.thenAction,
    false
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

// input is Condition struct
function obsShowCondition(cond) {
  switch (cond.query.content) {
    case "CurrentProgramScene":
      document.getElementById("queryInputSelect").removeAttribute("hidden");
      modHelpers.preselectSelectInput(
        cond.target,
        document.conditionAction.inputSelect
      );
      break;
    default:
      console.log("Unrecognised OBS query type");
      return;
  }

  document.getElementById("obsTypeSelect").removeAttribute("hidden");
}

// input is Condition struct
function vtsShowCondition(cond) {
  switch (cond.query.content) {
    case "ActiveModelId":
      document.getElementById("queryInputSelect").removeAttribute("hidden");
      invoke("get_vts_model_name_from_id", { id: cond.target }).then((act) =>
        modHelpers.preselectSelectInput(
          act,
          document.conditionAction.inputSelect
        )
      );
      break;
    default:
      console.log("Unrecognised VTS query type");
      return;
  }

  document.getElementById("vtsTypeSelect").removeAttribute("hidden");
}

// input is { query, target } (Condition struct)
function showCondition(cond) {
  document.conditionAction.plugin.value = cond.query.tag;

  switch (cond.query.tag) {
    case "OBS":
      // flow: set OBS/VTS field above, then set OBS query type (current scene, etc),
      // then populate the input for the selected query type (ex: available scenes to select),
      // finally preselect/prefill the query param/target input (the current selected scene)
      document.conditionAction.typeObs.value = cond.query.content;
      obsQueryChooseType(() => obsShowCondition(cond));
      break;
    case "VTS":
      document.conditionAction.typeVts.value = cond.query.content;
      vtsQueryChooseType(() => vtsShowCondition(cond));
      break;
    default:
      console.log("Unsupported plugin");
      break;
  }
}

export function showConditionAction(action) {
  showCondition(action[0]);
  invoke("get_actions").then((allActions) =>
    updateThenElseSelect(allActions, action[1], action[2])
  );

  queryChoosePlugin();
  document.conditionAction.removeAttribute("hidden");
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
