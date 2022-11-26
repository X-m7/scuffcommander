import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import style from "./style.css";
import { invoke } from "@tauri-apps/api";

import EditAction from "./editor";
import { generateSelectOptions } from "./common";

const Actions = () => {
  const [statusState, setStatusState] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<string>("none");
  const [actionsList, setActionsList] = useState<string[]>([]);

  const saveActions = (e: Event) => {
    e.preventDefault();

    invoke("save_actions")
      .then(() => {
        setStatusState("Actions saved");
      })
      .catch((err) => {
        setStatusState(`Error occurred: ${err.toString()}`);
      });
  };

  const onSelectedActionChange = (e: Event) => {
    if (e.target) {
      setSelectedAction((e.target as HTMLInputElement).value);
    }
  };

  const clearStatusMsg = () => {
    setStatusState("");
  };

  const refreshActions = (init: boolean) => {
    invoke("get_actions")
      .then((actsList) => {
        const actions = actsList as string[];
        setActionsList(actions);
      })
      .catch((err) => {
        setStatusState(`Error occurred: ${err.toString()}`);
      });

    // reset selected action since it could have been renamed/deleted
    if (!init) {
      setSelectedAction("none");
    }
  };

  const onSaveDeleteCallback = () => {
    refreshActions(false);
  };

  useEffect(() => {
    refreshActions(true);
  }, []);

  return (
    <div class={style.actions}>
      <h1>Actions Configuration</h1>

      <form onSubmit={saveActions}>
        <p>
          {statusState}
          {statusState.length > 0 && (
            <button type="button" onClick={clearStatusMsg}>
              Clear
            </button>
          )}
        </p>
        <label>
          Create a new action or select an existing one:
          <select value={selectedAction} onChange={onSelectedActionChange}>
            <option value="none">Select an option</option>
            <option value="new">Create a new action</option>
            {generateSelectOptions(actionsList)}
          </select>
        </label>
        <button type="submit">Save Actions</button>
        <br />
        <EditAction
          action={selectedAction}
          msgFunc={setStatusState}
          onSaveDeleteCallback={onSaveDeleteCallback}
        />
      </form>
    </div>
  );
};

export default Actions;
