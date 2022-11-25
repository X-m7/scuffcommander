import { h, Fragment } from "preact";
import { useEffect, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api";

import { ActionType, Action, ActionContent, SingleAction } from "./types";
import EditSingleAction from "./singleaction";

interface EditActionDetailsProps extends EditActionProps {
  actionType: ActionType;
  actionData?: ActionContent;
  msgFunc: (msg: string) => void;
}

const EditActionDetails = (props: EditActionDetailsProps) => {
  switch (props.actionType) {
    case ActionType.Single:
      // if the key attribute changes the component will be reset
      return (
        <EditSingleAction
          key={props.action}
          data={props.actionData as SingleAction | undefined}
          msgFunc={props.msgFunc}
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

interface EditActionProps {
  action: string;
  msgFunc: (msg: string) => void;
}

const EditAction = ({ action: actionProp, msgFunc }: EditActionProps) => {
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
      <hr />
      <EditActionDetails
        action={actionId}
        actionType={actionType}
        actionData={actionData}
        msgFunc={msgFunc}
      />
    </Fragment>
  );
};

export default EditAction;
