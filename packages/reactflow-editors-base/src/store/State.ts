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
import { SnapGrid } from "../snapgrid/SnapGrid";
import { DC__Point, DC__Shape } from "../maths/model";
import { GraphStructureAdjacencyList, GraphStructureEdge } from "../graph/graph";

export type ReactFlowKieEditorDiagramNodeData = {
  shape: DC__Shape;
};

export type ReactFlowKieEditorDiagramEdgeData = {
  edgeInfo: GraphStructureEdge;
  ["di:waypoint"]: DC__Point[];
  ["@_id"]: string;
  shapeSource: DC__Shape;
  shapeTarget: DC__Shape;
};

export type ReactFlowEditorDiagramData<
  N extends string,
  NData extends ReactFlowKieEditorDiagramNodeData,
  EData extends ReactFlowKieEditorDiagramEdgeData,
> = {
  graphStructureEdges: GraphStructureEdge[];
  graphStructureAdjacencyList: GraphStructureAdjacencyList;
  nodes: RF.Node<NData>[];
  edges: RF.Edge<EData>[];
  edgesById: Map<string, RF.Edge<EData>>;
  nodesById: Map<string, RF.Node<NData>>;
  selectedNodeTypes: Set<N>;
  selectedNodesById: Map<string, RF.Node<NData>>;
  selectedEdgesById: Map<string, RF.Edge<EData>>;
};

export interface ReactFlowKieEditorDiagramNodeStatus {
  selected: boolean;
  dragging: boolean;
  resizing: boolean;
}
export interface ReactFlowKieEditorDiagramEdgeStatus {
  selected: boolean;
  draggingWaypoint: boolean;
}

export type ReactFlowEditorDiagramState<
  S extends ReactFlowEditorDiagramState<S, N, NData, EData>,
  N extends string,
  NData extends ReactFlowKieEditorDiagramNodeData,
  EData extends ReactFlowKieEditorDiagramEdgeData,
> = {
  computed(s: S): {
    getDiagramData(): ReactFlowEditorDiagramData<N, NData, EData>;
    isDiagramEditingInProgress(): boolean;
    isDropTargetNodeValidForSelection(): boolean;
  };
  dispatch(s: S): {
    setNodeStatus: (nodeId: string, status: Partial<ReactFlowKieEditorDiagramNodeStatus>) => any;
    setEdgeStatus: (edgeId: string, status: Partial<ReactFlowKieEditorDiagramEdgeStatus>) => any;
  };
  reactflowKieEditorDiagram: {
    snapGrid: SnapGrid;
    _selectedNodes: Array<string>;
    _selectedEdges: Array<string>;
    draggingNodes: Array<string>;
    resizingNodes: Array<string>;
    draggingWaypoints: Array<string>;
    edgeIdBeingUpdated: string | undefined;
    dropTargetNode: undefined | RF.Node<NData>;
    ongoingConnection: RF.OnConnectStartParams | undefined;
  };
};
