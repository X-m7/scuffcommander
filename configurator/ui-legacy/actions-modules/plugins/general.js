const { invoke } = window.__TAURI__.tauri;

export function generalResetInputs() {
  document.getElementById("generalTypeSelect").setAttribute("hidden", "true");
  document.singleAction.typeGeneral.value = "none";
}

export function generalGetSingleActionParams() {
  const type = document.singleAction.typeGeneral.value;
  let param = null;

  switch (type) {
    case "Delay":
      param = parseFloat(document.singleAction.inputText.value);
      break;
    default:
      console.log("Unsupported general plugin type");
      return null;
  }

  return {
    type: type,
    param: param,
  };
}

export function generalSingleActionChooseType(then = null) {
  const type = document.singleAction.typeGeneral.value;
  switch (type) {
    case "none":
      if (!(then instanceof Function)) {
        document.singleAction.inputText.value = "";
        document.getElementById("actionInputText").setAttribute("hidden", true);
      }
      break;
    case "Delay":
      document.getElementById("actionInputText").removeAttribute("hidden");
      if (then instanceof Function) {
        then();
      }
      break;
    default:
      console.log("Unsupported general action type");
      break;
  }
}

export function generalShowSingleAction(action) {
  switch (action.tag) {
    case "Delay":
      document.singleAction.inputText.value = action.content;
      document.getElementById("actionInputText").removeAttribute("hidden");
      break;
    default:
      console.log("Unsupported general action type");
      break;
  }
}
