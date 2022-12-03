import { h, Fragment, Component, createRef } from "preact";

import EditOBSAction from "./obsaction";
import EditVTSAction from "./vtsaction";
import EditGeneralAction from "./generalaction";
import {
  ActionContent,
  SingleAction,
  PluginType,
  PluginAction,
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
  data?: PluginAction;
}

class EditSingleAction extends Component<
  EditSingleActionProps,
  EditSingleActionState
> {
  constructor(props: EditSingleActionProps) {
    super(props);

    let pluginType = PluginType.None;
    let data: PluginAction | undefined;

    if (props.data) {
      pluginType = PluginType[props.data.tag as keyof typeof PluginType];
      data = props.data.content;
    }

    this.state = {
      pluginType,
      data,
    };
  }

  actionRef = createRef<EditGeneralAction | EditOBSAction | EditVTSAction>();

  onPluginTypeChange = (e: Event) => {
    if (e.target) {
      this.setState({
        pluginType: parseInt(
          (e.target as HTMLInputElement).value,
          10
        ) as PluginType,
        // clear this once the plugin type is changed manually
        // since it means the original loaded data is irrelevant
        data: undefined,
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
        if (this.state.data) {
          generalAction = this.state.data as GeneralAction | undefined;
        }
        return (
          <EditGeneralAction
            ref={this.actionRef}
            data={generalAction}
            msgFunc={this.props.msgFunc}
          />
        );
      case PluginType.OBS:
        if (this.state.data) {
          obsAction = this.state.data as OBSAction | undefined;
        }
        return (
          <EditOBSAction
            ref={this.actionRef}
            data={obsAction}
            msgFunc={this.props.msgFunc}
          />
        );
      case PluginType.VTS:
        if (this.state.data) {
          vtsAction = this.state.data as VTSAction | undefined;
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

  getActionData = async () => {
    if (this.state.pluginType === PluginType.None) {
      this.props.msgFunc("Please select a plugin type");
      return undefined;
    }

    if (!this.actionRef.current) {
      return undefined;
    }

    const content = await this.actionRef.current.getActionData();

    // if undefined here means error message already shown
    if (!content) {
      return undefined;
    }

    return {
      tag: PluginType[this.state.pluginType],
      content,
    } as ActionContent;
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
