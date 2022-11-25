import { h, Fragment, Component } from "preact";
import { invoke } from "@tauri-apps/api";

import { VTSActionType, VTSAction } from "./types";
import { generateSelectOptions } from "./common";

interface EditVTSActionProps {
  data?: VTSAction;
  msgFunc: (msg: string) => void;
}

interface EditVTSActionState {
  actionType: VTSActionType;
  showSelectInput: boolean;
  selectInputValue?: string;
  selectInputOptions: string[];
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
      showSelectInput: false,
      selectInputValue: "none",
      selectInputOptions: [],
    };
  }

  componentDidMount() {
    this.actionTypeUpdate(this.state.actionType, true);
  }

  actionTypeUpdate = (actionType: VTSActionType, init: boolean) => {
    switch (actionType) {
      case VTSActionType.None:
        this.setState({
          ...this.state,
          actionType,
          showSelectInput: false,
          selectInputValue: "none",
        });
        break;
      case VTSActionType.ToggleExpression:
        // need to convert id to name
        // also prefill selector list
        invoke("get_vts_expression_names")
          .then((listRaw) => {
            this.setState({
              ...this.state,
              actionType,
              selectInputOptions: listRaw as string[],
              showSelectInput: true,
            });

            // On initialisation also convert the loaded ID to the name
            if (init && this.props.data && this.props.data.content) {
              invoke("get_vts_expression_name_from_id", {
                id: this.props.data.content,
              })
                .then((actRaw) => {
                  const actionName = actRaw as string;
                  this.setState({
                    ...this.state,
                    selectInputValue: `x-${actionName}`,
                  });
                })
                .catch((err) => {
                  this.props.msgFunc(`Error occurred: ${err.toString()}`);
                });
            }
          })
          .catch((err) => {
            this.props.msgFunc(`Error occurred: ${err.toString()}`);
          });
        break;
      default:
        this.props.msgFunc("Unimplemented VTS action type");
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
    ) as VTSActionType;

    this.actionTypeUpdate(newActionType, false);
  };

  onSelectInputChange = (e: Event) => {
    if (!e.target) {
      return;
    }

    this.setState({
      ...this.state,
      selectInputValue: (e.target as HTMLInputElement).value,
    });
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
        <br />
        <label hidden={!this.state.showSelectInput}>
          Action parameter:
          <select
            value={this.state.selectInputValue}
            onChange={this.onSelectInputChange}
          >
            <option value="none">Select an option</option>
            {generateSelectOptions(this.state.selectInputOptions)}
          </select>
        </label>
      </Fragment>
    );
  }
}

export default EditVTSAction;
