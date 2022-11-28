import { h, Fragment, Component, createRef } from "preact";
import { invoke } from "@tauri-apps/api";

import EditSingleAction from "./singleaction";
import EditConditionAction from "./conditionaction";
import { Action, ActionContent } from "./types";
import SelectOptsGen from "/components/selectoptsgen";
import DraggableListItem from "/components/draggablelistitem";

interface CopyActionState {
  selectedActionId: string;
  actionsList: string[];
}

interface CopyActionProps {
  msgFunc: (msg: string) => void;
}

class CopyAction extends Component<CopyActionProps, CopyActionState> {
  constructor(props: CopyActionProps) {
    super(props);

    this.state = {
      selectedActionId: "none",
      actionsList: [],
    };
  }

  componentDidMount() {
    invoke("get_actions").then((actsList) => {
      this.setState({
        actionsList: actsList as string[],
      });
    });
  }

  getActionData = async () => {
    if (this.state.selectedActionId === "none") {
      this.props.msgFunc("Please select an action to copy");
      return undefined;
    }

    return (await invoke("load_action_details", {
      id: this.state.selectedActionId.substring(2),
    })) as Action;
  };

  onSelectedActionChange = (e: Event) => {
    if (!e.target) {
      return;
    }

    this.setState({
      selectedActionId: (e.target as HTMLInputElement).value,
    });
  };

  render() {
    return (
      <label>
        Action to copy:
        <select
          value={this.state.selectedActionId}
          onChange={this.onSelectedActionChange}
        >
          <option value="none">Select an option</option>
          <SelectOptsGen opts={this.state.actionsList} />
        </select>
      </label>
    );
  }
}

enum NewActionType {
  None,
  Single,
  If,
  Copy,
}

interface EditChainActionProps {
  data?: Action[];
  msgFunc: (msg: string) => void;
}

interface EditChainActionState {
  chain: Action[];
  newActionType: NewActionType;
}

class EditChainAction extends Component<
  EditChainActionProps,
  EditChainActionState
> {
  constructor(props: EditChainActionProps) {
    super(props);

    const chain = this.props.data ?? [];

    this.state = {
      chain,
      newActionType: NewActionType.None,
    };
  }

  moveActionInChain = (draggedIndex: number, targetIndex: number) => {
    if (draggedIndex === targetIndex) {
      return;
    }
    const chain = Array.from(this.state.chain);

    // remove the dragged item and add it to the target position
    const draggedAction = chain.splice(draggedIndex, 1)[0];
    chain.splice(targetIndex, 0, draggedAction);

    this.setState({ chain });
  };

  deleteActionInChain = (index: number) => {
    this.setState({ chain: this.state.chain.filter((elem, i) => index != i) });
  };

  // This is very simple since there is no plugin specific logic to be concerned about here
  getActionData = async () => {
    return this.state.chain as ActionContent;
  };

  /*
   * Adding action to chain related code
   */
  onActionTypeToAddChange = (e: Event) => {
    if (!e.target) {
      return;
    }

    this.setState({
      newActionType: parseInt(
        (e.target as HTMLInputElement).value,
        10
      ) as NewActionType,
    });
  };

  actionRef = createRef<EditSingleAction | EditConditionAction | CopyAction>();

  renderNewActionDetailsEditor = () => {
    switch (this.state.newActionType) {
      case NewActionType.Single:
        return (
          <EditSingleAction
            ref={this.actionRef}
            data={undefined}
            msgFunc={this.props.msgFunc}
          />
        );
      case NewActionType.If:
        return (
          <EditConditionAction
            ref={this.actionRef}
            data={undefined}
            msgFunc={this.props.msgFunc}
          />
        );
      case NewActionType.Copy:
        return <CopyAction ref={this.actionRef} msgFunc={this.props.msgFunc} />;
      default:
        return <Fragment />;
    }
  };

  getNewActionData = async () => {
    if (
      !this.actionRef.current ||
      this.state.newActionType === NewActionType.None
    ) {
      return undefined;
    }

    const content = await this.actionRef.current.getActionData();

    // if undefined here means error message already shown
    if (!content) {
      return undefined;
    }

    // in copy mode the whole action is returned
    if (this.state.newActionType === NewActionType.Copy) {
      return content as Action;
    }

    return {
      tag: NewActionType[this.state.newActionType],
      content: content as ActionContent,
    } as Action;
  };

  addActionToChain = async () => {
    if (this.state.newActionType === NewActionType.None) {
      this.props.msgFunc("Please select an action type");
      return;
    }

    const newActionData = await this.getNewActionData();

    if (!newActionData) {
      return;
    }

    this.setState({ chain: this.state.chain.concat([newActionData]) });
  };

  convertActionToString = async (inp: Action) => {
    try {
      return (await invoke("convert_action_to_string", {
        action: inp,
      })) as string;
    } catch (err) {
      if (typeof err === "string") {
        this.props.msgFunc(`Error occurred: ${err.toString()}`);
      }
      return "";
    }
  };

  render() {
    return (
      <Fragment>
        <ol>
          {this.state.chain.map((act, index) => {
            return (
              <DraggableListItem<Action>
                key={act}
                pos={index}
                data={act}
                dataConverter={this.convertActionToString}
                moveCallback={this.moveActionInChain}
              >
                <button
                  type="button"
                  onClick={() => this.deleteActionInChain(index)}
                >
                  Delete
                </button>
              </DraggableListItem>
            );
          })}
        </ol>
        <hr />
        <label>
          Action type to add to chain:
          <select
            value={this.state.newActionType}
            onChange={this.onActionTypeToAddChange}
          >
            <option value={NewActionType.None}>Select an option</option>
            <option value={NewActionType.Single}>Single</option>
            <option value={NewActionType.If}>Condition</option>
            <option value={NewActionType.Copy}>Copy existing action</option>
          </select>
        </label>
        <button type="button" onClick={this.addActionToChain}>
          Add action to chain
        </button>
        <br />
        {this.renderNewActionDetailsEditor()}
      </Fragment>
    );
  }
}

export default EditChainAction;
