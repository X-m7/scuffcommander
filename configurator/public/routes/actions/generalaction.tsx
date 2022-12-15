import { h, Fragment, Component } from "preact";

import sharedStyle from "/style.module.css";
import { GeneralAction } from "/types";

enum GeneralActionType {
  None,
  Delay,
}

interface EditGeneralActionProps {
  data?: GeneralAction;
  msgFunc: (msg: string) => void;
}

interface EditGeneralActionState {
  actionType: GeneralActionType;
  actionInput: string;
  showActionInput: boolean;
  actionInputValid: boolean;
}

class EditGeneralAction extends Component<
  EditGeneralActionProps,
  EditGeneralActionState
> {
  constructor(props: EditGeneralActionProps) {
    super(props);

    let actionType = GeneralActionType.None;
    let actionInput = "";
    let showActionInput = false;
    let actionInputValid = false;

    if (props.data) {
      actionType =
        GeneralActionType[props.data.tag as keyof typeof GeneralActionType];
      actionInput = props.data.content.toString();
      showActionInput = true;
      actionInputValid = true;
    }

    this.state = {
      actionType,
      actionInput,
      showActionInput,
      actionInputValid,
    };
  }

  onActionTypeChange = (e: Event) => {
    if (!e.target) {
      return;
    }

    const actionType = parseInt(
      (e.target as HTMLInputElement).value,
      10
    ) as GeneralActionType;

    switch (actionType) {
      case GeneralActionType.None:
        this.setState({
          actionType,
          showActionInput: false,
        });
        break;
      case GeneralActionType.Delay:
        this.setState({
          actionType,
          showActionInput: true,
        });
        break;
    }
  };

  onActionParamInput = (e: Event) => {
    if (!e.target) {
      return;
    }

    const value = (e.target as HTMLInputElement).value;
    const parsedVal = parseFloat(value);

    const valid = !Number.isNaN(parsedVal) && parsedVal >= 0;

    this.setState({
      actionInput: value,
      actionInputValid: valid,
    });
  };

  getActionData = async () => {
    if (this.state.actionType === GeneralActionType.None) {
      this.props.msgFunc("Please select an option for the General action type");
      return undefined;
    }

    if (!this.state.actionInputValid) {
      this.props.msgFunc("Invalid input");
      return;
    }

    return {
      tag: GeneralActionType[this.state.actionType],
      content: parseFloat(this.state.actionInput),
    } as GeneralAction;
  };

  render() {
    return (
      <Fragment>
        <label>
          General action type:
          <select
            value={this.state.actionType}
            onChange={this.onActionTypeChange}
          >
            <option value={GeneralActionType.None}>Select an option</option>
            <option value={GeneralActionType.Delay}>Delay</option>
          </select>
        </label>
        <br />
        <label hidden={!this.state.showActionInput}>
          Delay time (seconds):
          <input
            class={this.state.actionInputValid ? "" : sharedStyle.invalid}
            type="number"
            value={this.state.actionInput}
            onInput={this.onActionParamInput}
          />
        </label>
      </Fragment>
    );
  }
}

export default EditGeneralAction;
