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

import * as React from "react";
import * as RF from "reactflow";
import { buildHierarchy } from "../graph/graph";
import { ContainmentMap, getDefaultEdgeTypeBetween, GraphStructure } from "../graph/graphStructure";
import { checkIsValidConnection } from "../graph/isValidConnection";
import { getContainmentRelationship, getDiBoundsCenterPoint } from "../maths/DcMaths";
import { DC__Bounds, DC__Dimension, DC__Shape } from "../maths/model";
import { SnapGrid, snapShapeDimensions } from "../snapgrid/SnapGrid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReactflowKieEditorDiagramStore, useReactflowKieEditorDiagramStoreApi } from "../store/Store";
import { NodeSizes } from "../nodes/NodeSizes";
import { SelectionStatusLabel } from "./SelectionStatusLabel";
import { ReactFlowKieEditorDiagramEdgeData, ReactFlowKieEditorDiagramNodeData } from "../store/State";

const isFirefox = typeof (window as any).InstallTrigger !== "undefined"; // See https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browsers

const PAN_ON_DRAG = [1, 2];

const FIT_VIEW_OPTIONS: RF.FitViewOptions = { maxZoom: 1, minZoom: 0.1, duration: 400 };

export const DEFAULT_VIEWPORT = { x: 100, y: 100, zoom: 1 };

const DELETE_NODE_KEY_CODES = ["Backspace", "Delete"];

export type DiagramRef = {
  getReactFlowInstance: () => RF.ReactFlowInstance | undefined;
};

export function Diagram<
  N extends string,
  E extends string,
  NData extends ReactFlowKieEditorDiagramNodeData,
  EData extends ReactFlowKieEditorDiagramEdgeData,
>({
  modelBeforeEditingRef,
  model,
  resetToBeforeEditingBegan,
  containmentMap,
  nodeTypes,
  edgeTypes,
  NODE_TYPES,
  MIN_NODE_SIZES,
  graphStructure,
  children,
  connectionLineComponent,
  container,
  ref,
}: {
  nodeTypes: RF.NodeTypes;
  edgeTypes: RF.EdgeTypes;
  modelBeforeEditingRef: React.MutableRefObject<unknown>;
  model: unknown;
  resetToBeforeEditingBegan: () => void;
  containmentMap: ContainmentMap<N>;
  NODE_TYPES: Record<string, string>;
  MIN_NODE_SIZES: NodeSizes<N>;
  graphStructure: GraphStructure<N, E>;
  connectionLineComponent: RF.ConnectionLineComponent;
  children: React.ReactElement[];
  ref: React.RefObject<DiagramRef>;
  container: React.RefObject<HTMLElement>;
}) {
  // Contexts
  const reactflowKieEditorDiagramStoreApi = useReactflowKieEditorDiagramStoreApi();
  const snapGrid = useReactflowKieEditorDiagramStore((s) => s.reactflowKieEditorDiagram.snapGrid);

  // State
  const [reactFlowInstance, setReactFlowInstance] = useState<RF.ReactFlowInstance<NData, EData> | undefined>(undefined);

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
      reactflowKieEditorDiagramStoreApi.setState((state) => {
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

        console.log("XYFLOW-DIAGRAM: Edge added");
        // FIXME: Tiago: Mutation
        // addEdge({
      });
    },
    [reactflowKieEditorDiagramStoreApi]
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
              containerMinSizes: MIN_NODE_SIZES[node.type as N],
              boundsMinSizes: minSizes,
            }).isInside
        ),
    [MIN_NODE_SIZES, reactFlowInstance]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    //   if (!e.dataTransfer.types.find((t) => t === MIME_TYPE_FOR_BPMN_EDITOR_NEW_NODE_FROM_PALETTE)) {
    //     return;
    //   }
    //   e.preventDefault();
    //   e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(async (e: React.DragEvent) => {
    console.log("XYFLOW-DIAGRAM: Node added (standalone)");
    // e.preventDefault();
    // if (!container.current || !reactFlowInstance) {
    //   return;
    // }
    // // we need to remove the wrapper bounds, in order to get the correct position
    // const dropPoint = reactFlowInstance.screenToFlowPosition({
    //   x: e.clientX,
    //   y: e.clientY,
    // });
    // if (e.dataTransfer.getData(MIME_TYPE_FOR_BPMN_EDITOR_NEW_NODE_FROM_PALETTE)) {
    //   const typeOfNewNodeFromPalette = e.dataTransfer.getData(
    //     MIME_TYPE_FOR_BPMN_EDITOR_NEW_NODE_FROM_PALETTE
    //   ) as BpmnNodeType;
    //   e.stopPropagation();
    //   // --------- This is where we draw the line between the diagram and the model.
    //   // FIXME: Tiago: Mutation
    //   // addStandaloneNode({
    // } else {
    //   // FIXME: Tiago: Mutation
    //   // addShape({
    // }
    // console.debug(`BPMN DIAGRAM: Adding Process Flow Element node`, JSON.stringify(null));
  }, []);

  const ongoingConnection = useReactflowKieEditorDiagramStore((s) => s.reactflowKieEditorDiagram.ongoingConnection);
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
      reactflowKieEditorDiagramStoreApi.setState((state) => {
        state.reactflowKieEditorDiagram.ongoingConnection = newConnection;
      });
    },
    [reactflowKieEditorDiagramStoreApi]
  );

  const onConnectEnd = useCallback<RF.OnConnectEnd>(
    (e) => {
      if (!(e instanceof MouseEvent)) {
        console.debug("BPMN DIAGRAM: Ignoring `onConnectEnd`. Not MouseEvent.");
        return;
      }

      console.debug("BPMN DIAGRAM: `onConnectEnd`");

      reactflowKieEditorDiagramStoreApi.setState((state) => {
        const targetIsPane = (e.target as Element | null)?.classList?.contains("react-flow__pane");
        if (
          !targetIsPane ||
          !container.current ||
          !state.reactflowKieEditorDiagram.ongoingConnection ||
          !reactFlowInstance
        ) {
          return;
        }

        const dropPoint = reactFlowInstance.screenToFlowPosition({
          x: e.clientX,
          y: e.clientY,
        });

        // only try to create node if source handle is compatible
        if (!Object.values(NODE_TYPES).find((n) => n === state.reactflowKieEditorDiagram.ongoingConnection!.handleId)) {
          return;
        }

        if (!state.reactflowKieEditorDiagram.ongoingConnection.nodeId) {
          return;
        }

        const sourceNode = state
          .computed(state)
          .getDiagramData()
          .nodesById.get(state.reactflowKieEditorDiagram.ongoingConnection.nodeId);
        if (!sourceNode) {
          return;
        }

        const sourceNodeBounds = state.computed(state).getDiagramData().nodesById.get(sourceNode.id)?.data.shape[
          "dc:Bounds"
        ];
        if (!sourceNodeBounds) {
          return;
        }

        const newNodeType = state.reactflowKieEditorDiagram.ongoingConnection.handleId as N;
        const sourceNodeType = sourceNode.type as N;

        const edgeType = getDefaultEdgeTypeBetween(graphStructure, sourceNodeType as N, newNodeType);
        if (!edgeType) {
          throw new Error(`BPMN DIAGRAM: Invalid structure: ${sourceNodeType} --(any)--> ${newNodeType}`);
        }

        // --------- This is where we draw the line between the diagram and the model.

        console.log("XYFLOW-DIAGRAM: Node added (connected)");
        // FIXME: Tiago: Mutation
        // addConnectedNode({
      });

      // Indepdent of what happens in the state mutation above, we always need to reset the `ongoingConnection` at the end here.
      reactflowKieEditorDiagramStoreApi.setState((state) => {
        state.reactflowKieEditorDiagram.ongoingConnection = undefined;
      });
    },
    [reactflowKieEditorDiagramStoreApi, container, reactFlowInstance, NODE_TYPES, graphStructure]
  );

  const isValidConnection = useCallback<RF.IsValidConnection>(
    (edgeOrConnection) => {
      const state = reactflowKieEditorDiagramStoreApi.getState();
      const edgeId = state.reactflowKieEditorDiagram.edgeIdBeingUpdated;
      const edgeType = edgeId ? (reactFlowInstance?.getEdge(edgeId)?.type as E) : undefined;

      const ongoingConnectionHierarchy = buildHierarchy({
        nodeId: state.reactflowKieEditorDiagram.ongoingConnection?.nodeId,
        edges: state.computed(state).getDiagramData().graphStructureEdges,
      });

      return (
        // Reflexive edges are not allowed
        edgeOrConnection.source !== edgeOrConnection.target &&
        // Matches graph structure.
        checkIsValidConnection(
          graphStructure,
          state.computed(state).getDiagramData().nodesById,
          edgeOrConnection,
          edgeType
        ) &&
        // Does not form cycles.
        !!edgeOrConnection.target &&
        !ongoingConnectionHierarchy.dependencies.has(edgeOrConnection.target) &&
        !!edgeOrConnection.source &&
        !ongoingConnectionHierarchy.dependents.has(edgeOrConnection.source)
      );
    },
    [reactflowKieEditorDiagramStoreApi, reactFlowInstance, graphStructure]
  );

  const onNodesChange = useCallback<RF.OnNodesChange>(
    (changes) => {
      if (!reactFlowInstance) {
        return;
      }

      reactflowKieEditorDiagramStoreApi.setState((state) => {
        const controlWaypointsByEdge = new Map<number, Set<number>>();

        for (const change of changes) {
          switch (change.type) {
            case "add":
              console.debug(`BPMN DIAGRAM: 'onNodesChange' --> add '${change.item.id}'`);
              state.dispatch(state).setNodeStatus(change.item.id, { selected: true });
              break;
            case "dimensions":
              console.debug(`BPMN DIAGRAM: 'onNodesChange' --> dimensions '${change.id}'`);
              state.dispatch(state).setNodeStatus(change.id, { resizing: change.resizing });
              if (change.dimensions) {
                const node = state.computed(state).getDiagramData().nodesById.get(change.id)!;
                // We only need to resize the node if its snapped dimensions change, as snapping is non-destructive.
                const snappedShape = snapShapeDimensions(
                  state.reactflowKieEditorDiagram.snapGrid,
                  node.data.shape,
                  MIN_NODE_SIZES[node.type as N]({
                    snapGrid: state.reactflowKieEditorDiagram.snapGrid,
                  })
                );
                if (
                  snappedShape.width !== change.dimensions.width ||
                  snappedShape.height !== change.dimensions.height
                ) {
                  console.log("XYFLOW-DIAGRAM: Node resized");
                  // FIXME: Tiago: Mutation
                  // resizeNode({
                }
              }
              break;
            case "position":
              console.debug(`BPMN DIAGRAM: 'onNodesChange' --> position '${change.id}'`);
              state.dispatch(state).setNodeStatus(change.id, { dragging: change.dragging });
              if (change.positionAbsolute) {
                const node = state.computed(state).getDiagramData().nodesById.get(change.id)!;

                console.log("XYFLOW-DIAGRAM: Node repositioned");
                // FIXME: Tiago: Mutation
                // repositionNode({
              }
              break;
            case "remove":
              console.debug(`BPMN DIAGRAM: 'onNodesChange' --> remove '${change.id}'`);
              const node = state.computed(state).getDiagramData().nodesById.get(change.id)!;
              console.log("XYFLOW-DIAGRAM: Node deleted");
              // FIXME: Tiago: Mutation
              // deleteNode({

              state.dispatch(state).setNodeStatus(node.id, {
                selected: false,
                dragging: false,
                resizing: false,
              });
              break;
            case "reset":
              state.dispatch(state).setNodeStatus(change.item.id, {
                selected: false,
                dragging: false,
                resizing: false,
              });
              break;
            case "select":
              state.dispatch(state).setNodeStatus(change.id, { selected: change.selected });
              break;
          }
        }
      });
    },
    [MIN_NODE_SIZES, reactFlowInstance, reactflowKieEditorDiagramStoreApi]
  );

  const onNodeDrag = useCallback<RF.NodeDragHandler>(
    (e, node: RF.Node<NData>) => {
      nodeIdBeingDraggedRef.current = node.id;
      reactflowKieEditorDiagramStoreApi.setState((state) => {
        state.reactflowKieEditorDiagram.dropTargetNode = getFirstNodeFittingBounds(
          node.id,
          {
            "@_x": node.positionAbsolute?.x ?? 0,
            "@_y": node.positionAbsolute?.y ?? 0,
            "@_width": node.width ?? 0,
            "@_height": node.height ?? 0,
          },
          MIN_NODE_SIZES[node.type as N],
          state.reactflowKieEditorDiagram.snapGrid
        );
      });
    },
    [reactflowKieEditorDiagramStoreApi, getFirstNodeFittingBounds, MIN_NODE_SIZES]
  );

  const onNodeDragStart = useCallback<RF.NodeDragHandler>(
    (e, node: RF.Node<NData>, nodes) => {
      modelBeforeEditingRef.current = model;
      onNodeDrag(e, node, nodes);
    },
    [modelBeforeEditingRef, onNodeDrag, model]
  );

  const onNodeDragStop = useCallback<RF.NodeDragHandler>(
    (e, node: RF.Node<NData>) => {
      try {
        reactflowKieEditorDiagramStoreApi.setState((state) => {
          console.debug("BPMN DIAGRAM: `onNodeDragStop`");
          const nodeBeingDragged = state.computed(state).getDiagramData().nodesById.get(nodeIdBeingDraggedRef.current!);
          nodeIdBeingDraggedRef.current = null;
          if (!nodeBeingDragged) {
            return;
          }

          // Validate
          const dropTargetNode = reactflowKieEditorDiagramStoreApi.getState().reactflowKieEditorDiagram.dropTargetNode;
          if (
            dropTargetNode &&
            containmentMap.has(dropTargetNode.type as N) &&
            !state.computed(state).isDropTargetNodeValidForSelection
          ) {
            console.debug(
              `BPMN DIAGRAM: Invalid containment: '${[...state.computed(state).getDiagramData().selectedNodeTypes].join(
                "', '"
              )}' inside '${dropTargetNode.type}'. Ignoring nodes dropped.`
            );
            resetToBeforeEditingBegan();
            return;
          }

          const selectedNodes = [...state.computed(state).getDiagramData().selectedNodesById.values()];

          state.reactflowKieEditorDiagram.dropTargetNode = undefined;

          if (!node.dragging) {
            return;
          }

          console.log("XYFLOW-DIAGRAM: Node parented");
          // FIXME: Tiago: Containment
          // Un-parent
          // if (nodeBeingDragged.data.parentRfNode) {
          //   const p = state.computed(state).getDiagramData().nodesById.get(nodeBeingDragged.data.parentRfNode.id);
          //   if (p?.type === NODE_TYPES.lane && nodeBeingDragged.type === NODE_TYPES.lane) {
          //     // FIXME: Tiago: Containment
          //   } else {
          //     console.debug(
          //       `BPMN DIAGRAM: Ignoring '${nodeBeingDragged.type}' with parent '${dropTargetNode?.type}' dropping somewhere..`
          //     );
          //   }
          // }

          // // Parent
          // if (dropTargetNode?.type === NODE_TYPES.lane) {
          //   // FIXME: Tiago: Containment
          // } else {
          //   console.debug(
          //     `BPMN DIAGRAM: Ignoring '${nodeBeingDragged.type}' dropped on top of '${dropTargetNode?.type}'`
          //   );
          // }
        });
      } catch (e) {
        console.error(e);
        resetToBeforeEditingBegan();
      }
    },
    [containmentMap, reactflowKieEditorDiagramStoreApi, resetToBeforeEditingBegan]
  );

  const onEdgesChange = useCallback<RF.OnEdgesChange>(
    (changes) => {
      reactflowKieEditorDiagramStoreApi.setState((state) => {
        for (const change of changes) {
          switch (change.type) {
            case "select":
              console.debug(`BPMN DIAGRAM: 'onEdgesChange' --> select '${change.id}'`);
              state.dispatch(state).setEdgeStatus(change.id, { selected: change.selected });
              break;
            case "remove":
              console.debug(`BPMN DIAGRAM: 'onEdgesChange' --> remove '${change.id}'`);
              const edge = state.computed(state).getDiagramData().edgesById.get(change.id);
              if (edge?.data) {
                console.log("XYFLOW-DIAGRAM: Edge deleted");
                // FIXME: Tiago: Mutation
                // deleteEdge({
                state.dispatch(state).setEdgeStatus(change.id, {
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
    [reactflowKieEditorDiagramStoreApi]
  );

  const onEdgeUpdate = useCallback<RF.OnEdgeUpdateFunc<EData>>(
    (oldEdge, newConnection) => {
      console.debug("BPMN DIAGRAM: `onEdgeUpdate`", oldEdge, newConnection);

      reactflowKieEditorDiagramStoreApi.setState((state) => {
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

        const lastWaypoint = oldEdge.data?.edgeInfo
          ? oldEdge.data!["di:waypoint"]![oldEdge.data!["di:waypoint"]!.length - 1]!
          : getDiBoundsCenterPoint(targetBounds);
        const firstWaypoint = oldEdge.data?.edgeInfo
          ? oldEdge.data!["di:waypoint"]![0]!
          : getDiBoundsCenterPoint(sourceBounds);

        console.log("XYFLOW-DIAGRAM: Edge updated");
        // FIXME: Tiago: Mutation
        // addEdge({
      });
    },
    [reactflowKieEditorDiagramStoreApi]
  );

  const onEdgeUpdateStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, edge: RF.Edge, handleType: RF.HandleType) => {
      console.debug("BPMN DIAGRAM: `onEdgeUpdateStart`");
      reactflowKieEditorDiagramStoreApi.setState((state) => {
        state.reactflowKieEditorDiagram.edgeIdBeingUpdated = edge.id;
      });
    },
    [reactflowKieEditorDiagramStoreApi]
  );

  const onEdgeUpdateEnd = useCallback(
    (e: MouseEvent | TouchEvent, edge: RF.Edge, handleType: RF.HandleType) => {
      console.debug("BPMN DIAGRAM: `onEdgeUpdateEnd`");

      // Needed for when the edge update operation doesn't change anything.
      reactflowKieEditorDiagramStoreApi.setState((state) => {
        state.reactflowKieEditorDiagram.ongoingConnection = undefined;
        state.reactflowKieEditorDiagram.edgeIdBeingUpdated = undefined;
      });
    },
    [reactflowKieEditorDiagramStoreApi]
  );

  // Override Reactflow's behavior by intercepting the keydown event using its `capture` variant.
  const handleRfKeyDownCapture = useCallback(
    (e: React.KeyboardEvent) => {
      const s = reactflowKieEditorDiagramStoreApi.getState();

      if (e.key === "Escape") {
        if (s.computed(s).isDiagramEditingInProgress() && modelBeforeEditingRef.current) {
          console.debug(
            "BPMN DIAGRAM: Intercepting Escape pressed and preventing propagation. Reverting BPMN model to what it was before editing began."
          );

          e.stopPropagation();
          e.preventDefault();

          resetToBeforeEditingBegan();
        } else if (!s.reactflowKieEditorDiagram.ongoingConnection) {
          reactflowKieEditorDiagramStoreApi.setState((state) => {
            if (
              state.computed(s).getDiagramData().selectedNodesById.size > 0 ||
              state.computed(s).getDiagramData().selectedEdgesById.size > 0
            ) {
              console.debug("BPMN DIAGRAM: Esc pressed. Desselecting everything.");
              state.reactflowKieEditorDiagram._selectedNodes = [];
              state.reactflowKieEditorDiagram._selectedEdges = [];
              e.preventDefault();
            } else if (
              state.computed(s).getDiagramData().selectedNodesById.size <= 0 &&
              state.computed(s).getDiagramData().selectedEdgesById.size <= 0
            ) {
              console.debug("BPMN DIAGRAM: Esc pressed. Closing all open panels.");
              console.log("XYFLOW-DIAGRAM: Esc pressed");
              // FIXME: Tiago --> Expose this
              // state.diagram.propertiesPanel.isOpen = false;
              // state.diagram.overlaysPanel.isOpen = false;
              // state.diagram.openLhsPanel = DiagramLhsPanel.NONE;
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
    [reactflowKieEditorDiagramStoreApi, modelBeforeEditingRef, resetToBeforeEditingBegan]
  );

  const nodes = useReactflowKieEditorDiagramStore((s) => s.computed(s).getDiagramData().nodes);
  const edges = useReactflowKieEditorDiagramStore((s) => s.computed(s).getDiagramData().edges);

  return (
    <>
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
        connectionLineComponent={connectionLineComponent}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        // (begin)
        // 'Starting to drag' and 'dragging' should have the same behavior. Otherwise,
        // clicking a node and letting it go, without moving, won't work properly, and
        // Nodes will be removed from Containment Nodes.
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
        {children}
        <SelectionStatusLabel />
        {!isFirefox && <RF.Background />}
        <RF.Controls fitViewOptions={FIT_VIEW_OPTIONS} position={"bottom-right"} />
        <SetConnectionToReactFlowStore />
      </RF.ReactFlow>
    </>
  );
}

export function SetConnectionToReactFlowStore(props: {}) {
  const ongoingConnection = useReactflowKieEditorDiagramStore((s) => s.reactflowKieEditorDiagram.ongoingConnection);
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
