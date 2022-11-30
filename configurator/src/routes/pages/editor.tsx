import { h, Fragment, createRef } from "preact";
import { useEffect, useState, useCallback } from "preact/hooks";
import { invoke } from "@tauri-apps/api";

import DraggableListItem from "/components/draggablelistitem";
import SelectOptsGen from "/components/selectoptsgen";
import EditButtonStyle from "/components/editbuttonstyle";
import { ButtonStyle } from "/components/editbuttonstyle/types";
import {
  UIButton,
  ButtonData,
  ExecuteAction,
  OpenPage,
  Base64Image,
} from "./types";

interface EditPageProps {
  page: string;
  msgFunc: (msg: string) => void;
  onSaveDeleteCallback: () => void;
}

const EditPage = ({
  page: pageProp,
  msgFunc,
  onSaveDeleteCallback,
}: EditPageProps) => {
  const [pageId, setPageId] = useState<string>("");
  const [buttonsList, setButtonsList] = useState<string[]>([]);

  const [editingButton, setEditingButton] = useState<boolean>(false);
  const [editButtonIndex, setEditButtonIndex] = useState<number>(-1);
  const [editButtonType, setEditButtonType] = useState<string>("none");
  const [editButtonTargetId, setEditButtonTargetId] = useState<string>("none");
  const [editButtonEnableImage, setEditButtonEnableImage] =
    useState<boolean>(false);
  const [editButtonImageLocation, setEditButtonImageLocation] =
    useState<string>("");
  const [editButtonEnableStyle, setEditButtonEnableStyle] =
    useState<boolean>(false);
  const [editButtonTargetList, setEditButtonTargetList] = useState<string[]>(
    []
  );

  const [editButtonLoadedTargetId, setEditButtonLoadedTargetId] =
    useState<string>("");
  const [editButtonLoadedStyle, setEditButtonLoadedStyle] = useState<
    ButtonStyle | undefined
  >(undefined);

  const updatePageButtons = useCallback(() => {
    invoke("get_page_buttons_info", { id: pageProp.substring(2) }).then(
      (buttonsRaw) => {
        setButtonsList(buttonsRaw as string[]);
      }
    );
  }, [pageProp]);

  // effectively the constructor
  useEffect(() => {
    if (pageProp === "none" || pageProp === "new") {
      setPageId("");
      setButtonsList([]);
      return;
    }

    setPageId(pageProp.substring(2));
    updatePageButtons();
  }, [pageProp, updatePageButtons]);

  useEffect(() => {
    if (editButtonType === "none") {
      return;
    }

    let currentPageId: string | undefined;

    if (pageProp !== "new") {
      currentPageId = pageProp.substring(2);
    }

    invoke("get_page_or_action_name_list", {
      pageId: currentPageId,
      outputType: editButtonType,
    }).then((listRaw) => {
      const list = listRaw as string[];

      // If this was triggered due to a button being loaded add it to the list
      // since normally actions/pages that already have a button are filtered out
      if (editButtonLoadedTargetId.length != 0) {
        list.push(editButtonLoadedTargetId);
        setEditButtonTargetId(`x-${editButtonLoadedTargetId}`);
      } else {
        setEditButtonTargetId("none");
      }
      setEditButtonTargetList(list);
    });
  }, [editButtonType, editButtonLoadedTargetId, pageProp]);

  const onPageIdInput = (e: Event) => {
    if (e.target) {
      setPageId((e.target as HTMLInputElement).value);
    }
  };

  const deleteCurrentPage = () => {
    const id = pageProp.substring(2);

    invoke("delete_page", { id })
      .then(() => {
        if (id === "home") {
          msgFunc(
            'Warning: The page with ID "home" has been deleted, which is the default page'
          );
        } else {
          msgFunc(`Page with ID "${id}" deleted`);
        }
        onSaveDeleteCallback();
      })
      .catch((err) => {
        msgFunc(`Error occurred: ${err.toString()}`);
      });
  };

  const renameCurrentPage = () => {
    const newId = pageId;
    const currentId = pageProp.substring(2);
    invoke("rename_page", { currentId, newId })
      .then(() => {
        if (currentId === "home") {
          msgFunc(
            'Warning: The page with ID "home" has been renamed, which is the default page'
          );
        } else {
          msgFunc(`Page with ID "${currentId}" renamed to "${newId}"`);
        }
        onSaveDeleteCallback();
      })
      .catch((err) => {
        msgFunc(`Error occurred: ${err.toString()}`);
      });
  };

  const dataConverter = async (page: string) => {
    return page;
  };

  const resetEditButtonForm = () => {
    setEditingButton(false);
    setEditButtonType("none");
    setEditButtonTargetId("none");
    setEditButtonEnableStyle(false);
    setEditButtonLoadedTargetId("");
    setEditButtonLoadedStyle(undefined);
  };

  const movePageInList = (draggedIndex: number, targetIndex: number) => {
    invoke("move_button_to_index", {
      id: pageProp.substring(2),
      indexInitial: draggedIndex,
      indexTarget: targetIndex,
    }).then(() => {
      updatePageButtons();
      // if a button is being edited and the list of buttons change
      // then the button being edited might have moved
      if (editingButton) {
        resetEditButtonForm();
      }
    });
  };

  const switchToEditingButton = (index: number) => {
    invoke("get_page_button_data", {
      id: pageProp.substring(2),
      index,
    }).then((buttonRaw) => {
      const button = buttonRaw as UIButton;
      let data: ButtonData | undefined;

      if ((button as ExecuteAction).ExecuteAction) {
        setEditButtonType("ExecuteAction");
        data = (button as ExecuteAction).ExecuteAction;
      } else if ((button as OpenPage).OpenPage) {
        setEditButtonType("OpenPage");
        data = (button as OpenPage).OpenPage;
      }

      if (data === undefined) {
        msgFunc("Loaded button has an unsupported type");
        return;
      }

      setEditButtonLoadedTargetId(data.target_id);
      setEditButtonEnableStyle(data.style_override !== null);
      setEditButtonLoadedStyle(data.style_override);
      setEditButtonEnableImage(data.img !== null);
      setEditButtonImageLocation(data.img ? "keeporiginal" : "");
      setEditButtonIndex(index);
      setEditingButton(true);
    });
  };

  const deleteButtonFromPage = (index: number) => {
    invoke("delete_button_from_page", { id: pageProp.substring(2), index })
      .then(() => {
        setButtonsList(buttonsList.filter((elem, i) => index != i));
      })
      .catch((err) => {
        msgFunc(`Error occurred: ${err.toString()}`);
      });
  };

  const buttonStyleRef = createRef<EditButtonStyle>();

  const getButtonData = () => {
    if (editButtonTargetId === "none") {
      msgFunc("Please select an action/page to activate for the button");
      return undefined;
    }

    let style_override: ButtonStyle | undefined;

    if (buttonStyleRef.current && editButtonEnableStyle) {
      style_override = buttonStyleRef.current.getButtonStyleData();
    }

    let img: Base64Image | undefined;

    if (editButtonEnableImage) {
      if (editButtonImageLocation === "keeporiginal") {
        img = {
          format: "keeporiginal",
          data: "",
        } as Base64Image;
      } else {
        img = {
          format: "",
          data: editButtonImageLocation,
        } as Base64Image;
      }
    }

    const buttonData = {
      target_id: editButtonTargetId.substring(2),
      style_override,
      img,
    } as ButtonData;

    switch (editButtonType) {
      case "none":
        msgFunc("Please select a button type to add");
        return undefined;
      case "ExecuteAction":
        return {
          ExecuteAction: buttonData,
        } as ExecuteAction;
      case "OpenPage":
        return {
          OpenPage: buttonData,
        } as OpenPage;
    }
  };

  const saveButton = () => {
    const data: UIButton | undefined = getButtonData();

    if (data === undefined) {
      return;
    }

    if (editingButton) {
      // when editing a button the page ID will not be "new"
      const targetPageId = pageProp.substring(2);
      invoke("edit_button_in_page", {
        id: targetPageId,
        index: editButtonIndex,
        data,
      })
        .then(() => {
          msgFunc(
            `Button at position ${
              editButtonIndex + 1
            } in page ${targetPageId} has been modified`
          );
          updatePageButtons();
        })
        .catch((err) => {
          msgFunc(`Error occurred: ${err.toString()}`);
        });
    } else {
      // when creating a new button in a new page use the ID from the input field,
      // else use the one from the prop since that is the saved one
      const targetPageId = pageProp === "new" ? pageId : pageProp.substring(2);
      invoke("add_new_button_to_page", {
        id: targetPageId,
        data,
      })
        .then((newPage) => {
          if (newPage) {
            msgFunc(`New page with ID ${targetPageId} created`);
            onSaveDeleteCallback();
          } else {
            msgFunc(`New button added to page ${targetPageId}`);
            updatePageButtons();
          }
        })
        .catch((err) => {
          msgFunc(`Error occurred: ${err.toString()}`);
        });
    }
  };

  const onEditButtonTypeChange = (e: Event) => {
    if (e.target) {
      // If the edit button type changed then the loaded target ID is no longer valid
      setEditButtonLoadedTargetId("");
      setEditButtonType((e.target as HTMLInputElement).value);
    }
  };

  const editButtonTargetIdChange = (e: Event) => {
    if (e.target) {
      setEditButtonTargetId((e.target as HTMLInputElement).value);
    }
  };

  const toggleEditButtonEnableStyle = () => {
    setEditButtonEnableStyle(!editButtonEnableStyle);
  };

  const toggleEditButtonEnableImage = () => {
    setEditButtonEnableImage(!editButtonEnableImage);
  };

  const pickImageFile = () => {
    invoke("pick_image_file")
      .then((imgRaw) => {
        setEditButtonImageLocation(imgRaw as string);
      })
      .catch((err) => {
        msgFunc(`Error occurred: ${err.toString()}`);
      });
  };

  // hide on none
  if (pageProp === "none") {
    return <Fragment />;
  }

  return (
    <Fragment>
      <label>
        Page ID:
        <input
          type="text"
          value={pageId}
          onInput={onPageIdInput}
          placeholder="No /, ? or #"
        />
      </label>
      <span hidden={pageProp === "new"}>
        <button type="button" onClick={renameCurrentPage}>
          Update page name
        </button>
        <button type="button" onClick={deleteCurrentPage}>
          Delete currently selected page
        </button>
      </span>
      <hr />
      <ol>
        {buttonsList.map((page, index) => {
          return (
            <DraggableListItem<string>
              key={page}
              pos={index}
              data={page}
              dataConverter={dataConverter}
              moveCallback={movePageInList}
            >
              <button
                type="button"
                onClick={() => switchToEditingButton(index)}
              >
                Edit
              </button>
              <button type="button" onClick={() => deleteButtonFromPage(index)}>
                Delete
              </button>
            </DraggableListItem>
          );
        })}
      </ol>
      <hr />
      <div>
        {editingButton ? (
          <Fragment>
            {`Currently editing the button at position ${editButtonIndex + 1}`}
            <button type="button" onClick={resetEditButtonForm}>
              Create a new button instead
            </button>
          </Fragment>
        ) : (
          "Currently creating a new button"
        )}
        <button type="button" onClick={saveButton}>
          Save button
        </button>
      </div>
      <label>
        Button type:
        <select value={editButtonType} onChange={onEditButtonTypeChange}>
          <option value="none">Select an option</option>
          <option value="ExecuteAction">Execute an action</option>
          <option value="OpenPage">Open another page</option>
        </select>
      </label>
      <br />
      <label hidden={editButtonType === "none"}>
        ID of {editButtonType === "ExecuteAction" ? "action" : "page"} to
        activate:
        <select value={editButtonTargetId} onChange={editButtonTargetIdChange}>
          <option value="none">Select an option</option>
          <SelectOptsGen opts={editButtonTargetList} />
        </select>
      </label>
      <br />
      <label>
        Show image instead of{" "}
        {editButtonType === "ExecuteAction" ? "action" : "page"} ID:
        <input
          type="checkbox"
          checked={editButtonEnableImage}
          onClick={toggleEditButtonEnableImage}
        />
      </label>
      <div hidden={!editButtonEnableImage}>
        <p>
          Warning: Make sure that the selected image is not overly large in
          size.
        </p>
        <label>
          <button type="button" onClick={pickImageFile}>
            Select image file
          </button>
          Image location:{" "}
          {editButtonImageLocation === "keeporiginal"
            ? "<stored>"
            : editButtonImageLocation}
        </label>
      </div>
      <br />
      <label>
        Enable style override:
        <input
          type="checkbox"
          checked={editButtonEnableStyle}
          onClick={toggleEditButtonEnableStyle}
        />
      </label>
      {editButtonEnableStyle && (
        <Fragment>
          <br />
          <EditButtonStyle
            ref={buttonStyleRef}
            initialData={editButtonLoadedStyle}
          />
        </Fragment>
      )}
    </Fragment>
  );
};

export default EditPage;
