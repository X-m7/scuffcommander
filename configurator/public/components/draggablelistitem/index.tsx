import { h, ComponentChildren } from "preact";
import { useState } from "preact/hooks";

import style from "./style.module.css";

/*
 * Generic draggable list element
 */

interface DraggableListItemProps {
  pos: number;
  moveCallback: (start: number, end: number) => void;
  children: ComponentChildren;
}

function DraggableListItem({
  pos,
  moveCallback,
  children,
}: DraggableListItemProps) {
  const [draggedOver, setDraggedOver] = useState<boolean>(false);

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
      {children}
    </li>
  );
}

export default DraggableListItem;
