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

import { BPMN20__tProcess, BPMNDI__BPMNShape } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import {
  Diagram,
  DiagramRef,
  OnNodeDeleted,
  OnNodeRepositioned,
} from "@kie-tools/reactflow-editors-base/dist/diagram/Diagram";
import {
  ConnectionLineEdgeMapping,
  ConnectionLineNodeMapping,
  ConnectionLine as ReactFlowDiagramConnectionLine,
} from "@kie-tools/reactflow-editors-base/dist/edges/ConnectionLine";
import { EdgeMarkers } from "@kie-tools/reactflow-editors-base/dist/edges/EdgeMarkers";
import * as React from "react";
import { useCallback, useState } from "react";
import * as RF from "reactflow";
import { useBpmnEditor } from "../BpmnEditorContext";
import { normalize } from "../normalization/normalize";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../store/StoreContext";
import { BpmnDiagramCommands } from "./BpmnDiagramCommands";
import { BpmnDiagramEmptyState } from "./BpmnDiagramEmptyState";
import { TopRightCornerPanels } from "./BpmnDiagramTopRightPanels";
import { BPMN_CONTAINMENT_MAP, BPMN_GRAPH_STRUCTURE, BpmnEdgeType, BpmnNodeType } from "./BpmnGraphStructure";
import { BpmnPalette } from "./BpmnPalette";
import { DiagramContainerContextProvider } from "./DiagramContainerContext";
import { AssociationPath, SequenceFlowPath } from "./edges/EdgeSvgs";
import { EDGE_TYPES } from "./edges/EdgeTypes";
import { AssociationEdge, SequenceFlowEdge } from "./edges/Edges";
import { DEFAULT_NODE_SIZES, MIN_NODE_SIZES } from "./nodes/NodeSizes";
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
import { NODE_TYPES } from "./nodes/NodeTypes";
import {
  BpmnDiagramNodeData,
  DataObjectNode,
  EndEventNode,
  GatewayNode,
  GroupNode,
  IntermediateCatchEventNode,
  IntermediateThrowEventNode,
  StartEventNode,
  SubProcessNode,
  TaskNode,
  TextAnnotationNode,
  UnknownNode,
} from "./nodes/Nodes";

export function BpmnDiagram({
  container,
  diagramRef,
}: {
  diagramRef: React.RefObject<DiagramRef>;
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

  const onNodeRepositioned = useCallback<OnNodeRepositioned<BpmnDiagramNodeData>>(
    ({ node, newPosition }) => {
      bpmnEditorStoreApi.setState((s) => {
        const shape = (s.bpmn.model.definitions["bpmndi:BPMNDiagram"] ?? [])
          .flatMap((d) => d["bpmndi:BPMNPlane"]["di:DiagramElement"])
          .filter((bpmnElement) => bpmnElement?.__$$element === "bpmndi:BPMNShape")
          .filter((bpmnShape) => bpmnShape?.["@_bpmnElement"] === node.id)?.[0] as BPMNDI__BPMNShape;

        shape["dc:Bounds"]["@_x"] = newPosition.x;
        shape["dc:Bounds"]["@_y"] = newPosition.y;
      });
    },
    [bpmnEditorStoreApi]
  );

  const onNodeDeleted = useCallback<OnNodeDeleted<BpmnDiagramNodeData>>(
    ({ node }) => {
      bpmnEditorStoreApi.setState((s) => {
        const process = s.bpmn.model.definitions.rootElement?.find(
          (s) => s.__$$element === "process"
        ) as BPMN20__tProcess;

        if (process) {
          process.artifact = process.artifact?.filter((s) => s["@_id"] !== node.id);
          process.flowElement = process.flowElement?.filter((s) => s["@_id"] !== node.id);
        }

        const plane = s.bpmn.model.definitions["bpmndi:BPMNDiagram"]?.[0]?.["bpmndi:BPMNPlane"];
        if (plane) {
          plane["di:DiagramElement"] = plane["di:DiagramElement"]?.filter((s) => s["@_bpmnElement"] !== node.id);
        }
      });
    },
    [bpmnEditorStoreApi]
  );

  return (
    <>
      {isEmptyStateShowing && <BpmnDiagramEmptyState setShowEmptyState={setShowEmptyState} />}
      <DiagramContainerContextProvider container={container}>
        <svg style={{ position: "absolute", top: 0, left: 0 }}>
          <EdgeMarkers />
        </svg>

        <Diagram
          // infra
          diagramRef={diagramRef}
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
          onNodeRepositioned={onNodeRepositioned}
          onNodeDeleted={onNodeDeleted}
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
