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
import { BpmnEdgeType, BpmnNodeType, bpmnGraphStructure, bpmnNodesContainmentMap } from "./BpmnGraphStructure";
import { BpmnPalette } from "./BpmnPalette";
import { DiagramContainerContextProvider } from "./DiagramContainerContext";
import { EDGE_TYPES } from "./edges/EdgeTypes";
import { AssociationEdge, SequenceFlowEdge } from "./edges/Edges";
import { MIN_NODE_SIZES } from "./nodes/DefaultSizes";
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
import { ConnectionLine as ReactFlowDiagramConnectionLine } from "@kie-tools/reactflow-editors-base/dist/edges/ConnectionLine";
import { DEFAULT_NODE_SIZES } from "./nodes/DefaultSizes";

const nodeTypes: Record<BpmnNodeType, any> = {
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

const edgeTypes: Record<BpmnEdgeType, any> = {
  [EDGE_TYPES.sequenceFlow]: SequenceFlowEdge,
  [EDGE_TYPES.association]: AssociationEdge,
};

export function BpmnDiagram({
  container,
  ref,
}: {
  ref: React.RefObject<DiagramRef>;
  container: React.RefObject<HTMLElement>;
}) {
  const [showEmptyState, setShowEmptyState] = useState(true);

  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

  const thisBpmn = useBpmnEditorStore((s) => s.bpmn.model);

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
          ref={ref}
          container={container}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          modelBeforeEditingRef={bpmnModelBeforeEditingRef}
          model={thisBpmn}
          resetToBeforeEditingBegan={resetToBeforeEditingBegan}
          containmentMap={bpmnNodesContainmentMap}
          NODE_TYPES={NODE_TYPES}
          MIN_NODE_SIZES={MIN_NODE_SIZES}
          graphStructure={bpmnGraphStructure}
          connectionLineComponent={ConnectionLine}
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
      DEFAULT_NODE_SIZES={DEFAULT_NODE_SIZES}
      graphStructure={bpmnGraphStructure}
    />
  );
}
