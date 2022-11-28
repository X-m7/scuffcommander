import { h, Fragment, Component, ComponentChildren, createRef } from "preact";
import { useEffect, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api";

import style from "./style.css";
import EditSingleAction from "./singleaction";
import EditConditionAction from "./conditionaction";
import { Action, ActionContent } from "./types";

interface ChainElementProps {
  pos: number;
  data: Action;
  msgFunc: (msg: string) => void;
  moveCallback: (start: number, end: number) => void;
  children: ComponentChildren;
}

const ChainElement = ({
  pos,
  data,
  msgFunc,
  moveCallback,
  children,
}: ChainElementProps) => {
  const [actionStr, setActionStr] = useState<string | undefined>(undefined);
  const [dragged, setDragged] = useState<boolean>(false);
  const [draggedOver, setDraggedOver] = useState<boolean>(false);

  useEffect(() => {
    invoke("convert_action_to_string", { action: data })
      .then((inp) => {
        setActionStr(inp as string);
      })
      .catch((err) => {
        msgFunc(`Error occurred: ${err.toString()}`);
      });
  }, [data, msgFunc]);

  const onDragStart = (e: DragEvent) => {
    if (e.dataTransfer === null) {
      return;
    }
    e.dataTransfer.setData("index", pos.toString());
    setDragged(true);
  };

  const onDragOver = (e: DragEvent) => {
    // default is to disable drop so stop that
    e.preventDefault();
  };

  const onDragEnter = () => {
    setDraggedOver(true);
  };

  const onDragLeave = () => {
    setDraggedOver(false);
  };

  /*
   * onDragEnd and onDrop both signal that the drag and drop is done,
   * so reset both drag attributes in both functions
   */
  const onDragEnd = () => {
    setDragged(false);
    setDraggedOver(false);
  };

  const onDrop = (e: DragEvent) => {
    if (e.dataTransfer === null) {
      return;
    }
    moveCallback(parseInt(e.dataTransfer.getData("index"), 10), pos);

    setDragged(false);
    setDraggedOver(false);
  };

  if (actionStr === undefined) {
    return <Fragment />;
  }

  return (
    <li
      class={`${dragged ? style.dragged : ""} ${
        draggedOver ? style.draggedOver : ""
      }`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {actionStr}
      {children}
    </li>
  );
};

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

  actionRef = createRef<EditSingleAction | EditConditionAction>();

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
        return <p>Copy</p>;
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

    return {
      tag: NewActionType[this.state.newActionType],
      content,
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

  render() {
    return (
      <Fragment>
        <ol>
          {this.state.chain.map((act, index) => {
            return (
              <ChainElement
                key={act}
                pos={index}
                data={act}
                msgFunc={this.props.msgFunc}
                moveCallback={this.moveActionInChain}
              >
                <button
                  type="button"
                  onClick={() => this.deleteActionInChain(index)}
                >
                  Delete
                </button>
              </ChainElement>
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
