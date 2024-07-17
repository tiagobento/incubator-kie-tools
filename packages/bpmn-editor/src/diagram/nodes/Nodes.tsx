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
  BPMN20__tComplexGateway,
  BPMN20__tDataObject,
  BPMN20__tEndEvent,
  BPMN20__tEventBasedGateway,
  BPMN20__tExclusiveGateway,
  BPMN20__tGateway,
  BPMN20__tGroup,
  BPMN20__tInclusiveGateway,
  BPMN20__tIntermediateCatchEvent,
  BPMN20__tIntermediateThrowEvent,
  BPMN20__tParallelGateway,
  BPMN20__tProcess,
  BPMN20__tStartEvent,
  BPMN20__tSubProcess,
  BPMN20__tTask,
  BPMN20__tTextAnnotation,
  BPMNDI__BPMNShape,
} from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import * as RF from "reactflow";
import { Normalized } from "../../normalization/normalize";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../../store/StoreContext";
import { BpmnNodeType, bpmnGraphOutgoingStructure, bpmnNodesContainmentMap } from "../BpmnGraphStructure";
import { EDGE_TYPES } from "../edges/EdgeTypes";
import { MIN_NODE_SIZES } from "./DefaultSizes";
import { getNodeLabelPosition, useNodeStyle } from "./NodeStyle";
import {
  DataObjectNodeSvg,
  EndEventNodeSvg,
  GatewayNodeSvg,
  GroupNodeSvg,
  IntermediateCatchEventNodeSvg,
  IntermediateThrowEventNodeSvg,
  StartEventNodeSvg,
  SubProcessNodeSvg,
  TaskNodeSvg,
  TextAnnotationNodeSvg,
  UnknownNodeSvg,
} from "./NodeSvgs";
import { NODE_TYPES } from "./NodeTypes";

import { propsHaveSameValuesDeep } from "@kie-tools/reactflow-editors-base/dist/memoization/memoization";
import {
  EditableNodeLabel,
  OnEditableNodeLabelChange,
  useEditableNodeLabel,
} from "@kie-tools/reactflow-editors-base/dist/nodes/EditableNodeLabel";
import {
  NodeResizerHandle,
  useConnectionTargetStatus,
  useHoveredNodeAlwaysOnTop,
  useNodeClassName,
  useNodeDimensions,
  useNodeResizing,
} from "@kie-tools/reactflow-editors-base/dist/nodes/Hooks";
import { InfoNodePanel } from "@kie-tools/reactflow-editors-base/dist/nodes/InfoNodePanel";
import { OutgoingStuffNodePanel } from "@kie-tools/reactflow-editors-base/dist/nodes/OutgoingStuffNodePanel";
import { PositionalNodeHandles } from "@kie-tools/reactflow-editors-base/dist/nodes/PositionalNodeHandles";
import { useIsHovered } from "@kie-tools/reactflow-editors-base/dist/reactExt/useIsHovered";
import { Unpacked } from "@kie-tools/reactflow-editors-base/dist/tsExt/tsExt";
import { getContainmentRelationship } from "@kie-tools/reactflow-editors-base/dist/maths/DcMaths";
import { BpmnDiagramEdgeData } from "../edges/Edges";

export type NodeBpmnObjects = null | Unpacked<
  Normalized<BPMN20__tProcess["flowElement"] | BPMN20__tProcess["artifact"]>
>;

export type BpmnDiagramNodeData<T extends NodeBpmnObjects = NodeBpmnObjects> = {
  bpmnObject: T;
  shape: Normalized<BPMNDI__BPMNShape>;
  shapeIndex: number;
  index: number;
  /**
   * We don't use Reactflow's parenting mechanism because it is
   * too opinionated on how it deletes nodes/edges that are
   * inside/connected to nodes with parents
   * */
  parentRfNode: RF.Node<BpmnDiagramNodeData> | undefined;
};

export const StartEventNode = React.memo(
  ({
    data: { bpmnObject: startEvent, shape, index, shapeIndex },
    selected,
    dragging,
    zIndex,
    type,
    id,
  }: RF.NodeProps<BpmnDiagramNodeData<Normalized<BPMN20__tStartEvent> & { __$$element: "startEvent" }>>) => {
    const renderCount = useRef<number>(0);
    renderCount.current++;

    const ref = useRef<HTMLDivElement>(null);

    const enableCustomNodeStyles = useBpmnEditorStore((s) => s.diagram.overlays.enableCustomNodeStyles);
    const isHovered = useIsHovered(ref);
    const isResizing = useNodeResizing(id);
    const shouldActLikeHovered = useBpmnEditorStore(
      (s) => (isHovered || isResizing) && s.reactflowKieEditorDiagram.draggingNodes.length === 0
    );

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(id);
    useHoveredNodeAlwaysOnTop(ref, zIndex, shouldActLikeHovered, dragging, selected, isEditingLabel);

    const bpmnEditorStoreApi = useBpmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(bpmnNodesContainmentMap, isValidConnectionTarget, id, NODE_TYPES, EDGE_TYPES);
    const nodeDimensions = useNodeDimensions({ shape, nodeType: type as BpmnNodeType, MIN_NODE_SIZES });

    const setName = useCallback<OnEditableNodeLabelChange>(
      (newName: string) => {
        bpmnEditorStoreApi.setState((state) => {
          // FIXME: Tiago: Mutation
          // renameProcessFlowElement({
        });
      },
      [bpmnEditorStoreApi]
    );

    const { fontCssProperties } = useNodeStyle({
      nodeType: type as BpmnNodeType,
      isEnabled: enableCustomNodeStyles,
    });

    return (
      <>
        <svg className={`kie-bpmn-editor--node-shape ${className} ${selected ? "selected" : ""}`}>
          <StartEventNodeSvg {...nodeDimensions} x={0} y={0} />
        </svg>
        <PositionalNodeHandles isTargeted={isTargeted && isValidConnectionTarget} nodeId={id} />
        <div
          onDoubleClick={triggerEditing}
          onKeyDown={triggerEditingIfEnter}
          className={`kie-bpmn-editor--task-node ${className} kie-bpmn-editor--selected-task-node`}
          ref={ref}
          tabIndex={-1}
          data-nodehref={id}
          data-nodelabel={startEvent["@_name"]}
        >
          {/* {`render count: ${renderCount.current}`}
          <br /> */}
          <div className={"kie-bpmn-editor--node"}>
            <InfoNodePanel
              isVisible={!isTargeted && shouldActLikeHovered}
              onClick={useCallback(() => {
                bpmnEditorStoreApi.setState((state) => {
                  state.diagram.propertiesPanel.isOpen = true;
                });
              }, [bpmnEditorStoreApi])}
            />

            <OutgoingStuffNodePanel
              nodeHref={id}
              isVisible={!isTargeted && shouldActLikeHovered}
              nodeTypes={bpmnGraphOutgoingStructure[NODE_TYPES.startEvent].nodes}
              edgeTypes={bpmnGraphOutgoingStructure[NODE_TYPES.startEvent].edges}
            />
          </div>
          {/* Creates a div element with the node size to push down the <EditableNodeLabel /> */}
          {<div style={{ height: nodeDimensions.height, flexShrink: 0 }} />}
          {<div>{startEvent["@_name"]}</div>}
        </div>
      </>
    );
  },
  propsHaveSameValuesDeep
);

export const IntermediateCatchEventNode = React.memo(
  ({
    data: { bpmnObject: intermediateCatchEvent, shape, index, shapeIndex },
    selected,
    dragging,
    zIndex,
    type,
    id,
  }: RF.NodeProps<
    BpmnDiagramNodeData<Normalized<BPMN20__tIntermediateCatchEvent> & { __$$element: "intermediateCatchEvent" }>
  >) => {
    const renderCount = useRef<number>(0);
    renderCount.current++;

    const ref = useRef<HTMLDivElement>(null);

    const enableCustomNodeStyles = useBpmnEditorStore((s) => s.diagram.overlays.enableCustomNodeStyles);
    const isHovered = useIsHovered(ref);
    const isResizing = useNodeResizing(id);
    const shouldActLikeHovered = useBpmnEditorStore(
      (s) => (isHovered || isResizing) && s.reactflowKieEditorDiagram.draggingNodes.length === 0
    );

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(id);
    useHoveredNodeAlwaysOnTop(ref, zIndex, shouldActLikeHovered, dragging, selected, isEditingLabel);

    const bpmnEditorStoreApi = useBpmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(bpmnNodesContainmentMap, isValidConnectionTarget, id, NODE_TYPES, EDGE_TYPES);
    const nodeDimensions = useNodeDimensions({ shape, nodeType: type as BpmnNodeType, MIN_NODE_SIZES });

    const setName = useCallback<OnEditableNodeLabelChange>(
      (newName: string) => {
        bpmnEditorStoreApi.setState((state) => {
          // FIXME: Tiago: Mutation
          // renameProcessFlowElement({
        });
      },
      [bpmnEditorStoreApi]
    );

    const { fontCssProperties } = useNodeStyle({
      nodeType: type as BpmnNodeType,
      isEnabled: enableCustomNodeStyles,
    });

    return (
      <>
        <svg className={`kie-bpmn-editor--node-shape ${className} ${selected ? "selected" : ""}`}>
          <IntermediateCatchEventNodeSvg {...nodeDimensions} x={0} y={0} />
        </svg>
        <PositionalNodeHandles isTargeted={isTargeted && isValidConnectionTarget} nodeId={id} />
        <div
          onDoubleClick={triggerEditing}
          onKeyDown={triggerEditingIfEnter}
          className={`kie-bpmn-editor--intermediate-catch-event-node ${className} kie-bpmn-editor--selected-intermediate-catch-event-node`}
          ref={ref}
          tabIndex={-1}
          data-nodehref={id}
          data-nodelabel={id}
        >
          {/* {`render count: ${renderCount.current}`}
          <br /> */}
          <div className={"kie-bpmn-editor--node"}>
            <InfoNodePanel
              isVisible={!isTargeted && shouldActLikeHovered}
              onClick={useCallback(() => {
                bpmnEditorStoreApi.setState((state) => {
                  state.diagram.propertiesPanel.isOpen = true;
                });
              }, [bpmnEditorStoreApi])}
            />

            <OutgoingStuffNodePanel
              nodeHref={id}
              isVisible={!isTargeted && shouldActLikeHovered}
              nodeTypes={bpmnGraphOutgoingStructure[NODE_TYPES.intermediateCatchEvent].nodes}
              edgeTypes={bpmnGraphOutgoingStructure[NODE_TYPES.intermediateCatchEvent].edges}
            />
          </div>
          {/* Creates a div element with the node size to push down the <EditableNodeLabel /> */}
          {<div style={{ height: nodeDimensions.height, flexShrink: 0 }} />}
          {<div>{""}</div>}
        </div>
      </>
    );
  },
  propsHaveSameValuesDeep
);

export const IntermediateThrowEventNode = React.memo(
  ({
    data: { bpmnObject: intermediateThrowEvent, shape, index, shapeIndex },
    selected,
    dragging,
    zIndex,
    type,
    id,
  }: RF.NodeProps<
    BpmnDiagramNodeData<Normalized<BPMN20__tIntermediateThrowEvent> & { __$$element: "intermediateThrowEvent" }>
  >) => {
    const renderCount = useRef<number>(0);
    renderCount.current++;

    const ref = useRef<HTMLDivElement>(null);

    const enableCustomNodeStyles = useBpmnEditorStore((s) => s.diagram.overlays.enableCustomNodeStyles);
    const isHovered = useIsHovered(ref);
    const isResizing = useNodeResizing(id);
    const shouldActLikeHovered = useBpmnEditorStore(
      (s) => (isHovered || isResizing) && s.reactflowKieEditorDiagram.draggingNodes.length === 0
    );

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(id);
    useHoveredNodeAlwaysOnTop(ref, zIndex, shouldActLikeHovered, dragging, selected, isEditingLabel);

    const bpmnEditorStoreApi = useBpmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(bpmnNodesContainmentMap, isValidConnectionTarget, id, NODE_TYPES, EDGE_TYPES);
    const nodeDimensions = useNodeDimensions({ shape, nodeType: type as BpmnNodeType, MIN_NODE_SIZES });

    const setName = useCallback<OnEditableNodeLabelChange>(
      (newName: string) => {
        bpmnEditorStoreApi.setState((state) => {
          // FIXME: Tiago: Mutation
          // renameProcessFlowElement({
        });
      },
      [bpmnEditorStoreApi]
    );

    const { fontCssProperties } = useNodeStyle({
      nodeType: type as BpmnNodeType,
      isEnabled: enableCustomNodeStyles,
    });

    return (
      <>
        <svg className={`kie-bpmn-editor--node-shape ${className} ${selected ? "selected" : ""}`}>
          <IntermediateThrowEventNodeSvg {...nodeDimensions} x={0} y={0} />
        </svg>
        <PositionalNodeHandles isTargeted={isTargeted && isValidConnectionTarget} nodeId={id} />
        <div
          onDoubleClick={triggerEditing}
          onKeyDown={triggerEditingIfEnter}
          className={`kie-bpmn-editor--intermediate-throw-event-node ${className} kie-bpmn-editor--selected-intermediate-throw-event-node`}
          ref={ref}
          tabIndex={-1}
          data-nodehref={id}
          data-nodelabel={id}
        >
          {/* {`render count: ${renderCount.current}`}
          <br /> */}
          <div className={"kie-bpmn-editor--node"}>
            <InfoNodePanel
              isVisible={!isTargeted && shouldActLikeHovered}
              onClick={useCallback(() => {
                bpmnEditorStoreApi.setState((state) => {
                  state.diagram.propertiesPanel.isOpen = true;
                });
              }, [bpmnEditorStoreApi])}
            />

            <OutgoingStuffNodePanel
              nodeHref={id}
              isVisible={!isTargeted && shouldActLikeHovered}
              nodeTypes={bpmnGraphOutgoingStructure[NODE_TYPES.intermediateThrowEvent].nodes}
              edgeTypes={bpmnGraphOutgoingStructure[NODE_TYPES.intermediateThrowEvent].edges}
            />
          </div>
          {/* Creates a div element with the node size to push down the <EditableNodeLabel /> */}
          {<div style={{ height: nodeDimensions.height, flexShrink: 0 }} />}
          {<div>{""}</div>}
        </div>
      </>
    );
  },
  propsHaveSameValuesDeep
);

export const EndEventNode = React.memo(
  ({
    data: { bpmnObject: EndEvent, shape, index, shapeIndex },
    selected,
    dragging,
    zIndex,
    type,
    id,
  }: RF.NodeProps<BpmnDiagramNodeData<Normalized<BPMN20__tEndEvent> & { __$$element: "endEvent" }>>) => {
    const renderCount = useRef<number>(0);
    renderCount.current++;

    const ref = useRef<HTMLDivElement>(null);

    const enableCustomNodeStyles = useBpmnEditorStore((s) => s.diagram.overlays.enableCustomNodeStyles);
    const isHovered = useIsHovered(ref);
    const isResizing = useNodeResizing(id);
    const shouldActLikeHovered = useBpmnEditorStore(
      (s) => (isHovered || isResizing) && s.reactflowKieEditorDiagram.draggingNodes.length === 0
    );

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(id);
    useHoveredNodeAlwaysOnTop(ref, zIndex, shouldActLikeHovered, dragging, selected, isEditingLabel);

    const bpmnEditorStoreApi = useBpmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(bpmnNodesContainmentMap, isValidConnectionTarget, id, NODE_TYPES, EDGE_TYPES);
    const nodeDimensions = useNodeDimensions({ shape, nodeType: type as BpmnNodeType, MIN_NODE_SIZES });

    const setName = useCallback<OnEditableNodeLabelChange>(
      (newName: string) => {
        bpmnEditorStoreApi.setState((state) => {
          // FIXME: Tiago: Mutation
          // renameProcessFlowElement({
        });
      },
      [bpmnEditorStoreApi]
    );

    const { fontCssProperties } = useNodeStyle({
      nodeType: type as BpmnNodeType,
      isEnabled: enableCustomNodeStyles,
    });

    return (
      <>
        <svg className={`kie-bpmn-editor--node-shape ${className} ${selected ? "selected" : ""}`}>
          <EndEventNodeSvg {...nodeDimensions} x={0} y={0} />
        </svg>
        <PositionalNodeHandles isTargeted={isTargeted && isValidConnectionTarget} nodeId={id} />
        <div
          onDoubleClick={triggerEditing}
          onKeyDown={triggerEditingIfEnter}
          className={`kie-bpmn-editor--end-event-node ${className} kie-bpmn-editor--selected-end-event-node`}
          ref={ref}
          tabIndex={-1}
          data-nodehref={id}
          data-nodelabel={id}
        >
          {/* {`render count: ${renderCount.current}`}
          <br /> */}
          <div className={"kie-bpmn-editor--node"}>
            <InfoNodePanel
              isVisible={!isTargeted && shouldActLikeHovered}
              onClick={useCallback(() => {
                bpmnEditorStoreApi.setState((state) => {
                  state.diagram.propertiesPanel.isOpen = true;
                });
              }, [bpmnEditorStoreApi])}
            />

            <OutgoingStuffNodePanel
              nodeHref={id}
              isVisible={!isTargeted && shouldActLikeHovered}
              nodeTypes={bpmnGraphOutgoingStructure[NODE_TYPES.endEvent].nodes}
              edgeTypes={bpmnGraphOutgoingStructure[NODE_TYPES.endEvent].edges}
            />
          </div>
          {/* Creates a div element with the node size to push down the <EditableNodeLabel /> */}
          {<div style={{ height: nodeDimensions.height, flexShrink: 0 }} />}
          {<div>{""}</div>}
        </div>
      </>
    );
  },
  propsHaveSameValuesDeep
);

export const TaskNode = React.memo(
  ({
    data: { bpmnObject: task, shape, index, shapeIndex },
    selected,
    dragging,
    zIndex,
    type,
    id,
  }: RF.NodeProps<BpmnDiagramNodeData<Normalized<BPMN20__tTask> & { __$$element: "task" }>>) => {
    const renderCount = useRef<number>(0);
    renderCount.current++;

    const ref = useRef<HTMLDivElement>(null);

    const enableCustomNodeStyles = useBpmnEditorStore((s) => s.diagram.overlays.enableCustomNodeStyles);
    const isHovered = useIsHovered(ref);
    const isResizing = useNodeResizing(id);
    const shouldActLikeHovered = useBpmnEditorStore(
      (s) => (isHovered || isResizing) && s.reactflowKieEditorDiagram.draggingNodes.length === 0
    );

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(id);
    useHoveredNodeAlwaysOnTop(ref, zIndex, shouldActLikeHovered, dragging, selected, isEditingLabel);

    const bpmnEditorStoreApi = useBpmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(bpmnNodesContainmentMap, isValidConnectionTarget, id, NODE_TYPES, EDGE_TYPES);
    const nodeDimensions = useNodeDimensions({ shape, nodeType: type as BpmnNodeType, MIN_NODE_SIZES });

    const setName = useCallback<OnEditableNodeLabelChange>(
      (newName: string) => {
        bpmnEditorStoreApi.setState((state) => {
          // FIXME: Tiago: Mutation
          // renameProcessFlowElement({
        });
      },
      [bpmnEditorStoreApi]
    );

    const { fontCssProperties } = useNodeStyle({
      nodeType: type as BpmnNodeType,
      isEnabled: enableCustomNodeStyles,
    });

    return (
      <>
        <svg className={`kie-bpmn-editor--node-shape ${className} ${selected ? "selected" : ""}`}>
          <TaskNodeSvg {...nodeDimensions} x={0} y={0} />
        </svg>
        <PositionalNodeHandles isTargeted={isTargeted && isValidConnectionTarget} nodeId={id} />
        <div
          onDoubleClick={triggerEditing}
          onKeyDown={triggerEditingIfEnter}
          className={`kie-bpmn-editor--task-node ${className} kie-bpmn-editor--selected-task-node`}
          ref={ref}
          tabIndex={-1}
          data-nodehref={id}
          data-nodelabel={task["@_name"]}
        >
          {/* {`render count: ${renderCount.current}`}
          <br /> */}
          <div className={"kie-bpmn-editor--node"}>
            <InfoNodePanel
              isVisible={!isTargeted && shouldActLikeHovered}
              onClick={useCallback(() => {
                bpmnEditorStoreApi.setState((state) => {
                  state.diagram.propertiesPanel.isOpen = true;
                });
              }, [bpmnEditorStoreApi])}
            />

            <OutgoingStuffNodePanel
              nodeHref={id}
              isVisible={!isTargeted && shouldActLikeHovered}
              nodeTypes={bpmnGraphOutgoingStructure[NODE_TYPES.task].nodes}
              edgeTypes={bpmnGraphOutgoingStructure[NODE_TYPES.task].edges}
            />

            {shouldActLikeHovered && (
              <NodeResizerHandle
                nodeType={type as typeof NODE_TYPES.task}
                nodeId={id}
                nodeShapeIndex={shapeIndex}
                MIN_NODE_SIZES={MIN_NODE_SIZES}
              />
            )}
          </div>
          {/* Creates a div element with the node size to push down the <EditableNodeLabel /> */}
          {<div style={{ height: nodeDimensions.height, flexShrink: 0 }} />}
          {<div>{task["@_name"]}</div>}
        </div>
      </>
    );
  },
  propsHaveSameValuesDeep
);

export const SubProcessNode = React.memo(
  ({
    data: { bpmnObject: subProcess, shape, index, shapeIndex },
    selected,
    dragging,
    zIndex,
    type,
    id,
  }: RF.NodeProps<BpmnDiagramNodeData<Normalized<BPMN20__tSubProcess> & { __$$element: "subProcess" }>>) => {
    const renderCount = useRef<number>(0);
    renderCount.current++;

    const ref = useRef<HTMLDivElement>(null);

    const enableCustomNodeStyles = useBpmnEditorStore((s) => s.diagram.overlays.enableCustomNodeStyles);
    const isHovered = useIsHovered(ref);
    const isResizing = useNodeResizing(id);
    const shouldActLikeHovered = useBpmnEditorStore(
      (s) => (isHovered || isResizing) && s.reactflowKieEditorDiagram.draggingNodes.length === 0
    );

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(id);
    useHoveredNodeAlwaysOnTop(ref, zIndex, shouldActLikeHovered, dragging, selected, isEditingLabel);

    const bpmnEditorStoreApi = useBpmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(bpmnNodesContainmentMap, isValidConnectionTarget, id, NODE_TYPES, EDGE_TYPES);
    const nodeDimensions = useNodeDimensions({ shape, nodeType: type as BpmnNodeType, MIN_NODE_SIZES });

    const setName = useCallback<OnEditableNodeLabelChange>(
      (newName: string) => {
        bpmnEditorStoreApi.setState((state) => {
          // FIXME: Tiago: Mutation
          // renameProcessFlowElement({
        });
      },
      [bpmnEditorStoreApi]
    );

    const { fontCssProperties } = useNodeStyle({
      nodeType: type as BpmnNodeType,
      isEnabled: enableCustomNodeStyles,
    });

    return (
      <>
        <svg className={`kie-bpmn-editor--node-shape ${className} ${selected ? "selected" : ""}`}>
          <SubProcessNodeSvg {...nodeDimensions} x={0} y={0} />
        </svg>
        <PositionalNodeHandles isTargeted={isTargeted && isValidConnectionTarget} nodeId={id} />
        <div
          onDoubleClick={triggerEditing}
          onKeyDown={triggerEditingIfEnter}
          className={`kie-bpmn-editor--sub-process-node ${className} kie-bpmn-editor--selected-sub-process-node`}
          ref={ref}
          tabIndex={-1}
          data-nodehref={id}
          data-nodelabel={subProcess["@_name"]}
        >
          {/* {`render count: ${renderCount.current}`}
          <br /> */}
          <div className={"kie-bpmn-editor--node"}>
            <InfoNodePanel
              isVisible={!isTargeted && shouldActLikeHovered}
              onClick={useCallback(() => {
                bpmnEditorStoreApi.setState((state) => {
                  state.diagram.propertiesPanel.isOpen = true;
                });
              }, [bpmnEditorStoreApi])}
            />

            <OutgoingStuffNodePanel
              nodeHref={id}
              isVisible={!isTargeted && shouldActLikeHovered}
              nodeTypes={bpmnGraphOutgoingStructure[NODE_TYPES.subProcess].nodes}
              edgeTypes={bpmnGraphOutgoingStructure[NODE_TYPES.subProcess].edges}
            />

            {shouldActLikeHovered && (
              <NodeResizerHandle
                nodeType={type as typeof NODE_TYPES.subProcess}
                nodeId={id}
                nodeShapeIndex={shapeIndex}
                MIN_NODE_SIZES={MIN_NODE_SIZES}
              />
            )}
          </div>
          {/* Creates a div element with the node size to push down the <EditableNodeLabel /> */}
          {<div style={{ height: nodeDimensions.height, flexShrink: 0 }} />}
          {<div>{subProcess["@_name"]}</div>}
        </div>
      </>
    );
  },
  propsHaveSameValuesDeep
);

export const GatewayNode = React.memo(
  ({
    data: { bpmnObject: gateway, shape, index, shapeIndex },
    selected,
    dragging,
    zIndex,
    type,
    id,
  }: RF.NodeProps<
    BpmnDiagramNodeData<
      Normalized<
        | BPMN20__tComplexGateway
        | BPMN20__tEventBasedGateway
        | BPMN20__tExclusiveGateway
        | BPMN20__tInclusiveGateway
        | BPMN20__tParallelGateway
      > & {
        __$$element:
          | "complexGateway"
          | "eventBasedGateway"
          | "exclusiveGateway"
          | "inclusiveGateway"
          | "parallelGateway";
      }
    >
  >) => {
    const renderCount = useRef<number>(0);
    renderCount.current++;

    const ref = useRef<HTMLDivElement>(null);

    const enableCustomNodeStyles = useBpmnEditorStore((s) => s.diagram.overlays.enableCustomNodeStyles);
    const isHovered = useIsHovered(ref);
    const isResizing = useNodeResizing(id);
    const shouldActLikeHovered = useBpmnEditorStore(
      (s) => (isHovered || isResizing) && s.reactflowKieEditorDiagram.draggingNodes.length === 0
    );

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(id);
    useHoveredNodeAlwaysOnTop(ref, zIndex, shouldActLikeHovered, dragging, selected, isEditingLabel);

    const bpmnEditorStoreApi = useBpmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(bpmnNodesContainmentMap, isValidConnectionTarget, id, NODE_TYPES, EDGE_TYPES);
    const nodeDimensions = useNodeDimensions({ shape, nodeType: type as BpmnNodeType, MIN_NODE_SIZES });

    const setName = useCallback<OnEditableNodeLabelChange>(
      (newName: string) => {
        bpmnEditorStoreApi.setState((state) => {
          // FIXME: Tiago: Mutation
          // renameProcessFlowElement({
        });
      },
      [bpmnEditorStoreApi]
    );

    const { fontCssProperties } = useNodeStyle({
      nodeType: type as BpmnNodeType,
      isEnabled: enableCustomNodeStyles,
    });

    return (
      <>
        <svg className={`kie-bpmn-editor--node-shape ${className} ${selected ? "selected" : ""}`}>
          <GatewayNodeSvg {...nodeDimensions} x={0} y={0} />
        </svg>
        <PositionalNodeHandles isTargeted={isTargeted && isValidConnectionTarget} nodeId={id} />
        <div
          onDoubleClick={triggerEditing}
          onKeyDown={triggerEditingIfEnter}
          className={`kie-bpmn-editor--gateway-node ${className} kie-bpmn-editor--selected-gateway-node`}
          ref={ref}
          tabIndex={-1}
          data-nodehref={id}
          data-nodelabel={gateway["@_name"]}
        >
          {/* {`render count: ${renderCount.current}`}
          <br /> */}
          <div className={"kie-bpmn-editor--node"}>
            <InfoNodePanel
              isVisible={!isTargeted && shouldActLikeHovered}
              onClick={useCallback(() => {
                bpmnEditorStoreApi.setState((state) => {
                  state.diagram.propertiesPanel.isOpen = true;
                });
              }, [bpmnEditorStoreApi])}
            />

            <OutgoingStuffNodePanel
              nodeHref={id}
              isVisible={!isTargeted && shouldActLikeHovered}
              nodeTypes={bpmnGraphOutgoingStructure[NODE_TYPES.gateway].nodes}
              edgeTypes={bpmnGraphOutgoingStructure[NODE_TYPES.gateway].edges}
            />
          </div>
          {/* Creates a div element with the node size to push down the <EditableNodeLabel /> */}
          {<div style={{ height: nodeDimensions.height, flexShrink: 0 }} />}
          {<div>{gateway["@_name"]}</div>}
        </div>
      </>
    );
  },
  propsHaveSameValuesDeep
);

export const DataObjectNode = React.memo(
  ({
    data: { bpmnObject: dataObject, shape, index, shapeIndex },
    selected,
    dragging,
    zIndex,
    type,
    id,
  }: RF.NodeProps<BpmnDiagramNodeData<Normalized<BPMN20__tDataObject> & { __$$element: "dataObject" }>>) => {
    const renderCount = useRef<number>(0);
    renderCount.current++;

    const ref = useRef<HTMLDivElement>(null);

    const enableCustomNodeStyles = useBpmnEditorStore((s) => s.diagram.overlays.enableCustomNodeStyles);
    const isHovered = useIsHovered(ref);
    const isResizing = useNodeResizing(id);
    const shouldActLikeHovered = useBpmnEditorStore(
      (s) => (isHovered || isResizing) && s.reactflowKieEditorDiagram.draggingNodes.length === 0
    );

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(id);
    useHoveredNodeAlwaysOnTop(ref, zIndex, shouldActLikeHovered, dragging, selected, isEditingLabel);

    const bpmnEditorStoreApi = useBpmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(bpmnNodesContainmentMap, isValidConnectionTarget, id, NODE_TYPES, EDGE_TYPES);
    const nodeDimensions = useNodeDimensions({ shape, nodeType: type as BpmnNodeType, MIN_NODE_SIZES });

    const setName = useCallback<OnEditableNodeLabelChange>(
      (newName: string) => {
        bpmnEditorStoreApi.setState((state) => {
          // FIXME: Tiago: Mutation
          // renameProcessFlowElement({
        });
      },
      [bpmnEditorStoreApi]
    );

    const { fontCssProperties } = useNodeStyle({
      nodeType: type as BpmnNodeType,
      isEnabled: enableCustomNodeStyles,
    });

    const [alternativeEditableNodeHeight, setAlternativeEditableNodeHeight] = React.useState<number>(0);
    const alternativeSvgStyle = useMemo<React.CSSProperties>(() => {
      // This is used to modify a css from a :before element.
      // The --height is a css var which is used by the kie-bpmn-editor--selected-data-object-node class.
      return {
        display: "flex",
        flexDirection: "column",
        outline: "none",
        "--selected-data-object-node-shape--height": `${
          nodeDimensions.height + 20 + (isEditingLabel ? 20 : alternativeEditableNodeHeight ?? 0)
        }px`,
      };
    }, [nodeDimensions, isEditingLabel, alternativeEditableNodeHeight]);

    return (
      <>
        <svg className={`kie-bpmn-editor--node-shape ${className} ${selected ? "selected" : ""}`}>
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
            <InfoNodePanel
              isVisible={!isTargeted && shouldActLikeHovered}
              onClick={useCallback(() => {
                bpmnEditorStoreApi.setState((state) => {
                  state.diagram.propertiesPanel.isOpen = true;
                });
              }, [bpmnEditorStoreApi])}
            />

            <OutgoingStuffNodePanel
              nodeHref={id}
              isVisible={!isTargeted && shouldActLikeHovered}
              nodeTypes={bpmnGraphOutgoingStructure[NODE_TYPES.dataObject].nodes}
              edgeTypes={bpmnGraphOutgoingStructure[NODE_TYPES.dataObject].edges}
            />

            {shouldActLikeHovered && (
              <NodeResizerHandle
                nodeType={type as typeof NODE_TYPES.dataObject}
                nodeId={id}
                nodeShapeIndex={shapeIndex}
                MIN_NODE_SIZES={MIN_NODE_SIZES}
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

export const GroupNode = React.memo(
  ({
    data: { bpmnObject: group, shape, index, shapeIndex },
    selected,
    dragging,
    zIndex,
    type,
    id,
  }: RF.NodeProps<BpmnDiagramNodeData<Normalized<BPMN20__tGroup> & { __$$element: "group" }>>) => {
    const renderCount = useRef<number>(0);
    renderCount.current++;

    const ref = useRef<SVGRectElement>(null);

    const snapGrid = useBpmnEditorStore((s) => s.reactflowKieEditorDiagram.snapGrid);
    const enableCustomNodeStyles = useBpmnEditorStore((s) => s.diagram.overlays.enableCustomNodeStyles);
    const isHovered = useIsHovered(ref);
    const isResizing = useNodeResizing(id);
    const shouldActLikeHovered = useBpmnEditorStore(
      (s) => (isHovered || isResizing) && s.reactflowKieEditorDiagram.draggingNodes.length === 0
    );
    const bpmnEditorStoreApi = useBpmnEditorStoreApi();
    const reactFlow = RF.useReactFlow<BpmnDiagramNodeData, BpmnDiagramEdgeData>();

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(id);
    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(bpmnNodesContainmentMap, isValidConnectionTarget, id, NODE_TYPES, EDGE_TYPES);
    const nodeDimensions = useNodeDimensions({ shape, nodeType: type as BpmnNodeType, MIN_NODE_SIZES });
    const setName = useCallback<OnEditableNodeLabelChange>(
      (newName: string) => {
        bpmnEditorStoreApi.setState((state) => {
          // FIXME: Tiago: Mutation
          // renameGroupNode({ definitions: state.bpmn.model.definitions, newName, index });
        });
      },
      [bpmnEditorStoreApi]
    );

    // Select nodes that are visually entirely inside the group.
    useEffect(() => {
      const onDoubleClick = () => {
        bpmnEditorStoreApi.setState((state) => {
          state.reactflowKieEditorDiagram._selectedNodes = reactFlow.getNodes().flatMap((n) =>
            getContainmentRelationship({
              bounds: n.data.shape["dc:Bounds"]!,
              container: shape["dc:Bounds"]!,
              snapGrid: state.reactflowKieEditorDiagram.snapGrid,
              containerMinSizes: MIN_NODE_SIZES[NODE_TYPES.group],
              boundsMinSizes: MIN_NODE_SIZES[n.type as BpmnNodeType],
            }).isInside
              ? [n.id]
              : []
          );
        });
      };

      const r = ref.current;
      r?.addEventListener("dblclick", onDoubleClick);
      return () => {
        r?.removeEventListener("dblclick", onDoubleClick);
      };
    }, [bpmnEditorStoreApi, reactFlow, shape]);

    const { fontCssProperties } = useNodeStyle({
      nodeType: type as BpmnNodeType,
      isEnabled: enableCustomNodeStyles,
    });

    return (
      <>
        <svg className={`kie-dmn-editor--node-shape ${className}`}>
          <GroupNodeSvg ref={ref} {...nodeDimensions} x={0} y={0} strokeWidth={3} />
        </svg>

        <div
          className={`kie-dmn-editor--node kie-dmn-editor--group-node ${className}`}
          tabIndex={-1}
          onDoubleClick={triggerEditing}
          onKeyDown={triggerEditingIfEnter}
          data-nodehref={id}
          data-nodelabel={id}
        >
          {/* {`render count: ${renderCount.current}`}
          <br /> */}
          <OutgoingStuffNodePanel
            nodeHref={id}
            isVisible={!isTargeted && selected && !dragging}
            nodeTypes={bpmnGraphOutgoingStructure[NODE_TYPES.group].nodes}
            edgeTypes={bpmnGraphOutgoingStructure[NODE_TYPES.group].edges}
          />

          {selected && !dragging && (
            <NodeResizerHandle
              nodeType={type as typeof NODE_TYPES.group}
              nodeId={id}
              nodeShapeIndex={shapeIndex}
              MIN_NODE_SIZES={MIN_NODE_SIZES}
            />
          )}
        </div>
      </>
    );
  },
  propsHaveSameValuesDeep
);

export const TextAnnotationNode = React.memo(
  ({
    data: { bpmnObject: textAnnotation, shape, index, shapeIndex },
    selected,
    dragging,
    zIndex,
    type,
    id,
  }: RF.NodeProps<BpmnDiagramNodeData<Normalized<BPMN20__tTextAnnotation> & { __$$element: "textAnnotation" }>>) => {
    const renderCount = useRef<number>(0);
    renderCount.current++;

    const ref = useRef<HTMLDivElement>(null);

    const enableCustomNodeStyles = useBpmnEditorStore((s) => s.diagram.overlays.enableCustomNodeStyles);
    const isHovered = useIsHovered(ref);
    const isResizing = useNodeResizing(id);
    const shouldActLikeHovered = useBpmnEditorStore(
      (s) => (isHovered || isResizing) && s.reactflowKieEditorDiagram.draggingNodes.length === 0
    );

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(id);
    useHoveredNodeAlwaysOnTop(ref, zIndex, shouldActLikeHovered, dragging, selected, isEditingLabel);

    const bpmnEditorStoreApi = useBpmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(bpmnNodesContainmentMap, isValidConnectionTarget, id, NODE_TYPES, EDGE_TYPES);
    const nodeDimensions = useNodeDimensions({
      nodeType: type as typeof NODE_TYPES.textAnnotation,
      shape,
      MIN_NODE_SIZES,
    });
    const setText = useCallback(
      (newText: string) => {
        bpmnEditorStoreApi.setState((state) => {
          // FIXME: Tiago: Mutation
          // updateTextAnnotation({ definitions: state.bpmn.model.definitions, newText, index });
        });
      },
      [bpmnEditorStoreApi]
    );

    const { fontCssProperties } = useNodeStyle({
      nodeType: type as BpmnNodeType,
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
          <InfoNodePanel
            isVisible={!isTargeted && shouldActLikeHovered}
            onClick={useCallback(() => {
              bpmnEditorStoreApi.setState((state) => {
                state.diagram.propertiesPanel.isOpen = true;
              });
            }, [bpmnEditorStoreApi])}
          />
          <OutgoingStuffNodePanel
            nodeHref={id}
            isVisible={!isTargeted && shouldActLikeHovered}
            nodeTypes={bpmnGraphOutgoingStructure[NODE_TYPES.textAnnotation].nodes}
            edgeTypes={bpmnGraphOutgoingStructure[NODE_TYPES.textAnnotation].edges}
          />
          <div>{textAnnotation.text /* FIXME: Tiago: XML*/}</div>
          {shouldActLikeHovered && (
            <NodeResizerHandle
              nodeType={type as typeof NODE_TYPES.textAnnotation}
              nodeId={id}
              nodeShapeIndex={shapeIndex}
              MIN_NODE_SIZES={MIN_NODE_SIZES}
            />
          )}
        </div>
      </>
    );
  },
  propsHaveSameValuesDeep
);

export const UnknownNode = React.memo(
  ({ data: { shape, shapeIndex }, selected, dragging, zIndex, type, id }: RF.NodeProps<BpmnDiagramNodeData<null>>) => {
    const renderCount = useRef<number>(0);
    renderCount.current++;

    const ref = useRef<HTMLDivElement>(null);

    const isHovered = useIsHovered(ref);
    const isResizing = useNodeResizing(id);
    const shouldActLikeHovered = useBpmnEditorStore(
      (s) => (isHovered || isResizing) && s.reactflowKieEditorDiagram.draggingNodes.length === 0
    );

    const bpmnEditorStoreApi = useBpmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(bpmnNodesContainmentMap, isValidConnectionTarget, id, NODE_TYPES, EDGE_TYPES);
    const nodeDimensions = useNodeDimensions({
      nodeType: type as typeof NODE_TYPES.unknown,
      shape,
      MIN_NODE_SIZES,
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
          <InfoNodePanel
            isVisible={!isTargeted && shouldActLikeHovered}
            onClick={useCallback(() => {
              bpmnEditorStoreApi.setState((state) => {
                state.diagram.propertiesPanel.isOpen = true;
              });
            }, [bpmnEditorStoreApi])}
          />

          <EditableNodeLabel
            id={id}
            name={undefined}
            position={getNodeLabelPosition({ nodeType: type as typeof NODE_TYPES.unknown })}
            isEditing={false}
            setEditing={() => {}}
            value={`? `}
            onChange={() => {}}
            skipValidation={false}
            validate={useCallback((value) => true, [])}
            shouldCommitOnBlur={true}
          />
          {selected && !dragging && (
            <NodeResizerHandle
              nodeType={type as typeof NODE_TYPES.unknown}
              nodeId={id}
              nodeShapeIndex={shapeIndex}
              MIN_NODE_SIZES={MIN_NODE_SIZES}
            />
          )}
        </div>
      </>
    );
  },
  propsHaveSameValuesDeep
);
