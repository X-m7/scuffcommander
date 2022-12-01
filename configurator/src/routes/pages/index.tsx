import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api";

import style from "./style.css";
import EditPage from "./editor";
import SelectOptsGen from "/components/selectoptsgen";

const Pages = () => {
  const [statusState, setStatusState] = useState<string>("");
  const [selectedPage, setSelectedPage] = useState<string>("none");
  const [pagesList, setPagesList] = useState<string[]>([]);

  const savePages = () => {
    invoke("save_ui_config")
      .then(() => {
        setStatusState("Pages saved");
      })
      .catch((err) => {
        setStatusState(`Error occurred: ${err.toString()}`);
      });
  };

  const onSelectedPageChange = (e: Event) => {
    if (e.target) {
      setSelectedPage((e.target as HTMLInputElement).value);
    }
  };

  const clearStatusMsg = () => {
    setStatusState("");
  };

  const refreshPages = (init: boolean) => {
    invoke("get_page_names")
      .then((pagesList) => {
        setPagesList(pagesList as string[]);
      })
      .catch((err) => {
        setStatusState(`Error occurred: ${err.toString()}`);
      });

    // reset selected page since it could have been renamed/deleted
    if (!init) {
      setSelectedPage("none");
    }
  };

  // called when a page is created, renamed or deleted
  const onSaveDeleteCallback = () => {
    refreshPages(false);
  };

  useEffect(() => {
    refreshPages(true);
  }, []);

  return (
    <div class={style.pages}>
      <h1>Pages Configuration</h1>

      <form>
        <p>
          {statusState}
          {statusState.length > 0 && (
            <button type="button" onClick={clearStatusMsg}>
              Clear
            </button>
          )}
        </p>
        <label>
          Create a new page or select an existing one:
          <select value={selectedPage} onChange={onSelectedPageChange}>
            <option value="none">Select an option</option>
            <option value="new">Create a new page</option>
            <SelectOptsGen opts={pagesList} />
          </select>
        </label>
        <button type="button" onClick={savePages}>
          Save Pages
        </button>
        <br />
        <EditPage
          key={selectedPage}
          page={selectedPage}
          msgFunc={setStatusState}
          onSaveDeleteCallback={onSaveDeleteCallback}
        />
      </form>
    </div>
  );
};

export default Pages;
