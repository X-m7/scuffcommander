import { h, Fragment, Component } from "preact";
import { invoke } from "@tauri-apps/api";

import style from "./style.module.css";
import { VTSAction, VTSMoveModelData } from "/types";
import SelectOptsGen from "/components/selectoptsgen";

enum VTSActionType {
  None,
  ToggleExpression,
  EnableExpression,
  DisableExpression,
  LoadModel,
  MoveModel,
  TriggerHotkey,
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
  modelPosValue: VTSMoveModelDataStr;
}

type VTSMoveModelDataStr = {
  x: string;
  y: string;
  rotation: string;
  size: string;
  time_sec: string;
};

const convertModelPosValueToNumbers = (inp: VTSMoveModelDataStr) => {
  return {
    x: parseFloat(inp.x),
    y: parseFloat(inp.y),
    rotation: parseFloat(inp.rotation),
    size: parseFloat(inp.size),
    time_sec: parseFloat(inp.time_sec),
  } as VTSMoveModelData;
};

const convertModelPosValueToString = (inp: VTSMoveModelData) => {
  return {
    x: inp.x.toString(),
    y: inp.y.toString(),
    rotation: inp.rotation.toString(),
    size: inp.size.toString(),
    time_sec: inp.time_sec.toString(),
  } as VTSMoveModelDataStr;
};

class EditVTSAction extends Component<EditVTSActionProps, EditVTSActionState> {
  constructor(props: EditVTSActionProps) {
    super(props);

    let actionType = VTSActionType.None;
    let showModelPosInput = false;
    let modelPosValue: VTSMoveModelDataStr = {
      x: "0",
      y: "0",
      rotation: "0",
      size: "0",
      time_sec: "0",
    };

    if (props.data) {
      actionType = VTSActionType[props.data.tag as keyof typeof VTSActionType];

      if (actionType === VTSActionType.MoveModel) {
        modelPosValue = convertModelPosValueToString(
          props.data.content as VTSMoveModelData
        );
        showModelPosInput = true;
      }
    }

    this.state = {
      actionType,
      showSelectInput: false,
      selectInputValue: "none",
      selectInputOptions: [],
      showModelPosInput,
      modelPosValue,
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
    switch (actionType) {
      case VTSActionType.None:
        this.setState({
          actionType,
          showSelectInput: false,
          showModelPosInput: false,
          selectInputValue: "none",
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

  getActionData = async () => {
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
        return {
          tag: "MoveModel",
          content: convertModelPosValueToNumbers(this.state.modelPosValue),
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

  onPosXInput = (e: Event) => {
    if (!e.target) {
      return;
    }

    this.setState({
      modelPosValue: {
        ...this.state.modelPosValue,
        x: (e.target as HTMLInputElement).value,
      },
    });
  };

  onPosYInput = (e: Event) => {
    if (!e.target) {
      return;
    }

    this.setState({
      modelPosValue: {
        ...this.state.modelPosValue,
        y: (e.target as HTMLInputElement).value,
      },
    });
  };

  onPosRotateInput = (e: Event) => {
    if (!e.target) {
      return;
    }

    this.setState({
      modelPosValue: {
        ...this.state.modelPosValue,
        rotation: (e.target as HTMLInputElement).value,
      },
    });
  };

  onPosSizeInput = (e: Event) => {
    if (!e.target) {
      return;
    }

    this.setState({
      modelPosValue: {
        ...this.state.modelPosValue,
        size: (e.target as HTMLInputElement).value,
      },
    });
  };

  onPosTimeInput = (e: Event) => {
    if (!e.target) {
      return;
    }

    this.setState({
      modelPosValue: {
        ...this.state.modelPosValue,
        time_sec: (e.target as HTMLInputElement).value,
      },
    });
  };

  getCurrentModelPos = () => {
    invoke("get_vts_current_model_pos")
      .then((posRaw) => {
        this.setState({
          modelPosValue: convertModelPosValueToString(
            posRaw as VTSMoveModelData
          ),
        });
      })
      .catch((err) => {
        this.props.msgFunc(`Error occurred: ${err.toString()}`);
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
            <option value={VTSActionType.EnableExpression}>
              Enable Expression
            </option>
            <option value={VTSActionType.DisableExpression}>
              Disable Expression
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
            <SelectOptsGen opts={this.state.selectInputOptions} />
          </select>
        </label>
        <div
          class={this.state.showModelPosInput ? style.tableDisp : style.hidden}
        >
          <button
            type="button"
            class={style.rowDisp}
            onClick={this.getCurrentModelPos}
          >
            Get current model position
          </button>
          <label class={style.rowDisp}>
            <span class={style.cellDisp}>X:</span>
            <input
              class={style.cellDisp}
              type="number"
              step="any"
              value={this.state.modelPosValue.x}
              onInput={this.onPosXInput}
            />
          </label>
          <label class={style.rowDisp}>
            <span class={style.cellDisp}>Y:</span>
            <input
              class={style.cellDisp}
              type="number"
              step="any"
              value={this.state.modelPosValue.y}
              onInput={this.onPosYInput}
            />
          </label>
          <label class={style.rowDisp}>
            <span class={style.cellDisp}>Rotation (degrees):</span>
            <input
              class={style.cellDisp}
              type="number"
              step="any"
              value={this.state.modelPosValue.rotation}
              onInput={this.onPosRotateInput}
            />
          </label>
          <label class={style.rowDisp}>
            <span class={style.cellDisp}>Size:</span>
            <input
              class={style.cellDisp}
              type="number"
              step="any"
              value={this.state.modelPosValue.size}
              onInput={this.onPosSizeInput}
            />
          </label>
          <label class={style.rowDisp}>
            <span class={style.cellDisp}>Animation time (0-2s):</span>
            <input
              class={style.cellDisp}
              type="number"
              step="any"
              value={this.state.modelPosValue.time_sec}
              onInput={this.onPosTimeInput}
            />
          </label>
        </div>
      </Fragment>
    );
  }
}

export default EditVTSAction;
