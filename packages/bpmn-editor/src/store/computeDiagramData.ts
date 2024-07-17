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
import { BpmnDiagramNodeData } from "../diagram/nodes/Nodes";
import { State } from "./Store";
import { ReactFlowEditorDiagramData } from "@kie-tools/reactflow-editors-base/dist/store/State";
import { NODE_TYPES } from "../diagram/nodes/NodeTypes";
import { SnapGrid, snapShapeDimensions } from "@kie-tools/reactflow-editors-base/dist/snapgrid/SnapGrid";
import { MIN_NODE_SIZES } from "../diagram/nodes/DefaultSizes";

export function computeDiagramData(
  definitions: State["bpmn"]["model"]["definitions"],
  snapGrid: SnapGrid
): ReactFlowEditorDiagramData<BpmnNodeType, BpmnDiagramNodeData, BpmnDiagramEdgeData> {
  const nodes: RF.Node<BpmnDiagramNodeData>[] =
    definitions["bpmndi:BPMNDiagram"]
      ?.flatMap((s) => s["bpmndi:BPMNPlane"]["di:DiagramElement"])
      .flatMap((s, i) => {
        if (s?.__$$element !== "bpmndi:BPMNShape") {
          return [];
        }
        return {
          id: s?.["@_id"],
          position: {
            x: s?.["dc:Bounds"]?.["@_x"],
            y: s?.["dc:Bounds"]?.["@_y"],
          },
          data: {
            bpmnObject: {
              "@_id": s["@_id"],
              __$$element: "task",
            },
            shape: s,
            index: i,
            shapeIndex: i,
            parentRfNode: undefined,
          },
          width: s?.["dc:Bounds"]?.["@_width"],
          height: s?.["dc:Bounds"]?.["@_height"],
          type: NODE_TYPES.task,
          style: { ...snapShapeDimensions(snapGrid, s, MIN_NODE_SIZES[NODE_TYPES.task]({ snapGrid: snapGrid })) },
        };
      }) ?? [];

  // definitions.rootElement
  //   ?.filter((s) => s.__$$element === "process")[0]
  //   .flowElement?.filter((s) => s.__$$element === "task")
  //   .map((s) => s["@_id"]);

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
