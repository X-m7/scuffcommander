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

function preselectSelectInput(newValue, selectElement) {
  selectElement.value = "x-" + newValue;
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
  document.getElementById("imageInfo").setAttribute("hidden", true);
  document.getElementById("imageLocationDisplay").setAttribute("hidden", true);

  document.pageDetails.id.value = "";
  document.getElementById("buttonsInPage").replaceChildren();

  document.buttonDetails.setAttribute("hidden", true);
  resetButtonDetailInputs();
  resetButtonStyleInputs();
}

function resetButtonStyleInputs() {
  document.buttonStyleDetails.setAttribute("hidden", true);

  document.buttonStyleDetails.width.value = 3;
  document.buttonStyleDetails.height.value = 3;
  document.buttonStyleDetails.bgColor.value = "#FFFFFF";
  document.buttonStyleDetails.fgColor.value = "#000000";
}

function resetButtonDetailInputs() {
  document.getElementById("newButtonText").setAttribute("hidden", true);
  document.getElementById("editButtonText").setAttribute("hidden", true);

  document.getElementById("editButtonId").textContent = "";
  document.buttonDetails.type.value = "none";
  document.buttonDetails.id.value = "none";
  document.buttonDetails.enableStyleOverride.checked = false;
  document.buttonDetails.enableImage.checked = false;
  document.getElementById("imageLocation").textContent = "";
}

function deleteButtonFromPage(id, pos) {
  invoke("delete_button_from_page", { id: id, index: pos }).then(() =>
    loadPage(id)
  );
}

function moveButtonUpInPage(id, pos) {
  invoke("move_button_up_in_page", { id: id, index: pos }).then(() =>
    loadPage(id)
  );
}

function moveButtonDownInPage(id, pos) {
  invoke("move_button_down_in_page", { id: id, index: pos }).then(() =>
    loadPage(id)
  );
}

// Takes the index of the element to modify (as number not string)
function showPageDetailsForm(editIndex = null) {
  document.pageDetails.removeAttribute("hidden");
  document.buttonDetails.removeAttribute("hidden");

  resetButtonDetailInputs();

  if (editIndex === null) {
    document.getElementById("newButtonText").removeAttribute("hidden");
    resetButtonStyleInputs();
  } else {
    document.getElementById("editButtonId").textContent = editIndex + 1;
    document.getElementById("editButtonText").removeAttribute("hidden");
  }
}

// takes ButtonStyle struct as input
function loadButtonStyleData(data) {
  document.buttonStyleDetails.width.value = parseFloat(data.width);
  document.buttonStyleDetails.height.value = parseFloat(data.height);
  document.buttonStyleDetails.bgColor.value = data.bg_color;
  document.buttonStyleDetails.fgColor.value = data.fg_color;

  document.buttonStyleDetails.removeAttribute("hidden");
}

function loadButtonData(id, pos) {
  showPageDetailsForm(pos);
  // command returns UIButton enum
  invoke("get_page_button_data", { id: id, index: pos }).then((button) => {
    let data = null;
    if (button.ExecuteAction) {
      data = button.ExecuteAction;
      document.buttonDetails.type.value = "ExecuteAction";
    } else if (button.OpenPage) {
      data = button.OpenPage;
      document.buttonDetails.type.value = "OpenPage";
    } else {
      console.log("Unsupported button type");
      return;
    }

    updateActionOrPageSelect(() => {
      const sel = document.buttonDetails.id;
      // add back the currently selected option, then preselect it
      sel.appendChild(
        createSelectOption("x-" + data.target_id, data.target_id)
      );
      preselectSelectInput(data.target_id, sel);
    });

    if (data.style_override !== null) {
      document.buttonDetails.enableStyleOverride.checked = true;
      loadButtonStyleData(data.style_override);
    } else {
      document.buttonDetails.enableStyleOverride.checked = false;
      resetButtonStyleInputs();
    }

    if (data.img != null) {
      document.buttonDetails.enableImage.checked = true;
      document.getElementById("imageInfo").removeAttribute("hidden");
    } else {
      document.buttonDetails.enableImage.checked = false;
    }
  });
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
        createButtonNode("Edit", () => loadButtonData(id, iInt))
      );

      // can't move top button any higher
      if (iInt > 0) {
        newElement.appendChild(
          createButtonNode("Move up", () => moveButtonUpInPage(id, iInt))
        );
      }

      // can't move bottom button any lower
      if (iInt < buttons.length - 1) {
        newElement.appendChild(
          createButtonNode("Move down", () => moveButtonDownInPage(id, iInt))
        );
      }

      newElement.appendChild(
        createButtonNode("Delete", () => deleteButtonFromPage(id, iInt))
      );
    }

    showPageDetailsForm();
  });
}

function getCurrentPageId() {
  const selected = document.pageSelect.page.value;

  if (selected === "none") {
    return;
  } else if (selected === "new") {
    return null;
  } else {
    return selected.substring(2);
  }
}

// `then` is a function to execute once the selector has been updated
function updateActionOrPageSelect(then = null) {
  const type = document.buttonDetails.type.value;
  switch (type) {
    case "none":
      break;
    case "ExecuteAction":
    case "OpenPage":
      invoke("get_page_or_action_name_list", {
        pageId: getCurrentPageId(),
        outputType: type,
      })
        .then((list) => updateSelectInput(list, document.buttonDetails.id))
        .then(then);
      break;
    default:
      console.log("Unsupported button type");
      break;
  }
}

/*
 * Functions used directly by the HTML (onload, onclick, oninput)
 */

window.switchToNewButtonMode = function () {
  showPageDetailsForm();
};

window.loadPages = function () {
  invoke("get_page_names").then(refreshPageSelect);
};

window.saveButton = function () {
  // TODO: if selected page is "new" and page ID field is empty warn user
};

window.saveUiConfig = function () {
  invoke("save_ui_config").then(
    () => (document.getElementById("saveOutput").textContent = "Pages saved")
  );
};

window.updateActionOrPageSelect = function () {
  updateActionOrPageSelect();
};

window.selectPage = function () {
  const page = document.pageSelect.page.value;
  switch (page) {
    case "none":
      document.pageDetails.setAttribute("hidden", true);
      return;
    case "new":
      resetAllPageDetailInputs();
      showPageDetailsForm();
      break;
    default:
      loadPage(page.substring(2));
      break;
  }

  document.pageDetails.removeAttribute("hidden");
};
