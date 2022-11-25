import { h, Fragment, Component } from "preact";

import EditOBSAction from "./obsaction";
import { SingleAction, PluginType, OBSAction } from "./types";

interface EditSingleActionProps {
  data?: SingleAction;
  msgFunc: (msg: string) => void;
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

    let pluginType = PluginType.None;
    if (props.data) {
      pluginType = PluginType[props.data.tag as keyof typeof PluginType];
    }

    this.state = {
      pluginType,
    };
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

  showSelectedPluginDetails = () => {
    let obsAction: OBSAction | undefined;

    switch (this.state.pluginType) {
      case PluginType.None:
        return <Fragment />;
      case PluginType.General:
        return <p>General</p>;
      case PluginType.OBS:
        if (this.props.data) {
          obsAction = this.props.data.content as OBSAction | undefined;
        }

        return <EditOBSAction data={obsAction} msgFunc={this.props.msgFunc} />;
      case PluginType.VTS:
        return <p>VTS</p>;
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
        <hr />
        {this.showSelectedPluginDetails()}
      </Fragment>
    );
  }
}

export default EditSingleAction;
