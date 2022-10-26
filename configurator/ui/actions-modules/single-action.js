import * as modHelpers from "./helpers.js";

const { invoke } = window.__TAURI__.tauri;

export function resetSingleActionInputs() {
  document.getElementById("obsTypeSelect").setAttribute("hidden", "true");
  document.getElementById("vtsTypeSelect").setAttribute("hidden", "true");
  document.getElementById("actionInputSelect").setAttribute("hidden", "true");
  document.singleAction.plugin.value = "none";
  document.singleAction.typeObs.value = "none";
  document.singleAction.typeVts.value = "none";
  document.singleAction.inputSelect.value = "none";
}

function getPluginParam(plugin) {
  switch (plugin) {
    case "none":
      console.log("Invalid plugin type");
      return null;
    case "OBS":
      return {
        type: document.singleAction.typeObs.value,
        // substring because it had "x-" prepended to it
        param: document.singleAction.inputSelect.value.substring(2),
      };
    case "VTS":
      return {
        type: document.singleAction.typeVts.value,
        // substring because it had "x-" prepended to it
        param: document.singleAction.inputSelect.value.substring(2),
      };
  }
}

export function getSingleActionData() {
  const pluginType = document.singleAction.plugin.value;
  const pluginData = getPluginParam(pluginType);
  return {
    pluginType: pluginType,
    pluginData: pluginData,
  };
}

export function addNewSingleAction(then = null) {
  const id = document.actionModify.id.value;
  const data = getSingleActionData();
  // once the action has been added refresh the list of actions
  invoke("add_new_single_action", {
    id: id,
    pluginType: data.pluginType,
    pluginData: data.pluginData,
  }).then(then);
}

function showObsAction(action) {
  switch (action.tag) {
    case "ProgramSceneChange":
      document.getElementById("actionInputSelect").removeAttribute("hidden");
      modHelpers.preselectSelectInput(
        action.content,
        document.singleAction.inputSelect
      );
      break;
    default:
      console.log("Unrecognised OBS action type");
      return;
  }

  document.getElementById("obsTypeSelect").removeAttribute("hidden");
}

function showVtsAction(action) {
  switch (action.tag) {
    case "ToggleExpression":
      document.getElementById("actionInputSelect").removeAttribute("hidden");
      invoke("get_vts_expression_name_from_id", { id: action.content }).then(
        (act) =>
          modHelpers.preselectSelectInput(
            act,
            document.singleAction.inputSelect
          )
      );
      break;
    case "LoadModel":
      document.getElementById("actionInputSelect").removeAttribute("hidden");
      invoke("get_vts_model_name_from_id", { id: action.content }).then((act) =>
        modHelpers.preselectSelectInput(act, document.singleAction.inputSelect)
      );
      break;
    default:
      console.log("Unrecognised VTS action type");
      return;
  }

  document.getElementById("vtsTypeSelect").removeAttribute("hidden");
}

export function showSingleAction(action) {
  switch (action.tag) {
    case "OBS":
      document.singleAction.typeObs.value = action.content.tag;
      obsChooseType(() => showObsAction(action.content));
      break;
    case "VTS":
      document.singleAction.typeVts.value = action.content.tag;
      vtsChooseType(() => showVtsAction(action.content));
      break;
    default:
      console.log("Unrecognised plugin type");
      return;
  }

  document.singleAction.plugin.value = action.tag;
  choosePlugin();
  document.singleAction.removeAttribute("hidden");
}

export function choosePlugin() {
  const plugin = document.singleAction.plugin.value;
  switch (plugin) {
    case "none":
      document.getElementById("vtsTypeSelect").setAttribute("hidden", true);
      document.getElementById("obsTypeSelect").setAttribute("hidden", true);
      document.getElementById("actionInputSelect").setAttribute("hidden", true);
      break;
    case "OBS":
      document.getElementById("obsTypeSelect").removeAttribute("hidden");
      document.getElementById("vtsTypeSelect").setAttribute("hidden", true);
      document.getElementById("actionInputSelect").removeAttribute("hidden");
      break;
    case "VTS":
      document.getElementById("vtsTypeSelect").removeAttribute("hidden");
      document.getElementById("obsTypeSelect").setAttribute("hidden", true);
      document.getElementById("actionInputSelect").removeAttribute("hidden");
      break;
    default:
      console.log("Unimplemented");
      break;
  }
}

// `then` is a function to be run after this has finished fully
// otherwise the input field(s) can end up being reset
export function obsChooseType(then = null) {
  const type = document.singleAction.typeObs.value;
  switch (type) {
    case "none":
      if (!(then instanceof Function)) {
        modHelpers.resetSelectInput(document.singleAction.inputSelect);
        document
          .getElementById("actionInputSelect")
          .setAttribute("hidden", true);
      }
      break;
    case "ProgramSceneChange":
      invoke("get_obs_scenes")
        .then((list) =>
          modHelpers.updateSelectInput(list, document.singleAction.inputSelect)
        )
        .then(then);
      document.getElementById("actionInputSelect").removeAttribute("hidden");
      break;
  }
}

// `then` is a function to be run after this has finished fully
// otherwise the input field(s) can end up being reset
export function vtsChooseType(then = null) {
  const type = document.singleAction.typeVts.value;
  switch (type) {
    case "none":
      if (!(then instanceof Function)) {
        modHelpers.resetSelectInput(document.singleAction.inputSelect);
        document
          .getElementById("actionInputSelect")
          .setAttribute("hidden", true);
      }
      break;
    case "ToggleExpression":
      invoke("get_vts_expression_names")
        .then((list) =>
          modHelpers.updateSelectInput(list, document.singleAction.inputSelect)
        )
        .then(then);
      document.getElementById("actionInputSelect").removeAttribute("hidden");
      break;
    case "LoadModel":
      invoke("get_vts_model_names")
        .then((list) =>
          modHelpers.updateSelectInput(list, document.singleAction.inputSelect)
        )
        .then(then);
      document.getElementById("actionInputSelect").removeAttribute("hidden");
      break;
  }
}
