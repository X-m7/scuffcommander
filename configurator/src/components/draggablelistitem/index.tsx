import { h, Fragment, ComponentChildren } from "preact";
import { useEffect, useState } from "preact/hooks";

import style from "./style.css";

/*
 * Generic draggable list element, where the given data will be converted to a string
 * in an async manner (so the outer element does not have to do it for all items manually)
 */

interface DraggableListItemProps<T> {
  pos: number;
  data: T;
  dataConverter: (inp: T) => Promise<string>;
  moveCallback: (start: number, end: number) => void;
  children: ComponentChildren;
}

function DraggableListItem<T>({
  pos,
  data,
  dataConverter,
  moveCallback,
  children,
}: DraggableListItemProps<T>) {
  const [dataStr, setDataStr] = useState<string | undefined>(undefined);
  const [dragged, setDragged] = useState<boolean>(false);
  const [draggedOver, setDraggedOver] = useState<boolean>(false);

  useEffect(() => {
    dataConverter(data).then((inp) => {
      setDataStr(inp);
    });
  }, [data, dataConverter]);

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

  if (dataStr === undefined) {
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
      {dataStr}
      {children}
    </li>
  );
}

export default DraggableListItem;
