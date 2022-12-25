import { h, Component } from "preact";
import { invoke } from "@tauri-apps/api";

import style from "./style.module.css";
import sharedStyle from "/style.module.css";
import { VTSMoveModelData } from "/types";

interface EditVTSMoveModelDataProps {
  data?: VTSMoveModelData;
  msgFunc: (msg: string) => void;
}

interface EditVTSMoveModelDataState {
  x: string;
  y: string;
  rotation: string;
  size: string;
  time: string;
  xValid: boolean;
  yValid: boolean;
  rotationValid: boolean;
  sizeValid: boolean;
  timeValid: boolean;
}

class EditVTSMoveModelData extends Component<
  EditVTSMoveModelDataProps,
  EditVTSMoveModelDataState
> {
  constructor(props: EditVTSMoveModelDataProps) {
    super(props);

    let x = "";
    let y = "";
    let rotation = "";
    let size = "";
    let time = "";
    let loaded = false;

    if (props.data) {
      x = props.data.x.toString();
      y = props.data.y.toString();
      rotation = props.data.rotation.toString();
      size = props.data.size.toString();
      time = props.data.time_sec.toString();
      loaded = true;
    }

    this.state = {
      x,
      y,
      rotation,
      size,
      time,
      xValid: loaded,
      yValid: loaded,
      rotationValid: loaded,
      sizeValid: loaded,
      timeValid: loaded,
    };
  }

  onPosXInput = (e: Event) => {
    if (!e.target) {
      return;
    }

    const value = (e.target as HTMLInputElement).value;

    // Since the input type is number the value attribute will be empty
    // if the input is not a valid number
    const valid = value.length > 0;

    this.setState({
      x: value,
      xValid: valid,
    });
  };

  onPosYInput = (e: Event) => {
    if (!e.target) {
      return;
    }

    const value = (e.target as HTMLInputElement).value;

    // Since the input type is number the value attribute will be empty
    // if the input is not a valid number
    const valid = value.length > 0;

    this.setState({
      y: value,
      yValid: valid,
    });
  };

  onPosRotateInput = (e: Event) => {
    if (!e.target) {
      return;
    }

    const value = (e.target as HTMLInputElement).value;
    const parsedVal = parseFloat(value);

    const valid =
      !Number.isNaN(parsedVal) && parsedVal >= -360 && parsedVal <= 360;

    this.setState({
      rotation: value,
      rotationValid: valid,
    });
  };

  onPosSizeInput = (e: Event) => {
    if (!e.target) {
      return;
    }

    const value = (e.target as HTMLInputElement).value;
    const parsedVal = parseFloat(value);

    const valid =
      !Number.isNaN(parsedVal) && parsedVal >= -100 && parsedVal <= 100;

    this.setState({
      size: value,
      sizeValid: valid,
    });
  };

  onPosTimeInput = (e: Event) => {
    if (!e.target) {
      return;
    }

    const value = (e.target as HTMLInputElement).value;
    const parsedVal = parseFloat(value);

    const valid = !Number.isNaN(parsedVal) && parsedVal >= 0 && parsedVal <= 2;

    this.setState({
      time: value,
      timeValid: valid,
    });
  };

  getCurrentModelPos = () => {
    const timer = setTimeout(() => {
      this.props.msgFunc(
        "Warning: A request to VTube Studio is taking an extended amount of time (there may be a pending authentication request that needs to be allowed)"
      );
    }, 1000);
    invoke("get_vts_current_model_pos")
      .then((posRaw) => {
        clearTimeout(timer);
        const pos = posRaw as VTSMoveModelData;
        this.setState({
          x: pos.x.toString(),
          y: pos.y.toString(),
          rotation: pos.rotation.toString(),
          size: pos.size.toString(),
          // assume loaded values are valid since they are definitely numbers from the Rust side
          xValid: true,
          yValid: true,
          rotationValid: true,
          sizeValid: true,
        });
      })
      .catch((err) => {
        clearTimeout(timer);
        this.props.msgFunc(`Error occurred: ${err.toString()}`);
      });
  };

  getData = () => {
    if (
      !(
        this.state.xValid &&
        this.state.yValid &&
        this.state.rotationValid &&
        this.state.sizeValid &&
        this.state.timeValid
      )
    ) {
      this.props.msgFunc("At least part of the model position data is invalid");
      return undefined;
    }

    return {
      x: parseFloat(this.state.x),
      y: parseFloat(this.state.y),
      rotation: parseFloat(this.state.rotation),
      size: parseFloat(this.state.size),
      time_sec: parseFloat(this.state.time),
    } as VTSMoveModelData;
  };

  render(props: EditVTSMoveModelDataProps, state: EditVTSMoveModelDataState) {
    return (
      <div class={style.tableDisp}>
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
            class={`${style.cellDisp} ${
              state.xValid ? "" : sharedStyle.invalid
            }`}
            type="number"
            value={state.x}
            onInput={this.onPosXInput}
          />
        </label>
        <label class={style.rowDisp}>
          <span class={style.cellDisp}>Y:</span>
          <input
            class={`${style.cellDisp} ${
              state.yValid ? "" : sharedStyle.invalid
            }`}
            type="number"
            value={state.y}
            onInput={this.onPosYInput}
          />
        </label>
        <label class={style.rowDisp}>
          <span class={style.cellDisp}>
            Rotation (range: -360 to 360 degrees):
          </span>
          <input
            class={`${style.cellDisp} ${
              state.rotationValid ? "" : sharedStyle.invalid
            }`}
            type="number"
            value={state.rotation}
            onInput={this.onPosRotateInput}
          />
        </label>
        <label class={style.rowDisp}>
          <span class={style.cellDisp}>Size (range: -100 to 100):</span>
          <input
            class={`${style.cellDisp} ${
              state.sizeValid ? "" : sharedStyle.invalid
            }`}
            type="number"
            value={state.size}
            onInput={this.onPosSizeInput}
          />
        </label>
        <label class={style.rowDisp}>
          <span class={style.cellDisp}>Animation time (0-2s):</span>
          <input
            class={`${style.cellDisp} ${
              state.timeValid ? "" : sharedStyle.invalid
            }`}
            type="number"
            value={state.time}
            onInput={this.onPosTimeInput}
          />
        </label>
      </div>
    );
  }
}

export default EditVTSMoveModelData;
