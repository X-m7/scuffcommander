import { h, Fragment, Component, createRef } from "preact";
import { invoke } from "@tauri-apps/api";

import EditOBSCondition from "./obscondition";
import EditVTSCondition from "./vtscondition";
import { Action, ActionContent, Condition, QueryPluginType } from "./types";
import SelectOptsGen from "/components/selectoptsgen";

interface EditConditionActionProps {
  data?: [Condition, Action, Action?];
  msgFunc: (msg: string) => void;
}

interface EditConditionActionState {
  queryPluginType: QueryPluginType;
  loadedCondition?: Condition;
  actionsList: string[];
  thenActionId: string;
  elseActionId: string;
  originalThenAction: string;
  originalElseAction: string;
}

class EditConditionAction extends Component<
  EditConditionActionProps,
  EditConditionActionState
> {
  constructor(props: EditConditionActionProps) {
    super(props);

    let loadedCondition: Condition | undefined;
    let queryPluginType: QueryPluginType = QueryPluginType.None;
    let thenActionId = "none";
    let elseActionId = "none";

    if (props.data) {
      loadedCondition = props.data[0];
      queryPluginType =
        QueryPluginType[
          props.data[0].query.tag as keyof typeof QueryPluginType
        ];

      thenActionId = "current";
      elseActionId = props.data[2] ? "current" : "none";
    }

    this.state = {
      queryPluginType,
      loadedCondition,
      actionsList: [],
      thenActionId,
      elseActionId,
      originalThenAction: "-",
      originalElseAction: "-",
    };
  }

  componentDidMount() {
    // Populate the then/else action selectors
    invoke("get_actions").then((actsList) => {
      this.setState({
        actionsList: actsList as string[],
      });
    });

    this.loadOriginalThenElseActionDisplay();
  }

  loadOriginalThenElseActionDisplay = () => {
    if (!this.props.data) {
      return;
    }

    // Populate the if action display
    invoke("convert_action_to_string", { action: this.props.data[1] })
      .then((out) => {
        this.setState({
          originalThenAction: out as string,
        });
      })
      .catch((err) => {
        this.props.msgFunc(`Error occurred: ${err.toString()}`);
      });

    // Populate the else action display
    if (this.props.data[2]) {
      invoke("convert_action_to_string", { action: this.props.data[2] })
        .then((out) => {
          this.setState({
            originalElseAction: out as string,
          });
        })
        .catch((err) => {
          this.props.msgFunc(`Error occurred: ${err.toString()}`);
        });
    } else {
      this.setState({
        originalElseAction: "Do nothing",
      });
    }
  };

  conditionRef = createRef<EditOBSCondition | EditVTSCondition>();

  getActionData = async () => {
    if (this.state.queryPluginType === QueryPluginType.None) {
      this.props.msgFunc("Please select a query plugin type");
      return undefined;
    }

    if (this.state.thenActionId === "none") {
      this.props.msgFunc(
        "Please select an action to perform if the condition is true"
      );
      return undefined;
    }

    if (!this.conditionRef.current) {
      return undefined;
    }

    const cond: Condition | undefined =
      await this.conditionRef.current.getConditionData();

    // if undefined here means error message already shown
    if (!cond) {
      return undefined;
    }

    let thenAction: Action | undefined;
    let elseAction: Action | undefined;

    // Get the initial actions if that is what is required
    if (this.props.data) {
      if (this.state.thenActionId === "current") {
        thenAction = this.props.data[1];
      }
      if (this.state.elseActionId === "current") {
        elseAction = this.props.data[2];
      }
    }

    // Try-catch in case the invokes fail
    try {
      // If thenActionId is neither none nor current
      if (thenAction === undefined) {
        thenAction = (await invoke("load_action_details", {
          id: this.state.thenActionId.substring(2),
        })) as Action;
      }

      // If elseActionId is neither none nor current
      if (
        this.state.elseActionId !== "current" &&
        this.state.elseActionId !== "none"
      ) {
        elseAction = (await invoke("load_action_details", {
          id: this.state.elseActionId.substring(2),
        })) as Action;
      }

      return [cond, thenAction, elseAction] as ActionContent;
    } catch (err) {
      if (typeof err === "string") {
        this.props.msgFunc(`Error occurred: ${err}`);
      }
      return undefined;
    }
  };

  showSelectedPluginDetails = () => {
    switch (this.state.queryPluginType) {
      case QueryPluginType.None:
        return <Fragment />;
      case QueryPluginType.OBS:
        return (
          <EditOBSCondition
            ref={this.conditionRef}
            data={this.state.loadedCondition}
            msgFunc={this.props.msgFunc}
          />
        );
      case QueryPluginType.VTS:
        return (
          <EditVTSCondition
            ref={this.conditionRef}
            data={this.state.loadedCondition}
            msgFunc={this.props.msgFunc}
          />
        );
    }
  };

  onQueryPluginTypeChange = (e: Event) => {
    if (!e.target) {
      return;
    }

    this.setState({
      queryPluginType: parseInt(
        (e.target as HTMLInputElement).value,
        10
      ) as QueryPluginType,
      // clear this once the plugin type is changed manually
      // since it means the original loaded data is irrelevant
      loadedCondition: undefined,
    });
  };

  onThenActionChange = (e: Event) => {
    if (!e.target) {
      return;
    }

    this.setState({
      thenActionId: (e.target as HTMLInputElement).value,
    });
  };

  onElseActionChange = (e: Event) => {
    if (!e.target) {
      return;
    }

    this.setState({
      elseActionId: (e.target as HTMLInputElement).value,
    });
  };

  render() {
    return (
      <Fragment>
        <label>
          Query plugin type:
          <select
            value={this.state.queryPluginType}
            onChange={this.onQueryPluginTypeChange}
          >
            <option value={QueryPluginType.None}>Select an option</option>
            <option value={QueryPluginType.OBS}>OBS Studio</option>
            <option value={QueryPluginType.VTS}>VTube Studio</option>
          </select>
        </label>
        <hr />
        {this.showSelectedPluginDetails()}
        <div hidden={this.state.queryPluginType === QueryPluginType.None}>
          <hr />
          <p>Original then action: {this.state.originalThenAction}</p>
          <p>Original else action: {this.state.originalElseAction}</p>
          <label>
            Then:
            <select
              value={this.state.thenActionId}
              onChange={this.onThenActionChange}
            >
              <option value="none">Select an option</option>
              {this.props.data && (
                <option value="current">Keep original action</option>
              )}
              <SelectOptsGen opts={this.state.actionsList} />
            </select>
          </label>
          <br />
          <label>
            Else:
            <select
              value={this.state.elseActionId}
              onChange={this.onElseActionChange}
            >
              <option value="none">Do nothing</option>
              {this.props.data && (
                <option value="current">Keep original action</option>
              )}
              <SelectOptsGen opts={this.state.actionsList} />
            </select>
          </label>
        </div>
      </Fragment>
    );
  }
}

export default EditConditionAction;
