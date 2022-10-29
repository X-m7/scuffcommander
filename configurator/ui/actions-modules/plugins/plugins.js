import * as modObs from "./obs.js";
import * as modVts from "./vts.js";
import * as modGeneral from "./general.js";

const { invoke } = window.__TAURI__.tauri;

/*
 * Single action relevant things
 */

function resetPluginInputs() {
  modObs.obsResetInputs();
  modVts.vtsResetInputs();
  modGeneral.generalResetInputs();
  document.getElementById("actionInputSelect").setAttribute("hidden", "true");
  document.getElementById("actionInputText").setAttribute("hidden", "true");
  document.singleAction.inputSelect.value = "none";
  document.singleAction.inputText.value = "";
}

export function singleActionResetInputs() {
  resetPluginInputs();
  document.singleAction.plugin.value = "none";
}

export function singleActionGetPluginParam(plugin) {
  switch (plugin) {
    case "OBS":
      return {
        type: document.singleAction.typeObs.value,
        // substring because it had "x-" prepended to it
        param: document.singleAction.inputSelect.value.substring(2),
      };
    case "VTS":
      return modVts.vtsGetSingleActionParams();
    case "General":
      return modGeneral.generalGetSingleActionParams();
    case "none":
    default:
      console.log("Invalid plugin type");
      return null;
  }
}

export function singleActionShowHelper(action) {
  switch (action.tag) {
    case "OBS":
      document.singleAction.typeObs.value = action.content.tag;
      modObs.obsSingleActionChooseType(() =>
        modObs.obsShowSingleAction(action.content)
      );
      break;
    case "VTS":
      document.singleAction.typeVts.value = action.content.tag;
      modVts.vtsSingleActionChooseType(() =>
        modVts.vtsShowSingleAction(action.content)
      );
      break;
    case "General":
      document.singleAction.typeGeneral.value = action.content.tag;
      modGeneral.generalSingleActionChooseType(() =>
        modGeneral.generalShowSingleAction(action.content)
      );
    default:
      console.log("Unrecognised plugin type");
      return;
  }

  document.singleAction.plugin.value = action.tag;
}

function hideTypeSelect() {
  document.getElementById("vtsTypeSelect").setAttribute("hidden", true);
  document.getElementById("obsTypeSelect").setAttribute("hidden", true);
  document.getElementById("generalTypeSelect").setAttribute("hidden", true);
}

export function singleActionChoosePlugin(plugin = null) {
  resetPluginInputs();

  if (plugin === null) {
    plugin = document.singleAction.plugin.value;
  }

  switch (plugin) {
    case "none":
      document.getElementById("actionInputSelect").setAttribute("hidden", true);
      document.getElementById("actionInputText").setAttribute("hidden", true);
      break;
    case "OBS":
      document.getElementById("obsTypeSelect").removeAttribute("hidden");
      document.getElementById("actionInputSelect").removeAttribute("hidden");
      document.getElementById("actionInputText").setAttribute("hidden", true);
      break;
    case "VTS":
      document.getElementById("vtsTypeSelect").removeAttribute("hidden");
      document.getElementById("actionInputText").setAttribute("hidden", true);
      break;
    case "General":
      document.getElementById("actionInputSelect").setAttribute("hidden", true);
      document.getElementById("generalTypeSelect").removeAttribute("hidden");
      document.getElementById("actionInputText").removeAttribute("hidden");
    default:
      console.log("Unimplemented");
      break;
  }
}

/*
 * Query/condition relevant things
 */

export function conditionResetPluginInputs() {
  document.getElementById("conditionQueryObs").setAttribute("hidden", true);
  document.getElementById("conditionQueryVts").setAttribute("hidden", true);
  document.getElementById("queryInputSelect").setAttribute("hidden", true);
  document.conditionAction.plugin.value = "none";
  document.conditionAction.inputSelect.value = "none";
  document.conditionAction.typeObs.value = "none";
  document.conditionAction.typeVts.value = "none";
}

export function queryGetPluginParam(plugin) {
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

// input is { query, target } (Condition struct)
export function conditionShowHelper(cond) {
  document.conditionAction.plugin.value = cond.query.tag;

  switch (cond.query.tag) {
    case "OBS":
      // flow: set OBS/VTS field above, then set OBS query type (current scene, etc),
      // then populate the input for the selected query type (ex: available scenes to select),
      // finally preselect/prefill the query param/target input (the current selected scene)
      document.conditionAction.typeObs.value = cond.query.content;
      modObs.obsQueryChooseType(() => modObs.obsShowCondition(cond));
      break;
    case "VTS":
      document.conditionAction.typeVts.value = cond.query.content;
      modVts.vtsQueryChooseType(() => modVts.vtsShowCondition(cond));
      break;
    default:
      console.log("Unsupported plugin");
      break;
  }
}
