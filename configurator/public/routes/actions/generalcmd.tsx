import { h, Fragment, Component } from "preact";
import { invoke } from "@tauri-apps/api/core";

import sharedStyle from "/style.module.css";
import { GeneralActionCommand } from "/types";

interface EditGeneralCommandProps {
  data?: GeneralActionCommand;
  msgFunc: (msg: string) => void;
}

interface EditGeneralCommandState {
  cmd: string;
  args: string[];
  currentDir: string;
  showCurrentDir: boolean;
}

class EditGeneralCommand extends Component<
  EditGeneralCommandProps,
  EditGeneralCommandState
> {
  constructor(props: EditGeneralCommandProps) {
    super(props);

    let cmd = "";
    let args: string[] = [];
    let currentDir = "";
    let showCurrentDir = false;

    if (props.data) {
      cmd = props.data[0];
      args = props.data[1];

      if (props.data[2]) {
        currentDir = props.data[2];
        showCurrentDir = true;
      }
    }

    this.state = {
      cmd,
      args,
      currentDir,
      showCurrentDir,
    };
  }

  onCmdInput = (e: Event) => {
    if (!e.target) {
      return;
    }

    this.setState({
      cmd: (e.target as HTMLInputElement).value,
    });
  };

  onCurrentDirInput = (e: Event) => {
    if (!e.target) {
      return;
    }

    this.setState({
      currentDir: (e.target as HTMLInputElement).value,
    });
  };

  onArgInput = (index: number, e: Event) => {
    if (!e.target) {
      return;
    }

    this.setState({
      args: this.state.args.map((orig, i) => {
        if (i === index) {
          return (e.target as HTMLInputElement).value;
        }

        return orig;
      }),
    });
  };

  addArg = () => {
    this.setState({
      args: this.state.args.concat([""]),
    });
  };

  deleteArg = (index: number) => {
    this.setState({
      args: this.state.args.filter((orig, i) => {
        return i !== index;
      }),
    });
  };

  selectExe = () => {
    invoke("pick_executable_file")
      .then((pathRaw) => {
        this.setState({
          cmd: pathRaw as string,
        });
      })
      .catch((err) => {
        this.props.msgFunc(`Error occurred: ${err.toString()}`);
      });
  };

  selectCurrentDir = () => {
    invoke("pick_folder")
      .then((pathRaw) => {
        this.setState({
          currentDir: pathRaw as string,
        });
      })
      .catch((err) => {
        this.props.msgFunc(`Error occurred: ${err.toString()}`);
      });
  };

  toggleShowCurrentDir = () => {
    this.setState({
      showCurrentDir: !this.state.showCurrentDir,
    });
  };

  getCmdData = () => {
    if (this.state.cmd.length === 0) {
      this.props.msgFunc("Command cannot be empty");
      return undefined;
    }

    if (this.state.showCurrentDir && this.state.currentDir.length === 0) {
      this.props.msgFunc("Current directory cannot be empty");
      return undefined;
    }

    for (const arg of this.state.args) {
      if (arg.length === 0) {
        this.props.msgFunc("At least one of the arguments is empty");
        return undefined;
      }
    }

    return [
      this.state.cmd,
      this.state.args,
      this.state.showCurrentDir ? this.state.currentDir : null,
    ] as GeneralActionCommand;
  };

  render(props: EditGeneralCommandProps, state: EditGeneralCommandState) {
    return (
      <Fragment>
        <label>
          Command:
          <input
            type="text"
            class={state.cmd.length === 0 ? sharedStyle.invalid : ""}
            value={state.cmd}
            onInput={this.onCmdInput}
          />
        </label>
        <button type="button" onClick={this.selectExe}>
          Select executable
        </button>
        <br />
        <button type="button" onClick={this.addArg}>
          Add argument
        </button>
        {state.args.map((argState, index) => {
          return (
            <Fragment key={index}>
              <br />
              <label>
                Argument {index + 1}:
                <input
                  type="text"
                  class={argState.length === 0 ? sharedStyle.invalid : ""}
                  value={argState}
                  onInput={(e: Event) => this.onArgInput(index, e)}
                />
              </label>
              <button type="button" onClick={() => this.deleteArg(index)}>
                Delete argument
              </button>
            </Fragment>
          );
        })}
        <br />
        <label>
          Set current directory:
          <input
            type="checkbox"
            checked={state.showCurrentDir}
            onClick={this.toggleShowCurrentDir}
          />
        </label>
        <div hidden={!state.showCurrentDir}>
          <label>
            Current directory:
            <input
              type="text"
              class={state.currentDir.length === 0 ? sharedStyle.invalid : ""}
              value={state.currentDir}
              onInput={this.onCurrentDirInput}
            />
          </label>
          <button type="button" onClick={this.selectCurrentDir}>
            Select directory
          </button>
        </div>
      </Fragment>
    );
  }
}

export default EditGeneralCommand;
