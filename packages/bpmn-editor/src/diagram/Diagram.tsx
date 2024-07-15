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

import { DC__Bounds } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { Button, ButtonVariant } from "@patternfly/react-core/dist/js/components/Button";
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStatePrimary,
} from "@patternfly/react-core/dist/js/components/EmptyState";
import { Label } from "@patternfly/react-core/dist/js/components/Label";
import { Popover } from "@patternfly/react-core/dist/js/components/Popover";
import { Title } from "@patternfly/react-core/dist/js/components/Title";
import { Bullseye } from "@patternfly/react-core/dist/js/layouts/Bullseye";
import { UserIcon } from "@patternfly/react-icons/dist/js/icons/user-icon";
import { InfoIcon } from "@patternfly/react-icons/dist/js/icons/info-icon";
import { MousePointerIcon } from "@patternfly/react-icons/dist/js/icons/mouse-pointer-icon";
import { AngleDoubleRightIcon } from "@patternfly/react-icons/dist/js/icons/angle-double-right-icon";
import { TimesIcon } from "@patternfly/react-icons/dist/js/icons/times-icon";
import { VirtualMachineIcon } from "@patternfly/react-icons/dist/js/icons/virtual-machine-icon";
import * as React from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as RF from "reactflow";
import { useBpmnEditor } from "../BpmnEditorContext";
import { useExternalModels } from "../externalModels/BpmnEditorExternalModelsContext";
import { OverlaysPanel } from "../overlaysPanel/OverlaysPanel";
import { DiagramLhsPanel, SnapGrid } from "../store/Store";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../store/StoreContext";
import { DiagramContainerContextProvider } from "./DiagramContainerContext";
import { MIME_TYPE_FOR_BPMN_EDITOR_NEW_NODE_FROM_PALETTE, Palette } from "./Palette";
import { snapShapeDimensions } from "./SnapGrid";
import { ConnectionLine } from "./connections/ConnectionLine";
import { EdgeType, NodeType, containment, getDefaultEdgeTypeBetween } from "./connections/graphStructure";
import { checkIsValidConnection } from "./connections/isValidConnection";
import { EdgeMarkers } from "./edges/EdgeMarkers";
import { EDGE_TYPES } from "./edges/EdgeTypes";
import { AssociationEdge, BpmnDiagramEdgeData, SequenceFlowEdge } from "./edges/Edges";
import { buildHierarchy } from "./graph/graph";
import { DC__Dimension, getContainmentRelationship, getDiBoundsCenterPoint } from "./maths/DiMaths";
import { MIN_NODE_SIZES } from "./nodes/DefaultSizes";
import { NODE_TYPES } from "./nodes/NodeTypes";
import { BpmnDiagramNodeData, DataObjectNode, TextAnnotationNode, UnknownNode } from "./nodes/Nodes";
import { normalize } from "../normalization/normalize";
import { DiagramCommands } from "./DiagramCommands";

const isFirefox = typeof (window as any).InstallTrigger !== "undefined"; // See https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browsers

const PAN_ON_DRAG = [1, 2];

const FIT_VIEW_OPTIONS: RF.FitViewOptions = { maxZoom: 1, minZoom: 0.1, duration: 400 };

export const DEFAULT_VIEWPORT = { x: 100, y: 100, zoom: 1 };

const DELETE_NODE_KEY_CODES = ["Backspace", "Delete"];

const AREA_ABOVE_OVERLAYS_PANEL = 120;

const nodeTypes: Record<NodeType, any> = {
  [NODE_TYPES.textAnnotation]: TextAnnotationNode,
  [NODE_TYPES.dataObject]: DataObjectNode,
  [NODE_TYPES.unknown]: UnknownNode,
} as any; // FIXME: Tiago: Add other nodes

const edgeTypes: Record<EdgeType, any> = {
  [EDGE_TYPES.sequenceFlow]: SequenceFlowEdge,
  [EDGE_TYPES.association]: AssociationEdge,
};

export type DiagramRef = {
  getReactFlowInstance: () => RF.ReactFlowInstance | undefined;
};

export const Diagram = React.forwardRef<DiagramRef, { container: React.RefObject<HTMLElement> }>(
  ({ container }, ref) => {
    // Contexts

    const bpmnEditorStoreApi = useBpmnEditorStoreApi();
    const { externalModelsByNamespace } = useExternalModels();
    const snapGrid = useBpmnEditorStore((s) => s.diagram.snapGrid);
    const thisBpmn = useBpmnEditorStore((s) => s.bpmn);
    const { bpmnModelBeforeEditingRef } = useBpmnEditor();

    // State

    const [reactFlowInstance, setReactFlowInstance] = useState<
      RF.ReactFlowInstance<BpmnDiagramNodeData, BpmnDiagramEdgeData> | undefined
    >(undefined);

    // Refs
    React.useImperativeHandle(
      ref,
      () => ({
        getReactFlowInstance: () => {
          return reactFlowInstance;
        },
      }),
      [reactFlowInstance]
    );

    const nodeIdBeingDraggedRef = useRef<string | null>(null);

    // Memos

    const rfSnapGrid = useMemo<[number, number]>(
      () => (snapGrid.isEnabled ? [snapGrid.x, snapGrid.y] : [1, 1]),
      [snapGrid.isEnabled, snapGrid.x, snapGrid.y]
    );

    // Callbacks

    const onConnect = useCallback<RF.OnConnect>(
      ({ source, target, sourceHandle, targetHandle }) => {
        console.debug("BPMN DIAGRAM: `onConnect`: ", { source, target, sourceHandle, targetHandle });
        bpmnEditorStoreApi.setState((state) => {
          const sourceNode = state.computed(state).getDiagramData().nodesById.get(source!);
          const targetNode = state.computed(state).getDiagramData().nodesById.get(target!);
          if (!sourceNode || !targetNode) {
            throw new Error("Cannot create connection without target and source nodes!");
          }

          const sourceBounds = sourceNode.data.shape["dc:Bounds"];
          const targetBounds = targetNode.data.shape["dc:Bounds"];
          if (!sourceBounds || !targetBounds) {
            throw new Error("Cannot create connection without target bounds!");
          }

          // --------- This is where we draw the line between the diagram and the model.

          // FIXME: Tiago: Mutation
          // addEdge({
        });
      },
      [bpmnEditorStoreApi, externalModelsByNamespace]
    );

    const getFirstNodeFittingBounds = useCallback(
      (
        nodeIdToIgnore: string,
        bounds: DC__Bounds,
        minSizes: (args: { snapGrid: SnapGrid }) => DC__Dimension,
        snapGrid: SnapGrid
      ) =>
        reactFlowInstance
          ?.getNodes()
          .reverse() // Respect the nodes z-index.
          .find(
            (node) =>
              node.id !== nodeIdToIgnore && // don't ever use the node being dragged
              getContainmentRelationship({
                bounds: bounds!,
                container: node.data.shape["dc:Bounds"]!,
                snapGrid,
                containerMinSizes: MIN_NODE_SIZES[node.type as NodeType],
                boundsMinSizes: minSizes,
              }).isInside
          ),
      [reactFlowInstance, bpmnEditorStoreApi]
    );

    const onDragOver = useCallback((e: React.DragEvent) => {
      if (!e.dataTransfer.types.find((t) => t === MIME_TYPE_FOR_BPMN_EDITOR_NEW_NODE_FROM_PALETTE)) {
        return;
      }

      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    }, []);

    const onDrop = useCallback(
      async (e: React.DragEvent) => {
        e.preventDefault();

        if (!container.current || !reactFlowInstance) {
          return;
        }

        // we need to remove the wrapper bounds, in order to get the correct position
        const dropPoint = reactFlowInstance.screenToFlowPosition({
          x: e.clientX,
          y: e.clientY,
        });

        if (e.dataTransfer.getData(MIME_TYPE_FOR_BPMN_EDITOR_NEW_NODE_FROM_PALETTE)) {
          const typeOfNewNodeFromPalette = e.dataTransfer.getData(
            MIME_TYPE_FOR_BPMN_EDITOR_NEW_NODE_FROM_PALETTE
          ) as NodeType;
          e.stopPropagation();

          // --------- This is where we draw the line between the diagram and the model.

          // FIXME: Tiago: Mutation
          // addStandaloneNode({
        } else {
          // FIXME: Tiago: Mutation
          // addShape({
        }

        console.debug(`BPMN DIAGRAM: Adding Process Flow Element node`, JSON.stringify(null));
      },
      [container, bpmnEditorStoreApi, externalModelsByNamespace, reactFlowInstance]
    );

    const ongoingConnection = useBpmnEditorStore((s) => s.diagram.ongoingConnection);
    useEffect(() => {
      const edgeUpdaterSource = document.querySelectorAll(
        ".react-flow__edgeupdater-source, .react-flow__edgeupdater-target"
      );
      if (ongoingConnection) {
        edgeUpdaterSource.forEach((e) => e.classList.add("hidden"));
      } else {
        edgeUpdaterSource.forEach((e) => e.classList.remove("hidden"));
      }
    }, [ongoingConnection]);

    const onConnectStart = useCallback<RF.OnConnectStart>(
      (e, newConnection) => {
        console.debug("BPMN DIAGRAM: `onConnectStart`");
        bpmnEditorStoreApi.setState((state) => {
          state.diagram.ongoingConnection = newConnection;
        });
      },
      [bpmnEditorStoreApi]
    );

    const onConnectEnd = useCallback(
      (e: MouseEvent) => {
        console.debug("BPMN DIAGRAM: `onConnectEnd`");

        bpmnEditorStoreApi.setState((state) => {
          const targetIsPane = (e.target as Element | null)?.classList?.contains("react-flow__pane");
          if (!targetIsPane || !container.current || !state.diagram.ongoingConnection || !reactFlowInstance) {
            return;
          }

          const dropPoint = reactFlowInstance.screenToFlowPosition({
            x: e.clientX,
            y: e.clientY,
          });

          // only try to create node if source handle is compatible
          if (!Object.values(NODE_TYPES).find((n) => n === state.diagram.ongoingConnection!.handleId)) {
            return;
          }

          if (!state.diagram.ongoingConnection.nodeId) {
            return;
          }

          const sourceNode = state
            .computed(state)
            .getDiagramData()
            .nodesById.get(state.diagram.ongoingConnection.nodeId);
          if (!sourceNode) {
            return;
          }

          const sourceNodeBounds = undefined; // FIXME: Tiago: ?
          if (!sourceNodeBounds) {
            return;
          }

          const newNodeType = state.diagram.ongoingConnection.handleId as NodeType;
          const sourceNodeType = sourceNode.type as NodeType;

          const edgeType = getDefaultEdgeTypeBetween(sourceNodeType as NodeType, newNodeType);
          if (!edgeType) {
            throw new Error(`BPMN DIAGRAM: Invalid structure: ${sourceNodeType} --(any)--> ${newNodeType}`);
          }

          // --------- This is where we draw the line between the diagram and the model.

          // FIXME: Tiago: Mutation
          // addConnectedNode({
        });

        // Indepdent of what happens in the state mutation above, we always need to reset the `ongoingConnection` at the end here.
        bpmnEditorStoreApi.setState((state) => {
          state.diagram.ongoingConnection = undefined;
        });
      },
      [bpmnEditorStoreApi, container, reactFlowInstance, externalModelsByNamespace]
    );

    const isValidConnection = useCallback<RF.IsValidConnection>(
      (edgeOrConnection) => {
        const state = bpmnEditorStoreApi.getState();
        const edgeId = state.diagram.edgeIdBeingUpdated;
        const edgeType = edgeId ? (reactFlowInstance?.getEdge(edgeId)?.type as EdgeType) : undefined;

        const ongoingConnectionHierarchy = buildHierarchy({
          nodeId: state.diagram.ongoingConnection?.nodeId,
          edges: state.computed(state).getDiagramData().processFlowEdges,
        });

        return (
          // Reflexive edges are not allowed for BPMN
          edgeOrConnection.source !== edgeOrConnection.target &&
          // Matches BPMNs structure.
          checkIsValidConnection(state.computed(state).getDiagramData().nodesById, edgeOrConnection, edgeType) &&
          // Does not form cycles.
          !!edgeOrConnection.target &&
          !ongoingConnectionHierarchy.dependencies.has(edgeOrConnection.target) &&
          !!edgeOrConnection.source &&
          !ongoingConnectionHierarchy.dependents.has(edgeOrConnection.source)
        );
      },
      [bpmnEditorStoreApi, externalModelsByNamespace, reactFlowInstance]
    );

    const onNodesChange = useCallback<RF.OnNodesChange>(
      (changes) => {
        if (!reactFlowInstance) {
          return;
        }

        bpmnEditorStoreApi.setState((state) => {
          const controlWaypointsByEdge = new Map<number, Set<number>>();

          for (const change of changes) {
            switch (change.type) {
              case "add":
                console.debug(`BPMN DIAGRAM: 'onNodesChange' --> add '${change.item.id}'`);
                state.dispatch(state).diagram.setNodeStatus(change.item.id, { selected: true });
                break;
              case "dimensions":
                console.debug(`BPMN DIAGRAM: 'onNodesChange' --> dimensions '${change.id}'`);
                state.dispatch(state).diagram.setNodeStatus(change.id, { resizing: change.resizing });
                if (change.dimensions) {
                  const node = state.computed(state).getDiagramData().nodesById.get(change.id)!;
                  // We only need to resize the node if its snapped dimensions change, as snapping is non-destructive.
                  const snappedShape = snapShapeDimensions(
                    state.diagram.snapGrid,
                    node.data.shape,
                    MIN_NODE_SIZES[node.type as NodeType]({
                      snapGrid: state.diagram.snapGrid,
                    })
                  );
                  if (
                    snappedShape.width !== change.dimensions.width ||
                    snappedShape.height !== change.dimensions.height
                  ) {
                    // FIXME: Tiago: Mutation
                    // resizeNode({
                  }
                }
                break;
              case "position":
                console.debug(`BPMN DIAGRAM: 'onNodesChange' --> position '${change.id}'`);
                state.dispatch(state).diagram.setNodeStatus(change.id, { dragging: change.dragging });
                if (change.positionAbsolute) {
                  const node = state.computed(state).getDiagramData().nodesById.get(change.id)!;

                  // FIXME: Tiago: Mutation
                  // repositionNode({
                }
                break;
              case "remove":
                console.debug(`BPMN DIAGRAM: 'onNodesChange' --> remove '${change.id}'`);
                const node = state.computed(state).getDiagramData().nodesById.get(change.id)!;

                // FIXME: Tiago: Mutation
                // deleteNode({

                state.dispatch(state).diagram.setNodeStatus(node.id, {
                  selected: false,
                  dragging: false,
                  resizing: false,
                });
                break;
              case "reset":
                state.dispatch(state).diagram.setNodeStatus(change.item.id, {
                  selected: false,
                  dragging: false,
                  resizing: false,
                });
                break;
              case "select":
                state.dispatch(state).diagram.setNodeStatus(change.id, { selected: change.selected });
                break;
            }
          }
        });
      },
      [reactFlowInstance, bpmnEditorStoreApi, externalModelsByNamespace]
    );

    const resetToBeforeEditingBegan = useCallback(() => {
      bpmnEditorStoreApi.setState((state) => {
        state.bpmn.model = normalize(bpmnModelBeforeEditingRef.current);
        state.diagram.draggingNodes = [];
        state.diagram.draggingWaypoints = [];
        state.diagram.resizingNodes = [];
        state.diagram.dropTargetNode = undefined;
        state.diagram.edgeIdBeingUpdated = undefined;
      });
    }, [bpmnEditorStoreApi, bpmnModelBeforeEditingRef]);

    const onNodeDrag = useCallback<RF.NodeDragHandler>(
      (e, node: RF.Node<BpmnDiagramNodeData>) => {
        nodeIdBeingDraggedRef.current = node.id;
        bpmnEditorStoreApi.setState((state) => {
          state.diagram.dropTargetNode = getFirstNodeFittingBounds(
            node.id,
            {
              // We can't use node.data.bpmnObject because it hasn't been updated at this point yet.
              "@_x": node.positionAbsolute?.x ?? 0,
              "@_y": node.positionAbsolute?.y ?? 0,
              "@_width": node.width ?? 0,
              "@_height": node.height ?? 0,
            },
            MIN_NODE_SIZES[node.type as NodeType],
            state.diagram.snapGrid
          );
        });
      },
      [bpmnEditorStoreApi, getFirstNodeFittingBounds]
    );

    const onNodeDragStart = useCallback<RF.NodeDragHandler>(
      (e, node: RF.Node<BpmnDiagramNodeData>, nodes) => {
        bpmnModelBeforeEditingRef.current = thisBpmn.model;
        onNodeDrag(e, node, nodes);
      },
      [thisBpmn.model, bpmnModelBeforeEditingRef, onNodeDrag]
    );

    const onNodeDragStop = useCallback<RF.NodeDragHandler>(
      (e, node: RF.Node<BpmnDiagramNodeData>) => {
        try {
          bpmnEditorStoreApi.setState((state) => {
            console.debug("BPMN DIAGRAM: `onNodeDragStop`");
            const nodeBeingDragged = state
              .computed(state)
              .getDiagramData()
              .nodesById.get(nodeIdBeingDraggedRef.current!);
            nodeIdBeingDraggedRef.current = null;
            if (!nodeBeingDragged) {
              return;
            }

            // Validate
            const dropTargetNode = bpmnEditorStoreApi.getState().diagram.dropTargetNode;
            if (
              dropTargetNode &&
              containment.has(dropTargetNode.type as NodeType) &&
              !state.computed(state).isDropTargetNodeValidForSelection
            ) {
              console.debug(
                `BPMN DIAGRAM: Invalid containment: '${[
                  ...state.computed(state).getDiagramData().selectedNodeTypes,
                ].join("', '")}' inside '${dropTargetNode.type}'. Ignoring nodes dropped.`
              );
              resetToBeforeEditingBegan();
              return;
            }

            const selectedNodes = [...state.computed(state).getDiagramData().selectedNodesById.values()];

            state.diagram.dropTargetNode = undefined;

            if (!node.dragging) {
              return;
            }

            // Un-parent
            if (nodeBeingDragged.data.parentRfNode) {
              const p = state.computed(state).getDiagramData().nodesById.get(nodeBeingDragged.data.parentRfNode.id);
              if (p?.type === NODE_TYPES.lane && nodeBeingDragged.type === NODE_TYPES.lane) {
                // FIXME: Tiago: Containment
              } else {
                console.debug(
                  `BPMN DIAGRAM: Ignoring '${nodeBeingDragged.type}' with parent '${dropTargetNode?.type}' dropping somewhere..`
                );
              }
            }

            // Parent
            if (dropTargetNode?.type === NODE_TYPES.lane) {
              // FIXME: Tiago: Containment
            } else {
              console.debug(
                `BPMN DIAGRAM: Ignoring '${nodeBeingDragged.type}' dropped on top of '${dropTargetNode?.type}'`
              );
            }
          });
        } catch (e) {
          console.error(e);
          resetToBeforeEditingBegan();
        }
      },
      [bpmnEditorStoreApi, externalModelsByNamespace, resetToBeforeEditingBegan]
    );

    const onEdgesChange = useCallback<RF.OnEdgesChange>(
      (changes) => {
        bpmnEditorStoreApi.setState((state) => {
          for (const change of changes) {
            switch (change.type) {
              case "select":
                console.debug(`BPMN DIAGRAM: 'onEdgesChange' --> select '${change.id}'`);
                state.dispatch(state).diagram.setEdgeStatus(change.id, { selected: change.selected });
                break;
              case "remove":
                console.debug(`BPMN DIAGRAM: 'onEdgesChange' --> remove '${change.id}'`);
                const edge = state.computed(state).getDiagramData().edgesById.get(change.id);
                if (edge?.data) {
                  // FIXME: Tiago: Mutation
                  // deleteEdge({
                  state.dispatch(state).diagram.setEdgeStatus(change.id, {
                    selected: false,
                    draggingWaypoint: false,
                  });
                }
                break;
              case "add":
              case "reset":
                console.debug(`BPMN DIAGRAM: 'onEdgesChange' --> add/reset '${change.item.id}'. Ignoring`);
            }
          }
        });
      },
      [bpmnEditorStoreApi, externalModelsByNamespace]
    );

    const onEdgeUpdate = useCallback<RF.OnEdgeUpdateFunc<BpmnDiagramEdgeData>>(
      (oldEdge, newConnection) => {
        console.debug("BPMN DIAGRAM: `onEdgeUpdate`", oldEdge, newConnection);

        bpmnEditorStoreApi.setState((state) => {
          const sourceNode = state.computed(state).getDiagramData().nodesById.get(newConnection.source!);
          const targetNode = state.computed(state).getDiagramData().nodesById.get(newConnection.target!);
          if (!sourceNode || !targetNode) {
            throw new Error("Cannot create connection without target and source nodes!");
          }

          const sourceBounds = sourceNode.data.shape["dc:Bounds"];
          const targetBounds = targetNode.data.shape["dc:Bounds"];
          if (!sourceBounds || !targetBounds) {
            throw new Error("Cannot create connection without target bounds!");
          }

          // --------- This is where we draw the line between the diagram and the model.

          const lastWaypoint = oldEdge.data?.bpmnEdge
            ? oldEdge.data!.bpmnEdge!["di:waypoint"]![oldEdge.data!.bpmnEdge!["di:waypoint"]!.length - 1]!
            : getDiBoundsCenterPoint(targetBounds);
          const firstWaypoint = oldEdge.data?.bpmnEdge
            ? oldEdge.data!.bpmnEdge!["di:waypoint"]![0]!
            : getDiBoundsCenterPoint(sourceBounds);

          // FIXME: Tiago: Mutation
          // addEdge({
        });
      },
      [bpmnEditorStoreApi, externalModelsByNamespace]
    );

    const onEdgeUpdateStart = useCallback(
      (e: React.MouseEvent | React.TouchEvent, edge: RF.Edge, handleType: RF.HandleType) => {
        console.debug("BPMN DIAGRAM: `onEdgeUpdateStart`");
        bpmnEditorStoreApi.setState((state) => {
          state.diagram.edgeIdBeingUpdated = edge.id;
        });
      },
      [bpmnEditorStoreApi]
    );

    const onEdgeUpdateEnd = useCallback(
      (e: MouseEvent | TouchEvent, edge: RF.Edge, handleType: RF.HandleType) => {
        console.debug("BPMN DIAGRAM: `onEdgeUpdateEnd`");

        // Needed for when the edge update operation doesn't change anything.
        bpmnEditorStoreApi.setState((state) => {
          state.diagram.ongoingConnection = undefined;
          state.diagram.edgeIdBeingUpdated = undefined;
        });
      },
      [bpmnEditorStoreApi]
    );

    // Override Reactflow's behavior by intercepting the keydown event using its `capture` variant.
    const handleRfKeyDownCapture = useCallback(
      (e: React.KeyboardEvent) => {
        const s = bpmnEditorStoreApi.getState();

        if (e.key === "Escape") {
          if (s.computed(s).isDiagramEditingInProgress() && bpmnModelBeforeEditingRef.current) {
            console.debug(
              "BPMN DIAGRAM: Intercepting Escape pressed and preventing propagation. Reverting BPMN model to what it was before editing began."
            );

            e.stopPropagation();
            e.preventDefault();

            resetToBeforeEditingBegan();
          } else if (!s.diagram.ongoingConnection) {
            bpmnEditorStoreApi.setState((state) => {
              if (
                state.computed(s).getDiagramData().selectedNodesById.size > 0 ||
                state.computed(s).getDiagramData().selectedEdgesById.size > 0
              ) {
                console.debug("BPMN DIAGRAM: Esc pressed. Desselecting everything.");
                state.diagram._selectedNodes = [];
                state.diagram._selectedEdges = [];
                e.preventDefault();
              } else if (
                state.computed(s).getDiagramData().selectedNodesById.size <= 0 &&
                state.computed(s).getDiagramData().selectedEdgesById.size <= 0
              ) {
                console.debug("BPMN DIAGRAM: Esc pressed. Closing all open panels.");
                state.diagram.propertiesPanel.isOpen = false;
                state.diagram.overlaysPanel.isOpen = false;
                state.diagram.openLhsPanel = DiagramLhsPanel.NONE;
                e.preventDefault();
              } else {
                // Let the
              }
            });
          } else {
            // Let the KeyboardShortcuts handle it.
          }
        }
      },
      [bpmnEditorStoreApi, bpmnModelBeforeEditingRef, externalModelsByNamespace, resetToBeforeEditingBegan]
    );

    const [showEmptyState, setShowEmptyState] = useState(true);

    const nodes = useBpmnEditorStore((s) => s.computed(s).getDiagramData().nodes);
    const edges = useBpmnEditorStore((s) => s.computed(s).getDiagramData().edges);

    const isEmptyStateShowing = showEmptyState && nodes.length === 0;

    return (
      <>
        {isEmptyStateShowing && <BpmnDiagramEmptyState setShowEmptyState={setShowEmptyState} />}
        <DiagramContainerContextProvider container={container}>
          <svg style={{ position: "absolute", top: 0, left: 0 }}>
            <EdgeMarkers />
          </svg>

          <RF.ReactFlow
            connectionMode={RF.ConnectionMode.Loose} // Allow target handles to be used as source. This is very important for allowing the positional handles to be updated for the base of an edge.
            onKeyDownCapture={handleRfKeyDownCapture} // Override Reactflow's keyboard listeners.
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onEdgeUpdateStart={onEdgeUpdateStart}
            onEdgeUpdateEnd={onEdgeUpdateEnd}
            onEdgeUpdate={onEdgeUpdate}
            onlyRenderVisibleElements={true}
            zoomOnDoubleClick={false}
            elementsSelectable={true}
            panOnScroll={true}
            zoomOnScroll={false}
            preventScrolling={true}
            selectionOnDrag={true}
            panOnDrag={PAN_ON_DRAG}
            selectionMode={RF.SelectionMode.Full} // For selections happening inside Containment nodes it's better to leave it as "Full"
            isValidConnection={isValidConnection}
            connectionLineComponent={ConnectionLine}
            onConnect={onConnect}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            // (begin)
            // 'Starting to drag' and 'dragging' should have the same behavior. Otherwise,
            // clicking a node and letting it go, without moving, won't work properly, and
            // Decisions will be removed from Decision Services.
            onNodeDragStart={onNodeDragStart}
            onNodeDrag={onNodeDrag}
            // (end)
            onNodeDragStop={onNodeDragStop}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            snapToGrid={true}
            snapGrid={rfSnapGrid}
            defaultViewport={DEFAULT_VIEWPORT}
            fitView={false}
            fitViewOptions={FIT_VIEW_OPTIONS}
            attributionPosition={"bottom-right"}
            onInit={setReactFlowInstance}
            deleteKeyCode={DELETE_NODE_KEY_CODES}
            // (begin)
            // Used to make the Palette work by dropping nodes on the Reactflow Canvas
            onDrop={onDrop}
            onDragOver={onDragOver}
            // (end)
          >
            <SelectionStatus />
            <Palette pulse={isEmptyStateShowing} />
            <TopRightCornerPanels availableHeight={container.current?.offsetHeight} />
            <DiagramCommands />
            {!isFirefox && <RF.Background />}
            <RF.Controls fitViewOptions={FIT_VIEW_OPTIONS} position={"bottom-right"} />
            <SetConnectionToReactFlowStore />
          </RF.ReactFlow>
        </DiagramContainerContextProvider>
      </>
    );
  }
);

function BpmnDiagramEmptyState({
  setShowEmptyState,
}: {
  setShowEmptyState: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

  return (
    <Bullseye
      style={{
        position: "absolute",
        width: "100%",
        pointerEvents: "none",
        zIndex: 1,
        height: "auto",
        marginTop: "120px",
      }}
    >
      <div className={"kie-bpmn-editor--diagram-empty-state"}>
        <Button
          title={"Close"}
          style={{
            position: "absolute",
            top: "8px",
            right: 0,
          }}
          variant={ButtonVariant.plain}
          icon={<TimesIcon />}
          onClick={() => setShowEmptyState(false)}
        />

        <EmptyState>
          <EmptyStateIcon icon={MousePointerIcon} />
          <Title size={"md"} headingLevel={"h4"}>
            {`This BPMN is empty`}
          </Title>
          <EmptyStateBody>Start by dragging nodes from the Palette</EmptyStateBody>
          <br />
          <EmptyStateBody>or</EmptyStateBody>
          <EmptyStatePrimary>
            <Button
              variant={ButtonVariant.link}
              icon={<AngleDoubleRightIcon />}
              onClick={() => {
                // FIXME: Tiago: ...
              }}
            >
              New Straight-Through Process (STP)...
            </Button>
            <br />
            <Button
              variant={ButtonVariant.link}
              icon={<UserIcon />}
              onClick={() => {
                // FIXME: Tiago: ...
              }}
            >
              New Human Task...
            </Button>
          </EmptyStatePrimary>
        </EmptyState>
      </div>
    </Bullseye>
  );
}

export function SetConnectionToReactFlowStore(props: {}) {
  const ongoingConnection = useBpmnEditorStore((s) => s.diagram.ongoingConnection);
  const rfStoreApi = RF.useStoreApi();
  useEffect(() => {
    rfStoreApi.setState({
      connectionHandleId: ongoingConnection?.handleId,
      connectionHandleType: ongoingConnection?.handleType,
      connectionNodeId: ongoingConnection?.nodeId,
    });
  }, [ongoingConnection?.handleId, ongoingConnection?.handleType, ongoingConnection?.nodeId, rfStoreApi]);

  return <></>;
}

interface TopRightCornerPanelsProps {
  availableHeight?: number | undefined;
}

export function TopRightCornerPanels({ availableHeight }: TopRightCornerPanelsProps) {
  const diagram = useBpmnEditorStore((s) => s.diagram);
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

  const togglePropertiesPanel = useCallback(() => {
    bpmnEditorStoreApi.setState((state) => {
      state.diagram.propertiesPanel.isOpen = !state.diagram.propertiesPanel.isOpen;
    });
  }, [bpmnEditorStoreApi]);

  const toggleOverlaysPanel = useCallback(() => {
    bpmnEditorStoreApi.setState((state) => {
      state.diagram.overlaysPanel.isOpen = !state.diagram.overlaysPanel.isOpen;
    });
  }, [bpmnEditorStoreApi]);

  useLayoutEffect(() => {
    bpmnEditorStoreApi.setState((state) => {
      if (state.diagram.overlaysPanel.isOpen) {
        // This is necessary to make sure that the Popover is open at the correct position.
        setTimeout(() => {
          bpmnEditorStoreApi.setState((state) => {
            state.diagram.overlaysPanel.isOpen = true;
          });
        }, 300); // That's the animation duration to open/close the properties panel.
      }
      state.diagram.overlaysPanel.isOpen = false;
    });
  }, [bpmnEditorStoreApi, diagram.propertiesPanel.isOpen]);

  return (
    <>
      <RF.Panel position={"top-right"} style={{ display: "flex" }}>
        <aside className={"kie-bpmn-editor--overlays-panel-toggle"}>
          <Popover
            className={"kie-bpmn-editor--overlay-panel-popover"}
            key={`${diagram.overlaysPanel.isOpen}`}
            aria-label="Overlays Panel"
            position={"bottom-end"}
            enableFlip={false}
            flipBehavior={["bottom-end"]}
            hideOnOutsideClick={false}
            isVisible={diagram.overlaysPanel.isOpen}
            bodyContent={<OverlaysPanel availableHeight={(availableHeight ?? 0) - AREA_ABOVE_OVERLAYS_PANEL} />}
          >
            <button
              className={"kie-bpmn-editor--overlays-panel-toggle-button"}
              onClick={toggleOverlaysPanel}
              title={"Overlays"}
            >
              <VirtualMachineIcon size={"sm"} />
            </button>
          </Popover>
        </aside>
        {!diagram.propertiesPanel.isOpen && (
          <aside className={"kie-bpmn-editor--properties-panel-toggle"}>
            <button
              className={"kie-bpmn-editor--properties-panel-toggle-button"}
              onClick={togglePropertiesPanel}
              title={"Properties panel"}
            >
              <InfoIcon size={"sm"} />
            </button>
          </aside>
        )}
      </RF.Panel>
    </>
  );
}

export function SelectionStatus() {
  const rfStoreApi = RF.useStoreApi();

  const { externalModelsByNamespace } = useExternalModels();
  const selectedNodesCount = useBpmnEditorStore((s) => s.computed(s).getDiagramData().selectedNodesById.size);
  const selectedEdgesCount = useBpmnEditorStore((s) => s.computed(s).getDiagramData().selectedEdgesById.size);
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

  useEffect(() => {
    if (selectedNodesCount >= 2) {
      rfStoreApi.setState({ nodesSelectionActive: true });
    }
  }, [rfStoreApi, selectedNodesCount]);

  const onClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      bpmnEditorStoreApi.setState((state) => {
        state.diagram._selectedNodes = [];
        state.diagram._selectedEdges = [];
      });
    },
    [bpmnEditorStoreApi]
  );

  return (
    <>
      {(selectedNodesCount + selectedEdgesCount >= 2 && (
        <RF.Panel position={"top-center"}>
          <Label style={{ paddingLeft: "24px" }} onClose={onClose}>
            {(selectedEdgesCount === 0 && `${selectedNodesCount} nodes selected`) ||
              (selectedNodesCount === 0 && `${selectedEdgesCount} edges selected`) ||
              `${selectedNodesCount} node${selectedNodesCount === 1 ? "" : "s"}, ${selectedEdgesCount} edge${
                selectedEdgesCount === 1 ? "" : "s"
              } selected`}
          </Label>
        </RF.Panel>
      )) || <></>}
    </>
  );
}
