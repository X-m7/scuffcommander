import { h, Fragment, Component } from "preact";
import { invoke } from "@tauri-apps/api";

import { OBSAction } from "/types";
import SelectOptsGen from "/components/selectoptsgen";

enum OBSActionType {
  None,
  ProgramSceneChange,
  StartStream,
  StopStream,
  StartRecord,
  StopRecord,
  CheckConnection,
}

interface EditOBSActionProps {
  data?: OBSAction;
  msgFunc: (msg: string) => void;
}

interface EditOBSActionState {
  actionType: OBSActionType;
  actionInputList: string[];
  actionInput: string;
  showActionInput: boolean;
}

class EditOBSAction extends Component<EditOBSActionProps, EditOBSActionState> {
  constructor(props: EditOBSActionProps) {
    super(props);

    let actionType = OBSActionType.None;
    let actionInput = "";
    let showActionInput = false;

    if (props.data) {
      actionType = OBSActionType[props.data.tag as keyof typeof OBSActionType];
      actionInput = `x-${props.data.content}` ?? "none";

      if (actionInput !== "none") {
        showActionInput = true;
      }
    }

    this.state = {
      actionType,
      actionInputList: [],
      actionInput,
      showActionInput,
    };
  }

  componentDidMount() {
    // need this to load the scene options
    this.actionTypeUpdate(this.state.actionType, true);
  }

  actionTypeUpdate = (newActionType: OBSActionType, init: boolean) => {
    switch (newActionType) {
      case OBSActionType.ProgramSceneChange:
        invoke("get_obs_scenes")
          .then((list) => {
            this.setState({
              actionType: newActionType,
              actionInputList: list as string[],
              showActionInput: true,
              // if called on init leave actionInput alone, otherwise reset
              actionInput: init ? this.state.actionInput : "none",
            });
          })
          .catch((err) => {
            this.props.msgFunc(`Error occurred: ${err.toString()}`);
          });
        break;
      case OBSActionType.StartStream:
      case OBSActionType.StopStream:
      case OBSActionType.StartRecord:
      case OBSActionType.StopRecord:
      case OBSActionType.None:
        this.setState({
          actionType: newActionType,
          showActionInput: false,
          actionInput: "none",
        });
        break;
    }
  };

  onActionTypeChange = (e: Event) => {
    if (!e.target) {
      return;
    }

    const newActionType = parseInt(
      (e.target as HTMLInputElement).value,
      10,
    ) as OBSActionType;

    this.actionTypeUpdate(newActionType, false);
  };

  onActionParamSelect = (e: Event) => {
    if (!e.target) {
      return;
    }

    this.setState({
      actionInput: (e.target as HTMLInputElement).value,
    });
  };

  getActionData = async () => {
    switch (this.state.actionType) {
      case OBSActionType.None:
        this.props.msgFunc(
          "Please select an option for the OBS Studio action type",
        );
        return undefined;
      case OBSActionType.ProgramSceneChange:
        if (this.state.actionInput === "none") {
          this.props.msgFunc(
            "Please select an option for the OBS Studio action parameter",
          );
          return undefined;
        }
        return {
          tag: OBSActionType[this.state.actionType],
          content: this.state.actionInput.substring(2),
        } as OBSAction;
      case OBSActionType.StartStream:
      case OBSActionType.StopStream:
      case OBSActionType.StartRecord:
      case OBSActionType.StopRecord:
        return {
          tag: OBSActionType[this.state.actionType],
          content: undefined,
        } as OBSAction;
    }

    return undefined;
  };

  render(props: EditOBSActionProps, state: EditOBSActionState) {
    return (
      <Fragment>
        <label>
          OBS Studio action type:
          <select value={state.actionType} onChange={this.onActionTypeChange}>
            <option value={OBSActionType.None}>Select an option</option>
            <option value={OBSActionType.ProgramSceneChange}>
              Program Scene Change
            </option>
            <option value={OBSActionType.StartStream}>Start Streaming</option>
            <option value={OBSActionType.StopStream}>Stop Streaming</option>
            <option value={OBSActionType.StartRecord}>Start Recording</option>
            <option value={OBSActionType.StopRecord}>Stop Recording</option>
          </select>
        </label>
        <br />
        <label hidden={!state.showActionInput}>
          Action parameter:
          <select value={state.actionInput} onChange={this.onActionParamSelect}>
            <option value="none">Select an option</option>
            <SelectOptsGen opts={state.actionInputList} />
          </select>
        </label>
      </Fragment>
    );
  }
}

export default EditOBSAction;
