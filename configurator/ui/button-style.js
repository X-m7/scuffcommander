const { invoke } = window.__TAURI__.tauri;

/*
 * Common button style functions (used by both the global and per button style)
 * Assumes there is a form like so:
 *
<form name="buttonStyleDetails" hidden>
    <input type="number" step="any" name="width" />
    <input type="number" step="any" name="height" />
    <input type="color" name="bgColor" />
    <input type="color" name="fgColor" />
</form>
 *
 */

export function resetButtonStyleInputs() {
  document.buttonStyleDetails.setAttribute("hidden", true);

  document.buttonStyleDetails.width.value = 3;
  document.buttonStyleDetails.height.value = 3;
  document.buttonStyleDetails.bgColor.value = "#FFFFFF";
  document.buttonStyleDetails.fgColor.value = "#000000";
}

// takes ButtonStyle struct as input
export function loadButtonStyleData(data) {
  // parseFloat strips the units out (so "2cm" => 2 for example)
  document.buttonStyleDetails.width.value = parseFloat(data.width);
  document.buttonStyleDetails.height.value = parseFloat(data.height);
  document.buttonStyleDetails.bgColor.value = data.bg_color;
  document.buttonStyleDetails.fgColor.value = data.fg_color;

  document.buttonStyleDetails.removeAttribute("hidden");
}

export function getButtonStyleStruct() {
  const out = {};
  out.width = document.buttonStyleDetails.width.value + "cm";
  out.height = document.buttonStyleDetails.height.value + "cm";
  out.bg_color = document.buttonStyleDetails.bgColor.value;
  out.fg_color = document.buttonStyleDetails.fgColor.value;

  return out;
}
