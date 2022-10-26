import * as modHelpers from "../helpers.js";

const { invoke } = window.__TAURI__.tauri;

/*
 * Single action relevant things
 */

export function vtsShowSingleAction(action) {
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

// `then` is a function to be run after this has finished fully
// otherwise the input field(s) can end up being reset
export function vtsSingleActionChooseType(then = null) {
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

/*
 * Query/condition relevant things
 */

// input is Condition struct
export function vtsShowCondition(cond) {
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

// `then` is a function to be run after this has finished fully
// otherwise the input field(s) can end up being reset
export function vtsQueryChooseType(then = null) {
  const type = document.conditionAction.typeVts.value;
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
    default:
      console.log("Unsupported VTS query type");
      break;
  }
}
