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

import { GraphStructureAdjacencyList, GraphStructureEdge } from "@kie-tools/reactflow-editors-base/dist/graph/graph";
import { snapShapeDimensions } from "@kie-tools/reactflow-editors-base/dist/snapgrid/SnapGrid";
import { ReactFlowEditorDiagramData } from "@kie-tools/reactflow-editors-base/dist/store/State";
import * as RF from "reactflow";
import { BpmnEdgeType, BpmnNodeType } from "../diagram/BpmnGraphStructure";
import { BpmnDiagramEdgeData } from "../diagram/edges/Edges";
import { EDGE_TYPES } from "../diagram/edges/EdgeTypes";
import { BpmnDiagramNodeData, EdgeBpmnElements, NodeBpmnElements } from "../diagram/nodes/Nodes";
import { MIN_NODE_SIZES } from "../diagram/nodes/NodeSizes";
import { NODE_TYPES } from "../diagram/nodes/NodeTypes";
import { BpmnReactFlowEditorDiagramState, State } from "./Store";

export function computeDiagramData(
  definitions: State["bpmn"]["model"]["definitions"],
  reactflowKieEditorDiagram: BpmnReactFlowEditorDiagramState["reactflowKieEditorDiagram"],
  snapGrid: BpmnReactFlowEditorDiagramState["reactflowKieEditorDiagram"]["snapGrid"]
): ReactFlowEditorDiagramData<BpmnNodeType, BpmnDiagramNodeData, BpmnDiagramEdgeData> {
  const nodeBpmnElementsById = new Map<string, NodeBpmnElements>();
  const edgeBpmnElementsById = new Map<string, EdgeBpmnElements>();

  definitions.rootElement
    ?.flatMap((s) => (s.__$$element !== "process" ? [] : s))
    .flatMap((s) => [...(s.flowElement ?? []), ...(s.artifact ?? [])])
    .forEach((flowElement) => {
      // nodes
      if (
        flowElement?.__$$element === "startEvent" ||
        flowElement?.__$$element === "intermediateCatchEvent" ||
        flowElement?.__$$element === "intermediateThrowEvent" ||
        flowElement?.__$$element === "complexGateway" ||
        flowElement?.__$$element === "eventBasedGateway" ||
        flowElement?.__$$element === "exclusiveGateway" ||
        flowElement?.__$$element === "inclusiveGateway" ||
        flowElement?.__$$element === "parallelGateway" ||
        flowElement?.__$$element === "businessRuleTask" ||
        flowElement?.__$$element === "choreographyTask" ||
        flowElement?.__$$element === "manualTask" ||
        flowElement?.__$$element === "receiveTask" ||
        flowElement?.__$$element === "scriptTask" ||
        flowElement?.__$$element === "sendTask" ||
        flowElement?.__$$element === "serviceTask" ||
        flowElement?.__$$element === "task" ||
        flowElement?.__$$element === "userTask" ||
        flowElement?.__$$element === "endEvent" ||
        flowElement?.__$$element === "group" ||
        flowElement?.__$$element === "textAnnotation"
      ) {
        nodeBpmnElementsById.set(flowElement["@_id"], flowElement);
      }

      // edges
      else if (
        flowElement?.__$$element === "sequenceFlow" || //
        flowElement?.__$$element === "association"
      ) {
        edgeBpmnElementsById.set(flowElement["@_id"], flowElement);
      }

      // other
      else {
        // ignore
      }
    }, new Map<string, NodeBpmnElements>()) ?? new Map<string, NodeBpmnElements>();

  const { selectedNodes, draggingNodes, resizingNodes, selectedEdges } = {
    selectedNodes: new Set(reactflowKieEditorDiagram._selectedNodes),
    draggingNodes: new Set(reactflowKieEditorDiagram.draggingNodes),
    resizingNodes: new Set(reactflowKieEditorDiagram.resizingNodes),
    selectedEdges: new Set(reactflowKieEditorDiagram._selectedEdges),
  };

  const nodes: RF.Node<BpmnDiagramNodeData>[] = (definitions["bpmndi:BPMNDiagram"] ?? [])
    .flatMap((d) => d["bpmndi:BPMNPlane"]["di:DiagramElement"])
    .flatMap((bpmnShape, i) => {
      if (bpmnShape?.__$$element !== "bpmndi:BPMNShape") {
        return [];
      }

      const bpmnElement = nodeBpmnElementsById.get(bpmnShape["@_bpmnElement"]!);
      if (!bpmnElement) {
        return []; // FIXME: Tiago: Unknown node
      }
      const nodeType = elementToNodeType[bpmnElement.__$$element];
      const id = bpmnElement["@_id"];

      const n: RF.Node<BpmnDiagramNodeData> = {
        id,
        position: {
          x: bpmnShape?.["dc:Bounds"]?.["@_x"],
          y: bpmnShape?.["dc:Bounds"]?.["@_y"],
        },
        data: {
          bpmnElement,
          shape: bpmnShape,
          index: i,
          shapeIndex: i,
          parentRfNode: undefined,
        },
        selected: selectedNodes.has(id),
        resizing: resizingNodes.has(id),
        dragging: draggingNodes.has(id),
        width: bpmnShape?.["dc:Bounds"]?.["@_width"],
        height: bpmnShape?.["dc:Bounds"]?.["@_height"],
        type: nodeType,
        style: { ...snapShapeDimensions(snapGrid, bpmnShape, MIN_NODE_SIZES[nodeType]({ snapGrid })) },
      };

      return n;
    });

  const nodesById = nodes.reduce((acc, n) => acc.set(n.id, n), new Map<string, RF.Node<BpmnDiagramNodeData>>());

  const selectedNodesById = reactflowKieEditorDiagram._selectedNodes.reduce(
    (acc, s) => acc.set(s, nodesById.get(s)!),
    new Map<string, RF.Node<BpmnDiagramNodeData>>()
  );

  const selectedNodeTypes = reactflowKieEditorDiagram._selectedNodes.reduce(
    (acc, s) => acc.add(nodesById.get(s)!.type as BpmnNodeType),
    new Set<BpmnNodeType>()
  );

  const edges: RF.Edge<BpmnDiagramEdgeData>[] = (definitions["bpmndi:BPMNDiagram"] ?? [])
    .flatMap((d) => d["bpmndi:BPMNPlane"]["di:DiagramElement"])
    .flatMap((bpmnEdge, i) => {
      if (bpmnEdge?.__$$element !== "bpmndi:BPMNEdge") {
        return [];
      }

      // (begin)
      // This logic comes from the BPMN Editor (classic). Where the id of an edge contains information about the source/target shapes.
      // edge_shape__FC832C6B-4A2F-40F0-96DD-A3CB34B22575_to_shape__88064D68-4F0B-47D4-9618-0972B954DFDC
      const [ss, tt] = bpmnEdge["@_id"].replace("edge_shape_", "").split("_to_shape_");
      const sourceId = bpmnEdge["@_sourceElement"] ?? ss;
      const targetId = bpmnEdge["@_targetElement"] ?? tt;
      // (end)

      const bpmnElement = edgeBpmnElementsById.get(bpmnEdge["@_bpmnElement"]!);
      if (bpmnElement?.__$$element !== "sequenceFlow" && bpmnElement?.__$$element !== "association") {
        return []; // Ignoring edge with wrong type of bpmnElement.
      }
      if (!bpmnElement) {
        console.warn("WARNING: BPMNEdge without SequenceFlow/Association: " + bpmnEdge["@_id"]);
        return []; // Ignoring BPMNEdge without SequenceFlow/Association
      }

      const shapeSource = nodesById.get(sourceId)?.data?.shape;
      const shapeTarget = nodesById.get(targetId)?.data?.shape;
      if (shapeSource === undefined || shapeTarget === undefined) {
        console.log("source " + sourceId);
        console.log("target " + targetId);
        return [];
      }

      const id = bpmnElement["@_id"];
      const e: RF.Edge<BpmnDiagramEdgeData> = {
        id,
        source: sourceId,
        target: targetId,
        data: {
          "@_id": id,
          "di:waypoint": bpmnEdge["di:waypoint"],
          shapeSource,
          shapeTarget,
          edgeInfo: { id, sourceId, targetId },
          //
          bpmnEdge: bpmnEdge,
          bpmnEdgeIndex: i,
          bpmnElement,
          bpmnShapeSource: shapeSource,
          bpmnShapeTarget: shapeTarget,
        },
        selected: selectedEdges.has(id),
        type: elementToEdgeType[bpmnElement.__$$element],
      };
      return e;
    });

  const graphStructureEdges: GraphStructureEdge[] = edges.map((s) => ({
    id: s.id,
    sourceId: s.source,
    targetId: s.target,
  }));

  const graphStructureAdjacencyList: GraphStructureAdjacencyList = graphStructureEdges.reduce((acc, e) => {
    const targetAdjancyList = acc.get(e.targetId);
    if (!targetAdjancyList) {
      return acc.set(e.targetId, { dependencies: new Set([e.sourceId]) });
    } else {
      targetAdjancyList.dependencies.add(e.sourceId);
      return acc;
    }
  }, new Map<string, { dependencies: Set<string> }>());

  const edgesById = edges.reduce((acc, e) => acc.set(e.id, e), new Map<string, RF.Edge<BpmnDiagramEdgeData>>());

  const selectedEdgesById = reactflowKieEditorDiagram._selectedEdges.reduce(
    (acc, s) => acc.set(s, edgesById.get(s)!),
    new Map<string, RF.Edge<BpmnDiagramEdgeData>>()
  );

  return {
    graphStructureEdges,
    graphStructureAdjacencyList,
    nodes,
    edges,
    edgesById,
    nodesById,
    selectedNodeTypes,
    selectedNodesById,
    selectedEdgesById,
  };
}

export const elementToNodeType: Record<NonNullable<NodeBpmnElements>["__$$element"], BpmnNodeType> = {
  // start event
  startEvent: NODE_TYPES.startEvent,
  // intermediate events
  intermediateCatchEvent: NODE_TYPES.intermediateCatchEvent,
  intermediateThrowEvent: NODE_TYPES.intermediateThrowEvent,
  // tasks
  businessRuleTask: NODE_TYPES.task,
  choreographyTask: NODE_TYPES.task,
  task: NODE_TYPES.task,
  userTask: NODE_TYPES.task,
  manualTask: NODE_TYPES.task,
  scriptTask: NODE_TYPES.task,
  sendTask: NODE_TYPES.task,
  serviceTask: NODE_TYPES.task,
  // subprocess
  subProcess: NODE_TYPES.subProcess,
  // end event
  endEvent: NODE_TYPES.endEvent,
  // gateway
  complexGateway: NODE_TYPES.gateway,
  eventBasedGateway: NODE_TYPES.gateway,
  exclusiveGateway: NODE_TYPES.gateway,
  inclusiveGateway: NODE_TYPES.gateway,
  parallelGateway: NODE_TYPES.gateway,
  // misc
  dataObject: NODE_TYPES.dataObject,
  group: NODE_TYPES.group,
  textAnnotation: NODE_TYPES.textAnnotation,
  //
  // unknown
  //
  adHocSubProcess: NODE_TYPES.unknown,
  boundaryEvent: NODE_TYPES.unknown,
  callActivity: NODE_TYPES.unknown,
  callChoreography: NODE_TYPES.unknown,
  event: NODE_TYPES.unknown,
  implicitThrowEvent: NODE_TYPES.unknown,
  receiveTask: NODE_TYPES.unknown,
  subChoreography: NODE_TYPES.unknown,
  transaction: NODE_TYPES.unknown,
  // edges (ignore)
  dataObjectReference: NODE_TYPES.unknown,
  dataStoreReference: NODE_TYPES.unknown,
};

export const elementToEdgeType: Record<NonNullable<EdgeBpmnElements>["__$$element"], BpmnEdgeType> = {
  association: EDGE_TYPES.association,
  sequenceFlow: EDGE_TYPES.sequenceFlow,
};
