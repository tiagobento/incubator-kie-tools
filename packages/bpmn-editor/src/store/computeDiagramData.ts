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

import * as RF from "reactflow";
import { BpmnNodeType } from "../diagram/BpmnGraphStructure";
import { BpmnDiagramEdgeData } from "../diagram/edges/Edges";
import { BpmnDiagramNodeData, NodeBpmnObjects } from "../diagram/nodes/Nodes";
import { State } from "./Store";
import { ReactFlowEditorDiagramData } from "@kie-tools/reactflow-editors-base/dist/store/State";
import { NODE_TYPES } from "../diagram/nodes/NodeTypes";
import { SnapGrid, snapShapeDimensions } from "@kie-tools/reactflow-editors-base/dist/snapgrid/SnapGrid";
import { MIN_NODE_SIZES } from "../diagram/nodes/NodeSizes";

export function computeDiagramData(
  definitions: State["bpmn"]["model"]["definitions"],
  snapGrid: SnapGrid
): ReactFlowEditorDiagramData<BpmnNodeType, BpmnDiagramNodeData, BpmnDiagramEdgeData> {
  const bpmnObjectsById =
    definitions.rootElement
      ?.flatMap((s) => {
        if (s.__$$element !== "process") {
          return [];
        }

        return s;
      })
      .flatMap((s) => {
        return s.flowElement;
      })
      .reduce((acc, flowElement) => {
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
          flowElement?.__$$element === "endEvent"
        ) {
          return acc.set(flowElement["@_id"], flowElement);
        } else {
          return acc;
        }
      }, new Map<string, NodeBpmnObjects>()) ?? new Map<string, NodeBpmnObjects>();

  const nodes: RF.Node<BpmnDiagramNodeData>[] =
    definitions["bpmndi:BPMNDiagram"]
      ?.flatMap((s) => s["bpmndi:BPMNPlane"]["di:DiagramElement"])
      .flatMap((s, i) => {
        if (s?.__$$element !== "bpmndi:BPMNShape") {
          return [];
        }

        const bpmnObject = bpmnObjectsById.get(s["@_bpmnElement"]!);
        if (!bpmnObject) {
          return {} as any; // FIXME: Tiago: Unknown node
        }
        const nodeType = elementToNodeType[bpmnObject.__$$element];
        return {
          id: s?.["@_id"],
          position: {
            x: s?.["dc:Bounds"]?.["@_x"],
            y: s?.["dc:Bounds"]?.["@_y"],
          },
          data: {
            bpmnObject,
            shape: s,
            index: i,
            shapeIndex: i,
            parentRfNode: undefined,
          },
          width: s?.["dc:Bounds"]?.["@_width"],
          height: s?.["dc:Bounds"]?.["@_height"],
          type: nodeType,
          style: { ...snapShapeDimensions(snapGrid, s, MIN_NODE_SIZES[nodeType]({ snapGrid })) },
        };
      }) ?? [];

  return {
    graphStructureEdges: [],
    graphStructureAdjacencyList: new Map(),
    nodes,
    edges: [],
    edgesById: nodes.reduce((acc, n) => acc.set(n.id, n), new Map()),
    nodesById: new Map(),
    selectedNodeTypes: new Set<BpmnNodeType>(),
    selectedNodesById: new Map<string, RF.Node<BpmnDiagramNodeData>>(),
    selectedEdgesById: new Map<string, RF.Edge<BpmnDiagramEdgeData>>(),
  };
}

export const elementToNodeType: Record<NonNullable<NodeBpmnObjects>["__$$element"], BpmnNodeType> = {
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
  // edges
  dataObjectReference: NODE_TYPES.unknown,
  dataStoreReference: NODE_TYPES.unknown,
  sequenceFlow: NODE_TYPES.unknown,
  association: NODE_TYPES.unknown,
};
