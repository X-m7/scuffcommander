import { h, Fragment } from "preact";
import { useEffect, useState } from "preact/hooks";
import style from "./style.css";
import { invoke } from "@tauri-apps/api";

import { ActionType, Action } from "./types";

const generateSelectOptions = (opts: string[]) => {
  return (
    <Fragment>
      {opts.map((opt) => {
        return (
          <option key={`x-${opt}`} value={`x-${opt}`}>
            {opt}
          </option>
        );
      })}
    </Fragment>
  );
};

interface EditActionDetailsProps extends EditActionProps {
  actionType: ActionType;
}

const EditActionDetails = (props: EditActionDetailsProps) => {
  return (
    <Fragment>
      <p>{props.action}</p>
      <p>{props.actionType}</p>
    </Fragment>
  );
};

interface EditActionProps {
  action: string;
  msgFunc: (msg: string) => void;
}

const EditAction = ({ action: actionProp, msgFunc }: EditActionProps) => {
  const [actionId, setActionId] = useState<string>("");
  const [actionType, setActionType] = useState<ActionType>(ActionType.None);

  // run only when the selected action changes (from outside)
  useEffect(() => {
    // reset on none/new
    if (actionProp === "none" || actionProp === "new") {
      setActionId("");
      setActionType(ActionType.None);
      return;
    }

    const newActionId = actionProp.substring(2);

    setActionId(newActionId);
    invoke("load_action_details", { id: newActionId })
      .then((loadedActionRaw) => {
        const loadedAction = loadedActionRaw as Action;

        switch (loadedAction.tag) {
          case "Single":
            setActionType(ActionType.Single);
            break;
          case "Chain":
            setActionType(ActionType.Chain);
            break;
          case "If":
            setActionType(ActionType.If);
            break;
          default:
            setActionType(ActionType.None);
            msgFunc("Loaded action has an unrecognised type");
            break;
        }
      })
      .catch((err) => {
        msgFunc(`Error occurred: ${err.toString()}`);
      });
  }, [actionProp, msgFunc]);

  // hide on none
  if (actionProp === "none") {
    return <Fragment />;
  }

  const onActionIdInput = (e: Event) => {
    if (e.target) {
      setActionId((e.target as HTMLInputElement).value);
    }
  };

  const onActionTypeChange = (e: Event) => {
    if (e.target) {
      setActionType(
        parseInt((e.target as HTMLInputElement).value, 10) as ActionType
      );
    }
  };

  const saveCurrentAction = () => {
    msgFunc("Unimplemented");
  };

  const deleteCurrentAction = () => {
    msgFunc("Unimplemented");
  };

  return (
    <Fragment>
      <hr />
      <label>
        Action ID:
        <input
          type="text"
          value={actionId}
          onInput={onActionIdInput}
          placeholder="No /, ? or #"
        />
      </label>
      <label>
        Action type:
        <select value={actionType} onChange={onActionTypeChange}>
          <option value={ActionType.None}>Select an option</option>
          <option value={ActionType.Single}>Single</option>
          <option value={ActionType.Chain}>Chain</option>
          <option value={ActionType.If}>Condition</option>
        </select>
      </label>
      <button type="button" onClick={saveCurrentAction}>
        Save
      </button>
      <button type="button" onClick={deleteCurrentAction}>
        Delete currently selected action
      </button>
      <EditActionDetails
        action={actionId}
        actionType={actionType}
        msgFunc={msgFunc}
      />
    </Fragment>
  );
};

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
        <p>{statusState}</p>
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
