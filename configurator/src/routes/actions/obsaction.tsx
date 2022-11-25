import { h, Fragment, Component } from "preact";
import { invoke } from "@tauri-apps/api";

import { OBSActionType, OBSAction } from "./types";

interface EditOBSActionProps {
  data?: OBSAction;
  msgFunc: (msg: string) => void;
}

interface EditOBSActionState {
  actionType: OBSActionType;
  programSceneList: string[];
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

      if (actionInput.length != 0) {
        showActionInput = true;
      }
    }

    this.state = {
      actionType,
      programSceneList: [],
      actionInput,
      showActionInput,
    };
  }

  componentDidMount() {
    // need this to load the scene options
    this.actionTypeUpdate(this.state.actionType);
  }

  actionTypeUpdate = (newActionType: OBSActionType) => {
    switch (newActionType) {
      case OBSActionType.ProgramSceneChange:
        invoke("get_obs_scenes")
          .then((list) => {
            this.setState({
              ...this.state,
              actionType: newActionType,
              programSceneList: list as string[],
              showActionInput: true,
            });
          })
          .catch((err) => {
            this.props.msgFunc(`Error occurred: ${err.toString()}`);
          });
        break;
      case OBSActionType.None:
        this.setState({
          ...this.state,
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
      10
    ) as OBSActionType;

    this.actionTypeUpdate(newActionType);
  };

  onActionParamSelect = (e: Event) => {
    if (!e.target) {
      return;
    }

    this.setState({
      ...this.state,
      actionInput: (e.target as HTMLInputElement).value,
    });
  };

  renderSelectInputOptions = () => {
    const content = [];

    for (const opt of this.state.programSceneList) {
      content.push(
        <option key={`x-${opt}`} value={`x-${opt}`}>
          {opt}
        </option>
      );
    }

    return content;
  };

  render() {
    return (
      <Fragment>
        <label>
          OBS Studio action type:
          <select
            value={this.state.actionType}
            onChange={this.onActionTypeChange}
          >
            <option value={OBSActionType.None}>Select an option</option>
            <option value={OBSActionType.ProgramSceneChange}>
              Program Scene Change
            </option>
          </select>
        </label>
        <br />
        <label hidden={!this.state.showActionInput}>
          Action parameter:
          <select
            value={this.state.actionInput}
            onChange={this.onActionParamSelect}
          >
            <option value="none">Select an option</option>
            {this.renderSelectInputOptions()}
          </select>
        </label>
      </Fragment>
    );
  }
}

export default EditOBSAction;
