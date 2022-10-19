const { invoke } = window.__TAURI__.tauri;

function saveAll() {
  invoke("save_actions")
    .then(() => {
      document.getElementById("saveAllOutput").textContent = "Actions saved";
    })
    .catch((e) => {
      document.getElementById("saveAllOutput").textContent =
        "Error occurred: " + e;
    });
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

function addNewSingleAction() {
  const id = document.actionModify.id.value;
  const pluginType = document.singleAction.plugin.value;
  const pluginData = getPluginParam(pluginType);
  // once the action has been added refresh the list of actions
  invoke("add_new_single_action", {
    id: id,
    pluginType: pluginType,
    pluginData: pluginData,
  }).then(loadActions);
}

function addNewAction() {
  const type = document.actionModify.type.value;
  switch (type) {
    case "none":
      console.log("Invalid action type");
      break;
    case "single":
      addNewSingleAction();
      break;
  }
}

function saveCurrentAction() {
  switch (document.actionSelect.action.value) {
    case "none":
      console.log("Invalid action selected");
      break;
    case "new":
      addNewAction();
      break;
  }
}

function updateActions(actions) {
  document.actionSelect.action.options.length = 0;
  let defaultOpt = document.createElement("option");
  defaultOpt.value = "none";
  defaultOpt.textContent = "Select an option";
  document.actionSelect.action.appendChild(defaultOpt);

  let defaultOpt2 = document.createElement("option");
  defaultOpt2.value = "new";
  defaultOpt2.textContent = "Create a new action";
  document.actionSelect.action.appendChild(defaultOpt2);

  for (i in actions) {
    let opt = document.createElement("option");
    // prepend something so we can differentiate the real options from "none" and "new"
    opt.value = "x-" + actions[i];
    opt.textContent = actions[i];
    document.actionSelect.action.appendChild(opt);
  }
}

function loadActions() {
  invoke("get_actions").then(updateActions);
}

function showObsAction(action) {
  switch (action.tag) {
    case "ProgramSceneChange":
      document.getElementById("actionInputSelect").removeAttribute("hidden");
      document.singleAction.inputSelect.value = "x-" + action.content;
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
    case "LoadModel":
      document.getElementById("actionInputSelect").removeAttribute("hidden");
      document.singleAction.inputSelect.value = "x-" + action.content;
      break;
    default:
      console.log("Unrecognised VTS action type");
      return;
  }

  document.getElementById("vtsTypeSelect").removeAttribute("hidden");
}

function showSingleAction(action) {
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
  document.singleAction.removeAttribute("hidden");
}

function showActionInUi(action) {
  switch (action.tag) {
    case "Single":
      showSingleAction(action.content);
      break;
    case "Chain":
    case "Condition":
      console.log("Unimplemented");
      break;
    default:
      console.log("Unrecognised action type");
      return;
  }

  document.actionModify.type.value = action.tag.toLowerCase();
}

function chooseAction() {
  const action = document.actionSelect.action.value;
  switch (action) {
    case "none":
      document.actionModify.setAttribute("hidden", true);
      document.singleAction.setAttribute("hidden", true);
      document.actionModify.type.value = "none";
      break;
    case "new":
      document.actionModify.removeAttribute("hidden");
      break;
    default:
      const action_id = action.substring(2);
      document.actionModify.removeAttribute("hidden");
      document.actionModify.id.value = action_id;
      invoke("load_action_details", { id: action_id }).then(showActionInUi);
      break;
  }
}

function chooseType() {
  const type = document.actionModify.type.value;
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

function choosePlugin() {
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

function resetActionInput() {
  document.singleAction.inputSelect.options.length = 0;
  let defaultOpt = document.createElement("option");
  defaultOpt.value = "none";
  defaultOpt.textContent = "Select an option";
  document.singleAction.inputSelect.appendChild(defaultOpt);
}

function updateActionInputSelect(list) {
  resetActionInput();
  for (i in list) {
    let opt = document.createElement("option");
    // prepend something so we can differentiate the real options from "none"
    opt.value = "x-" + list[i];
    opt.textContent = list[i];
    document.singleAction.inputSelect.appendChild(opt);
  }
}

// afterUpdateFn is a function to be run after this has finished fully
// otherwise the input field(s) can end up being reset
function obsChooseType(afterUpdateFn = null) {
  const type = document.singleAction.typeObs.value;
  switch (type) {
    case "none":
      if (!(afterUpdateFn instanceof Function)) {
        resetActionInput();
        document
          .getElementById("actionInputSelect")
          .setAttribute("hidden", true);
      }
      break;
    case "ProgramSceneChange":
      invoke("get_obs_scenes")
        .then(updateActionInputSelect)
        .then(afterUpdateFn);
      document.getElementById("actionInputSelect").removeAttribute("hidden");
      break;
  }
}

// afterUpdateFn is a function to be run after this has finished fully
// otherwise the input field(s) can end up being reset
function vtsChooseType(afterUpdateFn = null) {
  const type = document.singleAction.typeVts.value;
  switch (type) {
    case "none":
      if (!(afterUpdateFn instanceof Function)) {
        resetActionInput();
        document
          .getElementById("actionInputSelect")
          .setAttribute("hidden", true);
      }
      break;
    case "ToggleExpression":
      invoke("get_vts_expression_names")
        .then(updateActionInputSelect)
        .then(afterUpdateFn);
      document.getElementById("actionInputSelect").removeAttribute("hidden");
      break;
    case "LoadModel":
      invoke("get_vts_model_names")
        .then(updateActionInputSelect)
        .then(afterUpdateFn);
      document.getElementById("actionInputSelect").removeAttribute("hidden");
      break;
  }
}
