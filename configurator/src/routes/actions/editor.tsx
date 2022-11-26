import { h, Fragment, createRef } from "preact";
import { useEffect, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api";

import { ActionType, Action, ActionContent, SingleAction } from "./types";
import EditSingleAction from "./singleaction";

interface EditActionProps {
  action: string;
  msgFunc: (msg: string) => void;
  onSaveDeleteCallback: () => void;
}

const EditAction = ({
  action: actionProp,
  msgFunc,
  onSaveDeleteCallback,
}: EditActionProps) => {
  const [actionId, setActionId] = useState<string>("");
  const [actionType, setActionType] = useState<ActionType>(ActionType.None);
  const [actionData, setActionData] = useState<ActionContent | undefined>(
    undefined
  );

  // run only when the selected action changes (from outside)
  useEffect(() => {
    // reset on none/new
    if (actionProp === "none" || actionProp === "new") {
      setActionId("");
      setActionType(ActionType.None);
      return;
    }

    const newActionId = actionProp.substring(2);

    invoke("load_action_details", { id: newActionId })
      .then((loadedActionRaw) => {
        const loadedAction = loadedActionRaw as Action;
        setActionData(loadedAction.content);

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

        // this is how the inner components know they need to refresh,
        // so do this after the action details have been loaded
        setActionId(newActionId);
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

  const deleteCurrentAction = () => {
    msgFunc("Unimplemented");
  };

  /*
   * Saving related code
   */
  const singleActionRef = createRef<EditSingleAction>();

  const renderActionDetailsEditor = () => {
    switch (actionType) {
      case ActionType.Single:
        // if the key attribute changes the component will be reset
        return (
          <EditSingleAction
            ref={singleActionRef}
            key={actionId}
            data={actionData as SingleAction | undefined}
            msgFunc={msgFunc}
          />
        );
      case ActionType.Chain:
        return <p>Chain</p>;
      case ActionType.If:
        return <p>If</p>;
      default:
        return <Fragment />;
    }
  };

  const getSingleActionData = () => {
    if (!singleActionRef.current) {
      console.log("Component reference not ready");
      return undefined;
    }

    const content = singleActionRef.current.getActionData();

    // if undefined here means error message already shown
    if (!content) {
      return undefined;
    }

    return {
      tag: "Single",
      content,
    } as Action;
  };

  const saveCurrentAction = () => {
    if (actionId.length === 0) {
      msgFunc("Action ID cannot be empty");
      return;
    }

    // allow overwrites only when editing an action without changing its ID
    const allowOverwrite =
      actionProp !== "new" && actionId === actionProp.substring(2);

    let singleActionData: Action | undefined;

    switch (actionType) {
      case ActionType.None:
        msgFunc("Please select an action type");
        break;
      case ActionType.Single:
        singleActionData = getSingleActionData();
        if (!singleActionData) {
          return;
        }

        invoke("add_new_action", {
          id: actionId,
          action: singleActionData,
          overwrite: allowOverwrite,
        })
          .then(onSaveDeleteCallback)
          .catch((err) => {
            msgFunc(`Error occurred: ${err.toString()}`);
          });
        break;
      default:
        msgFunc("Saving given action type not implemented yet");
        break;
    }
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
      <hr />
      {renderActionDetailsEditor()}
    </Fragment>
  );
};

export default EditAction;
