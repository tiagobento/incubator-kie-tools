/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {
  BPMN20__tDataObject,
  BPMN20__tProcess,
  BPMN20__tTextAnnotation,
  BPMNDI__BPMNShape,
} from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import * as React from "react";
import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import * as RF from "reactflow";
import { Normalized } from "../../normalization/normalize";
import { SnapGrid } from "../../store/Store";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../../store/StoreContext";
import { NODE_LAYERS } from "../../store/computed/computeDiagramData";
import { Unpacked } from "../../tsExt/tsExt";
import { snapShapeDimensions } from "../SnapGrid";
import { PositionalNodeHandles } from "../connections/PositionalNodeHandles";
import { NodeType, containment, outgoingStructure } from "../connections/graphStructure";
import { EDGE_TYPES } from "../edges/EdgeTypes";
import { propsHaveSameValuesDeep } from "../memoization/memoization";
import { useIsHovered } from "../useIsHovered";
import { MIN_NODE_SIZES } from "./DefaultSizes";
import { EditableNodeLabel, OnEditableNodeLabelChange, useEditableNodeLabel } from "./EditableNodeLabel";
import { InfoNodePanel } from "./InfoNodePanel";
import { getNodeLabelPosition, useNodeStyle } from "./NodeStyle";
import { DataObjectNodeSvg, TextAnnotationNodeSvg, UnknownNodeSvg } from "./NodeSvgs";
import { NODE_TYPES } from "./NodeTypes";
import { OutgoingStuffNodePanel } from "./OutgoingStuffNodePanel";

export type ElementFilter<E extends { __$$element: string }, Filter extends string> = E extends any
  ? E["__$$element"] extends Filter
    ? E
    : never
  : never;

export type NodeBpmnObjects = null | Unpacked<
  Normalized<BPMN20__tProcess["flowElement"] | BPMN20__tProcess["artifact"]>
>;

export type BpmnDiagramNodeData<T extends NodeBpmnObjects = NodeBpmnObjects> = {
  bpmnObject: T;
  shape: Normalized<BPMNDI__BPMNShape> & { index: number };
  index: number;
  /**
   * We don't use Reactflow's parenting mechanism because it is
   * too opinionated on how it deletes nodes/edges that are
   * inside/connected to nodes with parents
   * */
  parentRfNode: RF.Node<BpmnDiagramNodeData> | undefined;
};

export const DataObjectNode = React.memo(
  ({
    data: { bpmnObject: dataObject, shape, index },
    selected,
    dragging,
    zIndex,
    type,
    id,
  }: RF.NodeProps<BpmnDiagramNodeData<Normalized<BPMN20__tDataObject> & { __$$element: "dataObject" }>>) => {
    const renderCount = useRef<number>(0);
    renderCount.current++;

    const ref = useRef<HTMLDivElement>(null);

    const snapGrid = useBpmnEditorStore((s) => s.diagram.snapGrid);
    const enableCustomNodeStyles = useBpmnEditorStore((s) => s.diagram.overlays.enableCustomNodeStyles);
    const isHovered = useIsHovered(ref);
    const isResizing = useNodeResizing(id);
    const shouldActLikeHovered = useBpmnEditorStore(
      (s) => (isHovered || isResizing) && s.diagram.draggingNodes.length === 0
    );

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(id);
    useHoveredNodeAlwaysOnTop(ref, zIndex, shouldActLikeHovered, dragging, selected, isEditingLabel);

    const bpmnEditorStoreApi = useBpmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(isValidConnectionTarget, id);
    const nodeDimensions = useNodeDimensions({ snapGrid, shape, nodeType: type as NodeType });

    const setName = useCallback<OnEditableNodeLabelChange>(
      (newName: string) => {
        bpmnEditorStoreApi.setState((state) => {
          // FIXME: Tiago: Mutation
          // renameProcessFlowElement({
        });
      },
      [bpmnEditorStoreApi, index]
    );

    const { fontCssProperties } = useNodeStyle({
      nodeType: type as NodeType,
      isEnabled: enableCustomNodeStyles,
    });

    const [alternativeEditableNodeHeight, setAlternativeEditableNodeHeight] = React.useState<number>(0);
    const alternativeSvgStyle = useMemo(() => {
      // This is used to modify a css from a :before element.
      // The --height is a css var which is used by the kie-bpmn-editor--selected-data-object-node class.
      return {
        display: "flex",
        flexDirection: "column",
        outline: "none",
        "--selected-data-object-node-shape--height": `${
          nodeDimensions.height + 20 + (isEditingLabel ? 20 : alternativeEditableNodeHeight ?? 0)
        }px`,
      } as any;
      // The dependecy should be "nodeDimension" to trigger an adjustment on width changes as well.
    }, [nodeDimensions, isEditingLabel, alternativeEditableNodeHeight]);

    return (
      <>
        <svg className={`kie-bpmn-editor--node-shape ${className} alternative ${selected ? "selected" : ""}`}>
          <DataObjectNodeSvg {...nodeDimensions} x={0} y={0} isIcon={false} />
        </svg>
        <PositionalNodeHandles isTargeted={isTargeted && isValidConnectionTarget} nodeId={id} />
        <div
          onDoubleClick={triggerEditing}
          onKeyDown={triggerEditingIfEnter}
          style={alternativeSvgStyle}
          className={`kie-bpmn-editor--data-object-node ${className} kie-bpmn-editor--selected-data-object-node`}
          ref={ref}
          tabIndex={-1}
          data-nodehref={id}
          data-nodelabel={dataObject["@_name"]}
        >
          {/* {`render count: ${renderCount.current}`}
          <br /> */}
          <div className={"kie-bpmn-editor--node"}>
            <InfoNodePanel isVisible={!isTargeted && shouldActLikeHovered} />

            <OutgoingStuffNodePanel
              nodeHref={id}
              isVisible={!isTargeted && shouldActLikeHovered}
              nodeTypes={outgoingStructure[NODE_TYPES.dataObject].nodes}
              edgeTypes={outgoingStructure[NODE_TYPES.dataObject].edges}
            />

            {shouldActLikeHovered && (
              <NodeResizerHandle
                nodeType={type as typeof NODE_TYPES.dataObject}
                snapGrid={snapGrid}
                nodeId={id}
                nodeShapeIndex={shape.index}
              />
            )}
          </div>
          {/* Creates a div element with the node size to push down the <EditableNodeLabel /> */}
          {<div style={{ height: nodeDimensions.height, flexShrink: 0 }} />}
          {<div>{dataObject["@_name"]}</div>}
        </div>
      </>
    );
  },
  propsHaveSameValuesDeep
);

export const TextAnnotationNode = React.memo(
  ({
    data: { bpmnObject: textAnnotation, shape, index },
    selected,
    dragging,
    zIndex,
    type,
    id,
  }: RF.NodeProps<BpmnDiagramNodeData<Normalized<BPMN20__tTextAnnotation> & { __$$element: "textAnnotation" }>>) => {
    const renderCount = useRef<number>(0);
    renderCount.current++;

    const ref = useRef<HTMLDivElement>(null);

    const snapGrid = useBpmnEditorStore((s) => s.diagram.snapGrid);
    const enableCustomNodeStyles = useBpmnEditorStore((s) => s.diagram.overlays.enableCustomNodeStyles);
    const isHovered = useIsHovered(ref);
    const isResizing = useNodeResizing(id);
    const shouldActLikeHovered = useBpmnEditorStore(
      (s) => (isHovered || isResizing) && s.diagram.draggingNodes.length === 0
    );

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(id);
    useHoveredNodeAlwaysOnTop(ref, zIndex, shouldActLikeHovered, dragging, selected, isEditingLabel);

    const bpmnEditorStoreApi = useBpmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(isValidConnectionTarget, id);
    const nodeDimensions = useNodeDimensions({
      nodeType: type as typeof NODE_TYPES.textAnnotation,
      snapGrid,
      shape,
    });
    const setText = useCallback(
      (newText: string) => {
        bpmnEditorStoreApi.setState((state) => {
          // FIXME: Tiago: Mutation
          // updateTextAnnotation({ definitions: state.bpmn.model.definitions, newText, index });
        });
      },
      [bpmnEditorStoreApi, index]
    );

    const { fontCssProperties } = useNodeStyle({
      nodeType: type as NodeType,
      isEnabled: enableCustomNodeStyles,
    });

    return (
      <>
        <svg className={`kie-bpmn-editor--node-shape ${className}`}>
          <TextAnnotationNodeSvg {...nodeDimensions} x={0} y={0} />
        </svg>

        <PositionalNodeHandles isTargeted={isTargeted && isValidConnectionTarget} nodeId={id} />

        <div
          ref={ref}
          className={`kie-bpmn-editor--node kie-bpmn-editor--text-annotation-node ${className}`}
          tabIndex={-1}
          onDoubleClick={triggerEditing}
          onKeyDown={triggerEditingIfEnter}
          data-nodehref={id}
          data-nodelabel={textAnnotation.text as string} // FIXME: Tiago: XML
        >
          {/* {`render count: ${renderCount.current}`}
          <br /> */}
          <InfoNodePanel isVisible={!isTargeted && shouldActLikeHovered} />
          <OutgoingStuffNodePanel
            nodeHref={id}
            isVisible={!isTargeted && shouldActLikeHovered}
            nodeTypes={outgoingStructure[NODE_TYPES.textAnnotation].nodes}
            edgeTypes={outgoingStructure[NODE_TYPES.textAnnotation].edges}
          />
          <div>{textAnnotation.text /* FIXME: Tiago: XML*/}</div>
          {shouldActLikeHovered && (
            <NodeResizerHandle
              nodeType={type as typeof NODE_TYPES.textAnnotation}
              snapGrid={snapGrid}
              nodeId={id}
              nodeShapeIndex={shape.index}
            />
          )}
        </div>
      </>
    );
  },
  propsHaveSameValuesDeep
);

export const UnknownNode = React.memo(
  ({ data: { shape }, selected, dragging, zIndex, type, id }: RF.NodeProps<BpmnDiagramNodeData<null>>) => {
    const renderCount = useRef<number>(0);
    renderCount.current++;

    const ref = useRef<HTMLDivElement>(null);

    const snapGrid = useBpmnEditorStore((s) => s.diagram.snapGrid);
    const isHovered = useIsHovered(ref);
    const isResizing = useNodeResizing(id);
    const shouldActLikeHovered = useBpmnEditorStore(
      (s) => (isHovered || isResizing) && s.diagram.draggingNodes.length === 0
    );

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(isValidConnectionTarget, id);
    const nodeDimensions = useNodeDimensions({
      nodeType: type as typeof NODE_TYPES.unknown,
      snapGrid,
      shape,
    });

    return (
      <>
        <svg className={`kie-bpmn-editor--node-shape ${className}`}>
          <UnknownNodeSvg {...nodeDimensions} x={0} y={0} />
        </svg>

        <RF.Handle key={"unknown"} id={"unknown"} type={"source"} style={{ opacity: 0 }} position={RF.Position.Top} />

        <div
          ref={ref}
          className={`kie-bpmn-editor--node kie-bpmn-editor--unknown-node ${className}`}
          tabIndex={-1}
          data-nodehref={id}
        >
          {/* {`render count: ${renderCount.current}`}
          <br /> */}
          <InfoNodePanel isVisible={!isTargeted && shouldActLikeHovered} />

          <EditableNodeLabel
            id={id}
            name={undefined}
            position={getNodeLabelPosition({ nodeType: type as typeof NODE_TYPES.unknown })}
            isEditing={false}
            setEditing={() => {}}
            value={`? `}
            onChange={() => {}}
            skipValidation={false}
            onGetAllUniqueNames={useCallback(() => new Map(), [])}
            shouldCommitOnBlur={true}
          />
          {selected && !dragging && (
            <NodeResizerHandle
              nodeType={type as typeof NODE_TYPES.unknown}
              snapGrid={snapGrid}
              nodeId={id}
              nodeShapeIndex={shape.index}
            />
          )}
        </div>
      </>
    );
  },
  propsHaveSameValuesDeep
);

///

export function EmptyLabel() {
  return (
    <span style={{ fontFamily: "serif" }}>
      <i style={{ opacity: 0.8 }}>{`<Empty>`}</i>
      <br />
      <i style={{ opacity: 0.5, fontSize: "0.8em", lineHeight: "0.8em" }}>{`Double-click to name`}</i>
    </span>
  );
}

const resizerControlStyle = {
  background: "transparent",
  border: "none",
};

type NodeResizeHandleProps = {
  snapGrid: SnapGrid;
  nodeId: string;
  nodeShapeIndex: number;
  nodeType: NodeType;
};

export function NodeResizerHandle(props: NodeResizeHandleProps) {
  const minSize = MIN_NODE_SIZES[props.nodeType]({ snapGrid: props.snapGrid });
  return (
    <RF.NodeResizeControl style={resizerControlStyle} minWidth={minSize["@_width"]} minHeight={minSize["@_height"]}>
      <div
        data-testid={`kie-tools--bpmn-editor--${props.nodeId}-resize-handle`}
        style={{
          position: "absolute",
          top: "-10px",
          left: "-10px",
          width: "12px",
          height: "12px",
          backgroundColor: "black",
          clipPath: "polygon(0 100%, 100% 100%, 100% 0)",
        }}
      />
    </RF.NodeResizeControl>
  );
}

function useNodeResizing(id: string): boolean {
  return RF.useStore((s) => s.nodeInternals.get(id)?.resizing ?? false);
}

type NodeDimensionsArgs = {
  snapGrid: SnapGrid;
  shape: Normalized<BPMNDI__BPMNShape>;
  nodeType: NodeType;
};

function useNodeDimensions(args: NodeDimensionsArgs): RF.Dimensions {
  const { nodeType, snapGrid, shape } = args;

  return useMemo(() => {
    const minSizes = MIN_NODE_SIZES[nodeType]({
      snapGrid,
    });

    return {
      width: snapShapeDimensions(snapGrid, shape, minSizes).width,
      height: snapShapeDimensions(snapGrid, shape, minSizes).height,
    };
  }, [shape, snapGrid, nodeType]);
}

function useHoveredNodeAlwaysOnTop(
  ref: React.RefObject<HTMLDivElement | SVGElement>,
  zIndex: number,
  shouldActLikeHovered: boolean,
  dragging: boolean,
  selected: boolean,
  isEditing: boolean
) {
  useLayoutEffect(() => {
    const r = ref.current;

    if (selected && !isEditing) {
      r?.focus();
    }

    if (r) {
      r.parentElement!.style.zIndex = `${
        shouldActLikeHovered || dragging ? zIndex + NODE_LAYERS.NESTED_NODES + 1 : zIndex
      }`;
    }
  }, [dragging, shouldActLikeHovered, ref, zIndex, selected, isEditing]);
}

export function useConnection(nodeId: string) {
  const connectionNodeId = RF.useStore((s) => s.connectionNodeId);
  const connectionHandleType = RF.useStore((s) => s.connectionHandleType);

  const source = connectionNodeId;
  const target = nodeId;

  const edgeIdBeingUpdated = useBpmnEditorStore((s) => s.diagram.edgeIdBeingUpdated);
  const sourceHandle = RF.useStore(
    (s) => s.connectionHandleId ?? s.edges.find((e) => e.id === edgeIdBeingUpdated)?.type ?? null
  );

  const connection = useMemo(
    () => ({
      source: connectionHandleType === "source" ? source : target,
      target: connectionHandleType === "source" ? target : source,
      sourceHandle,
      targetHandle: null, // We don't use targetHandles, as target handles are only different in position, not in semantic.
    }),
    [connectionHandleType, source, sourceHandle, target]
  );

  return connection;
}

export function useConnectionTargetStatus(nodeId: string, shouldActLikeHovered: boolean) {
  const isTargeted = RF.useStore((s) => !!s.connectionNodeId && s.connectionNodeId !== nodeId && shouldActLikeHovered);
  const connection = useConnection(nodeId);
  const isValidConnectionTarget = RF.useStore((s) => s.isValidConnection?.(connection) ?? false);

  return useMemo(
    () => ({
      isTargeted,
      isValidConnectionTarget,
    }),
    [isTargeted, isValidConnectionTarget]
  );
}

export function useNodeClassName(isValidConnectionTarget: boolean, nodeId: string) {
  const isDropTarget = useBpmnEditorStore(
    (s) => s.diagram.dropTargetNode?.id === nodeId && containment.get(s.diagram.dropTargetNode?.type as NodeType)
  );
  const isDropTargetNodeValidForSelection = useBpmnEditorStore((s) =>
    s.computed(s).isDropTargetNodeValidForSelection()
  );
  const isConnectionNodeId = RF.useStore((s) => s.connectionNodeId === nodeId);
  const connection = useConnection(nodeId);
  const isEdgeConnection = !!Object.values(EDGE_TYPES).find((s) => s === connection.sourceHandle);
  const isNodeConnection = !!Object.values(NODE_TYPES).find((s) => s === connection.sourceHandle);

  if (isNodeConnection && !isConnectionNodeId) {
    return "dimmed";
  }

  if (isEdgeConnection && (!isValidConnectionTarget || isConnectionNodeId)) {
    return "dimmed";
  }

  if (isDropTarget) {
    return isDropTargetNodeValidForSelection ? "drop-target" : "drop-target-invalid";
  }

  return "normal";
}
