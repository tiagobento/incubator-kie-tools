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

import { Diagram, DiagramRef } from "@kie-tools/reactflow-editors-base/dist/diagram/Diagram";
import { EdgeMarkers } from "@kie-tools/reactflow-editors-base/dist/edges/EdgeMarkers";
import * as React from "react";
import * as RF from "reactflow";
import { useCallback, useState } from "react";
import { useBpmnEditor } from "../BpmnEditorContext";
import { normalize } from "../normalization/normalize";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../store/StoreContext";
import { BpmnDiagramCommands } from "./BpmnDiagramCommands";
import { BpmnDiagramEmptyState } from "./BpmnDiagramEmptyState";
import { BpmnEdgeType, BpmnNodeType, BPMN_GRAPH_STRUCTURE, BPMN_CONTAINMENT_MAP } from "./BpmnGraphStructure";
import { BpmnPalette } from "./BpmnPalette";
import { DiagramContainerContextProvider } from "./DiagramContainerContext";
import { EDGE_TYPES } from "./edges/EdgeTypes";
import { AssociationEdge, SequenceFlowEdge } from "./edges/Edges";
import { MIN_NODE_SIZES } from "./nodes/NodeSizes";
import { NODE_TYPES } from "./nodes/NodeTypes";
import {
  DataObjectNode,
  TextAnnotationNode,
  UnknownNode,
  TaskNode,
  StartEventNode,
  IntermediateCatchEventNode,
  IntermediateThrowEventNode,
  EndEventNode,
  GroupNode,
  SubProcessNode,
  GatewayNode,
} from "./nodes/Nodes";
import { TopRightCornerPanels } from "./BpmnDiagramTopRightPanels";
import {
  ConnectionLineEdgeMapping,
  ConnectionLineNodeMapping,
  ConnectionLine as ReactFlowDiagramConnectionLine,
} from "@kie-tools/reactflow-editors-base/dist/edges/ConnectionLine";
import { DEFAULT_NODE_SIZES } from "./nodes/NodeSizes";
import {
  EndEventNodeSvg,
  GatewayNodeSvg,
  IntermediateCatchEventNodeSvg,
  IntermediateThrowEventNodeSvg,
  StartEventNodeSvg,
  SubProcessNodeSvg,
  TaskNodeSvg,
  TextAnnotationNodeSvg,
} from "./nodes/NodeSvgs";
import { AssociationPath, SequenceFlowPath } from "./edges/EdgeSvgs";

export function BpmnDiagram({
  container,
  ref,
}: {
  ref: React.RefObject<DiagramRef>;
  container: React.RefObject<HTMLElement>;
}) {
  const [showEmptyState, setShowEmptyState] = useState(true);

  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

  const model = useBpmnEditorStore((s) => s.bpmn.model);

  const { bpmnModelBeforeEditingRef } = useBpmnEditor();

  const resetToBeforeEditingBegan = useCallback(() => {
    bpmnEditorStoreApi.setState((state) => {
      state.bpmn.model = normalize(bpmnModelBeforeEditingRef.current);
      state.reactflowKieEditorDiagram.draggingNodes = [];
      state.reactflowKieEditorDiagram.draggingWaypoints = [];
      state.reactflowKieEditorDiagram.resizingNodes = [];
      state.reactflowKieEditorDiagram.dropTargetNode = undefined;
      state.reactflowKieEditorDiagram.edgeIdBeingUpdated = undefined;
    });
  }, [bpmnEditorStoreApi, bpmnModelBeforeEditingRef]);

  const nodes = useBpmnEditorStore((s) => s.computed(s).getDiagramData().nodes);

  const isEmptyStateShowing = showEmptyState && nodes.length === 0;

  return (
    <>
      {isEmptyStateShowing && <BpmnDiagramEmptyState setShowEmptyState={setShowEmptyState} />}
      <DiagramContainerContextProvider container={container}>
        <svg style={{ position: "absolute", top: 0, left: 0 }}>
          <EdgeMarkers />
        </svg>

        <Diagram
          // infra
          ref={ref}
          container={container}
          // model
          modelBeforeEditingRef={bpmnModelBeforeEditingRef}
          model={model}
          resetToBeforeEditingBegan={resetToBeforeEditingBegan}
          // components
          connectionLineComponent={ConnectionLine}
          nodeComponents={RF_NODE_TYPES}
          edgeComponents={RF_EDGE_TYPES}
          // domain
          containmentMap={BPMN_CONTAINMENT_MAP}
          nodeTypes={NODE_TYPES}
          minNodeSizes={MIN_NODE_SIZES}
          graphStructure={BPMN_GRAPH_STRUCTURE}
        >
          <BpmnPalette pulse={isEmptyStateShowing} />
          <TopRightCornerPanels availableHeight={container.current?.offsetHeight} />
          <BpmnDiagramCommands />
        </Diagram>
      </DiagramContainerContextProvider>
    </>
  );
}

export function ConnectionLine<N extends string, E extends string>(props: RF.ConnectionLineComponentProps) {
  return (
    <ReactFlowDiagramConnectionLine
      {...props}
      defaultNodeSizes={DEFAULT_NODE_SIZES}
      graphStructure={BPMN_GRAPH_STRUCTURE}
      nodeComponentsMapping={CONNECTION_LINE_NODE_COMPONENT_MAPPING}
      edgeComponentsMapping={CONNECTION_LINE_EDGE_COMPONENTS_MAPPING}
    />
  );
}

const RF_NODE_TYPES: Record<BpmnNodeType, any> = {
  [NODE_TYPES.startEvent]: StartEventNode,
  [NODE_TYPES.intermediateCatchEvent]: IntermediateCatchEventNode,
  [NODE_TYPES.intermediateThrowEvent]: IntermediateThrowEventNode,
  [NODE_TYPES.endEvent]: EndEventNode,
  [NODE_TYPES.task]: TaskNode,
  [NODE_TYPES.subProcess]: SubProcessNode,
  [NODE_TYPES.gateway]: GatewayNode,
  [NODE_TYPES.group]: GroupNode,
  [NODE_TYPES.textAnnotation]: TextAnnotationNode,
  [NODE_TYPES.dataObject]: DataObjectNode,
  [NODE_TYPES.unknown]: UnknownNode,
};

const RF_EDGE_TYPES: Record<BpmnEdgeType, any> = {
  [EDGE_TYPES.sequenceFlow]: SequenceFlowEdge,
  [EDGE_TYPES.association]: AssociationEdge,
};

const CONNECTION_LINE_NODE_COMPONENT_MAPPING: ConnectionLineNodeMapping<BpmnNodeType> = {
  [NODE_TYPES.startEvent]: StartEventNodeSvg,
  [NODE_TYPES.intermediateCatchEvent]: IntermediateCatchEventNodeSvg,
  [NODE_TYPES.intermediateThrowEvent]: IntermediateThrowEventNodeSvg,
  [NODE_TYPES.endEvent]: EndEventNodeSvg,
  [NODE_TYPES.task]: TaskNodeSvg,
  [NODE_TYPES.subProcess]: SubProcessNodeSvg,
  [NODE_TYPES.gateway]: GatewayNodeSvg,
  [NODE_TYPES.textAnnotation]: TextAnnotationNodeSvg,
  // Ignore
  node_dataObject: undefined as any,
  node_unknown: undefined as any,
  node_group: undefined as any,
};

const CONNECTION_LINE_EDGE_COMPONENTS_MAPPING: ConnectionLineEdgeMapping<BpmnEdgeType> = {
  [EDGE_TYPES.sequenceFlow]: SequenceFlowPath,
  [EDGE_TYPES.association]: AssociationPath,
};
