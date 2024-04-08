import { h, Fragment, createRef } from "preact";
import { useEffect, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api";

import sharedStyle from "/style.module.css";
import { Action, ActionContent, SingleAction, IfAction } from "/types";
import EditSingleAction from "./singleaction";
import EditChainAction from "./chainaction";
import EditConditionAction from "./conditionaction";

enum ActionType {
  None,
  Single,
  Chain,
  If,
}

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
    undefined,
  );

  // run only when the selected action changes (from outside)
  useEffect(() => {
    // reset on none/new
    if (actionProp === "none" || actionProp === "new") {
      setActionId("");
      setActionType(ActionType.None);
      setActionData(undefined);
      return;
    }

    const newActionId = actionProp.substring(2);

    invoke("load_action_details", { id: newActionId })
      .then((loadedActionRaw) => {
        const loadedAction = loadedActionRaw as Action;

        setActionId(newActionId);
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
      })
      .catch((err) => {
        msgFunc(`Error occurred: ${err.toString()}`);
      });
  }, [actionProp, msgFunc]);

  const onActionIdInput = (e: Event) => {
    if (e.target) {
      setActionId((e.target as HTMLInputElement).value);
    }
  };

  const onActionTypeChange = (e: Event) => {
    if (e.target) {
      setActionType(
        parseInt((e.target as HTMLInputElement).value, 10) as ActionType,
      );

      // clear this once the plugin type is changed manually
      // since it means the original loaded data is irrelevant
      setActionData(undefined);
    }
  };

  const deleteCurrentAction = () => {
    const id = actionProp.substring(2);
    invoke("delete_action", { id })
      .then(() => {
        msgFunc(`Action with ID "${id}" deleted`);
        onSaveDeleteCallback();
      })
      .catch((err) => {
        msgFunc(`Error occurred: ${err.toString()}`);
      });
  };

  /*
   * Saving related code
   */
  const actionRef = createRef<
    EditSingleAction | EditChainAction | EditConditionAction
  >();

  const renderActionDetailsEditor = () => {
    switch (actionType) {
      case ActionType.Single:
        return (
          <EditSingleAction
            ref={actionRef}
            data={actionData as SingleAction | undefined}
            msgFunc={msgFunc}
          />
        );
      case ActionType.Chain:
        return (
          <EditChainAction
            ref={actionRef}
            data={actionData as Action[] | undefined}
            msgFunc={msgFunc}
          />
        );
      case ActionType.If:
        return (
          <EditConditionAction
            ref={actionRef}
            data={actionData as IfAction | undefined}
            msgFunc={msgFunc}
          />
        );
      default:
        return <Fragment />;
    }
  };

  const getActionData = async () => {
    if (!actionRef.current || actionType === ActionType.None) {
      return undefined;
    }

    const content = await actionRef.current.getActionData();

    // if undefined here means error message already shown
    if (!content) {
      return undefined;
    }

    return {
      tag: ActionType[actionType],
      content,
    } as Action;
  };

  const saveCurrentAction = async () => {
    if (actionId.length === 0) {
      msgFunc("Action ID cannot be empty");
      return;
    }

    if (actionType === ActionType.None) {
      msgFunc("Please select an action type");
      return;
    }

    // allow overwrites only when editing an action without changing its ID
    const allowOverwrite =
      actionProp !== "new" && actionId === actionProp.substring(2);

    const actionData = await getActionData();

    if (!actionData) {
      return;
    }

    invoke("add_new_action", {
      id: actionId,
      action: actionData,
      overwrite: allowOverwrite,
    })
      .then(onSaveDeleteCallback)
      .catch((err) => {
        msgFunc(`Error occurred: ${err.toString()}`);
      });
  };

  // hide on none
  if (actionProp === "none") {
    return <Fragment />;
  }

  return (
    <Fragment>
      <hr />
      <label>
        Action ID:
        <input
          class={actionId.length === 0 ? sharedStyle.invalid : ""}
          type="text"
          value={actionId}
          onInput={onActionIdInput}
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
      <button
        type="button"
        hidden={actionProp === "new"}
        onClick={deleteCurrentAction}
      >
        Delete currently selected action
      </button>
      <hr />
      {renderActionDetailsEditor()}
    </Fragment>
  );
};

export default EditAction;
