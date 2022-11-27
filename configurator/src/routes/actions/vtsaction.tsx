import { h, Fragment, Component } from "preact";
import { invoke } from "@tauri-apps/api";
import style from "./style.css";

import { VTSActionType, VTSAction, VTSMoveModelData } from "./types";
import { generateSelectOptions } from "./common";

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
  modelPosValue: VTSMoveModelData;
}

class EditVTSAction extends Component<EditVTSActionProps, EditVTSActionState> {
  constructor(props: EditVTSActionProps) {
    super(props);

    let actionType = VTSActionType.None;
    let showModelPosInput = false;
    let modelPosValue: VTSMoveModelData = {
      x: 0,
      y: 0,
      rotation: 0,
      size: 0,
      time_sec: 0,
    };

    if (props.data) {
      actionType = VTSActionType[props.data.tag as keyof typeof VTSActionType];

      if (actionType === VTSActionType.MoveModel) {
        modelPosValue = props.data.content as VTSMoveModelData;
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
    invoke(invokeArgOuter)
      .then((listRaw) => {
        this.setState({
          ...this.state,
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
  };

  actionTypeUpdate = (actionType: VTSActionType, init: boolean) => {
    switch (actionType) {
      case VTSActionType.None:
        this.setState({
          ...this.state,
          actionType,
          showSelectInput: false,
          showModelPosInput: false,
          selectInputValue: "none",
        });
        break;
      case VTSActionType.ToggleExpression:
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
          ...this.state,
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
        return await this.getSelectInputData("get_vts_expression_id_from_name");
      case VTSActionType.LoadModel:
        return await this.getSelectInputData("get_vts_model_id_from_name");
      case VTSActionType.TriggerHotkey:
        return await this.getSelectInputData("get_vts_hotkey_id_from_name");
      case VTSActionType.MoveModel:
        return {
          tag: "MoveModel",
          content: this.state.modelPosValue,
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
      ...this.state,
      selectInputValue: (e.target as HTMLInputElement).value,
    });
  };

  onPosXInput = (e: Event) => {
    if (!e.target) {
      return;
    }

    this.setState({
      ...this.state,
      modelPosValue: {
        ...this.state.modelPosValue,
        x: parseFloat((e.target as HTMLInputElement).value),
      },
    });
  };

  onPosYInput = (e: Event) => {
    if (!e.target) {
      return;
    }

    this.setState({
      ...this.state,
      modelPosValue: {
        ...this.state.modelPosValue,
        y: parseFloat((e.target as HTMLInputElement).value),
      },
    });
  };

  onPosRotateInput = (e: Event) => {
    if (!e.target) {
      return;
    }

    this.setState({
      ...this.state,
      modelPosValue: {
        ...this.state.modelPosValue,
        rotation: parseFloat((e.target as HTMLInputElement).value),
      },
    });
  };

  onPosSizeInput = (e: Event) => {
    if (!e.target) {
      return;
    }

    this.setState({
      ...this.state,
      modelPosValue: {
        ...this.state.modelPosValue,
        size: parseFloat((e.target as HTMLInputElement).value),
      },
    });
  };

  onPosTimeInput = (e: Event) => {
    if (!e.target) {
      return;
    }

    this.setState({
      ...this.state,
      modelPosValue: {
        ...this.state.modelPosValue,
        time_sec: parseFloat((e.target as HTMLInputElement).value),
      },
    });
  };

  getCurrentModelPos = () => {
    invoke("get_vts_current_model_pos")
      .then((posRaw) => {
        this.setState({
          ...this.state,
          modelPosValue: posRaw as VTSMoveModelData,
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
        <div
          class={
            this.state.showModelPosInput ? style.vtsModelPosForm : style.hidden
          }
        >
          <button
            type="button"
            class={style.vtsModelPosRow}
            onClick={this.getCurrentModelPos}
          >
            Get current model position
          </button>
          <label class={style.vtsModelPosRow}>
            <span class={style.vtsModelPosCell}>X:</span>
            <input
              class={style.vtsModelPosCell}
              type="text"
              value={this.state.modelPosValue.x}
              onInput={this.onPosXInput}
            />
          </label>
          <label class={style.vtsModelPosRow}>
            <span class={style.vtsModelPosCell}>Y:</span>
            <input
              class={style.vtsModelPosCell}
              type="text"
              value={this.state.modelPosValue.y}
              onInput={this.onPosYInput}
            />
          </label>
          <label class={style.vtsModelPosRow}>
            <span class={style.vtsModelPosCell}>Rotation (degrees):</span>
            <input
              class={style.vtsModelPosCell}
              type="text"
              value={this.state.modelPosValue.rotation}
              onInput={this.onPosRotateInput}
            />
          </label>
          <label class={style.vtsModelPosRow}>
            <span class={style.vtsModelPosCell}>Size:</span>
            <input
              class={style.vtsModelPosCell}
              type="text"
              value={this.state.modelPosValue.size}
              onInput={this.onPosSizeInput}
            />
          </label>
          <label class={style.vtsModelPosRow}>
            <span class={style.vtsModelPosCell}>Animation time (0-2s):</span>
            <input
              class={style.vtsModelPosCell}
              type="text"
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
