import { h, Fragment, Component, createRef } from "preact";

import EditOBSAction from "./obsaction";
import EditVTSAction from "./vtsaction";
import EditGeneralAction from "./generalaction";
import {
  SingleAction,
  PluginType,
  OBSAction,
  VTSAction,
  GeneralAction,
} from "./types";

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

  actionRef = createRef<EditGeneralAction | EditOBSAction | EditVTSAction>();

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
    let vtsAction: VTSAction | undefined;
    let generalAction: GeneralAction | undefined;

    switch (this.state.pluginType) {
      case PluginType.None:
        return <Fragment />;
      case PluginType.General:
        if (this.props.data) {
          generalAction = this.props.data.content as GeneralAction | undefined;
        }
        return (
          <EditGeneralAction
            ref={this.actionRef}
            data={generalAction}
            msgFunc={this.props.msgFunc}
          />
        );
      case PluginType.OBS:
        if (this.props.data) {
          obsAction = this.props.data.content as OBSAction | undefined;
        }
        return (
          <EditOBSAction
            ref={this.actionRef}
            data={obsAction}
            msgFunc={this.props.msgFunc}
          />
        );
      case PluginType.VTS:
        if (this.props.data) {
          vtsAction = this.props.data.content as VTSAction | undefined;
        }
        return (
          <EditVTSAction
            ref={this.actionRef}
            data={vtsAction}
            msgFunc={this.props.msgFunc}
          />
        );
    }
  };

  getActionData = () => {
    if (this.state.pluginType === PluginType.None) {
      this.props.msgFunc("Please select a plugin type");
      return undefined;
    }

    if (!this.actionRef.current) {
      console.log("Component reference not ready");
      return undefined;
    }

    const content = this.actionRef.current.getActionData();

    // if undefined here means error message already shown
    if (!content) {
      return undefined;
    }

    return {
      tag: PluginType[this.state.pluginType],
      content,
    } as SingleAction;
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
