const { invoke } = window.__TAURI__.tauri;

/*
 * Common helper functions copied from actions-modules/helpers.js
 * TODO: move out into common helper module
 */

function createSelectOption(val, text) {
  const defaultOpt = document.createElement("option");
  defaultOpt.value = val;
  defaultOpt.textContent = text;
  return defaultOpt;
}

function resetSelectInput(selectElement, defaultContent = "Select an option") {
  selectElement.options.length = 0;
  selectElement.appendChild(createSelectOption("none", defaultContent));
}

function updateSelectInput(list, selectElement, resetBeforehand = true) {
  if (resetBeforehand) {
    resetSelectInput(selectElement);
  }
  for (const i of list) {
    selectElement.appendChild(createSelectOption("x-" + i, i));
  }
}

// this one was specific to chain actions
function createButtonNode(text, onclick) {
  const button = document.createElement("button");
  button.textContent = text;
  button.addEventListener("click", onclick);
  button.setAttribute("type", "button");
  return button;
}

/*
 * End common helper functions
 */

function refreshPageSelect(pages) {
  resetSelectInput(document.pageSelect.page);
  document.pageSelect.page.appendChild(
    createSelectOption("new", "Create a new page")
  );
  updateSelectInput(pages, document.pageSelect.page, false);
}

function resetAllPageDetailInputs() {
  document.pageDetails.setAttribute("hidden", true);
  document.buttonDetails.setAttribute("hidden", true);
  document.getElementById("imageInfo").setAttribute("hidden", true);
  document.styleDetails.setAttribute("hidden", true);

  document.pageDetails.id.value = "";
  document.getElementById("buttonsInPage").replaceChildren();
  document.buttonDetails.type.value = "none";
  document.buttonDetails.id.value = "none";
  document.buttonDetails.enableStyleOverride.checked = false;
  document.buttonDetails.enableImage.checked = false;
  document.getElementById("imageLocation").textContent = "";
  document.styleDetails.width.value = 3;
  document.styleDetails.height.value = 3;
  document.styleDetails.bgColor.value = "#FFFFFF";
  document.styleDetails.fgColor.value = "#000000";
}

function deleteButtonFromPage(id, pos) {
  invoke("delete_button_from_page", { id: id, index: pos }).then(() =>
    loadPage(id)
  );
}

function loadPage(id) {
  resetAllPageDetailInputs();
  document.pageDetails.id.value = id;

  invoke("get_page_buttons_info", { id: id }).then((buttons) => {
    const list = document.getElementById("buttonsInPage");

    for (const i in buttons) {
      const newElement = document.createElement("li");
      newElement.textContent = buttons[i];
      list.appendChild(newElement);

      const iInt = parseInt(i);
      newElement.appendChild(
        createButtonNode("Delete", () => deleteButtonFromPage(id, iInt))
      );
      // TODO: other buttons (edit, move up, move down)
    }

    document.pageDetails.removeAttribute("hidden");
  });
}

window.loadPages = function () {
  invoke("get_page_names").then(refreshPageSelect);
};

window.selectPage = function () {
  const page = document.pageSelect.page.value;
  switch (page) {
    case "none":
      document.pageDetails.setAttribute("hidden", true);
      return;
    case "new":
      resetAllPageDetailInputs();
      break;
    default:
      loadPage(page.substring(2));
      break;
  }

  document.pageDetails.removeAttribute("hidden");
};
