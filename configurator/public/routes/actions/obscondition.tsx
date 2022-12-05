import { h, Fragment, Component } from "preact";
import { invoke } from "@tauri-apps/api";

import { Condition } from "/types";
import SelectOptsGen from "/components/selectoptsgen";

enum OBSQueryType {
  None,
  CurrentProgramScene,
  IsStreaming,
  IsRecording,
  Version,
}

interface EditOBSConditionProps {
  data?: Condition;
  msgFunc: (msg: string) => void;
}

interface EditOBSConditionState {
  queryType: OBSQueryType;
  queryInputList: string[];
  queryInput: string;
  showQueryInput: boolean;
}

class EditOBSCondition extends Component<
  EditOBSConditionProps,
  EditOBSConditionState
> {
  constructor(props: EditOBSConditionProps) {
    super(props);

    let queryType = OBSQueryType.None;
    let queryInput = "";
    let showQueryInput = false;

    if (props.data) {
      queryType =
        OBSQueryType[props.data.query.content as keyof typeof OBSQueryType];
      queryInput = `x-${props.data.target}` ?? "none";

      if (queryInput !== "none") {
        showQueryInput = true;
      }
    }

    this.state = {
      queryType,
      queryInputList: [],
      queryInput,
      showQueryInput,
    };
  }

  componentDidMount() {
    // need this to load the scene options
    this.queryTypeUpdate(this.state.queryType, true);
  }

  queryTypeUpdate = (newQueryType: OBSQueryType, init: boolean) => {
    switch (newQueryType) {
      case OBSQueryType.CurrentProgramScene:
        invoke("get_obs_scenes")
          .then((list) => {
            this.setState({
              queryType: newQueryType,
              queryInputList: list as string[],
              showQueryInput: true,
              // if called on init leave queryInput alone, otherwise reset
              queryInput: init ? this.state.queryInput : "none",
            });
          })
          .catch((err) => {
            this.props.msgFunc(`Error occurred: ${err.toString()}`);
          });
        break;
      case OBSQueryType.IsStreaming:
      case OBSQueryType.IsRecording:
        this.setState({
          queryType: newQueryType,
          queryInputList: ["true", "false"],
          showQueryInput: true,
          // if called on init leave queryInput alone, otherwise reset
          queryInput: init ? this.state.queryInput : "none",
        });
        break;
      case OBSQueryType.None:
        this.setState({
          queryType: newQueryType,
          showQueryInput: false,
          queryInput: "none",
        });
        break;
    }
  };

  onQueryTypeChange = (e: Event) => {
    if (!e.target) {
      return;
    }

    const newQueryType = parseInt(
      (e.target as HTMLInputElement).value,
      10
    ) as OBSQueryType;

    this.queryTypeUpdate(newQueryType, false);
  };

  onQueryParamSelect = (e: Event) => {
    if (!e.target) {
      return;
    }

    this.setState({
      queryInput: (e.target as HTMLInputElement).value,
    });
  };

  getQueryDisplayString = (queryType: OBSQueryType) => {
    switch (queryType) {
      case OBSQueryType.CurrentProgramScene:
        return "the current program scene is";
      case OBSQueryType.IsStreaming:
        return "OBS is streaming";
      case OBSQueryType.IsRecording:
        return "OBS is recording";
      case OBSQueryType.None:
        return "<none>";
    }
  };

  getConditionData = async () => {
    if (this.state.queryType === OBSQueryType.None) {
      this.props.msgFunc(
        "Please select an option for the OBS Studio query type"
      );
      return undefined;
    }

    if (this.state.queryInput === "none") {
      this.props.msgFunc(
        "Please select an option for the OBS Studio query parameter"
      );
      return undefined;
    }

    return {
      query: {
        tag: "OBS",
        content: OBSQueryType[this.state.queryType],
      },
      target: this.state.queryInput.substring(2),
    } as Condition;
  };

  render() {
    return (
      <Fragment>
        <label>
          OBS Studio query type:
          <select
            value={this.state.queryType}
            onChange={this.onQueryTypeChange}
          >
            <option value={OBSQueryType.None}>Select an option</option>
            <option value={OBSQueryType.CurrentProgramScene}>
              Current Program Scene
            </option>
            <option value={OBSQueryType.IsStreaming}>Is streaming</option>
            <option value={OBSQueryType.IsRecording}>Is recording</option>
          </select>
        </label>
        <br />
        <label hidden={!this.state.showQueryInput}>
          If {this.getQueryDisplayString(this.state.queryType)}
          <select
            value={this.state.queryInput}
            onChange={this.onQueryParamSelect}
          >
            <option value="none">Select an option</option>
            <SelectOptsGen opts={this.state.queryInputList} />
          </select>
        </label>
      </Fragment>
    );
  }
}

export default EditOBSCondition;
