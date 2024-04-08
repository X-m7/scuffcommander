import { h, Fragment, Component, createRef } from "preact";
import { invoke } from "@tauri-apps/api";

import { VTSAction, VTSMoveModelData, VTSRestoreModelPositionData } from "/types";
import EditVTSMoveModelData from "./vtsmovemodel";
import SelectOptsGen from "/components/selectoptsgen";

enum VTSActionType {
  None,
  ToggleExpression,
  EnableExpression,
  DisableExpression,
  LoadModel,
  MoveModel,
  TriggerHotkey,
  SaveCurrentModelPosition,
  RestoreModelPosition,
  CheckConnection,
}

interface EditVTSActionProps {
  data?: VTSAction;
  msgFunc: (msg: string) => void;
}

interface EditVTSActionState {
  actionType: VTSActionType;
  showSelectInput: boolean;
  selectInputValue: string;
  selectInputOptions: string[];
  showModelPosInput: boolean;
  loadedModelPosData?: VTSMoveModelData;
  showTextInput: boolean;
  textInputValue: string;
}

class EditVTSAction extends Component<EditVTSActionProps, EditVTSActionState> {
  constructor(props: EditVTSActionProps) {
    super(props);

    let actionType = VTSActionType.None;
    let showModelPosInput = false;
    let loadedModelPosData: VTSMoveModelData | undefined;

    if (props.data) {
      actionType = VTSActionType[props.data.tag as keyof typeof VTSActionType];

      if (actionType === VTSActionType.MoveModel) {
        showModelPosInput = true;
        loadedModelPosData = props.data.content as VTSMoveModelData;
      }
    }

    this.state = {
      actionType,
      showSelectInput: false,
      selectInputValue: "none",
      selectInputOptions: [],
      showModelPosInput,
      loadedModelPosData,
      showTextInput: false,
      textInputValue: "",
    };
  }

  componentDidMount() {
    this.actionTypeUpdate(this.state.actionType, true);
  }

  fillSelectInput = (
    actionType: VTSActionType,
    invokeArgOuter: string,
    invokeArgInner: string,
    init: boolean
  ) => {
    const timer = setTimeout(() => {
      this.props.msgFunc(
        "Warning: A request to VTube Studio is taking an extended amount of time (there may be a pending authentication request that needs to be allowed)"
      );
    }, 1000);
    invoke(invokeArgOuter)
      .then((listRaw) => {
        this.setState({
          actionType,
          selectInputOptions: listRaw as string[],
          showSelectInput: true,
          showModelPosInput: false,
          // Reset the selected input in most cases (on manual change)
          selectInputValue: "none",
        });

        // Unless init is true, in which case we get the loaded ID
        // and convert it to the name
        if (init && this.props.data && this.props.data.content) {
          invoke(invokeArgInner, {
            id: this.props.data.content,
          })
            .then((actRaw) => {
              // Reset the timer only after both invokes are done
              clearTimeout(timer);
              const actionName = actRaw as string;
              this.setState({
                selectInputValue: `x-${actionName}`,
              });
            })
            .catch((err) => {
              clearTimeout(timer);
              this.props.msgFunc(`Error occurred: ${err.toString()}`);
            });
        } else {
          // Otherwise only one invoke is needed, so reset the timeout here
          clearTimeout(timer);
        }
      })
      .catch((err) => {
        clearTimeout(timer);
        this.props.msgFunc(`Error occurred: ${err.toString()}`);
      });
  };

  actionTypeUpdate = (actionType: VTSActionType, init: boolean) => {
    let textInputValue = "";

    switch (actionType) {
      case VTSActionType.None:
        this.setState({
          actionType,
          showSelectInput: false,
          showModelPosInput: false,
          selectInputValue: "none",
          showTextInput: false,
          textInputValue,
        });
        break;
      case VTSActionType.ToggleExpression:
      case VTSActionType.EnableExpression:
      case VTSActionType.DisableExpression:
        this.fillSelectInput(
          actionType,
          "get_vts_expression_names",
          "get_vts_expression_name_from_id",
          init
        );
        break;
      case VTSActionType.TriggerHotkey:
        this.fillSelectInput(
          actionType,
          "get_vts_hotkey_names",
          "get_vts_hotkey_name_from_id",
          init
        );
        break;
      case VTSActionType.LoadModel:
        this.fillSelectInput(
          actionType,
          "get_vts_model_names",
          "get_vts_model_name_from_id",
          init
        );
        break;
      case VTSActionType.MoveModel:
        this.setState({
          actionType,
          showSelectInput: false,
          selectInputValue: "none",
          showModelPosInput: true,
          showTextInput: false,
          textInputValue,
        });
        break;
      case VTSActionType.SaveCurrentModelPosition:
        if (init && this.props.data && this.props.data.content) {
          textInputValue = this.props.data.content as string;
        }
        this.setState({
          actionType,
          showSelectInput: false,
          selectInputValue: "none",
          showModelPosInput: false,
          showTextInput: true,
          textInputValue,
        });
        break;
      case VTSActionType.RestoreModelPosition:
        if (init && this.props.data && typeof this.props.data.content === "object" && "var_id" in this.props.data.content) {
          textInputValue = this.props.data.content.var_id;
        }
        this.setState({
          actionType,
          showSelectInput: false,
          selectInputValue: "none",
          showModelPosInput: false,
          showTextInput: true,
          textInputValue,
        });
        break;
    }
  };

  getSelectInputData = async (invokeCmd: string) => {
    if (this.state.selectInputValue === "none") {
      this.props.msgFunc(
        "Please select an option for the VTube Studio action parameter"
      );
      return undefined;
    }

    try {
      return {
        tag: VTSActionType[this.state.actionType],
        content: await invoke(invokeCmd, {
          name: this.state.selectInputValue.substring(2),
        }),
      } as VTSAction;
    } catch (err) {
      if (typeof err === "string") {
        this.props.msgFunc(`Error occurred: ${err.toString()}`);
      }
      return undefined;
    }
  };

  moveModelEditorRef = createRef<EditVTSMoveModelData>();

  getActionData = async () => {
    let moveModelData: VTSMoveModelData | undefined;
    let restoreModelData: VTSRestoreModelPositionData;

    switch (this.state.actionType) {
      case VTSActionType.None:
        this.props.msgFunc(
          "Please select an option for the VTube Studio action type"
        );
        return undefined;
      case VTSActionType.ToggleExpression:
      case VTSActionType.EnableExpression:
      case VTSActionType.DisableExpression:
        return await this.getSelectInputData("get_vts_expression_id_from_name");
      case VTSActionType.LoadModel:
        return await this.getSelectInputData("get_vts_model_id_from_name");
      case VTSActionType.TriggerHotkey:
        return await this.getSelectInputData("get_vts_hotkey_id_from_name");
      case VTSActionType.MoveModel:
        if (!this.moveModelEditorRef.current) {
          return undefined;
        }

        moveModelData = this.moveModelEditorRef.current.getData();

        if (!moveModelData) {
          return undefined;
        }

        return {
          tag: "MoveModel",
          content: moveModelData,
        } as VTSAction;
      case VTSActionType.SaveCurrentModelPosition:
        if (this.state.textInputValue === "") {
          this.props.msgFunc(
            "Please enter a variable name to save the model position to"
          );
          return undefined;
        }

        return {
          tag: "SaveCurrentModelPosition",
          content: this.state.textInputValue,
        } as VTSAction;
      case VTSActionType.RestoreModelPosition:
        if (this.state.textInputValue === "") {
          this.props.msgFunc(
            "Please enter a variable name to load the model position from"
          );
          return undefined;
        }

        restoreModelData = {
          var_id: this.state.textInputValue,
          time_sec: 0.2,
        } as VTSRestoreModelPositionData;

        return {
          tag: "RestoreModelPosition",
          content: restoreModelData,
        } as VTSAction;
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
      selectInputValue: (e.target as HTMLInputElement).value,
    });
  };

  onTextInputChange = (e: Event) => {
    if (!e.target) {
      return;
    }

    this.setState({
      textInputValue: (e.target as HTMLInputElement).value,
    });
  };

  render(props: EditVTSActionProps, state: EditVTSActionState) {
    return (
      <Fragment>
        <label>
          VTube Studio action type:
          <select value={state.actionType} onChange={this.onActionTypeChange}>
            <option value={VTSActionType.None}>Select an option</option>
            <option value={VTSActionType.ToggleExpression}>
              Toggle Expression
            </option>
            <option value={VTSActionType.EnableExpression}>
              Enable Expression
            </option>
            <option value={VTSActionType.DisableExpression}>
              Disable Expression
            </option>
            <option value={VTSActionType.LoadModel}>Load Model</option>
            <option value={VTSActionType.MoveModel}>Move Model</option>
            <option value={VTSActionType.TriggerHotkey}>Trigger Hotkey</option>
            <option value={VTSActionType.SaveCurrentModelPosition}>
              Save Current Model Position
            </option>
            <option value={VTSActionType.RestoreModelPosition}>
              Restore Model Position
            </option>
          </select>
        </label>
        <br />
        <label hidden={!state.showSelectInput}>
          Action parameter:
          <select
            value={state.selectInputValue}
            onChange={this.onSelectInputChange}
          >
            <option value="none">Select an option</option>
            <SelectOptsGen opts={state.selectInputOptions} />
          </select>
        </label>
        <label hidden={!state.showTextInput}>
          Action parameter:
          <input
            type="text"
            value={state.textInputValue}
            onInput={this.onTextInputChange}
          />
        </label>
        {state.showModelPosInput && (
          <EditVTSMoveModelData
            ref={this.moveModelEditorRef}
            data={state.loadedModelPosData}
            msgFunc={props.msgFunc}
          />
        )}
      </Fragment>
    );
  }
}

export default EditVTSAction;
