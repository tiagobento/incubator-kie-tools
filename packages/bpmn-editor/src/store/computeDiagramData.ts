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

import { GraphStructureAdjacencyList, GraphStructureEdge } from "@kie-tools/xyflow-react-kie-diagram/dist/graph/graph";
import { snapShapeDimensions } from "@kie-tools/xyflow-react-kie-diagram/dist/snapgrid/SnapGrid";
import { XyFlowDiagramData } from "@kie-tools/xyflow-react-kie-diagram/dist/store/State";
import * as RF from "reactflow";
import {
  BPMN_CONTAINMENT_MAP,
  BpmnDiagramEdgeData,
  BpmnDiagramNodeData,
  BpmnEdgeElement,
  BpmnEdgeType,
  BpmnNodeElement,
  BpmnNodeType,
  EDGE_TYPES,
  elementToEdgeType,
  elementToNodeType,
  NODE_TYPES,
} from "../diagram/BpmnDiagramDomain";
import { MIN_NODE_SIZES } from "../diagram/BpmnDiagramDomain";
import { BpmnXyFlowDiagramState, State } from "./Store";
import { NODE_LAYERS } from "@kie-tools/xyflow-react-kie-diagram/dist/nodes/Hooks";

export function computeDiagramData(
  definitions: State["bpmn"]["model"]["definitions"],
  xyFlowReactKieDiagram: BpmnXyFlowDiagramState["xyFlowReactKieDiagram"],
  snapGrid: BpmnXyFlowDiagramState["xyFlowReactKieDiagram"]["snapGrid"]
): XyFlowDiagramData<BpmnNodeType, BpmnDiagramNodeData, BpmnDiagramEdgeData> {
  const nodeBpmnElementsById = new Map<string, BpmnNodeElement>();
  const edgeBpmnElementsById = new Map<string, BpmnEdgeElement>();

  definitions.rootElement
    ?.flatMap((s) => (s.__$$element !== "process" ? [] : s))
    .flatMap((s) => [
      ...(s.flowElement ?? []),
      ...(s.artifact ?? []),
      ...(s.laneSet ?? []).flatMap((s) => s.lane ?? []).map((l) => ({ ...l, __$$element: "lane" as const })),
    ])
    .forEach((bpmnElement) => {
      // nodes
      if (
        // activities
        // ->  sub-processes
        bpmnElement?.__$$element === "subProcess" ||
        bpmnElement?.__$$element === "adHocSubProcess" ||
        bpmnElement?.__$$element === "transaction" ||
        bpmnElement?.__$$element === "callActivity" || // a.k.a. reusable sub-process
        // ->  tasks
        bpmnElement?.__$$element === "businessRuleTask" ||
        bpmnElement?.__$$element === "scriptTask" ||
        bpmnElement?.__$$element === "serviceTask" ||
        bpmnElement?.__$$element === "userTask" ||
        bpmnElement?.__$$element === "task" ||
        // events
        bpmnElement?.__$$element === "boundaryEvent" ||
        bpmnElement?.__$$element === "startEvent" ||
        bpmnElement?.__$$element === "intermediateCatchEvent" ||
        bpmnElement?.__$$element === "intermediateThrowEvent" ||
        bpmnElement?.__$$element === "endEvent" ||
        // gateways
        bpmnElement?.__$$element === "complexGateway" ||
        bpmnElement?.__$$element === "eventBasedGateway" ||
        bpmnElement?.__$$element === "exclusiveGateway" ||
        bpmnElement?.__$$element === "inclusiveGateway" ||
        bpmnElement?.__$$element === "parallelGateway" ||
        // lanes
        bpmnElement?.__$$element === "lane" ||
        // artifacts
        bpmnElement?.__$$element === "group" ||
        bpmnElement?.__$$element === "textAnnotation"
      ) {
        nodeBpmnElementsById.set(bpmnElement["@_id"], bpmnElement);
      }

      // edges
      else if (
        bpmnElement?.__$$element === "sequenceFlow" || //
        bpmnElement?.__$$element === "association"
      ) {
        edgeBpmnElementsById.set(bpmnElement["@_id"], bpmnElement);
      }

      // other
      else {
        // ignore
      }
    }, new Map<string, BpmnNodeElement>()) ?? new Map<string, BpmnNodeElement>();

  const { selectedNodes, draggingNodes, resizingNodes, selectedEdges } = {
    selectedNodes: new Set(xyFlowReactKieDiagram._selectedNodes),
    draggingNodes: new Set(xyFlowReactKieDiagram.draggingNodes),
    resizingNodes: new Set(xyFlowReactKieDiagram.resizingNodes),
    selectedEdges: new Set(xyFlowReactKieDiagram._selectedEdges),
  };

  const nodes: RF.Node<BpmnDiagramNodeData, BpmnNodeType>[] = (definitions["bpmndi:BPMNDiagram"] ?? [])
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

      const n: RF.Node<BpmnDiagramNodeData, BpmnNodeType> = {
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
          parentXyFlowNode: undefined,
        },
        className:
          BPMN_CONTAINMENT_MAP.has(nodeType) || nodeType === NODE_TYPES.group
            ? "xyflow-react-kie-diagram--containerNode"
            : "",
        zIndex:
          bpmnElement.__$$element === "lane"
            ? NODE_LAYERS.GROUP_NODES
            : bpmnElement.__$$element === "transaction"
              ? NODE_LAYERS.CONTAINER_NODES
              : bpmnElement.__$$element === "boundaryEvent"
                ? NODE_LAYERS.NESTED_NODES
                : NODE_LAYERS.NODES,
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

  const nodesById = nodes.reduce(
    (acc, n) => acc.set(n.id, n),
    new Map<string, RF.Node<BpmnDiagramNodeData, BpmnNodeType>>()
  );

  const selectedNodesById = xyFlowReactKieDiagram._selectedNodes.reduce(
    (acc, s) => acc.set(s, nodesById.get(s)!),
    new Map<string, RF.Node<BpmnDiagramNodeData, BpmnNodeType>>()
  );

  const selectedNodeTypes = xyFlowReactKieDiagram._selectedNodes.reduce(
    (acc, s) => acc.add(nodesById.get(s)!.type as BpmnNodeType),
    new Set<BpmnNodeType>()
  );

  const edges: RF.Edge<BpmnDiagramEdgeData>[] = (definitions["bpmndi:BPMNDiagram"] ?? [])
    .flatMap((d) => d["bpmndi:BPMNPlane"]["di:DiagramElement"])
    .flatMap((bpmnEdge, i) => {
      if (bpmnEdge?.__$$element !== "bpmndi:BPMNEdge") {
        return [];
      }

      const bpmnElement = edgeBpmnElementsById.get(bpmnEdge["@_bpmnElement"]!);
      if (bpmnElement?.__$$element !== "sequenceFlow" && bpmnElement?.__$$element !== "association") {
        return []; // Ignoring edge with wrong type of bpmnElement.
      }
      if (!bpmnElement) {
        console.warn("WARNING: BPMNEdge without SequenceFlow/Association: " + bpmnEdge["@_id"]);
        return []; // Ignoring BPMNEdge without SequenceFlow/Association
      }

      const sourceId = bpmnElement["@_sourceRef"];
      const targetId = bpmnElement["@_targetRef"];

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

  const selectedEdgesById = xyFlowReactKieDiagram._selectedEdges.reduce(
    (acc, s) => acc.set(s, edgesById.get(s)!),
    new Map<string, RF.Edge<BpmnDiagramEdgeData>>()
  );

  const sortedNodes = [...nodes]
    .sort((a, b) => Number(b.type === NODE_TYPES.subProcess) - Number(a.type === NODE_TYPES.subProcess))
    .sort((a, b) => Number(b.type === NODE_TYPES.lane) - Number(a.type === NODE_TYPES.lane))
    .sort((a, b) => Number(b.type === NODE_TYPES.group) - Number(a.type === NODE_TYPES.group));

  return {
    graphStructureEdges,
    graphStructureAdjacencyList,
    nodes: sortedNodes,
    edges,
    edgesById,
    nodesById,
    selectedNodeTypes,
    selectedNodesById,
    selectedEdgesById,
  };
}
