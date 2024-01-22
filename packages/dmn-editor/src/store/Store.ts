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

import { DmnLatestModel } from "@kie-tools/dmn-marshaller";
import { DMN15__tImport } from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { createContext, useContext } from "react";
import * as RF from "reactflow";
import { StoreApi, UseBoundStore, create } from "zustand";
import { WithImmer, immer } from "zustand/middleware/immer";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { ExternalModelsIndex } from "../DmnEditor";
import { NodeType } from "../diagram/connections/graphStructure";
import { isValidContainment } from "../diagram/connections/isValidContainment";
import { DmnDiagramNodeData } from "../diagram/nodes/Nodes";
import {
  computeAllFeelVariableUniqueNames,
  computeAllUniqueFeelNames,
  computeDataTypes,
  computeDiagramData,
  computeExternalModelsByType,
  computeImportsByNamespace,
  computeIndexes,
  computeIsDiagramEditingInProgress,
  computeIsDropTargetNodeValidForSelection,
} from "./ComputedState";
import { cached } from "./ComputedStateCache";

export interface DmnEditorDiagramNodeStatus {
  selected: boolean;
  dragging: boolean;
  resizing: boolean;
}
export interface DmnEditorDiagramEdgeStatus {
  selected: boolean;
  draggingWaypoint: boolean;
}

export interface DmnEditorDiagramDividerLineStatus {
  moving: boolean;
}

export interface SnapGrid {
  isEnabled: boolean;
  x: number;
  y: number;
}

export enum DiagramNodesPanel {
  NONE = "NONE",
  DRG_NODES = "DRG_NODES",
  EXTERNAL_NODES = "EXTERNAL_NODES",
}

export type DropTargetNode = undefined | RF.Node<DmnDiagramNodeData>;

export interface State {
  dispatch: Dispatch;
  computed: Computed;
  dmn: { model: DmnLatestModel };
  focus: {
    consumableId: string | undefined;
  };
  boxedExpressionEditor: {
    activeDrgElementId: string | undefined;
    selectedObjectId: string | undefined;
    propertiesPanel: {
      isOpen: boolean;
    };
  };
  dataTypesEditor: {
    activeItemDefinitionId: string | undefined;
    expandedItemComponentIds: string[];
  };
  navigation: {
    tab: DmnEditorTab;
  };
  diagram: {
    drdIndex: number;
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
    autolayoutPanel: {
      isOpen: boolean;
    };
    openNodesPanel: DiagramNodesPanel;
    drdSelector: {
      isOpen: boolean;
    };
    overlays: {
      enableNodeHierarchyHighlight: boolean;
      enableExecutionHitsHighlights: boolean;
      enableCustomNodeStyles: boolean;
      enableDataTypesToolbarOnNodes: boolean;
      enableStyles: boolean;
    };
    snapGrid: SnapGrid;
    _selectedNodes: Array<string>;
    _selectedEdges: Array<string>;
    draggingNodes: Array<string>;
    resizingNodes: Array<string>;
    draggingWaypoints: Array<string>;
    movingDividerLines: Array<string>;
    editingStyle: boolean;
  };
}

// Read this to understand why we need computed as part of the store.
// https://github.com/pmndrs/zustand/issues/132#issuecomment-1120467721
export type Computed = {
  allUniqueFeelNames: ReturnType<typeof computeAllUniqueFeelNames>;
  isDiagramEditingInProgress: boolean;
  importsByNamespace: Map<string, DMN15__tImport>;
  indexes: ReturnType<typeof computeIndexes>;
  getDiagramData(e: ExternalModelsIndex | undefined): ReturnType<typeof computeDiagramData>;
  isDropTargetNodeValidForSelection(e: ExternalModelsIndex | undefined): boolean;
  getExternalModelTypesByNamespace: (
    e: ExternalModelsIndex | undefined
  ) => ReturnType<typeof computeExternalModelsByType>;
  getDataTypes(e: ExternalModelsIndex | undefined): ReturnType<typeof computeDataTypes>;
  getAllFeelVariableUniqueNames(
    e: ExternalModelsIndex | undefined
  ): ReturnType<typeof computeAllFeelVariableUniqueNames>;
};

export type Dispatch = {
  dmn: {
    reset: (model: State["dmn"]["model"]) => void;
  };
  boxedExpressionEditor: {
    open: (state: State, id: string) => void;
    close: (state: State) => void;
  };
  diagram: {
    setNodeStatus: (state: State, nodeId: string, status: Partial<DmnEditorDiagramNodeStatus>) => void;
    setEdgeStatus: (state: State, edgeId: string, status: Partial<DmnEditorDiagramEdgeStatus>) => void;
    setDividerLineStatus: (
      state: State,
      decisionServiceId: string,
      status: Partial<DmnEditorDiagramDividerLineStatus>
    ) => void;
  };
};

export enum DmnEditorTab {
  EDITOR,
  DATA_TYPES,
  INCLUDED_MODELS,
}

type ExtractState = StoreApi<State> extends { getState: () => infer T } ? T : never;

export function useDmnEditorStore<StateSlice = ExtractState>(
  selector: (state: State) => StateSlice,
  equalityFn?: (a: StateSlice, b: StateSlice) => boolean
) {
  const store = useContext(DmnEditorStoreApiContext);

  if (store === null) {
    throw new Error("Can't use DMN Editor Store outside of the DmnEditor component.");
  }

  return useStoreWithEqualityFn(store, selector, equalityFn);
}

export function useDmnEditorStoreApi() {
  return useContext(DmnEditorStoreApiContext);
}

export type StoreApiType = UseBoundStore<WithImmer<StoreApi<State>>>;

export const DmnEditorStoreApiContext = createContext<StoreApiType>({} as any);

export const defaultStaticState = (): Omit<State, "dmn" | "dispatch" | "computed"> => ({
  boxedExpressionEditor: {
    activeDrgElementId: undefined,
    selectedObjectId: undefined,
    propertiesPanel: {
      isOpen: false,
    },
  },
  navigation: {
    tab: DmnEditorTab.EDITOR,
  },
  focus: {
    consumableId: undefined,
  },
  dataTypesEditor: {
    activeItemDefinitionId: undefined,
    expandedItemComponentIds: [],
  },
  diagram: {
    drdIndex: 0,
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
    autolayoutPanel: {
      isOpen: true,
    },
    openNodesPanel: DiagramNodesPanel.NONE,
    drdSelector: {
      isOpen: false,
    },
    overlays: {
      enableNodeHierarchyHighlight: false,
      enableExecutionHitsHighlights: false,
      enableCustomNodeStyles: false,
      enableDataTypesToolbarOnNodes: true,
      enableStyles: true,
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
    movingDividerLines: [],
    editingStyle: false,
  },
});

export function createDmnEditorStore(model: State["dmn"]["model"]) {
  return create(
    immer<State>((set, get) => ({
      dmn: {
        model,
      },
      ...defaultStaticState(),
      dispatch: {
        dmn: {
          reset: (model) => {
            set((state) => {
              state.diagram._selectedNodes = [];
              state.diagram.draggingNodes = [];
              state.diagram.resizingNodes = [];
              state.navigation.tab = DmnEditorTab.EDITOR;
              state.boxedExpressionEditor.activeDrgElementId = undefined;
              state.boxedExpressionEditor.selectedObjectId = undefined;
            });
          },
        },
        boxedExpressionEditor: {
          open: (state, id) => {
            state.boxedExpressionEditor.activeDrgElementId = id;
            state.boxedExpressionEditor.selectedObjectId = undefined;
            state.boxedExpressionEditor.propertiesPanel.isOpen = state.diagram.propertiesPanel.isOpen;
          },
          close: (state) => {
            state.diagram.propertiesPanel.isOpen = state.boxedExpressionEditor.propertiesPanel.isOpen;
            state.boxedExpressionEditor.activeDrgElementId = undefined;
            state.boxedExpressionEditor.selectedObjectId = undefined;
          },
        },
        diagram: {
          setNodeStatus: (prev, nodeId, newStatus) => {
            //selected
            if (newStatus.selected !== undefined) {
              if (newStatus.selected) {
                prev.diagram._selectedNodes.push(nodeId);
              } else {
                prev.diagram._selectedNodes = prev.diagram._selectedNodes.filter((s) => s !== nodeId);
              }
            }
            //dragging
            if (newStatus.dragging !== undefined) {
              if (newStatus.dragging) {
                prev.diagram.draggingNodes.push(nodeId);
              } else {
                prev.diagram.draggingNodes = prev.diagram.draggingNodes.filter((s) => s !== nodeId);
              }
            }
            // resizing
            if (newStatus.resizing !== undefined) {
              if (newStatus.resizing) {
                prev.diagram.resizingNodes.push(nodeId);
              } else {
                prev.diagram.resizingNodes = prev.diagram.resizingNodes.filter((s) => s !== nodeId);
              }
            }
          },
          setEdgeStatus: (prev, edgeId, newStatus) => {
            //selected
            if (newStatus.selected !== undefined) {
              if (newStatus.selected) {
                prev.diagram._selectedEdges.push(edgeId);
              } else {
                prev.diagram._selectedEdges = prev.diagram._selectedEdges.filter((s) => s !== edgeId);
              }
            }
            //dragging
            if (newStatus.draggingWaypoint !== undefined) {
              if (newStatus.draggingWaypoint) {
                prev.diagram.draggingWaypoints.push(edgeId);
              } else {
                prev.diagram.draggingWaypoints = prev.diagram.draggingWaypoints.filter((s) => s !== edgeId);
              }
            }
          },
          setDividerLineStatus: (prev, decisionServiceId, newStatus) => {
            //dragging
            if (newStatus.moving !== undefined) {
              if (newStatus.moving) {
                prev.diagram.movingDividerLines.push(decisionServiceId);
              } else {
                prev.diagram.movingDividerLines = prev.diagram.movingDividerLines.filter(
                  (s) => s !== decisionServiceId
                );
              }
            }
          },
        },
      },
      computed: {
        get allUniqueFeelNames() {
          return cached("allUniqueFeelNames", get(), (s) => computeAllUniqueFeelNames(s));
        },
        get isDiagramEditingInProgress() {
          return cached("isDiagramEditingInProgress", get(), (s) => computeIsDiagramEditingInProgress(s));
        },
        get importsByNamespace() {
          return cached("importsByNamespace", get(), (s) => computeImportsByNamespace(s));
        },
        get indexes() {
          return cached("indexes", get(), (s) => computeIndexes(s));
        },
        isDropTargetNodeValidForSelection: (externalModelsByNamespace: ExternalModelsIndex | undefined) =>
          cached(
            "isDropTargetNodeValidForSelection",
            get(),
            (state, computed) =>
              computeIsDropTargetNodeValidForSelection(state, computed.getDiagramData(externalModelsByNamespace)),
            [externalModelsByNamespace]
          ),
        getDataTypes: (externalModelsByNamespace: ExternalModelsIndex | undefined) =>
          cached(
            "getDataTypes",
            get(),
            (state, computed) =>
              computeDataTypes(
                state,
                computed.getExternalModelTypesByNamespace(externalModelsByNamespace),
                computed.importsByNamespace
              ),
            [externalModelsByNamespace]
          ),
        getAllFeelVariableUniqueNames: (externalModelsByNamespace: ExternalModelsIndex | undefined) =>
          cached(
            "getAllFeelVariableUniqueNames",
            get(),
            (state, computed) => computeAllFeelVariableUniqueNames(computed.getDataTypes(externalModelsByNamespace)),
            [externalModelsByNamespace]
          ),
        getExternalModelTypesByNamespace: (externalModelsByNamespace: ExternalModelsIndex | undefined) =>
          cached(
            "getExternalModelTypesByNamespace",
            get(),
            (state) => computeExternalModelsByType(state, externalModelsByNamespace),
            [externalModelsByNamespace]
          ),
        getDiagramData: (externalModelsByNamespace: ExternalModelsIndex | undefined) =>
          cached(
            "getDiagramData",
            get(),
            (state, computed) =>
              computeDiagramData(
                state,
                computed.getExternalModelTypesByNamespace(externalModelsByNamespace),
                computed.indexes
              ),
            [externalModelsByNamespace]
          ),
      },
    }))
  );
}
