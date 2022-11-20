import * as modHelpers from "../helpers.js";
import * as modCommon from "../../common.js";

const { invoke } = window.__TAURI__.tauri;

/*
 * Single action relevant things
 */

export function vtsResetInputs() {
  document.getElementById("vtsTypeSelect").setAttribute("hidden", "true");
  document
    .getElementById("vtsModelPositionInput")
    .setAttribute("hidden", "true");
  document.singleAction.typeVts.value = "none";
  document.singleAction.vtsPosX.value = "";
  document.singleAction.vtsPosY.value = "";
  document.singleAction.vtsPosRotation.value = "";
  document.singleAction.vtsPosSize.value = "";
  document.singleAction.vtsPosAnimDuration.value = "";
}

export function vtsGetSingleActionParams() {
  const type = document.singleAction.typeVts.value;
  let param = null;

  switch (type) {
    case "ToggleExpression":
    case "LoadModel":
    case "TriggerHotkey":
      // substring because it had "x-" prepended to it
      param = document.singleAction.inputSelect.value.substring(2);
      break;
    case "MoveModel":
      // follows the structure of VTSMoveModelInput
      param = {
        x: parseFloat(document.singleAction.vtsPosX.value),
        y: parseFloat(document.singleAction.vtsPosY.value),
        rotation: parseFloat(document.singleAction.vtsPosRotation.value),
        size: parseFloat(document.singleAction.vtsPosSize.value),
        time_sec: parseFloat(document.singleAction.vtsPosAnimDuration.value),
      };
      break;
    default:
      console.log("Unsupported VTS action type");
      return null;
  }

  return {
    type: type,
    param: param,
  };
}

// requires VTSMoveModelInput as the input
function prefillMoveModelAction(action) {
  document.singleAction.vtsPosX.value = action.x;
  document.singleAction.vtsPosY.value = action.y;
  document.singleAction.vtsPosRotation.value = action.rotation;
  document.singleAction.vtsPosSize.value = action.size;
  document.singleAction.vtsPosAnimDuration.value = action.time_sec;
}

export function vtsShowSingleAction(action) {
  switch (action.tag) {
    case "ToggleExpression":
      document.getElementById("actionInputSelect").removeAttribute("hidden");
      invoke("get_vts_expression_name_from_id", { id: action.content }).then(
        (act) =>
          modCommon.preselectSelectInput(act, document.singleAction.inputSelect)
      );
      break;
    case "TriggerHotkey":
      document.getElementById("actionInputSelect").removeAttribute("hidden");
      invoke("get_vts_hotkey_name_from_id", { id: action.content }).then(
        (act) =>
          modCommon.preselectSelectInput(act, document.singleAction.inputSelect)
      );
      break;
    case "LoadModel":
      document.getElementById("actionInputSelect").removeAttribute("hidden");
      invoke("get_vts_model_name_from_id", { id: action.content }).then((act) =>
        modCommon.preselectSelectInput(act, document.singleAction.inputSelect)
      );
      break;
    case "MoveModel":
      prefillMoveModelAction(action.content);
      break;
    default:
      console.log("Unrecognised VTS action type");
      return;
  }

  document.getElementById("vtsTypeSelect").removeAttribute("hidden");
}

// `then` is a function to be run after this has finished fully
// otherwise the input field(s) can end up being reset
export function vtsSingleActionChooseType(then = null) {
  document.getElementById("actionInputSelect").setAttribute("hidden", true);
  document.getElementById("vtsModelPositionInput").setAttribute("hidden", true);

  const type = document.singleAction.typeVts.value;
  switch (type) {
    case "none":
      if (!(then instanceof Function)) {
        modCommon.resetSelectInput(document.singleAction.inputSelect);
      }
      break;
    case "ToggleExpression":
      invoke("get_vts_expression_names")
        .then((list) =>
          modCommon.updateSelectInput(list, document.singleAction.inputSelect)
        )
        .then(then);
      document.getElementById("actionInputSelect").removeAttribute("hidden");
      break;
    case "TriggerHotkey":
      invoke("get_vts_hotkey_names")
        .then((list) =>
          modCommon.updateSelectInput(list, document.singleAction.inputSelect)
        )
        .then(then);
      document.getElementById("actionInputSelect").removeAttribute("hidden");
      break;
    case "LoadModel":
      invoke("get_vts_model_names")
        .then((list) =>
          modCommon.updateSelectInput(list, document.singleAction.inputSelect)
        )
        .then(then);
      document.getElementById("actionInputSelect").removeAttribute("hidden");
      break;
    case "MoveModel":
      document
        .getElementById("vtsModelPositionInput")
        .removeAttribute("hidden");
      if (then instanceof Function) {
        then();
      }
      break;
    default:
      console.log("Unsupported action");
      break;
  }
}

export function vtsGetCurrentModelPos() {
  invoke("get_vts_current_model_pos").then(prefillMoveModelAction);
}

/*
 * Query/condition relevant things
 */

// input is Condition struct
export function vtsShowCondition(cond) {
  switch (cond.query.content) {
    case "ActiveModelId":
      document.getElementById("queryInputSelect").removeAttribute("hidden");
      invoke("get_vts_model_name_from_id", { id: cond.target }).then((act) =>
        modCommon.preselectSelectInput(
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

// `then` is a function to be run after this has finished fully
// otherwise the input field(s) can end up being reset
export function vtsQueryChooseType(then = null) {
  const type = document.conditionAction.typeVts.value;
  switch (type) {
    case "none":
      if (!(then instanceof Function)) {
        modCommon.resetSelectInput(document.conditionAction.inputSelect);
        document
          .getElementById("queryInputSelect")
          .setAttribute("hidden", true);
      }
      break;
    case "ActiveModelId":
      invoke("get_vts_model_names")
        .then((list) =>
          modCommon.updateSelectInput(
            list,
            document.conditionAction.inputSelect
          )
        )
        .then(then);
      document.getElementById("queryInputSelect").removeAttribute("hidden");
      break;
    default:
      console.log("Unsupported VTS query type");
      break;
  }
}
