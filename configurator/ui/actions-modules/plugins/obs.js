const { invoke } = window.__TAURI__.tauri;

import * as modHelpers from "../helpers.js";
import * as modCommon from "../../common.js";

/*
 * Single action relevant things
 */

export function obsResetInputs() {
  document.getElementById("obsTypeSelect").setAttribute("hidden", "true");
  document.singleAction.typeObs.value = "none";
}

export function obsShowSingleAction(action) {
  switch (action.tag) {
    case "ProgramSceneChange":
      document.getElementById("actionInputSelect").removeAttribute("hidden");
      modCommon.preselectSelectInput(
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

// `then` is a function to be run after this has finished fully
// otherwise the input field(s) can end up being reset
export function obsSingleActionChooseType(then = null) {
  const type = document.singleAction.typeObs.value;
  switch (type) {
    case "none":
      if (!(then instanceof Function)) {
        modCommon.resetSelectInput(document.singleAction.inputSelect);
        document
          .getElementById("actionInputSelect")
          .setAttribute("hidden", true);
      }
      break;
    case "ProgramSceneChange":
      invoke("get_obs_scenes")
        .then((list) =>
          modCommon.updateSelectInput(list, document.singleAction.inputSelect)
        )
        .then(then);
      document.getElementById("actionInputSelect").removeAttribute("hidden");
      break;
    default:
      console.log("Unsupported OBS action type");
      break;
  }
}

/*
 * Query/condition relevant things
 */

// input is Condition struct
export function obsShowCondition(cond) {
  switch (cond.query.content) {
    case "CurrentProgramScene":
      document.getElementById("queryInputSelect").removeAttribute("hidden");
      modCommon.preselectSelectInput(
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

// `then` is a function to be run after this has finished fully
// otherwise the input field(s) can end up being reset
export function obsQueryChooseType(then = null) {
  const type = document.conditionAction.typeObs.value;
  switch (type) {
    case "none":
      if (!(then instanceof Function)) {
        modCommon.resetSelectInput(document.conditionAction.inputSelect);
        document
          .getElementById("queryInputSelect")
          .setAttribute("hidden", true);
      }
      break;
    case "CurrentProgramScene":
      invoke("get_obs_scenes")
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
