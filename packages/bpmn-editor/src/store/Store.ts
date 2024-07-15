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

import { BpmnLatestModel } from "@kie-tools/bpmn-marshaller";
import { enableMapSet } from "immer";
import * as RF from "reactflow";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { BpmnDiagramNodeData } from "../diagram/nodes/Nodes";
import { Normalized, normalize } from "../normalization/normalize";
import { ComputedStateCache } from "./ComputedStateCache";
import { computeDiagramData } from "./computed/computeDiagramData";
import { computeIsDropTargetNodeValidForSelection } from "./computed/computeIsDropTargetNodeValidForSelection";

enableMapSet(); // Necessary because `Computed` has a lot of Maps and Sets.

export interface BpmnEditorDiagramNodeStatus {
  selected: boolean;
  dragging: boolean;
  resizing: boolean;
}
export interface BpmnEditorDiagramEdgeStatus {
  selected: boolean;
  draggingWaypoint: boolean;
}

export interface SnapGrid {
  isEnabled: boolean;
  x: number;
  y: number;
}

export enum DiagramLhsPanel {
  NONE = "NONE",
}

export type DropTargetNode = undefined | RF.Node<BpmnDiagramNodeData>;

export interface State {
  dispatch: (s: State) => Dispatch;
  computed: (s: State) => Computed;
  bpmn: {
    model: Normalized<BpmnLatestModel>;
  };
  focus: {
    consumableId: string | undefined;
  };
  diagram: {
    edgeIdBeingUpdated: string | undefined;
    dropTargetNode: DropTargetNode;
    ongoingConnection: RF.OnConnectStartParams | undefined;
    propertiesPanel: {
      isOpen: boolean;
      elementId: string | undefined;
    };
    overlaysPanel: {
      isOpen: boolean;
    };
    openLhsPanel: DiagramLhsPanel;
    overlays: {
      enableNodeHierarchyHighlight: boolean;
      enableCustomNodeStyles: boolean;
    };
    snapGrid: SnapGrid;
    _selectedNodes: Array<string>;
    _selectedEdges: Array<string>;
    draggingNodes: Array<string>;
    resizingNodes: Array<string>;
    draggingWaypoints: Array<string>;
    isEditingStyle: boolean;
  };
}

// Read this to understand why we need computed as part of the store.
// https://github.com/pmndrs/zustand/issues/132#issuecomment-1120467721
export type Computed = {
  isDiagramEditingInProgress(): boolean;

  getDiagramData(): ReturnType<typeof computeDiagramData>;

  isDropTargetNodeValidForSelection(): boolean;
};

export type Dispatch = {
  bpmn: {
    reset: (model: State["bpmn"]["model"]) => void;
  };
  diagram: {
    setNodeStatus: (nodeId: string, status: Partial<BpmnEditorDiagramNodeStatus>) => void;
    setEdgeStatus: (edgeId: string, status: Partial<BpmnEditorDiagramEdgeStatus>) => void;
  };
};

export const defaultStaticState = (): Omit<State, "bpmn" | "dispatch" | "computed"> => ({
  focus: {
    consumableId: undefined,
  },
  diagram: {
    edgeIdBeingUpdated: undefined,
    dropTargetNode: undefined,
    ongoingConnection: undefined,
    propertiesPanel: {
      isOpen: false,
      elementId: undefined,
    },
    overlaysPanel: {
      isOpen: false,
    },
    openLhsPanel: DiagramLhsPanel.NONE,
    overlays: {
      enableNodeHierarchyHighlight: false,
      enableCustomNodeStyles: true,
    },
    snapGrid: {
      isEnabled: true,
      x: 20,
      y: 20,
    },
    _selectedNodes: [],
    _selectedEdges: [],
    draggingNodes: [],
    resizingNodes: [],
    draggingWaypoints: [],
    isEditingStyle: false,
  },
});

export function createBpmnEditorStore(model: BpmnLatestModel, computedCache: ComputedStateCache<Computed>) {
  const { diagram, ...defaultState } = defaultStaticState();
  return create(
    immer<State>(() => ({
      bpmn: {
        model: normalize(model),
      },
      ...defaultState,
      diagram: {
        ...diagram,
      },
      dispatch(s: State) {
        return {
          bpmn: {
            reset: () => {
              s.diagram._selectedNodes = [];
              s.diagram.draggingNodes = [];
              s.diagram.resizingNodes = [];
            },
          },
          diagram: {
            setNodeStatus: (nodeId, newStatus) => {
              //selected
              if (newStatus.selected !== undefined) {
                if (newStatus.selected) {
                  s.diagram._selectedNodes.push(nodeId);
                } else {
                  s.diagram._selectedNodes = s.diagram._selectedNodes.filter((s) => s !== nodeId);
                }
              }
              //dragging
              if (newStatus.dragging !== undefined) {
                if (newStatus.dragging) {
                  s.diagram.draggingNodes.push(nodeId);
                } else {
                  s.diagram.draggingNodes = s.diagram.draggingNodes.filter((s) => s !== nodeId);
                }
              }
              // resizing
              if (newStatus.resizing !== undefined) {
                if (newStatus.resizing) {
                  s.diagram.resizingNodes.push(nodeId);
                } else {
                  s.diagram.resizingNodes = s.diagram.resizingNodes.filter((s) => s !== nodeId);
                }
              }
            },
            setEdgeStatus: (edgeId, newStatus) => {
              //selected
              if (newStatus.selected !== undefined) {
                if (newStatus.selected) {
                  s.diagram._selectedEdges.push(edgeId);
                } else {
                  s.diagram._selectedEdges = s.diagram._selectedEdges.filter((s) => s !== edgeId);
                }
              }
              //dragging
              if (newStatus.draggingWaypoint !== undefined) {
                if (newStatus.draggingWaypoint) {
                  s.diagram.draggingWaypoints.push(edgeId);
                } else {
                  s.diagram.draggingWaypoints = s.diagram.draggingWaypoints.filter((s) => s !== edgeId);
                }
              }
            },
          },
        };
      },
      computed(s: State) {
        return {
          isDiagramEditingInProgress: () => {
            return computedCache.cached(
              "isDiagramEditingInProgress",
              (
                draggingNodesCount: number,
                resizingNodesCount: number,
                draggingWaypointsCount: number,
                movingDividerLinesCount: number,
                isisEditingStyle: boolean
              ) =>
                draggingNodesCount > 0 ||
                resizingNodesCount > 0 ||
                draggingWaypointsCount > 0 ||
                movingDividerLinesCount > 0 ||
                isisEditingStyle,
              [
                s.diagram.draggingNodes.length,
                s.diagram.resizingNodes.length,
                s.diagram.draggingWaypoints.length,
                s.diagram.isEditingStyle,
              ]
            );
          },

          isDropTargetNodeValidForSelection: () =>
            computedCache.cached("isDropTargetNodeValidForSelection", computeIsDropTargetNodeValidForSelection, [
              s.diagram.dropTargetNode,
              s.computed(s).getDiagramData(),
            ]),

          getDiagramData: () =>
            computedCache.cached("getDiagramData", computeDiagramData, [s.diagram, s.bpmn.model.definitions]),
        };
      },
    }))
  );
}
