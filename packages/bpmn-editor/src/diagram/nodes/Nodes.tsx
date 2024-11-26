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
  BPMN20__tGroup,
  BPMN20__tInclusiveGateway,
  BPMN20__tIntermediateCatchEvent,
  BPMN20__tIntermediateThrowEvent,
  BPMN20__tLane,
  BPMN20__tParallelGateway,
  BPMN20__tStartEvent,
  BPMN20__tSubProcess,
  BPMN20__tTask,
  BPMN20__tTextAnnotation,
} from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import * as RF from "reactflow";
import { Normalized } from "../../normalization/normalize";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../../store/StoreContext";
import {
  ActivityNodeMarker,
  BPMN_CONTAINMENT_MAP,
  BpmnDiagramNodeData,
  BpmnNodeType,
  EDGE_TYPES,
  NODE_TYPES,
} from "../BpmnDiagramDomain";
import { BPMN_OUTGOING_STRUCTURE } from "../BpmnDiagramDomain";
import { MIN_NODE_SIZES } from "../BpmnDiagramDomain";
import { getNodeLabelPosition, useNodeStyle } from "./NodeStyle";
import {
  DataObjectNodeSvg,
  EndEventNodeSvg,
  GatewayNodeSvg,
  GroupNodeSvg,
  IntermediateCatchEventNodeSvg,
  IntermediateThrowEventNodeSvg,
  LaneNodeSvg,
  StartEventNodeSvg,
  TaskNodeSvg,
  TextAnnotationNodeSvg,
  SubProcessNodeSvg,
  UnknownNodeSvg,
} from "./NodeSvgs";

import { getContainmentRelationship } from "@kie-tools/xyflow-react-kie-diagram/dist/maths/DcMaths";
import { propsHaveSameValuesDeep } from "@kie-tools/xyflow-react-kie-diagram/dist/memoization/memoization";
import {
  EditableNodeLabel,
  OnEditableNodeLabelChange,
  useEditableNodeLabel,
} from "@kie-tools/xyflow-react-kie-diagram/dist/nodes/EditableNodeLabel";
import {
  NodeResizerHandle,
  useConnectionTargetStatus,
  useHoveredNodeAlwaysOnTop,
  useNodeClassName,
  useNodeDimensions,
  useNodeResizing,
} from "@kie-tools/xyflow-react-kie-diagram/dist/nodes/Hooks";
import { InfoNodePanel } from "@kie-tools/xyflow-react-kie-diagram/dist/nodes/InfoNodePanel";
import { OutgoingStuffNodePanel } from "@kie-tools/xyflow-react-kie-diagram/dist/nodes/OutgoingStuffNodePanel";
import { PositionalNodeHandles } from "@kie-tools/xyflow-react-kie-diagram/dist/nodes/PositionalNodeHandles";
import { useIsHovered } from "@kie-tools/xyflow-react-kie-diagram/dist/reactExt/useIsHovered";
import { BpmnDiagramEdgeData } from "../BpmnDiagramDomain";
import { bpmnNodesOutgoingStuffNodePanelMapping } from "../BpmnDiagramDomain";
import { bpmnEdgesOutgoingStuffNodePanelMapping } from "../BpmnDiagramDomain";

export const StartEventNode = React.memo(
  ({
    data: { bpmnElement: startEvent, shape, index, shapeIndex },
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
      (s) => (isHovered || isResizing) && s.xyFlowReactKieDiagram.draggingNodes.length === 0
    );

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(id);
    useHoveredNodeAlwaysOnTop(ref, zIndex, shouldActLikeHovered, dragging, selected, isEditingLabel);

    const bpmnEditorStoreApi = useBpmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(isValidConnectionTarget, id, NODE_TYPES, EDGE_TYPES);
    const nodeDimensions = useNodeDimensions({ shape, nodeType: type as BpmnNodeType, MIN_NODE_SIZES });

    const setName = useCallback<OnEditableNodeLabelChange>(
      (newName: string) => {
        bpmnEditorStoreApi.setState((state) => {
          // FIXME: Tiago: Mutation (set node name)
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
        <svg className={`xyflow-react-kie-diagram--node-shape ${className} ${selected ? "selected" : ""}`}>
          <StartEventNodeSvg
            {...nodeDimensions}
            x={0}
            y={0}
            variant={startEvent.eventDefinition?.[0]?.__$$element ?? "none"}
          />
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
          <div className={"xyflow-react-kie-diagram--node"}>
            <InfoNodePanel
              isVisible={!isTargeted && shouldActLikeHovered}
              onClick={useCallback(() => {
                bpmnEditorStoreApi.setState((state) => {
                  state.diagram.propertiesPanel.isOpen = true;
                });
              }, [bpmnEditorStoreApi])}
            />

            <OutgoingStuffNodePanel
              nodeMapping={bpmnNodesOutgoingStuffNodePanelMapping}
              edgeMapping={bpmnEdgesOutgoingStuffNodePanelMapping}
              nodeHref={id}
              isVisible={!isTargeted && shouldActLikeHovered}
              nodeTypes={BPMN_OUTGOING_STRUCTURE[NODE_TYPES.startEvent].nodes}
              edgeTypes={BPMN_OUTGOING_STRUCTURE[NODE_TYPES.startEvent].edges}
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
    data: { bpmnElement: intermediateCatchEvent, shape, index, shapeIndex },
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
      (s) => (isHovered || isResizing) && s.xyFlowReactKieDiagram.draggingNodes.length === 0
    );

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(id);
    useHoveredNodeAlwaysOnTop(ref, zIndex, shouldActLikeHovered, dragging, selected, isEditingLabel);

    const bpmnEditorStoreApi = useBpmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(isValidConnectionTarget, id, NODE_TYPES, EDGE_TYPES);
    const nodeDimensions = useNodeDimensions({ shape, nodeType: type as BpmnNodeType, MIN_NODE_SIZES });

    const setName = useCallback<OnEditableNodeLabelChange>(
      (newName: string) => {
        bpmnEditorStoreApi.setState((state) => {
          // FIXME: Tiago: Mutation (set node name)
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
        <svg className={`xyflow-react-kie-diagram--node-shape ${className} ${selected ? "selected" : ""}`}>
          <IntermediateCatchEventNodeSvg
            {...nodeDimensions}
            x={0}
            y={0}
            variant={intermediateCatchEvent.eventDefinition?.[0].__$$element ?? "none"}
          />
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
          <div className={"xyflow-react-kie-diagram--node"}>
            <InfoNodePanel
              isVisible={!isTargeted && shouldActLikeHovered}
              onClick={useCallback(() => {
                bpmnEditorStoreApi.setState((state) => {
                  state.diagram.propertiesPanel.isOpen = true;
                });
              }, [bpmnEditorStoreApi])}
            />

            <OutgoingStuffNodePanel
              nodeMapping={bpmnNodesOutgoingStuffNodePanelMapping}
              edgeMapping={bpmnEdgesOutgoingStuffNodePanelMapping}
              nodeHref={id}
              isVisible={!isTargeted && shouldActLikeHovered}
              nodeTypes={BPMN_OUTGOING_STRUCTURE[NODE_TYPES.intermediateCatchEvent].nodes}
              edgeTypes={BPMN_OUTGOING_STRUCTURE[NODE_TYPES.intermediateCatchEvent].edges}
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
    data: { bpmnElement: intermediateThrowEvent, shape, index, shapeIndex },
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
      (s) => (isHovered || isResizing) && s.xyFlowReactKieDiagram.draggingNodes.length === 0
    );

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(id);
    useHoveredNodeAlwaysOnTop(ref, zIndex, shouldActLikeHovered, dragging, selected, isEditingLabel);

    const bpmnEditorStoreApi = useBpmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(isValidConnectionTarget, id, NODE_TYPES, EDGE_TYPES);
    const nodeDimensions = useNodeDimensions({ shape, nodeType: type as BpmnNodeType, MIN_NODE_SIZES });

    const setName = useCallback<OnEditableNodeLabelChange>(
      (newName: string) => {
        bpmnEditorStoreApi.setState((state) => {
          // FIXME: Tiago: Mutation (set node name)
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
        <svg className={`xyflow-react-kie-diagram--node-shape ${className} ${selected ? "selected" : ""}`}>
          <IntermediateThrowEventNodeSvg
            {...nodeDimensions}
            x={0}
            y={0}
            variant={intermediateThrowEvent.eventDefinition?.[0]?.__$$element ?? "none"}
          />
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
          <div className={"xyflow-react-kie-diagram--node"}>
            <InfoNodePanel
              isVisible={!isTargeted && shouldActLikeHovered}
              onClick={useCallback(() => {
                bpmnEditorStoreApi.setState((state) => {
                  state.diagram.propertiesPanel.isOpen = true;
                });
              }, [bpmnEditorStoreApi])}
            />

            <OutgoingStuffNodePanel
              nodeMapping={bpmnNodesOutgoingStuffNodePanelMapping}
              edgeMapping={bpmnEdgesOutgoingStuffNodePanelMapping}
              nodeHref={id}
              isVisible={!isTargeted && shouldActLikeHovered}
              nodeTypes={BPMN_OUTGOING_STRUCTURE[NODE_TYPES.intermediateThrowEvent].nodes}
              edgeTypes={BPMN_OUTGOING_STRUCTURE[NODE_TYPES.intermediateThrowEvent].edges}
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
    data: { bpmnElement: endEvent, shape, index, shapeIndex },
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
      (s) => (isHovered || isResizing) && s.xyFlowReactKieDiagram.draggingNodes.length === 0
    );

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(id);
    useHoveredNodeAlwaysOnTop(ref, zIndex, shouldActLikeHovered, dragging, selected, isEditingLabel);

    const bpmnEditorStoreApi = useBpmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(isValidConnectionTarget, id, NODE_TYPES, EDGE_TYPES);
    const nodeDimensions = useNodeDimensions({ shape, nodeType: type as BpmnNodeType, MIN_NODE_SIZES });

    const setName = useCallback<OnEditableNodeLabelChange>(
      (newName: string) => {
        bpmnEditorStoreApi.setState((state) => {
          // FIXME: Tiago: Mutation (set node name)
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
        <svg className={`xyflow-react-kie-diagram--node-shape ${className} ${selected ? "selected" : ""}`}>
          <EndEventNodeSvg
            {...nodeDimensions}
            x={0}
            y={0}
            variant={endEvent.eventDefinition?.[0]?.__$$element ?? "none"}
            strokeWidth={6}
          />
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
          <div className={"xyflow-react-kie-diagram--node"}>
            <InfoNodePanel
              isVisible={!isTargeted && shouldActLikeHovered}
              onClick={useCallback(() => {
                bpmnEditorStoreApi.setState((state) => {
                  state.diagram.propertiesPanel.isOpen = true;
                });
              }, [bpmnEditorStoreApi])}
            />

            <OutgoingStuffNodePanel
              nodeMapping={bpmnNodesOutgoingStuffNodePanelMapping}
              edgeMapping={bpmnEdgesOutgoingStuffNodePanelMapping}
              nodeHref={id}
              isVisible={!isTargeted && shouldActLikeHovered}
              nodeTypes={BPMN_OUTGOING_STRUCTURE[NODE_TYPES.endEvent].nodes}
              edgeTypes={BPMN_OUTGOING_STRUCTURE[NODE_TYPES.endEvent].edges}
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
    data: { bpmnElement: task, shape, index, shapeIndex },
    selected,
    dragging,
    zIndex,
    type,
    id,
  }: RF.NodeProps<
    BpmnDiagramNodeData<
      Normalized<BPMN20__tTask> & {
        __$$element: "task" | "serviceTask" | "userTask" | "businessRuleTask" | "scriptTask" | "callActivity";
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
      (s) => (isHovered || isResizing) && s.xyFlowReactKieDiagram.draggingNodes.length === 0
    );

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(id);
    useHoveredNodeAlwaysOnTop(ref, zIndex, shouldActLikeHovered, dragging, selected, isEditingLabel);

    const bpmnEditorStoreApi = useBpmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(isValidConnectionTarget, id, NODE_TYPES, EDGE_TYPES);
    const nodeDimensions = useNodeDimensions({ shape, nodeType: type as BpmnNodeType, MIN_NODE_SIZES });

    const setName = useCallback<OnEditableNodeLabelChange>(
      (newName: string) => {
        bpmnEditorStoreApi.setState((state) => {
          // FIXME: Tiago: Mutation (set node name)
          // renameProcessFlowElement({
        });
      },
      [bpmnEditorStoreApi]
    );

    const { fontCssProperties } = useNodeStyle({
      nodeType: type as BpmnNodeType,
      isEnabled: enableCustomNodeStyles,
    });

    const icons = useActivityIcons(task);

    return (
      <>
        <svg className={`xyflow-react-kie-diagram--node-shape ${className} ${selected ? "selected" : ""}`}>
          <TaskNodeSvg
            {...nodeDimensions}
            x={0}
            y={0}
            strokeWidth={task.__$$element === "callActivity" ? 5 : undefined}
            icons={icons}
          />
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
          <div className={"xyflow-react-kie-diagram--node"}>
            <InfoNodePanel
              isVisible={!isTargeted && shouldActLikeHovered}
              onClick={useCallback(() => {
                bpmnEditorStoreApi.setState((state) => {
                  state.diagram.propertiesPanel.isOpen = true;
                });
              }, [bpmnEditorStoreApi])}
            />

            <>{task["@_name"]}</>

            <OutgoingStuffNodePanel
              nodeMapping={bpmnNodesOutgoingStuffNodePanelMapping}
              edgeMapping={bpmnEdgesOutgoingStuffNodePanelMapping}
              nodeHref={id}
              isVisible={!isTargeted && shouldActLikeHovered}
              nodeTypes={BPMN_OUTGOING_STRUCTURE[NODE_TYPES.task].nodes}
              edgeTypes={BPMN_OUTGOING_STRUCTURE[NODE_TYPES.task].edges}
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
        </div>
      </>
    );
  },
  propsHaveSameValuesDeep
);

export const SubProcessNode = React.memo(
  ({
    data: { bpmnElement: subProcess, shape, index, shapeIndex },
    selected,
    dragging,
    zIndex,
    type,
    id,
  }: RF.NodeProps<
    BpmnDiagramNodeData<
      Normalized<BPMN20__tSubProcess> & { __$$element: "transaction" | "adHocSubProcess" | "subProcess" }
    >
  >) => {
    const renderCount = useRef<number>(0);
    renderCount.current++;

    const ref = useRef<SVGRectElement>(null);

    const enableCustomNodeStyles = useBpmnEditorStore((s) => s.diagram.overlays.enableCustomNodeStyles);
    const isHovered = useIsHovered(ref);
    const isResizing = useNodeResizing(id);
    const shouldActLikeHovered = useBpmnEditorStore(
      (s) => (isHovered || isResizing) && s.xyFlowReactKieDiagram.draggingNodes.length === 0
    );

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(id);
    useHoveredNodeAlwaysOnTop(ref, zIndex, shouldActLikeHovered, dragging, selected, isEditingLabel);

    const bpmnEditorStoreApi = useBpmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(isValidConnectionTarget, id, NODE_TYPES, EDGE_TYPES);
    const nodeDimensions = useNodeDimensions({ shape, nodeType: type as BpmnNodeType, MIN_NODE_SIZES });

    const setName = useCallback<OnEditableNodeLabelChange>(
      (newName: string) => {
        bpmnEditorStoreApi.setState((state) => {
          // FIXME: Tiago: Mutation (set node name)
          // renameProcessFlowElement({
        });
      },
      [bpmnEditorStoreApi]
    );

    const { fontCssProperties } = useNodeStyle({
      nodeType: type as BpmnNodeType,
      isEnabled: enableCustomNodeStyles,
    });

    const icons = useActivityIcons(subProcess);

    return (
      <>
        <svg className={`xyflow-react-kie-diagram--node-shape ${className} ${selected ? "selected" : ""}`}>
          <SubProcessNodeSvg
            {...nodeDimensions}
            ref={ref}
            x={0}
            y={0}
            icons={icons}
            type={
              subProcess.__$$element === "transaction"
                ? "transaction"
                : subProcess["@_triggeredByEvent"]
                  ? "event"
                  : "other"
            }
          />
        </svg>
        <PositionalNodeHandles isTargeted={isTargeted && isValidConnectionTarget} nodeId={id} />
        <div
          onDoubleClick={triggerEditing}
          onKeyDown={triggerEditingIfEnter}
          className={`kie-bpmn-editor--sub-process-node ${className} kie-bpmn-editor--selected-sub-process-node`}
          tabIndex={-1}
          data-nodehref={id}
          data-nodelabel={subProcess["@_name"]}
        >
          {/* {`render count: ${renderCount.current}`}
          <br /> */}
          <div className={"xyflow-react-kie-diagram--node"}>
            <InfoNodePanel
              isVisible={!isTargeted && selected && !dragging}
              onClick={useCallback(() => {
                bpmnEditorStoreApi.setState((state) => {
                  state.diagram.propertiesPanel.isOpen = true;
                });
              }, [bpmnEditorStoreApi])}
            />

            {/* FIXME: Tiago: Not actually the way to render this. */}
            <span style={{ position: "absolute", top: "20px", left: "20px" }}>{subProcess["@_name"]}</span>

            <OutgoingStuffNodePanel
              nodeMapping={bpmnNodesOutgoingStuffNodePanelMapping}
              edgeMapping={bpmnEdgesOutgoingStuffNodePanelMapping}
              nodeHref={id}
              isVisible={!isTargeted && selected && !dragging}
              nodeTypes={BPMN_OUTGOING_STRUCTURE[NODE_TYPES.subProcess].nodes}
              edgeTypes={BPMN_OUTGOING_STRUCTURE[NODE_TYPES.subProcess].edges}
            />

            {selected && !dragging && (
              <NodeResizerHandle
                nodeType={type as typeof NODE_TYPES.subProcess}
                nodeId={id}
                nodeShapeIndex={shapeIndex}
                MIN_NODE_SIZES={MIN_NODE_SIZES}
              />
            )}
          </div>
        </div>
      </>
    );
  },
  propsHaveSameValuesDeep
);

export const GatewayNode = React.memo(
  ({
    data: { bpmnElement: gateway, shape, index, shapeIndex },
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
      (s) => (isHovered || isResizing) && s.xyFlowReactKieDiagram.draggingNodes.length === 0
    );

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(id);
    useHoveredNodeAlwaysOnTop(ref, zIndex, shouldActLikeHovered, dragging, selected, isEditingLabel);

    const bpmnEditorStoreApi = useBpmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(isValidConnectionTarget, id, NODE_TYPES, EDGE_TYPES);
    const nodeDimensions = useNodeDimensions({ shape, nodeType: type as BpmnNodeType, MIN_NODE_SIZES });

    const setName = useCallback<OnEditableNodeLabelChange>(
      (newName: string) => {
        bpmnEditorStoreApi.setState((state) => {
          // FIXME: Tiago: Mutation (set node name)
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
        <svg className={`xyflow-react-kie-diagram--node-shape ${className} ${selected ? "selected" : ""}`}>
          <GatewayNodeSvg {...nodeDimensions} x={0} y={0} variant={gateway.__$$element} />
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
          <div className={"xyflow-react-kie-diagram--node"}>
            <InfoNodePanel
              isVisible={!isTargeted && shouldActLikeHovered}
              onClick={useCallback(() => {
                bpmnEditorStoreApi.setState((state) => {
                  state.diagram.propertiesPanel.isOpen = true;
                });
              }, [bpmnEditorStoreApi])}
            />

            <OutgoingStuffNodePanel
              nodeMapping={bpmnNodesOutgoingStuffNodePanelMapping}
              edgeMapping={bpmnEdgesOutgoingStuffNodePanelMapping}
              nodeHref={id}
              isVisible={!isTargeted && shouldActLikeHovered}
              nodeTypes={BPMN_OUTGOING_STRUCTURE[NODE_TYPES.gateway].nodes}
              edgeTypes={BPMN_OUTGOING_STRUCTURE[NODE_TYPES.gateway].edges}
            />
          </div>
          {/* Creates a div element with the node size to push down the <EditableNodeLabel /> */}
          {<div style={{ height: nodeDimensions.height, flexShrink: 0 }} />}
          {gateway["@_name"] && (
            <div
              style={{
                fontSize: "0.8em",
                marginTop: "10px",
                borderRadius: "5px",
                padding: "5px",
                backgroundColor: "rgba(0,0,0,0.05)",
                border: "1px solid rgba(0,0,0,0.5)",
                boxShadow: "rgba(0, 0, 0, 0.4) 2px 2px 6px",
                backdropFilter: "blur(4px)",
                textAlign: "center",
                width: "140%",
                marginLeft: "-20%",
              }}
            >
              {gateway["@_name"]}
            </div>
          )}
        </div>
      </>
    );
  },
  propsHaveSameValuesDeep
);

export const DataObjectNode = React.memo(
  ({
    data: { bpmnElement: dataObject, shape, index, shapeIndex },
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
      (s) => (isHovered || isResizing) && s.xyFlowReactKieDiagram.draggingNodes.length === 0
    );

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(id);
    useHoveredNodeAlwaysOnTop(ref, zIndex, shouldActLikeHovered, dragging, selected, isEditingLabel);

    const bpmnEditorStoreApi = useBpmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(isValidConnectionTarget, id, NODE_TYPES, EDGE_TYPES);
    const nodeDimensions = useNodeDimensions({ shape, nodeType: type as BpmnNodeType, MIN_NODE_SIZES });

    const setName = useCallback<OnEditableNodeLabelChange>(
      (newName: string) => {
        bpmnEditorStoreApi.setState((state) => {
          // FIXME: Tiago: Mutation (set node name)
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
        <svg className={`xyflow-react-kie-diagram--node-shape ${className} ${selected ? "selected" : ""}`}>
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
          <div className={"xyflow-react-kie-diagram--node"}>
            <InfoNodePanel
              isVisible={!isTargeted && shouldActLikeHovered}
              onClick={useCallback(() => {
                bpmnEditorStoreApi.setState((state) => {
                  state.diagram.propertiesPanel.isOpen = true;
                });
              }, [bpmnEditorStoreApi])}
            />

            <OutgoingStuffNodePanel
              nodeMapping={bpmnNodesOutgoingStuffNodePanelMapping}
              edgeMapping={bpmnEdgesOutgoingStuffNodePanelMapping}
              nodeHref={id}
              isVisible={!isTargeted && shouldActLikeHovered}
              nodeTypes={BPMN_OUTGOING_STRUCTURE[NODE_TYPES.dataObject].nodes}
              edgeTypes={BPMN_OUTGOING_STRUCTURE[NODE_TYPES.dataObject].edges}
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
    data: { bpmnElement: group, shape, index, shapeIndex },
    selected,
    dragging,
    zIndex,
    type,
    id,
  }: RF.NodeProps<BpmnDiagramNodeData<Normalized<BPMN20__tGroup> & { __$$element: "group" }>>) => {
    const renderCount = useRef<number>(0);
    renderCount.current++;

    const ref = useRef<SVGRectElement>(null);

    const snapGrid = useBpmnEditorStore((s) => s.xyFlowReactKieDiagram.snapGrid);
    const enableCustomNodeStyles = useBpmnEditorStore((s) => s.diagram.overlays.enableCustomNodeStyles);
    const isHovered = useIsHovered(ref);
    const isResizing = useNodeResizing(id);
    const shouldActLikeHovered = useBpmnEditorStore(
      (s) => (isHovered || isResizing) && s.xyFlowReactKieDiagram.draggingNodes.length === 0
    );
    const bpmnEditorStoreApi = useBpmnEditorStoreApi();
    const reactFlow = RF.useReactFlow<BpmnDiagramNodeData, BpmnDiagramEdgeData>();

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(id);
    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(isValidConnectionTarget, id, NODE_TYPES, EDGE_TYPES, true);
    const nodeDimensions = useNodeDimensions({ shape, nodeType: type as BpmnNodeType, MIN_NODE_SIZES });
    const setName = useCallback<OnEditableNodeLabelChange>(
      (newName: string) => {
        bpmnEditorStoreApi.setState((state) => {
          // FIXME: Tiago: Mutation (set node name)
          // renameGroupNode({ definitions: state.bpmn.model.definitions, newName, index });
        });
      },
      [bpmnEditorStoreApi]
    );

    // Select nodes that are visually entirely inside the group.
    useEffect(() => {
      const onDoubleClick = () => {
        bpmnEditorStoreApi.setState((state) => {
          state.xyFlowReactKieDiagram._selectedNodes = reactFlow.getNodes().flatMap((n) =>
            getContainmentRelationship({
              bounds: n.data.shape["dc:Bounds"]!,
              container: shape["dc:Bounds"]!,
              snapGrid: state.xyFlowReactKieDiagram.snapGrid,
              containerMinSizes: MIN_NODE_SIZES[NODE_TYPES.group],
              boundsMinSizes: MIN_NODE_SIZES[n.type as BpmnNodeType],
              borderAllowanceInPx: 0, // We only care about nodes that are completelyInside the Group node.
            }).isCompletelyInside
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
        <svg className={`xyflow-react-kie-diagram--node-shape ${className}`}>
          <GroupNodeSvg ref={ref} {...nodeDimensions} x={0} y={0} strokeWidth={3} />
        </svg>

        <div
          className={`xyflow-react-kie-diagram--node kie-bpmn-editor--group-node ${className}`}
          tabIndex={-1}
          onDoubleClick={triggerEditing}
          onKeyDown={triggerEditingIfEnter}
          data-nodehref={id}
          data-nodelabel={id}
        >
          {/* {`render count: ${renderCount.current}`}
          <br /> */}
          <OutgoingStuffNodePanel
            nodeMapping={bpmnNodesOutgoingStuffNodePanelMapping}
            edgeMapping={bpmnEdgesOutgoingStuffNodePanelMapping}
            nodeHref={id}
            isVisible={!isTargeted && selected && !dragging}
            nodeTypes={BPMN_OUTGOING_STRUCTURE[NODE_TYPES.group].nodes}
            edgeTypes={BPMN_OUTGOING_STRUCTURE[NODE_TYPES.group].edges}
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

export const LaneNode = React.memo(
  ({
    data: { bpmnElement: lane, shape, index, shapeIndex },
    selected,
    dragging,
    zIndex,
    type,
    id,
  }: RF.NodeProps<BpmnDiagramNodeData<Normalized<BPMN20__tLane> & { __$$element: "lane" }>>) => {
    const renderCount = useRef<number>(0);
    renderCount.current++;

    const ref = useRef<SVGRectElement>(null);

    const enableCustomNodeStyles = useBpmnEditorStore((s) => s.diagram.overlays.enableCustomNodeStyles);
    const isHovered = useIsHovered(ref);
    const isResizing = useNodeResizing(id);
    const shouldActLikeHovered = useBpmnEditorStore(
      (s) => (isHovered || isResizing) && s.xyFlowReactKieDiagram.draggingNodes.length === 0
    );

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(id);
    useHoveredNodeAlwaysOnTop(ref, zIndex, shouldActLikeHovered, dragging, selected, isEditingLabel);

    const bpmnEditorStoreApi = useBpmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(isValidConnectionTarget, id, NODE_TYPES, EDGE_TYPES);
    const nodeDimensions = useNodeDimensions({ shape, nodeType: type as BpmnNodeType, MIN_NODE_SIZES });

    const setName = useCallback<OnEditableNodeLabelChange>(
      (newName: string) => {
        bpmnEditorStoreApi.setState((state) => {
          // FIXME: Tiago: Mutation (set node name)
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
        <svg className={`xyflow-react-kie-diagram--node-shape ${className} ${selected ? "selected" : ""}`}>
          <LaneNodeSvg {...nodeDimensions} x={0} y={0} ref={ref} />
        </svg>
        <PositionalNodeHandles isTargeted={isTargeted && isValidConnectionTarget} nodeId={id} />
        <div
          onDoubleClick={triggerEditing}
          onKeyDown={triggerEditingIfEnter}
          className={`kie-bpmn-editor--lane-node ${className} kie-bpmn-editor--selected-lane-node`}
          tabIndex={-1}
          data-nodehref={id}
          data-nodelabel={lane["@_name"]}
        >
          {/* {`render count: ${renderCount.current}`}
          <br /> */}
          <div className={"xyflow-react-kie-diagram--node"}>
            <InfoNodePanel
              isVisible={!isTargeted && selected && !dragging}
              onClick={useCallback(() => {
                bpmnEditorStoreApi.setState((state) => {
                  state.diagram.propertiesPanel.isOpen = true;
                });
              }, [bpmnEditorStoreApi])}
            />

            {/* FIXME: Tiago */}
            <span style={{ position: "absolute", top: "20px", left: "20px" }}>{lane["@_name"]}</span>

            <OutgoingStuffNodePanel
              nodeMapping={bpmnNodesOutgoingStuffNodePanelMapping}
              edgeMapping={bpmnEdgesOutgoingStuffNodePanelMapping}
              nodeHref={id}
              isVisible={!isTargeted && selected && !dragging}
              nodeTypes={BPMN_OUTGOING_STRUCTURE[NODE_TYPES.lane].nodes}
              edgeTypes={BPMN_OUTGOING_STRUCTURE[NODE_TYPES.lane].edges}
            />

            {selected && !dragging && (
              <NodeResizerHandle
                nodeType={type as typeof NODE_TYPES.lane}
                nodeId={id}
                nodeShapeIndex={shapeIndex}
                MIN_NODE_SIZES={MIN_NODE_SIZES}
              />
            )}
          </div>
        </div>
      </>
    );
  },
  propsHaveSameValuesDeep
);

export const TextAnnotationNode = React.memo(
  ({
    data: { bpmnElement: textAnnotation, shape, index, shapeIndex },
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
      (s) => (isHovered || isResizing) && s.xyFlowReactKieDiagram.draggingNodes.length === 0
    );

    const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(id);
    useHoveredNodeAlwaysOnTop(ref, zIndex, shouldActLikeHovered, dragging, selected, isEditingLabel);

    const bpmnEditorStoreApi = useBpmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(isValidConnectionTarget, id, NODE_TYPES, EDGE_TYPES);
    const nodeDimensions = useNodeDimensions({
      nodeType: type as typeof NODE_TYPES.textAnnotation,
      shape,
      MIN_NODE_SIZES,
    });
    const setText = useCallback(
      (newText: string) => {
        bpmnEditorStoreApi.setState((state) => {
          // FIXME: Tiago: Mutation (set node name)
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
        <svg className={`xyflow-react-kie-diagram--node-shape ${className}`}>
          <TextAnnotationNodeSvg {...nodeDimensions} x={0} y={0} />
        </svg>

        <PositionalNodeHandles isTargeted={isTargeted && isValidConnectionTarget} nodeId={id} />

        <div
          ref={ref}
          className={`xyflow-react-kie-diagram--node kie-bpmn-editor--text-annotation-node ${className}`}
          tabIndex={-1}
          onDoubleClick={triggerEditing}
          onKeyDown={triggerEditingIfEnter}
          data-nodehref={id}
          data-nodelabel={String(textAnnotation.text)}
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
            nodeMapping={bpmnNodesOutgoingStuffNodePanelMapping}
            edgeMapping={bpmnEdgesOutgoingStuffNodePanelMapping}
            nodeHref={id}
            isVisible={!isTargeted && shouldActLikeHovered}
            nodeTypes={BPMN_OUTGOING_STRUCTURE[NODE_TYPES.textAnnotation].nodes}
            edgeTypes={BPMN_OUTGOING_STRUCTURE[NODE_TYPES.textAnnotation].edges}
          />
          <div>{String(textAnnotation.text)}</div>
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
      (s) => (isHovered || isResizing) && s.xyFlowReactKieDiagram.draggingNodes.length === 0
    );

    const bpmnEditorStoreApi = useBpmnEditorStoreApi();

    const { isTargeted, isValidConnectionTarget } = useConnectionTargetStatus(id, shouldActLikeHovered);
    const className = useNodeClassName(isValidConnectionTarget, id, NODE_TYPES, EDGE_TYPES);
    const nodeDimensions = useNodeDimensions({
      nodeType: type as typeof NODE_TYPES.unknown,
      shape,
      MIN_NODE_SIZES,
    });

    return (
      <>
        <svg className={`xyflow-react-kie-diagram--node-shape ${className}`}>
          <UnknownNodeSvg {...nodeDimensions} x={0} y={0} />
        </svg>

        <RF.Handle key={"unknown"} id={"unknown"} type={"source"} style={{ opacity: 0 }} position={RF.Position.Top} />

        <div
          ref={ref}
          className={`xyflow-react-kie-diagram--node kie-bpmn-editor--unknown-node ${className}`}
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

export function useActivityIcons(
  activity:
    | (Normalized<BPMN20__tSubProcess> & { __$$element: "transaction" | "adHocSubProcess" | "subProcess" })
    | (Normalized<BPMN20__tTask> & {
        __$$element: "task" | "serviceTask" | "userTask" | "businessRuleTask" | "scriptTask" | "callActivity";
      })
) {
  return useMemo(() => {
    const icons: ActivityNodeMarker[] = [];
    if (activity.__$$element === "adHocSubProcess") {
      icons.push(ActivityNodeMarker.AdHocSubProcess);
    }

    if (activity["@_isForCompensation"]) {
      icons.push(ActivityNodeMarker.Compensation);
    }

    if (activity.loopCharacteristics?.__$$element === "multiInstanceLoopCharacteristics") {
      icons.push(
        activity.loopCharacteristics["@_isSequential"]
          ? ActivityNodeMarker.MultiInstanceSequential
          : ActivityNodeMarker.MultiInstanceParallel
      );
    }

    if (activity.loopCharacteristics?.__$$element === "standardLoopCharacteristics") {
      icons.push(ActivityNodeMarker.Loop);
    }

    if (activity.__$$element === "callActivity") {
      icons.push(ActivityNodeMarker.Collapsed);
    }

    return icons;
  }, [activity]);
}
