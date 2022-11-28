import { h, Fragment, Component, ComponentChildren } from "preact";
import { useEffect, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api";

import style from "./style.css";
import { Action } from "./types";

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

interface EditChainActionProps {
  data?: Action[];
  msgFunc: (msg: string) => void;
}

interface EditChainActionState {
  chain: Action[];
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
      </Fragment>
    );
  }
}

export default EditChainAction;
