import { h, Component } from "preact";

import sharedStyle from "/style.module.css";
import style from "./style.module.css";
import { ButtonStyle } from "/types";

interface EditButtonStyleProps {
  initialData?: ButtonStyle;
}

interface EditButtonStyleState {
  width: string;
  height: string;
  bgColor: string;
  fgColor: string;
  widthValid: boolean;
  heightValid: boolean;
}

class EditButtonStyle extends Component<
  EditButtonStyleProps,
  EditButtonStyleState
> {
  constructor(props: EditButtonStyleProps) {
    super(props);

    if (props.initialData) {
      this.state = {
        // parseFloat strips the units out (so "2cm" becomes "2" for example)
        width: parseFloat(props.initialData.width).toString(),
        height: parseFloat(props.initialData.height).toString(),
        bgColor: props.initialData.bg_color,
        fgColor: props.initialData.fg_color,
        // assume loaded data is valid
        widthValid: true,
        heightValid: true,
      } as EditButtonStyleState;
    } else {
      this.state = {
        width: "3",
        height: "3",
        bgColor: "#FFFFFF",
        fgColor: "#000000",
        // also start as true since we provide default values
        widthValid: true,
        heightValid: true,
      } as EditButtonStyleState;
    }
  }

  onWidthInput = (e: Event) => {
    if (!e.target) {
      return;
    }

    const value = (e.target as HTMLInputElement).value;
    const parsedVal = parseFloat(value);

    const valid = !Number.isNaN(parsedVal) && parsedVal > 0;

    this.setState({
      width: value,
      widthValid: valid,
    });
  };

  onHeightInput = (e: Event) => {
    if (!e.target) {
      return;
    }

    const value = (e.target as HTMLInputElement).value;
    const parsedVal = parseFloat(value);

    const valid = !Number.isNaN(parsedVal) && parsedVal > 0;

    this.setState({
      height: value,
      heightValid: valid,
    });
  };

  onBgColorInput = (e: Event) => {
    if (!e.target) {
      return;
    }

    this.setState({
      bgColor: (e.target as HTMLInputElement).value,
    });
  };

  onFgColorInput = (e: Event) => {
    if (!e.target) {
      return;
    }

    this.setState({
      fgColor: (e.target as HTMLInputElement).value,
    });
  };

  getButtonStyleData = () => {
    return {
      width: `${this.state.width}cm`,
      height: `${this.state.height}cm`,
      bg_color: this.state.bgColor,
      fg_color: this.state.fgColor,
    } as ButtonStyle;
  };

  render() {
    return (
      <div class={style.tableDisp}>
        <label class={style.rowDisp}>
          <span class={style.cellDisp}>Button width (cm):</span>
          <input
            class={`${style.cellDisp} ${
              this.state.widthValid ? "" : sharedStyle.invalid
            }`}
            type="number"
            step="any"
            value={this.state.width}
            onInput={this.onWidthInput}
          />
        </label>
        <label class={style.rowDisp}>
          <span class={style.cellDisp}>Button height (cm):</span>
          <input
            class={`${style.cellDisp} ${
              this.state.heightValid ? "" : sharedStyle.invalid
            }`}
            type="number"
            step="any"
            value={this.state.height}
            onInput={this.onHeightInput}
          />
        </label>
        <label class={style.rowDisp}>
          <span class={style.cellDisp}>Button background color:</span>
          <input
            class={style.cellDisp}
            type="color"
            value={this.state.bgColor}
            onInput={this.onBgColorInput}
          />
        </label>
        <label class={style.rowDisp}>
          <span class={style.cellDisp}>Button foreground color:</span>
          <input
            class={style.cellDisp}
            type="color"
            value={this.state.fgColor}
            onInput={this.onFgColorInput}
          />
        </label>
      </div>
    );
  }
}

export default EditButtonStyle;
