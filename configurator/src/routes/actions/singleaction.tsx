import { h, Fragment, Component } from "preact";
import { SingleAction, SingleActionTag, PluginType } from "./types";

interface EditSingleActionProps {
  data: SingleAction;
}

interface EditSingleActionState {
  pluginType: PluginType;
}

class EditSingleAction extends Component<
  EditSingleActionProps,
  EditSingleActionState
> {
  constructor(props: EditSingleActionProps) {
    super(props);
    this.state = {
      pluginType: this.getPluginType(props.data.tag as SingleActionTag),
    };
  }

  getPluginType(tag: SingleActionTag) {
    switch (tag) {
      case "General":
        return PluginType.General;
      case "OBS":
        return PluginType.OBS;
      case "VTS":
        return PluginType.VTS;
      default:
        return PluginType.None;
    }
  }

  onPluginTypeChange = (e: Event) => {
    if (e.target) {
      this.setState({
        ...this.state,
        pluginType: parseInt(
          (e.target as HTMLInputElement).value,
          10
        ) as PluginType,
      });
    }
  };

  render() {
    return (
      <Fragment>
        <label>
          Plugin type:
          <select
            value={this.state.pluginType}
            onChange={this.onPluginTypeChange}
          >
            <option value={PluginType.None}>Select an option</option>
            <option value={PluginType.General}>General</option>
            <option value={PluginType.OBS}>OBS Studio</option>
            <option value={PluginType.VTS}>VTube Studio</option>
          </select>
        </label>
      </Fragment>
    );
  }
}

export default EditSingleAction;
