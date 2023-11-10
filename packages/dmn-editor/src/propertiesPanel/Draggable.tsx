import "./Draggable.css";
import * as React from "react";
import { useState, useCallback, useEffect, useContext, useMemo } from "react";
import { Icon } from "@patternfly/react-core/dist/js/components/Icon";
import GripVerticalIcon from "@patternfly/react-icons/dist/js/icons/grip-vertical-icon";

export interface DraggableContext {
  source: number;
  dest: number;
  dragging: boolean;
  origin: number;
  leftOrigin: boolean;
  hovered: boolean;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragEnd: (index: number) => void;
  onDragEnter: (index: number) => void;
  onDragLeave: (index: number) => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onPointerOver: () => void;
}

export const DraggableContext = React.createContext<DraggableContext>({} as any);

export function useDraggableContext() {
  return useContext(DraggableContext);
}

export function DraggableContextProvider({
  children,
  reorder,
  onDragEnd,
}: React.PropsWithChildren<{
  reorder: (source: number, dest: number) => void;
  onDragEnd?: (source: number, dest: number) => void;
}>) {
  const [source, setSource] = useState<number>(-1);
  const [dest, setDest] = useState<number>(-1);
  const [dragging, setDragging] = useState<boolean>(false);
  const [origin, setOrigin] = useState(-1);
  const [leftOrigin, setLeftOrigin] = useState(false);
  const [hover, setHover] = useState(false);

  const hovered = useMemo(() => source === -1 && origin === -1 && hover, [origin, hover, source]);

  const onInternalDragStart = useCallback((index: number) => {
    setDragging(true);
    setSource(index);
    setOrigin(index);
    setLeftOrigin(false);
  }, []);

  const onInternalDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    setDest(index);
  }, []);

  const onInternalDragEnd = useCallback(
    (index: number) => {
      onDragEnd?.(origin, dest);
      setDragging(false);
      setSource(-1);
      setDest(-1);
      setOrigin(-1);
      setLeftOrigin(false);
      setHover(false);
    },
    [dest, onDragEnd, origin]
  );

  const onInternalDragEnter = useCallback(
    (index: number) => {
      if (index === dest && index !== source) {
        reorder(source, dest);
        setSource(dest);
        setDest(source);
      }
    },
    [dest, reorder, source]
  );

  const onInternalDragLeave = useCallback(
    (index: number) => {
      if (!leftOrigin && index !== source) {
        setLeftOrigin(true);
      }
    },
    [leftOrigin, source]
  );

  const onInternalPointerEnter = useCallback(() => {
    setHover(true);
  }, []);

  const onInternalPointerLeave = useCallback(() => {
    setHover(false);
  }, []);

  const onInternalPointerOver = useCallback(() => {
    setHover(true);
  }, []);

  return (
    <DraggableContext.Provider
      value={{
        source,
        dest,
        dragging,
        origin,
        leftOrigin,
        hovered,
        onDragStart: onInternalDragStart,
        onDragOver: onInternalDragOver,
        onDragEnd: onInternalDragEnd,
        onDragEnter: onInternalDragEnter,
        onDragLeave: onInternalDragLeave,
        onPointerEnter: onInternalPointerEnter,
        onPointerLeave: onInternalPointerLeave,
        onPointerOver: onInternalPointerOver,
      }}
    >
      {children}
    </DraggableContext.Provider>
  );
}

export function Draggable(props: {
  index: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  handlerStyle?: React.CSSProperties;
  childrenStyle?: React.CSSProperties;
}) {
  const {
    source,
    dragging,
    leftOrigin,
    hovered,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragEnter,
    onDragLeave,
    onPointerEnter,
    onPointerLeave,
    onPointerOver,
  } = useDraggableContext();
  const [draggable, setDraggable] = useState(false);

  const rowClassName = useMemo(() => {
    let className = "kie-dmn-editor--draggable-row";

    if (hovered) {
      className += " kie-dmn-editor--draggable-row-hovered";
    }

    if (props.index === source && leftOrigin) {
      className += " kie-dmn-editor--draggable-row-is-dragging";
    }

    return className;
  }, [hovered, leftOrigin, props.index, source]);

  return (
    <div
      style={props.style}
      className={rowClassName}
      draggable={dragging || draggable}
      onDragStart={() => onDragStart(props.index)}
      onDragOver={(e) => onDragOver(e, props.index)}
      onDragEnd={() => {
        onDragEnd(props.index);
      }}
      onDragLeave={() => onDragLeave(props.index)}
      onDragEnter={() => onDragEnter(props.index)}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerOver={onPointerOver}
    >
      <Icon
        className={"kie-dmn-editor--draggable-icon"}
        onPointerEnter={() => setDraggable(true)}
        onPointerLeave={() => setDraggable(false)}
        style={props.handlerStyle}
      >
        <GripVerticalIcon
          className={
            hovered ? "kie-dmn-editor--draggable-icon-handler-hovered" : "kie-dmn-editor--draggable-icon-handler"
          }
        />
      </Icon>
      <div className={"kie-dmn-editor--draggable-children"} style={props.childrenStyle}>
        {props.children}
      </div>
    </div>
  );
}
