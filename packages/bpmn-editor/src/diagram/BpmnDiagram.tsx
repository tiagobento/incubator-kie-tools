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
  DiagramRef,
  OnConnectedNodeAdded,
  OnEdgeAdded,
  OnEdgeDeleted,
  OnEdgeUpdated,
  OnEscPressed,
  OnNodeAdded,
  OnNodeDeleted,
  OnNodeParented,
  OnNodeRepositioned,
  OnNodeResized,
  OnNodeUnparented,
  OnWaypointAdded,
  OnWaypointDeleted,
  OnWaypointRepositioned,
  XyFlowReactKieDiagram,
} from "@kie-tools/xyflow-react-kie-diagram/dist/diagram/XyFlowReactKieDiagram";
import { ConnectionLine as ReactFlowDiagramConnectionLine } from "@kie-tools/xyflow-react-kie-diagram/dist/edges/ConnectionLine";
import { EdgeMarkers } from "@kie-tools/xyflow-react-kie-diagram/dist/edges/EdgeMarkers";
import * as React from "react";
import { useCallback, useState } from "react";
import * as RF from "reactflow";
import { useBpmnEditor } from "../BpmnEditorContext";
import { normalize } from "../normalization/normalize";
import { BpmnDiagramLhsPanel, State } from "../store/Store";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../store/StoreContext";
import { BpmnDiagramCommands } from "./BpmnDiagramCommands";
import {
  BPMN_CONTAINMENT_MAP,
  BPMN_GRAPH_STRUCTURE,
  BpmnDiagramEdgeData,
  BpmnDiagramNodeData,
  BpmnEdgeType,
  BpmnNodeType,
  CONNECTION_LINE_EDGE_COMPONENTS_MAPPING,
  CONNECTION_LINE_NODE_COMPONENT_MAPPING,
  DEFAULT_NODE_SIZES,
  MIN_NODE_SIZES,
  NODE_TYPES,
  XY_FLOW_EDGE_TYPES,
  XY_FLOW_NODE_TYPES,
} from "./BpmnDiagramDomain";
import { BpmnDiagramEmptyState } from "./BpmnDiagramEmptyState";
import { TopRightCornerPanels } from "./BpmnDiagramTopRightPanels";
import { BpmnPalette, MIME_TYPE_FOR_BPMN_EDITOR_NEW_NODE_FROM_PALETTE } from "./BpmnPalette";
import { DiagramContainerContextProvider } from "./DiagramContainerContext";
import { repositionNode } from "../mutations/repositionNode";
import { deleteNode } from "../mutations/deleteNode";
import { nodeNatures } from "../mutations/NodeNature";
import { addConnectedNode } from "../mutations/addConnectedNode";

export function BpmnDiagram({
  container,
  diagramRef,
}: {
  diagramRef: React.RefObject<DiagramRef<BpmnNodeType, BpmnDiagramNodeData, BpmnDiagramEdgeData>>;
  container: React.RefObject<HTMLElement>;
}) {
  const [showEmptyState, setShowEmptyState] = useState(true);

  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

  const model = useBpmnEditorStore((s) => s.bpmn.model);

  const { bpmnModelBeforeEditingRef } = useBpmnEditor();

  const resetToBeforeEditingBegan = useCallback(() => {
    bpmnEditorStoreApi.setState((state) => {
      state.bpmn.model = normalize(bpmnModelBeforeEditingRef.current);
      state.xyFlowReactKieDiagram.draggingNodes = [];
      state.xyFlowReactKieDiagram.draggingWaypoints = [];
      state.xyFlowReactKieDiagram.resizingNodes = [];
      state.xyFlowReactKieDiagram.dropTargetNode = undefined;
      state.xyFlowReactKieDiagram.edgeIdBeingUpdated = undefined;
    });
  }, [bpmnEditorStoreApi, bpmnModelBeforeEditingRef]);

  const nodes = useBpmnEditorStore((s) => s.computed(s).getDiagramData().nodes);

  const isEmptyStateShowing = showEmptyState && nodes.length === 0;

  // nodes

  const onNodeAdded = useCallback<OnNodeAdded<State, BpmnNodeType, BpmnDiagramNodeData, BpmnDiagramEdgeData>>(
    ({ state }) => {
      console.log("BPMN EDITOR DIAGRAM: onNodeAdded");
    },
    []
  );

  const onConnectedNodeAdded = useCallback<
    OnConnectedNodeAdded<State, BpmnNodeType, BpmnEdgeType, BpmnDiagramNodeData, BpmnDiagramEdgeData>
  >(({ state, sourceNode, newNodeType, edgeType, dropPoint }) => {
    console.log("BPMN EDITOR DIAGRAM: onConnectedNodeAdded");
    addConnectedNode({
      definitions: state.bpmn.model.definitions,
      __readonly_newNode: {
        bounds: {
          "@_x": dropPoint.x,
          "@_y": dropPoint.y,
          "@_width": DEFAULT_NODE_SIZES[newNodeType]({ snapGrid: state.xyFlowReactKieDiagram.snapGrid })["@_width"],
          "@_height": DEFAULT_NODE_SIZES[newNodeType]({ snapGrid: state.xyFlowReactKieDiagram.snapGrid })["@_height"],
        },
        type: newNodeType,
      },
      __readonly_sourceNode: {
        bounds: sourceNode.data.shape["dc:Bounds"],
        id: sourceNode.id,
        shapeId: sourceNode.data.shape["@_id"],
        type: sourceNode.type as BpmnNodeType,
      },
    });
  }, []);

  const onNodeRepositioned = useCallback<
    OnNodeRepositioned<State, BpmnNodeType, BpmnDiagramNodeData, BpmnDiagramEdgeData>
  >(({ state, node, controlWaypointsByEdge, newPosition }) => {
    console.log("BPMN EDITOR DIAGRAM: onNodeRepositioned");
    repositionNode({
      definitions: state.bpmn.model.definitions,
      controlWaypointsByEdge,
      __readonly_change: {
        type: "absolute",
        nodeType: node.type as BpmnNodeType,
        selectedEdges: [...state.computed(state).getDiagramData().selectedEdgesById.keys()],
        shapeIndex: node.data.shapeIndex,
        sourceEdgeIndexes: state
          .computed(state)
          .getDiagramData()
          .edges.flatMap((e) => (e.source === node.id && e.data?.bpmnEdge ? [e.data.bpmnEdgeIndex] : [])),
        targetEdgeIndexes: state
          .computed(state)
          .getDiagramData()
          .edges.flatMap((e) => (e.target === node.id && e.data?.bpmnEdge ? [e.data.bpmnEdgeIndex] : [])),
        position: newPosition,
      },
    });
  }, []);

  const onNodeDeleted = useCallback<OnNodeDeleted<State, BpmnNodeType, BpmnDiagramNodeData, BpmnDiagramEdgeData>>(
    ({ state, node }) => {
      console.log("BPMN EDITOR DIAGRAM: onNodeDeleted");
      deleteNode({
        definitions: state.bpmn.model.definitions,
        __readonly_bpmnElementId: node.data.bpmnElement?.["@_id"],
        __readonly_nodeNature: nodeNatures[node.type as BpmnNodeType],
        __readonly_bpmnEdgeData: state
          .computed(state)
          .getDiagramData()
          .edges.map((e) => e.data!),
      });
    },
    []
  );

  const onNodeUnparented = useCallback<OnNodeUnparented<State, BpmnNodeType, BpmnDiagramNodeData, BpmnDiagramEdgeData>>(
    ({ state }) => {
      console.log("BPMN EDITOR DIAGRAM: onNodeUnparented");
    },
    []
  );

  const onNodeParented = useCallback<OnNodeParented<State, BpmnNodeType, BpmnDiagramNodeData, BpmnDiagramEdgeData>>(
    ({ state }) => {
      console.log("BPMN EDITOR DIAGRAM: onNodeParented");
    },
    []
  );

  const onNodeResized = useCallback<OnNodeResized<State, BpmnNodeType, BpmnDiagramNodeData, BpmnDiagramEdgeData>>(
    ({ state }) => {
      console.log("BPMN EDITOR DIAGRAM: onNodeResized");
    },
    []
  );

  // edges

  const onEdgeAdded = useCallback<
    OnEdgeAdded<State, BpmnNodeType, BpmnEdgeType, BpmnDiagramNodeData, BpmnDiagramEdgeData>
  >(({ state }) => {
    console.log("BPMN EDITOR DIAGRAM: onEdgeAdded");
  }, []);

  const onEdgeUpdated = useCallback<
    OnEdgeUpdated<State, BpmnNodeType, BpmnEdgeType, BpmnDiagramNodeData, BpmnDiagramEdgeData>
  >(({ state }) => {
    console.log("BPMN EDITOR DIAGRAM: onEdgeUpdated");
  }, []);

  const onEdgeDeleted = useCallback<
    OnEdgeDeleted<State, BpmnNodeType, BpmnEdgeType, BpmnDiagramNodeData, BpmnDiagramEdgeData>
  >(({ state }) => {
    console.log("BPMN EDITOR DIAGRAM: onEdgeDeleted");
  }, []);

  // waypoints

  const onWaypointAdded = useCallback<OnWaypointAdded>(() => {
    console.log("BPMN EDITOR DIAGRAM: onWaypointAdded");
  }, []);

  const onWaypointRepositioned = useCallback<OnWaypointRepositioned>(() => {
    console.log("BPMN EDITOR DIAGRAM: onWaypointRepositioned");
  }, []);

  const onWaypointDeleted = useCallback<OnWaypointDeleted>(() => {
    console.log("BPMN EDITOR DIAGRAM: onWaypointDeleted");
  }, []);

  // misc

  const onEscPressed = useCallback<OnEscPressed>(() => {
    bpmnEditorStoreApi.setState((state) => {
      state.diagram.propertiesPanel.isOpen = false;
      state.diagram.overlaysPanel.isOpen = false;
      state.diagram.openLhsPanel = BpmnDiagramLhsPanel.NONE;
    });
  }, [bpmnEditorStoreApi]);

  return (
    <>
      {isEmptyStateShowing && <BpmnDiagramEmptyState setShowEmptyState={setShowEmptyState} />}
      <DiagramContainerContextProvider container={container}>
        <svg style={{ position: "absolute", top: 0, left: 0 }}>
          <EdgeMarkers />
        </svg>

        <XyFlowReactKieDiagram
          // infra
          diagramRef={diagramRef}
          container={container}
          // model
          modelBeforeEditingRef={bpmnModelBeforeEditingRef}
          model={model}
          resetToBeforeEditingBegan={resetToBeforeEditingBegan}
          // components
          connectionLineComponent={ConnectionLine}
          nodeComponents={XY_FLOW_NODE_TYPES}
          edgeComponents={XY_FLOW_EDGE_TYPES}
          // domain
          newNodeMimeType={MIME_TYPE_FOR_BPMN_EDITOR_NEW_NODE_FROM_PALETTE}
          containmentMap={BPMN_CONTAINMENT_MAP}
          nodeTypes={NODE_TYPES}
          minNodeSizes={MIN_NODE_SIZES}
          graphStructure={BPMN_GRAPH_STRUCTURE}
          // actions
          onNodeAdded={onNodeAdded}
          onConnectedNodeAdded={onConnectedNodeAdded}
          onNodeRepositioned={onNodeRepositioned}
          onNodeDeleted={onNodeDeleted}
          onEdgeAdded={onEdgeAdded}
          onEdgeUpdated={onEdgeUpdated}
          onEdgeDeleted={onEdgeDeleted}
          onNodeUnparented={onNodeUnparented}
          onNodeParented={onNodeParented}
          onNodeResized={onNodeResized}
          onEscPressed={onEscPressed}
          onWaypointAdded={onWaypointAdded}
          onWaypointRepositioned={onWaypointRepositioned}
          onWaypointDeleted={onWaypointDeleted}
        >
          <BpmnPalette pulse={isEmptyStateShowing} />
          <TopRightCornerPanels availableHeight={container.current?.offsetHeight} />
          <BpmnDiagramCommands />
        </XyFlowReactKieDiagram>
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
