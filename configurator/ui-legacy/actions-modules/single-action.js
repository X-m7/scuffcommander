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

export function addNewSingleAction(then = null, overwrite = false) {
  const id = document.actionModify.id.value;
  const data = getSingleActionData();
  // once the action has been added refresh the list of actions
  invoke("add_new_single_action", {
    id: id,
    pluginType: data.pluginType,
    pluginData: data.pluginData,
    overwrite: overwrite,
  }).then(then);
}

export function showSingleAction(action) {
  // this hides/unhides things based on the plugin
  modPlugins.singleActionChoosePlugin(action.tag);

  // show helper actually loads the action details
  modPlugins.singleActionShowHelper(action);

  document.singleAction.removeAttribute("hidden");
}
