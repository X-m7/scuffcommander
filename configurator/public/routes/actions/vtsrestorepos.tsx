import { h, Component } from "preact";

import style from "./style.module.css";
import sharedStyle from "/style.module.css";
import { VTSRestoreModelPositionData } from "/types";

interface EditVTSRestoreModelPositionDataProps {
  data?: VTSRestoreModelPositionData;
  msgFunc: (msg: string) => void;
}

interface EditVTSRestoreModelPositionDataState {
  varId: string;
  time: string;
  varIdValid: boolean;
  timeValid: boolean;
}

class EditVTSRestoreModelPositionData extends Component<
  EditVTSRestoreModelPositionDataProps,
  EditVTSRestoreModelPositionDataState
> {
  constructor(props: EditVTSRestoreModelPositionDataProps) {
    super(props);

    let varId = "";
    let time = "";
    let loaded = false;

    if (props.data) {
      varId = props.data.var_id.toString();
      time = props.data.time_sec.toString();
      loaded = true;
    }

    this.state = {
      varId,
      time,
      varIdValid: loaded,
      timeValid: loaded,
    };
  }

  onVarIdInput = (e: Event) => {
    if (!e.target) {
      return;
    }

    const value = (e.target as HTMLInputElement).value;

    const valid = value.length > 0;

    this.setState({
      varId: value,
      varIdValid: valid,
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

  getData = () => {
    if (!(this.state.varIdValid && this.state.timeValid)) {
      this.props.msgFunc("Either the variable name or the time is invalid");
      return undefined;
    }

    return {
      var_id: this.state.varId,
      time_sec: parseFloat(this.state.time),
    } as VTSRestoreModelPositionData;
  };

  render(props: EditVTSRestoreModelPositionDataProps, state: EditVTSRestoreModelPositionDataState) {
    return (
      <div class={style.tableDisp}>
        <label class={style.rowDisp}>
          <span class={style.cellDisp}>Variable name:</span>
          <input
            class={`${style.cellDisp} ${
              state.varIdValid ? "" : sharedStyle.invalid
            }`}
            type="text"
            value={state.varId}
            onInput={this.onVarIdInput}
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

export default EditVTSRestoreModelPositionData;
