import { h, Fragment, ComponentChildren } from "preact";
import { useEffect, useState } from "preact/hooks";

import style from "./style.module.css";

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

  const onDragEnd = () => {
    setDraggedOver(false);
  };

  const onDrop = (e: DragEvent) => {
    setDraggedOver(false);

    if (e.dataTransfer === null) {
      return;
    }

    const initialIndexStr = e.dataTransfer.getData("index");

    // sometimes the order of events can get mixed up somehow,
    // if that is the case don't bother with the callback
    if (initialIndexStr.length === 0) {
      return;
    }

    moveCallback(parseInt(initialIndexStr, 10), pos);
  };

  if (dataStr === undefined) {
    return <Fragment />;
  }

  return (
    <li
      class={`${style.draggable} ${draggedOver ? style.draggedOver : ""}`}
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
