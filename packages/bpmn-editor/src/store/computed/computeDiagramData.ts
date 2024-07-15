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
import { NodeType } from "../../diagram/connections/graphStructure";
import { BpmnDiagramEdgeData } from "../../diagram/edges/Edges";
import { BpmnDiagramNodeData } from "../../diagram/nodes/Nodes";
import { State } from "../Store";

export const NODE_LAYERS = {
  GROUP_NODE: 0,
  NODES: 1000, // We need a difference > 1000 here, since ReactFlow will add 1000 to the z-index when a node is selected.
  CONTAINING_NODS: 2000, // We need a difference > 1000 here, since ReactFlow will add 1000 to the z-index when a node is selected.
  NESTED_NODES: 4000,
};

export function computeDiagramData(diagram: State["diagram"], definitions: State["bpmn"]["model"]["definitions"]) {
  return {
    processFlowEdges: [],
    processFlowAdjacencyList: [],
    nodes: [],
    edges: [],
    edgesById: new Map(),
    externalNodesByNamespace: new Map(),
    nodesById: new Map(),
    selectedNodeTypes: new Set<NodeType>(),
    selectedNodesById: new Map<string, RF.Node<BpmnDiagramNodeData>>(),
    selectedEdgesById: new Map<string, RF.Edge<BpmnDiagramEdgeData>>(),
  };
}
