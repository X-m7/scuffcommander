import { h, Fragment, Component, createRef } from "preact";
import { invoke } from "@tauri-apps/api";

import EditOBSCondition from "./obscondition";
import EditVTSCondition from "./vtscondition";
import { Action, ActionContent, IfAction, Condition } from "/types";
import SelectOptsGen from "/components/selectoptsgen";
import ActionDetails from "/components/actiondetails";

enum QueryPluginType {
  None,
  OBS,
  VTS,
}

interface EditConditionActionProps {
  data?: IfAction;
  msgFunc: (msg: string) => void;
}

interface EditConditionActionState {
  queryPluginType: QueryPluginType;
  loadedCondition?: Condition;
  actionsList: string[];
  thenActionId: string;
  elseActionId: string;
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
    };
  }

  componentDidMount() {
    // Populate the then/else action selectors
    invoke("get_actions").then((actsList) => {
      this.setState({
        actionsList: actsList as string[],
      });
    });
  }

  conditionRef = createRef<EditOBSCondition | EditVTSCondition>();

  getActionData = async () => {
    if (this.state.queryPluginType === QueryPluginType.None) {
      this.props.msgFunc("Please select a query plugin type");
      return undefined;
    }

    if (this.state.thenActionId === "none") {
      this.props.msgFunc(
        "Please select an action to perform if the condition is true",
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
    let elseAction: Action | null = null;

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
        10,
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

  render(props: EditConditionActionProps, state: EditConditionActionState) {
    return (
      <Fragment>
        <label>
          Query plugin type:
          <select
            value={state.queryPluginType}
            onChange={this.onQueryPluginTypeChange}
          >
            <option value={QueryPluginType.None}>Select an option</option>
            <option value={QueryPluginType.OBS}>OBS Studio</option>
            <option value={QueryPluginType.VTS}>VTube Studio</option>
          </select>
        </label>
        <hr />
        {this.showSelectedPluginDetails()}
        <div hidden={state.queryPluginType === QueryPluginType.None}>
          <hr />
          {props.data !== undefined && (
            <Fragment>
              <p>Original then action:</p>
              <ActionDetails action={props.data[1]} msgFunc={props.msgFunc} />
              <hr />
              <p>Original else action:</p>
              {props.data[2] !== null ? (
                <ActionDetails action={props.data[2]} msgFunc={props.msgFunc} />
              ) : (
                "Do nothing"
              )}
              <hr />
            </Fragment>
          )}
          <label>
            Then:
            <select
              value={state.thenActionId}
              onChange={this.onThenActionChange}
            >
              <option value="none">Select an option</option>
              {props.data && (
                <option value="current">Keep original action</option>
              )}
              <SelectOptsGen opts={state.actionsList} />
            </select>
          </label>
          <br />
          <label>
            Else:
            <select
              value={state.elseActionId}
              onChange={this.onElseActionChange}
            >
              <option value="none">Do nothing</option>
              {props.data && (
                <option value="current">Keep original action</option>
              )}
              <SelectOptsGen opts={state.actionsList} />
            </select>
          </label>
        </div>
      </Fragment>
    );
  }
}

export default EditConditionAction;
