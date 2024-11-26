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
import { getHandlePosition } from "@kie-tools/xyflow-react-kie-diagram/dist/maths/DcMaths";
import { PositionalNodeHandleId } from "@kie-tools/xyflow-react-kie-diagram/dist/nodes/PositionalNodeHandles";
import * as React from "react";
import { useCallback, useState } from "react";
import * as RF from "reactflow";
import { useBpmnEditor } from "../BpmnEditorContext";
import { addConnectedNode } from "../mutations/addConnectedNode";
import { addEdge } from "../mutations/addEdge";
import { addStandaloneNode } from "../mutations/addStandaloneNode";
import { deleteEdge } from "../mutations/deleteEdge";
import { deleteNode } from "../mutations/deleteNode";
import { nodeNatures } from "../mutations/NodeNature";
import { repositionNode } from "../mutations/repositionNode";
import { resizeNode } from "../mutations/resizeNode";
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
  elementToNodeType,
  MIN_NODE_SIZES,
  NODE_TYPES,
  XY_FLOW_EDGE_TYPES,
  XY_FLOW_NODE_TYPES,
} from "./BpmnDiagramDomain";
import { BpmnDiagramEmptyState } from "./BpmnDiagramEmptyState";
import { TopRightCornerPanels } from "./BpmnDiagramTopRightPanels";
import { BpmnPalette, MIME_TYPE_FOR_BPMN_EDITOR_NEW_NODE_FROM_PALETTE } from "./BpmnPalette";
import { DiagramContainerContextProvider } from "./DiagramContainerContext";
import { repositionEdgeWaypoint } from "../mutations/repositionEdgeWaypoint";
import { addEdgeWaypoint } from "../mutations/addEdgeWaypoint";
import { deleteEdgeWaypoint } from "../mutations/deleteEdgeWaypoint";

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
    ({ state, type, element, dropPoint }) => {
      console.log("BPMN EDITOR DIAGRAM: onNodeAdded");
      const { id } = addStandaloneNode({
        definitions: state.bpmn.model.definitions,
        __readonly_element: element as keyof typeof elementToNodeType,
        __readonly_newNode: {
          type,
          bounds: {
            "@_x": dropPoint.x,
            "@_y": dropPoint.y,
            "@_width": DEFAULT_NODE_SIZES[type]({ snapGrid: state.xyFlowReactKieDiagram.snapGrid })["@_width"],
            "@_height": DEFAULT_NODE_SIZES[type]({ snapGrid: state.xyFlowReactKieDiagram.snapGrid })["@_height"],
          },
        },
      });

      return { newNodeId: id };
    },
    []
  );

  const onConnectedNodeAdded = useCallback<
    OnConnectedNodeAdded<State, BpmnNodeType, BpmnEdgeType, BpmnDiagramNodeData, BpmnDiagramEdgeData>
  >(({ state, sourceNode, newNodeType, edgeType, dropPoint }) => {
    console.log("BPMN EDITOR DIAGRAM: onConnectedNodeAdded");
    const { id } = addConnectedNode({
      definitions: state.bpmn.model.definitions,
      __readonly_sourceNode: {
        bounds: sourceNode.data.shape["dc:Bounds"],
        id: sourceNode.id,
        shapeId: sourceNode.data.shape["@_id"],
        type: sourceNode.type as BpmnNodeType,
      },
      __readonly_newNode: {
        type: newNodeType,
        bounds: {
          "@_x": dropPoint.x,
          "@_y": dropPoint.y,
          "@_width": DEFAULT_NODE_SIZES[newNodeType]({ snapGrid: state.xyFlowReactKieDiagram.snapGrid })["@_width"],
          "@_height": DEFAULT_NODE_SIZES[newNodeType]({ snapGrid: state.xyFlowReactKieDiagram.snapGrid })["@_height"],
        },
      },
    });
    return { newNodeId: id };
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
    ({ state, node, newDimensions }) => {
      console.log("BPMN EDITOR DIAGRAM: onNodeResized");
      resizeNode({
        definitions: state.bpmn.model.definitions,
        __readonly_snapGrid: state.xyFlowReactKieDiagram.snapGrid,
        __readonly_change: {
          nodeType: node.type!,
          shapeIndex: node.data.shapeIndex,
          sourceEdgeIndexes: state
            .computed(state)
            .getDiagramData()
            .edges.flatMap((e) => (e.source === node.id && e.data?.bpmnEdge ? [e.data.bpmnEdgeIndex] : [])),
          targetEdgeIndexes: state
            .computed(state)
            .getDiagramData()
            .edges.flatMap((e) => (e.target === node.id && e.data?.bpmnEdge ? [e.data.bpmnEdgeIndex] : [])),
          dimension: {
            "@_width": newDimensions.width,
            "@_height": newDimensions.height,
          },
        },
      });
    },
    []
  );

  // edges

  const onEdgeAdded = useCallback<
    OnEdgeAdded<State, BpmnNodeType, BpmnEdgeType, BpmnDiagramNodeData, BpmnDiagramEdgeData>
  >(({ state, edgeType, sourceNode, targetNode, targetHandle }) => {
    console.log("BPMN EDITOR DIAGRAM: onEdgeAdded");
    addEdge({
      definitions: state.bpmn.model.definitions,
      __readonly_edge: {
        type: edgeType as BpmnEdgeType,
        targetHandle: targetHandle,
        sourceHandle: PositionalNodeHandleId.Center,
        autoPositionedEdgeMarker: undefined,
      },
      __readonly_sourceNode: {
        type: sourceNode.type as BpmnNodeType,
        data: sourceNode.data,
        href: sourceNode.id,
        bounds: sourceNode.data.shape["dc:Bounds"],
        shapeId: sourceNode.data.shape["@_id"],
      },
      __readonly_targetNode: {
        type: targetNode.type as BpmnNodeType,
        href: targetNode.id,
        data: targetNode.data,
        bounds: targetNode.data.shape["dc:Bounds"],
        index: targetNode.data.index,
        shapeId: targetNode.data.shape["@_id"],
      },
      __readonly_keepWaypoints: false,
    });
  }, []);

  const onEdgeUpdated = useCallback<
    OnEdgeUpdated<State, BpmnNodeType, BpmnEdgeType, BpmnDiagramNodeData, BpmnDiagramEdgeData>
  >(({ state, edge, targetNode, sourceNode, targetHandle, sourceHandle, firstWaypoint, lastWaypoint }) => {
    console.log("BPMN EDITOR DIAGRAM: onEdgeUpdated");
    const { newBpmnEdge } = addEdge({
      definitions: state.bpmn.model.definitions,
      __readonly_edge: {
        autoPositionedEdgeMarker: undefined,
        type: edge.type as BpmnEdgeType,
        targetHandle: ((targetHandle as PositionalNodeHandleId) ??
          getHandlePosition({ shapeBounds: targetNode.data.shape["dc:Bounds"], waypoint: lastWaypoint })
            .handlePosition) as PositionalNodeHandleId,
        sourceHandle: ((sourceHandle as PositionalNodeHandleId) ??
          getHandlePosition({ shapeBounds: sourceNode.data.shape["dc:Bounds"], waypoint: firstWaypoint })
            .handlePosition) as PositionalNodeHandleId,
      },
      __readonly_sourceNode: {
        type: sourceNode.type!,
        href: sourceNode.id,
        data: sourceNode.data,
        bounds: sourceNode.data.shape["dc:Bounds"],
        shapeId: sourceNode.data.shape["@_id"],
      },
      __readonly_targetNode: {
        type: targetNode.type!,
        href: targetNode.id,
        data: targetNode.data,
        bounds: targetNode.data.shape["dc:Bounds"],
        index: targetNode.data.index,
        shapeId: targetNode.data.shape["@_id"],
      },
      __readonly_keepWaypoints: true,
    });

    // The BPMN Edge changed nodes, so we need to delete the old one, but keep the waypoints.
    if (newBpmnEdge["@_bpmnElement"] !== edge.id) {
      const { deletedBpmnEdge } = deleteEdge({
        definitions: state.bpmn.model.definitions,
        __readonly_edge: { id: edge.id, bpmnElement: edge.data!.bpmnElement },
      });

      const deletedWaypoints = deletedBpmnEdge?.["di:waypoint"];

      if (edge.source !== sourceNode.id && deletedWaypoints) {
        newBpmnEdge["di:waypoint"] = [newBpmnEdge["di:waypoint"]![0], ...deletedWaypoints.slice(1)];
      }

      if (edge.target !== targetNode.id && deletedWaypoints) {
        newBpmnEdge["di:waypoint"] = [
          ...deletedWaypoints.slice(0, deletedWaypoints.length - 1),
          newBpmnEdge["di:waypoint"]![newBpmnEdge["di:waypoint"]!.length - 1],
        ];
      }
    }
  }, []);

  const onEdgeDeleted = useCallback<
    OnEdgeDeleted<State, BpmnNodeType, BpmnEdgeType, BpmnDiagramNodeData, BpmnDiagramEdgeData>
  >(({ state, edge }) => {
    console.log("BPMN EDITOR DIAGRAM: onEdgeDeleted");
    deleteEdge({
      definitions: state.bpmn.model.definitions,
      __readonly_edge: { id: edge.id, bpmnElement: edge.data!.bpmnElement },
    });
  }, []);

  // waypoints

  const onWaypointAdded = useCallback<OnWaypointAdded>(
    ({ beforeIndex, edgeIndex, waypoint }) => {
      console.log("BPMN EDITOR DIAGRAM: onWaypointAdded");
      bpmnEditorStoreApi.setState((s) => {
        addEdgeWaypoint({
          definitions: s.bpmn.model.definitions,
          __readonly_edgeIndex: edgeIndex,
          __readonly_beforeIndex: beforeIndex,
          __readonly_waypoint: waypoint,
        });
      });
    },
    [bpmnEditorStoreApi]
  );

  const onWaypointRepositioned = useCallback<OnWaypointRepositioned>(
    ({ waypointIndex, edgeIndex, waypoint }) => {
      console.log("BPMN EDITOR DIAGRAM: onWaypointRepositioned");
      bpmnEditorStoreApi.setState((s) => {
        repositionEdgeWaypoint({
          definitions: s.bpmn.model.definitions,
          __readonly_edgeIndex: edgeIndex,
          __readonly_waypoint: waypoint,
          __readonly_waypointIndex: waypointIndex,
        });
      });
    },
    [bpmnEditorStoreApi]
  );

  const onWaypointDeleted = useCallback<OnWaypointDeleted>(
    ({ waypointIndex, edgeIndex }) => {
      console.log("BPMN EDITOR DIAGRAM: onWaypointDeleted");
      bpmnEditorStoreApi.setState((s) => {
        deleteEdgeWaypoint({
          definitions: s.bpmn.model.definitions,
          __readonly_edgeIndex: edgeIndex,
          __readonly_waypointIndex: waypointIndex,
        });
      });
    },
    [bpmnEditorStoreApi]
  );

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
