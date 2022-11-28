import { h, Fragment } from "preact";
import { useEffect, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api";

import DraggableListItem from "/components/draggablelistitem";

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

  useEffect(() => {
    if (pageProp === "none" || pageProp === "new") {
      setPageId("");
      setButtonsList([]);
      return;
    }

    const newPageId = pageProp.substring(2);

    invoke("get_page_buttons_info", { id: newPageId }).then((buttonsRaw) => {
      const buttons = buttonsRaw as string[];

      setButtonsList(buttons);
      setPageId(newPageId);
    });
  }, [pageProp]);

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

  const movePageInList = (draggedIndex: number, targetIndex: number) => {};

  const deleteButtonFromPage = (index: number) => {
    invoke("delete_button_from_page", { id: pageProp.substring(2), index })
      .then(() => {
        setButtonsList(buttonsList.filter((elem, i) => index != i));
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
              <button type="button" onClick={() => deleteButtonFromPage(index)}>
                Delete
              </button>
            </DraggableListItem>
          );
        })}
      </ol>
    </Fragment>
  );
};

export default EditPage;
