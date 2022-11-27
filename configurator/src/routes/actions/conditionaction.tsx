import { h, Fragment, Component, createRef } from "preact";

import EditOBSCondition from "./obscondition";
import EditVTSCondition from "./vtscondition";
import { Action, Condition, QueryPluginType } from "./types";

interface EditConditionActionProps {
  data?: [Condition, Action, Action?];
  msgFunc: (msg: string) => void;
}

interface EditConditionActionState {
  queryPluginType: QueryPluginType;
  loadedCondition?: Condition;
}

class EditConditionAction extends Component<
  EditConditionActionProps,
  EditConditionActionState
> {
  constructor(props: EditConditionActionProps) {
    super(props);

    let loadedCondition: Condition | undefined;
    let queryPluginType: QueryPluginType = QueryPluginType.None;

    if (props.data) {
      loadedCondition = props.data[0];
      queryPluginType =
        QueryPluginType[
          props.data[0].query.tag as keyof typeof QueryPluginType
        ];
    }

    this.state = {
      queryPluginType,
      loadedCondition,
    };
  }

  conditionRef = createRef<EditOBSCondition>();

  getActionData = async () => {
    if (this.state.queryPluginType === QueryPluginType.None) {
      this.props.msgFunc("Please select a query plugin type");
      return undefined;
    }

    if (!this.conditionRef.current) {
      return undefined;
    }

    const content = await this.conditionRef.current.getConditionData();

    // if undefined here means error message already shown
    if (!content) {
      return undefined;
    }

    // return [Condition, Action, Action?]
  };

  showSelectedPluginDetails = () => {
    switch (this.state.queryPluginType) {
      case QueryPluginType.None:
        return <Fragment />;
      case QueryPluginType.OBS:
        return (
          <EditOBSCondition
            data={this.state.loadedCondition}
            msgFunc={this.props.msgFunc}
          />
        );
      case QueryPluginType.VTS:
        return (
          <EditVTSCondition
            data={this.state.loadedCondition}
            msgFunc={this.props.msgFunc}
          />
        );
    }
  };

  onQueryPluginTypeChange = (e: Event) => {
    if (e.target) {
      this.setState({
        ...this.state,
        queryPluginType: parseInt(
          (e.target as HTMLInputElement).value,
          10
        ) as QueryPluginType,
        // clear this once the plugin type is changed manually
        // since it means the original loaded data is irrelevant
        loadedCondition: undefined,
      });
    }
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
      </Fragment>
    );
  }
}

export default EditConditionAction;
