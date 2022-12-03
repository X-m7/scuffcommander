import { h, Fragment, Component } from "preact";
import { invoke } from "@tauri-apps/api";

import { Condition, VTSQueryType } from "./types";
import SelectOptsGen from "/components/selectoptsgen";

interface EditVTSConditionProps {
  data?: Condition;
  msgFunc: (msg: string) => void;
}

interface EditVTSConditionState {
  queryType: VTSQueryType;
  queryInputList: string[];
  queryInput: string;
  showQueryInput: boolean;
}

class EditVTSCondition extends Component<
  EditVTSConditionProps,
  EditVTSConditionState
> {
  constructor(props: EditVTSConditionProps) {
    super(props);

    let queryType = VTSQueryType.None;
    let queryInput = "";
    let showQueryInput = false;

    if (props.data) {
      queryType =
        VTSQueryType[props.data.query.content as keyof typeof VTSQueryType];
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

  queryTypeUpdate = (newQueryType: VTSQueryType, init: boolean) => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    switch (newQueryType) {
      case VTSQueryType.ActiveModelId:
        timer = setTimeout(() => {
          this.props.msgFunc(
            "Warning: A request to VTube Studio is taking an extended amount of time (there may be a pending authentication request that needs to be allowed)"
          );
        }, 1000);
        invoke("get_vts_model_names")
          .then((list) => {
            this.setState({
              queryType: newQueryType,
              queryInputList: list as string[],
              showQueryInput: true,
              // Reset the selected input in most cases (on manual change)
              queryInput: "none",
            });

            // Unless init is true, in which case we get the loaded ID
            // and convert it to the name
            if (init && this.props.data) {
              invoke("get_vts_model_name_from_id", {
                id: this.props.data.target,
              })
                .then((nameRaw) => {
                  clearTimeout(timer);
                  this.setState({
                    queryInput: `x-${nameRaw as string}`,
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
        break;
      case VTSQueryType.None:
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
    ) as VTSQueryType;

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

  getQueryDisplayString = (queryType: VTSQueryType) => {
    switch (queryType) {
      case VTSQueryType.ActiveModelId:
        return "active model";
      case VTSQueryType.None:
        return "<none>";
    }
  };

  getConditionData = async () => {
    let queryInput = this.state.queryInput;

    switch (this.state.queryType) {
      case VTSQueryType.None:
        this.props.msgFunc(
          "Please select an option for the VTube Studio query type"
        );
        return undefined;
      case VTSQueryType.ActiveModelId:
        if (queryInput === "none") {
          this.props.msgFunc(
            "Please select an option for the VTube Studio query parameter"
          );
          return undefined;
        }

        try {
          queryInput = await invoke("get_vts_model_id_from_name", {
            name: queryInput.substring(2),
          });
        } catch (err) {
          if (typeof err === "string") {
            this.props.msgFunc(
              "Please select an option for the VTube Studio query type"
            );
            return undefined;
          }
        }
    }

    return {
      query: {
        tag: "VTS",
        content: VTSQueryType[this.state.queryType],
      },
      target: queryInput,
    } as Condition;
  };

  render() {
    return (
      <Fragment>
        <label>
          VTube Studio query type:
          <select
            value={this.state.queryType}
            onChange={this.onQueryTypeChange}
          >
            <option value={VTSQueryType.None}>Select an option</option>
            <option value={VTSQueryType.ActiveModelId}>Active Model</option>
          </select>
        </label>
        <br />
        <label hidden={!this.state.showQueryInput}>
          If the {this.getQueryDisplayString(this.state.queryType)} is
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

export default EditVTSCondition;
