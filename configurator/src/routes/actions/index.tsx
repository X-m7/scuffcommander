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
    setStatusState(selectedAction);
  };

  const onSelectedActionChange = (e: Event) => {
    if (e.target) {
      setSelectedAction((e.target as HTMLInputElement).value);
    }
  };

  const clearStatusMsg = () => {
    setStatusState("");
  };

  useEffect(() => {
    invoke("get_actions")
      .then((actsList) => {
        const actions = actsList as string[];
        setActionsList(actions);
      })
      .catch((err) => {
        setStatusState(`Error occurred: ${err.toString()}`);
      });
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
        <EditAction action={selectedAction} msgFunc={setStatusState} />
      </form>
    </div>
  );
};

export default Actions;
