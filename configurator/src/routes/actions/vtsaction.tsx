import { h, Fragment, Component } from "preact";

import { VTSActionType, VTSAction } from "./types";

interface EditVTSActionProps {
  data?: VTSAction;
  msgFunc: (msg: string) => void;
}

interface EditVTSActionState {
  actionType: VTSActionType;
}

class EditVTSAction extends Component<EditVTSActionProps, EditVTSActionState> {
  constructor(props: EditVTSActionProps) {
    super(props);

    let actionType = VTSActionType.None;

    if (props.data) {
      actionType = VTSActionType[props.data.tag as keyof typeof VTSActionType];
    }

    this.state = {
      actionType,
    };
  }

  onActionTypeChange = (e: Event) => {
    if (!e.target) {
      return;
    }

    const newActionType = parseInt(
      (e.target as HTMLInputElement).value,
      10
    ) as VTSActionType;

    this.setState({ ...this.state, actionType: newActionType });
  };

  render() {
    return (
      <Fragment>
        <label>
          VTube Studio action type:
          <select
            value={this.state.actionType}
            onChange={this.onActionTypeChange}
          >
            <option value={VTSActionType.None}>Select an option</option>
            <option value={VTSActionType.ToggleExpression}>
              Toggle Expression
            </option>
            <option value={VTSActionType.LoadModel}>Load Model</option>
            <option value={VTSActionType.MoveModel}>Move Model</option>
            <option value={VTSActionType.TriggerHotkey}>Trigger Hotkey</option>
          </select>
        </label>
      </Fragment>
    );
  }
}

export default EditVTSAction;
