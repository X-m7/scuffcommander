import { h, Fragment, Component, createRef } from "preact";

import sharedStyle from "/style.module.css";
import {
  GeneralAction,
  GeneralActionCommand,
  GeneralActionDelay,
  GeneralActionRunCmd,
} from "/types";
import EditGeneralCommand from "./generalcmd";

enum GeneralActionType {
  None,
  Delay,
  RunCommand,
}

interface EditGeneralActionProps {
  data?: GeneralAction;
  msgFunc: (msg: string) => void;
}

interface EditGeneralActionState {
  actionType: GeneralActionType;
  actionNumberInput: string;
  showCmdInput: boolean;
  loadedCmd?: GeneralActionCommand;
  showActionNumberInput: boolean;
  actionNumberInputValid: boolean;
}

class EditGeneralAction extends Component<
  EditGeneralActionProps,
  EditGeneralActionState
> {
  constructor(props: EditGeneralActionProps) {
    super(props);

    let actionType = GeneralActionType.None;
    let actionNumberInput = "";
    let showCmdInput = false;
    let loadedCmd: GeneralActionCommand | undefined;
    let showActionNumberInput = false;
    let actionNumberInputValid = false;

    if (props.data) {
      actionType =
        GeneralActionType[props.data.tag as keyof typeof GeneralActionType];

      switch (actionType) {
        case GeneralActionType.Delay:
          actionNumberInput = props.data.content.toString();
          showActionNumberInput = true;
          actionNumberInputValid = true;
          break;
        case GeneralActionType.RunCommand:
          showCmdInput = true;
          loadedCmd = props.data.content as GeneralActionCommand;
          break;
      }
    }

    this.state = {
      actionType,
      showCmdInput,
      loadedCmd,
      actionNumberInput,
      showActionNumberInput,
      actionNumberInputValid,
    };
  }

  onActionTypeChange = (e: Event) => {
    if (!e.target) {
      return;
    }

    const actionType = parseInt(
      (e.target as HTMLInputElement).value,
      10,
    ) as GeneralActionType;

    switch (actionType) {
      case GeneralActionType.None:
        this.setState({
          actionType,
          showActionNumberInput: false,
          showCmdInput: false,
        });
        break;
      case GeneralActionType.Delay:
        this.setState({
          actionType,
          showActionNumberInput: true,
          showCmdInput: false,
        });
        break;
      case GeneralActionType.RunCommand:
        this.setState({
          actionType,
          showActionNumberInput: false,
          showCmdInput: true,
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
      actionNumberInput: value,
      actionNumberInputValid: valid,
    });
  };

  cmdInputRef = createRef<EditGeneralCommand>();

  getActionData = async () => {
    let cmdData: GeneralActionCommand | undefined;

    switch (this.state.actionType) {
      case GeneralActionType.None:
        this.props.msgFunc(
          "Please select an option for the General action type",
        );
        return undefined;
      case GeneralActionType.Delay:
        if (!this.state.actionNumberInputValid) {
          this.props.msgFunc("Invalid delay input");
          return undefined;
        }

        return {
          tag: "Delay",
          content: parseFloat(this.state.actionNumberInput),
        } as GeneralActionDelay;
      case GeneralActionType.RunCommand:
        if (!this.cmdInputRef.current) {
          return undefined;
        }

        cmdData = this.cmdInputRef.current.getCmdData();

        if (!cmdData) {
          return undefined;
        }

        return {
          tag: "RunCommand",
          content: cmdData,
        } as GeneralActionRunCmd;
      default:
        return undefined;
    }
  };

  render(props: EditGeneralActionProps, state: EditGeneralActionState) {
    return (
      <Fragment>
        <label>
          General action type:
          <select value={state.actionType} onChange={this.onActionTypeChange}>
            <option value={GeneralActionType.None}>Select an option</option>
            <option value={GeneralActionType.Delay}>Delay</option>
            <option value={GeneralActionType.RunCommand}>Run command</option>
          </select>
        </label>
        <br />
        <label hidden={!state.showActionNumberInput}>
          Delay time (seconds):
          <input
            class={state.actionNumberInputValid ? "" : sharedStyle.invalid}
            type="number"
            value={state.actionNumberInput}
            onInput={this.onActionParamInput}
          />
        </label>
        {state.showCmdInput && (
          <EditGeneralCommand
            ref={this.cmdInputRef}
            data={state.loadedCmd}
            msgFunc={props.msgFunc}
          />
        )}
      </Fragment>
    );
  }
}

export default EditGeneralAction;
