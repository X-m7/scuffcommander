import { h, Fragment } from "preact";
import { useEffect, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api";

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

  useEffect(() => {
    if (pageProp === "none" || pageProp === "new") {
      setPageId("");
      return;
    }

    const newPageId = pageProp.substring(2);
    setPageId(newPageId);
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
        msgFunc(`Page with ID "${id}" deleted`);
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
        msgFunc(`Page with ID "${currentId}" renamed to "${newId}"`);
        onSaveDeleteCallback();
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
    </Fragment>
  );
};

export default EditPage;
