const { invoke } = window.__TAURI__.tauri;

function getPluginParam(plugin) {
    switch (plugin) {
        case "none":
            console.log("Invalid plugin type");
            return null;
        case "OBS":
            return {
                type: document.singleAction.typeObs.value,
                param: document.singleAction.inputSelect.value
            };
        case "VTS":
            return {
                type: document.singleAction.typeVts.value,
                param: document.singleAction.inputSelect.value
            };
    }
}

function addNewSingleAction() {
    const id = document.actionModify.id.value;
    const pluginType = document.singleAction.plugin.value;
    const pluginData = getPluginParam(pluginType);
    // once the action has been added refresh the list of actions
    invoke("add_new_single_action", { id: id, pluginType: pluginType, pluginData: pluginData }).then(loadActions);
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
    defaultOpt.innerHTML = "Select an option"
    document.actionSelect.action.appendChild(defaultOpt);

    let defaultOpt2 = document.createElement("option");
    defaultOpt2.value = "new";
    defaultOpt2.innerHTML = "Create a new action"
    document.actionSelect.action.appendChild(defaultOpt2);

    for (i in actions) {
        let opt = document.createElement("option");
        // prepend something so we can differentiate the real options from "none" and "new"
        opt.value = "x-" + actions[i];
        opt.innerHTML = actions[i];
        document.actionSelect.action.appendChild(opt);
    }
}

function loadActions() {
    invoke("get_actions").then(updateActions);
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
            console.log("Unimplemented");
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
    defaultOpt.innerHTML = "Select an option"
    document.singleAction.inputSelect.appendChild(defaultOpt);
}

function updateActionInputSelect(list) {
    resetActionInput();
    for (i in list) {
        let opt = document.createElement("option");
        // prepend something so we can differentiate the real options from "none"
        opt.value = "x-" + list[i];
        opt.innerHTML = list[i];
        document.singleAction.inputSelect.appendChild(opt);
    }
}

function obsChooseType() {
    const type = document.singleAction.typeObs.value;
    switch (type) {
        case "none":
            resetActionInput();
            document.getElementById("actionInputSelect").setAttribute("hidden", true);
            break;
        case "ProgramSceneChange":
            invoke("get_obs_scenes").then(updateActionInputSelect);
            document.getElementById("actionInputSelect").removeAttribute("hidden");
            break;
    }
}

function vtsChooseType() {
    const type = document.singleAction.typeVts.value;
    switch (type) {
        case "none":
            resetActionInput();
            document.getElementById("actionInputSelect").setAttribute("hidden", true);
            break;
        case "ToggleExpression":
            invoke("get_vts_expression_names").then(updateActionInputSelect);
            document.getElementById("actionInputSelect").removeAttribute("hidden");
            break;
        case "LoadModel":
            invoke("get_vts_model_names").then(updateActionInputSelect);
            document.getElementById("actionInputSelect").removeAttribute("hidden");
            break;
    }
}
