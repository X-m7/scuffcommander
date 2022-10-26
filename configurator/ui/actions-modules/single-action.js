import * as modHelpers from "./helpers.js";
import * as modPlugins from "./plugins/plugins.js";

const { invoke } = window.__TAURI__.tauri;

export function getSingleActionData() {
  const pluginType = document.singleAction.plugin.value;
  const pluginData = modPlugins.singleActionGetPluginParam(pluginType);
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

export function showSingleAction(action) {
  modPlugins.singleActionShowHelper(action);
  modPlugins.singleActionChoosePlugin();
  document.singleAction.removeAttribute("hidden");
}
