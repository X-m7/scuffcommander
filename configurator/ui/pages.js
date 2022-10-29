import * as modCommon from "./common.js";
import * as modButtonStyle from "./button-style.js";

const { invoke } = window.__TAURI__.tauri;

function refreshPageSelect(pages) {
  modCommon.resetSelectInput(document.pageSelect.page);
  document.pageSelect.page.appendChild(
    modCommon.createSelectOption("new", "Create a new page")
  );
  modCommon.updateSelectInput(pages, document.pageSelect.page, false);
}

function resetAllPageDetailInputs() {
  document.pageDetails.setAttribute("hidden", true);

  document.pageDetails.id.value = "";
  document.getElementById("buttonsInPage").replaceChildren();

  document.buttonDetails.setAttribute("hidden", true);
  resetButtonDetailInputs();
}

function resetButtonDetailInputs() {
  document.getElementById("newButtonText").setAttribute("hidden", true);
  document.getElementById("editButtonText").setAttribute("hidden", true);

  document.getElementById("editButtonId").textContent = "";
  document.buttonDetails.type.value = "none";
  document.buttonDetails.id.value = "none";
  document.buttonDetails.enableStyleOverride.checked = false;
  document.buttonDetails.enableImage.checked = false;

  modButtonStyle.resetButtonStyleInputs();
  resetButtonImageInput();
}

function resetButtonImageInput() {
  document.getElementById("imageInfo").setAttribute("hidden", true);
  document.getElementById("imageLocationDisplay").setAttribute("hidden", true);
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
    modButtonStyle.resetButtonStyleInputs();
  } else {
    document.getElementById("editButtonId").textContent = editIndex + 1;
    document.getElementById("editButtonText").removeAttribute("hidden");
  }
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
        modCommon.createSelectOption("x-" + data.target_id, data.target_id)
      );
      modCommon.preselectSelectInput(data.target_id, sel);
    });

    if (data.style_override !== null) {
      document.buttonDetails.enableStyleOverride.checked = true;
      modButtonStyle.loadButtonStyleData(data.style_override);
    } else {
      document.buttonDetails.enableStyleOverride.checked = false;
      modButtonStyle.resetButtonStyleInputs();
    }

    if (data.img != null) {
      document.buttonDetails.enableImage.checked = true;
      document.getElementById("imageInfo").removeAttribute("hidden");
      document.getElementById("imageLocation").textContent = "keeporiginal";
    } else {
      document.buttonDetails.enableImage.checked = false;
      resetButtonImageInput();
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
        modCommon.createButtonNode("Edit", () => loadButtonData(id, iInt))
      );

      // can't move top button any higher
      if (iInt > 0) {
        newElement.appendChild(
          modCommon.createButtonNode("Move up", () =>
            moveButtonUpInPage(id, iInt)
          )
        );
      }

      // can't move bottom button any lower
      if (iInt < buttons.length - 1) {
        newElement.appendChild(
          modCommon.createButtonNode("Move down", () =>
            moveButtonDownInPage(id, iInt)
          )
        );
      }

      newElement.appendChild(
        modCommon.createButtonNode("Delete", () =>
          deleteButtonFromPage(id, iInt)
        )
      );
    }

    showPageDetailsForm();
  });
}

function getCurrentPageId() {
  const selected = document.pageSelect.page.value;

  if (selected === "none" || selected === "new") {
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
        .then((list) => {
          modCommon.updateSelectInput(list, document.buttonDetails.id);
        })
        .then(then);
      break;
    default:
      console.log("Unsupported button type");
      break;
  }
}

function loadPages(then = null) {
  invoke("get_page_names").then(refreshPageSelect).then(then);
}

function getUiButtonStruct() {
  const out = {};
  const type = document.buttonDetails.type.value;
  out[type] = {};
  out[type].target_id = document.buttonDetails.id.value.substring(2);

  if (document.buttonDetails.enableStyleOverride.checked) {
    out[type].style_override = modButtonStyle.getButtonStyleStruct();
  } else {
    out[type].style_override = null;
  }

  if (document.buttonDetails.enableImage.checked) {
    const img = {};
    const imgLocation = document.getElementById("imageLocation").textContent;

    if (imgLocation === "keeporiginal") {
      img.format = "keeporiginal";
      img.data = "";
    } else {
      // Rust side will get the file extension and convert to base64
      img.format = "";
      img.data = imgLocation;
    }

    out[type].img = img;
  } else {
    out[type].img = null;
  }

  return out;
}

function showMsg(msg) {
  document.getElementById("msgOutput").textContent = msg;
}

/*
 * Functions used directly by the HTML (onload, onclick, oninput)
 */

window.switchToNewButtonMode = function () {
  showPageDetailsForm();
};

window.loadPages = function () {
  loadPages();
};

window.saveButton = function () {
  const selectedPage = document.pageSelect.page.value;
  const newPageId = document.pageDetails.id.value;
  let pageId = null;
  if (selectedPage === "new") {
    if (newPageId.length === 0) {
      showMsg(
        "Before adding a button to a new page the page ID needs to be specified first"
      );
      return;
    }
    pageId = newPageId;
  } else {
    pageId = selectedPage.substring(2);
  }

  if (
    document.getElementById("editButtonText").getAttribute("hidden") !== "true"
  ) {
    invoke("edit_button_in_page", {
      id: pageId,
      index: parseInt(document.getElementById("editButtonId").textContent) - 1,
      data: getUiButtonStruct(),
    }).then(() => {
      showMsg(`Button edit saved to page "${pageId}"`);
      selectPage();
    });
  } else {
    invoke("add_new_button_to_page", {
      id: pageId,
      data: getUiButtonStruct(),
    }).then((newPage) => {
      if (newPage) {
        showMsg(`New page "${pageId}" created`);
        loadPages();
      } else {
        showMsg(`New button added to page "${pageId}"`);
      }
      selectPage();
    });
  }
};

window.saveUiConfig = function () {
  invoke("save_ui_config").then(() => showMsg("Pages saved"));
};

window.deletePage = function () {
  const id = getCurrentPageId();
  invoke("delete_page", { id: id }).then(() => {
    showMsg(`Page "${id}" deleted`);
    document.pageSelect.page.value = "none";
    loadPages();
    selectPage();
  });
};

window.updateActionOrPageSelect = function () {
  updateActionOrPageSelect();
};

window.pickImageFile = function () {
  invoke("pick_image_file").then((img) => {
    document.getElementById("imageLocation").textContent = img;
    document.getElementById("imageLocationDisplay").removeAttribute("hidden");
  });
};

window.renamePage = function () {
  const selectedPage = document.pageSelect.page.value;
  const newPageId = document.pageDetails.id.value;

  if (selectedPage === "none") {
    return;
  }

  if (selectedPage === "new") {
    showMsg("To create a new page please add a button");
    return;
  }

  const currentId = selectedPage.substring(2);

  invoke("rename_page", { currentId: currentId, newId: newPageId }).then(() => {
    loadPages(() => {
      modCommon.preselectSelectInput(newPageId, document.pageSelect.page);
      selectPage();
    });
  });
};

window.showHideButtonStyleInputs = function () {
  modButtonStyle.resetButtonStyleInputs();
  if (document.buttonDetails.enableStyleOverride.checked) {
    document.buttonStyleDetails.removeAttribute("hidden");
  }
};

window.showHideButtonImageInput = function () {
  resetButtonImageInput();
  if (document.buttonDetails.enableImage.checked) {
    document.getElementById("imageInfo").removeAttribute("hidden");
  }
};

window.selectPage = function () {
  const page = document.pageSelect.page.value;
  resetAllPageDetailInputs();
  switch (page) {
    case "none":
      document.pageDetails.setAttribute("hidden", true);
      return;
    case "new":
      showPageDetailsForm();
      break;
    default:
      loadPage(page.substring(2));
      break;
  }

  document.pageDetails.removeAttribute("hidden");
};
