const { invoke } = window.__TAURI__.tauri;

export function createSelectOption(val, text) {
  const defaultOpt = document.createElement("option");
  defaultOpt.value = val;
  defaultOpt.textContent = text;
  return defaultOpt;
}

export function resetSelectInput(
  selectElement,
  defaultContent = "Select an option"
) {
  selectElement.options.length = 0;
  selectElement.appendChild(createSelectOption("none", defaultContent));
}

export function updateSelectInput(list, selectElement, resetBeforehand = true) {
  if (resetBeforehand) {
    resetSelectInput(selectElement);
  }
  for (const i of list) {
    selectElement.appendChild(createSelectOption("x-" + i, i));
  }
}

export function preselectSelectInput(newValue, selectElement) {
  selectElement.value = "x-" + newValue;
}

export function createButtonNode(text, onclick) {
  const button = document.createElement("button");
  button.textContent = text;
  button.addEventListener("click", onclick);
  button.setAttribute("type", "button");
  return button;
}
