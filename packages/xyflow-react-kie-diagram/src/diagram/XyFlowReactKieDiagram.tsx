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
import { DC__Bounds, DC__Dimension, DC__Point, DC__Shape } from "../maths/model";
import { SnapGrid, snapShapeDimensions } from "../snapgrid/SnapGrid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useXyFlowReactKieDiagramStore, useXyFlowReactKieDiagramStoreApi } from "../store/Store";
import { NodeSizes } from "../nodes/NodeSizes";
import { SelectionStatusLabel } from "./SelectionStatusLabel";
import { XyFlowDiagramState, XyFlowReactKieDiagramEdgeData, XyFlowReactKieDiagramNodeData } from "../store/State";
import { Draft } from "immer";
import { PositionalNodeHandleId } from "../nodes/PositionalNodeHandles";

// nodes

export type OnNodeAdded<
  S extends XyFlowDiagramState<S, N, NData, EData>,
  N extends string,
  NData extends XyFlowReactKieDiagramNodeData<N, NData>,
  EData extends XyFlowReactKieDiagramEdgeData,
> = (args: { state: Draft<S>; type: N; dropPoint: { x: number; y: number } }) => { newNodeId: string };

export type OnConnectedNodeAdded<
  S extends XyFlowDiagramState<S, N, NData, EData>,
  N extends string,
  E extends string,
  NData extends XyFlowReactKieDiagramNodeData<N, NData>,
  EData extends XyFlowReactKieDiagramEdgeData,
> = (args: {
  state: Draft<S>;
  sourceNode: RF.Node<NData, N>;
  newNodeType: N;
  edgeType: E;
  dropPoint: { x: number; y: number };
}) => { newNodeId: string };

export type OnNodeUnparented<
  S extends XyFlowDiagramState<S, N, NData, EData>,
  N extends string,
  NData extends XyFlowReactKieDiagramNodeData<N, NData>,
  EData extends XyFlowReactKieDiagramEdgeData,
> = (args: {
  state: Draft<S>;
  exParentNode: RF.Node<NData, N>;
  activeNode: RF.Node<NData, N>;
  selectedNodes: RF.Node<NData, N>[];
}) => void;

export type OnNodeParented<
  S extends XyFlowDiagramState<S, N, NData, EData>,
  N extends string,
  NData extends XyFlowReactKieDiagramNodeData<N, NData>,
  EData extends XyFlowReactKieDiagramEdgeData,
> = (args: {
  state: Draft<S>;
  parentNode: RF.Node<NData, N>;
  activeNode: RF.Node<NData, N>;
  selectedNodes: RF.Node<NData, N>[];
}) => void;

export type OnNodeRepositioned<
  S extends XyFlowDiagramState<S, N, NData, EData>,
  N extends string,
  NData extends XyFlowReactKieDiagramNodeData<N, NData>,
  EData extends XyFlowReactKieDiagramEdgeData,
> = (args: {
  state: Draft<S>;
  /** Set of waypoint indexes by Edge index */
  controlWaypointsByEdge: Map<number, Set<number>>;
  node: RF.Node<NData, N>;
  newPosition: RF.XYPosition;
}) => void;

export type OnNodeDeleted<
  S extends XyFlowDiagramState<S, N, NData, EData>,
  N extends string,
  NData extends XyFlowReactKieDiagramNodeData<N, NData>,
  EData extends XyFlowReactKieDiagramEdgeData,
> = (args: { state: Draft<S>; node: RF.Node<NData, N> }) => void;

export type OnNodeResized<
  S extends XyFlowDiagramState<S, N, NData, EData>,
  N extends string,
  NData extends XyFlowReactKieDiagramNodeData<N, NData>,
  EData extends XyFlowReactKieDiagramEdgeData,
> = (args: { state: Draft<S>; node: RF.Node<NData, N>; newDimensions: { width: number; height: number } }) => void;

// edges

export type OnEdgeAdded<
  S extends XyFlowDiagramState<S, N, NData, EData>,
  N extends string,
  E extends string,
  NData extends XyFlowReactKieDiagramNodeData<N, NData>,
  EData extends XyFlowReactKieDiagramEdgeData,
> = (args: {
  state: Draft<S>;
  sourceNode: RF.Node<NData, N>;
  targetNode: RF.Node<NData, N>;
  edgeType: E;
  sourceHandle: PositionalNodeHandleId;
  targetHandle: PositionalNodeHandleId;
}) => void;

export type OnEdgeUpdated<
  S extends XyFlowDiagramState<S, N, NData, EData>,
  N extends string,
  E extends string,
  NData extends XyFlowReactKieDiagramNodeData<N, NData>,
  EData extends XyFlowReactKieDiagramEdgeData,
> = (args: {
  state: Draft<S>;
  sourceNode: RF.Node<NData, N>;
  targetNode: RF.Node<NData, N>;
  edge: RF.Edge<EData>;
  targetHandle: PositionalNodeHandleId;
  sourceHandle: PositionalNodeHandleId;
  firstWaypoint: DC__Point;
  lastWaypoint: DC__Point;
}) => void;

export type OnEdgeDeleted<
  S extends XyFlowDiagramState<S, N, NData, EData>,
  N extends string,
  E extends string,
  NData extends XyFlowReactKieDiagramNodeData<N, NData>,
  EData extends XyFlowReactKieDiagramEdgeData,
> = (args: { state: Draft<S>; edge: RF.Edge<EData> }) => void;

// waypoints

export type OnWaypointAdded = () => void;
export type OnWaypointRepositioned = () => void;
export type OnWaypointDeleted = () => void;

// misc

export type OnEscPressed = () => void;

//

export type Props<
  S extends XyFlowDiagramState<S, N, NData, EData>,
  N extends string,
  E extends string,
  NData extends XyFlowReactKieDiagramNodeData<N, NData>,
  EData extends XyFlowReactKieDiagramEdgeData,
> = {
  // model
  model: unknown;
  modelBeforeEditingRef: React.MutableRefObject<unknown>;
  resetToBeforeEditingBegan: () => void;
  // components
  connectionLineComponent: RF.ConnectionLineComponent;
  nodeComponents: RF.NodeTypes;
  edgeComponents: RF.EdgeTypes;
  // infra
  diagramRef: React.RefObject<DiagramRef<N, NData, EData>>;
  children: React.ReactElement[];
  container: React.RefObject<HTMLElement>;
  // domain
  newNodeMimeType: string;
  containmentMap: ContainmentMap<N>;
  nodeTypes: Record<string, string>;
  minNodeSizes: NodeSizes<N>;
  graphStructure: GraphStructure<N, E>;
  // actions
  onNodeRepositioned: OnNodeRepositioned<S, N, NData, EData>;
  onNodeDeleted: OnNodeDeleted<S, N, NData, EData>;
  onNodeAdded: OnNodeAdded<S, N, NData, EData>;
  onNodeUnparented: OnNodeUnparented<S, N, NData, EData>;
  onNodeParented: OnNodeParented<S, N, NData, EData>;
  onConnectedNodeAdded: OnConnectedNodeAdded<S, N, E, NData, EData>;
  onNodeResized: OnNodeResized<S, N, NData, EData>;
  onEdgeAdded: OnEdgeAdded<S, N, E, NData, EData>;
  onEdgeUpdated: OnEdgeUpdated<S, N, E, NData, EData>;
  onEdgeDeleted: OnEdgeDeleted<S, N, E, NData, EData>;
  onEscPressed: OnEscPressed;
  onWaypointAdded: OnWaypointAdded;
  onWaypointRepositioned: OnWaypointRepositioned;
  onWaypointDeleted: OnWaypointDeleted;
};

//

const isFirefox = typeof (window as any).InstallTrigger !== "undefined"; // See https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browsers

const PAN_ON_DRAG = [1, 2];

const FIT_VIEW_OPTIONS: RF.FitViewOptions = { maxZoom: 1, minZoom: 0.1, duration: 400 };

export const DEFAULT_VIEWPORT = { x: 100, y: 100, zoom: 1 };

const DELETE_NODE_KEY_CODES = ["Backspace", "Delete"];

export type DiagramRef<
  N extends string,
  NData extends XyFlowReactKieDiagramNodeData<N, NData>,
  EData extends XyFlowReactKieDiagramEdgeData,
> = {
  getReactFlowInstance: () => RF.ReactFlowInstance<NData, EData> | undefined;
};

export function XyFlowReactKieDiagram<
  S extends XyFlowDiagramState<S, N, NData, EData>,
  N extends string,
  E extends string,
  NData extends XyFlowReactKieDiagramNodeData<N, NData>,
  EData extends XyFlowReactKieDiagramEdgeData,
>({
  // model
  model,
  modelBeforeEditingRef,
  resetToBeforeEditingBegan,
  // infra
  diagramRef,
  children,
  container,
  // components
  connectionLineComponent,
  nodeComponents,
  edgeComponents,
  // domain
  newNodeMimeType,
  containmentMap,
  nodeTypes,
  minNodeSizes,
  graphStructure,
  // actions
  onNodeAdded,
  onConnectedNodeAdded,
  onNodeUnparented,
  onNodeParented,
  onNodeRepositioned,
  onNodeResized,
  onNodeDeleted,
  onEdgeAdded,
  onEdgeUpdated,
  onEdgeDeleted,
  onEscPressed,
}: Props<S, N, E, NData, EData>) {
  // Contexts
  const xyFlowReactKieDiagramStoreApi = useXyFlowReactKieDiagramStoreApi<S, N, NData, EData>();
  const snapGrid = useXyFlowReactKieDiagramStore((s) => s.xyFlowReactKieDiagram.snapGrid);

  // State
  const [reactFlowInstance, setReactFlowInstance] = useState<RF.ReactFlowInstance<NData, EData> | undefined>(undefined);

  // Refs
  React.useImperativeHandle(diagramRef, () => ({ getReactFlowInstance: () => reactFlowInstance }), [reactFlowInstance]);

  const nodeIdBeingDraggedRef = useRef<string | null>(null);

  // Memos

  const xyFlowSnapGrid = useMemo<[number, number]>(
    () => (snapGrid.isEnabled ? [snapGrid.x, snapGrid.y] : [1, 1]),
    [snapGrid.isEnabled, snapGrid.x, snapGrid.y]
  );

  // Callbacks

  const onConnect = useCallback<RF.OnConnect>(
    ({ source, target, sourceHandle, targetHandle }) => {
      console.debug("XYFLOW KIE DIAGRAM: `onConnect`: ", { source, target, sourceHandle, targetHandle });
      const state = xyFlowReactKieDiagramStoreApi.getState();
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

      console.log("XYFLOW KIE DIAGRAM: Edge added");
      xyFlowReactKieDiagramStoreApi.setState((state) => {
        onEdgeAdded({
          state,
          sourceNode,
          targetNode,
          edgeType: sourceHandle as E,
          targetHandle: targetHandle as PositionalNodeHandleId,
          sourceHandle: sourceHandle as PositionalNodeHandleId,
        });
      });
    },
    [onEdgeAdded, xyFlowReactKieDiagramStoreApi]
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
              containerMinSizes: minNodeSizes[node.type as N],
              boundsMinSizes: minSizes,
            }).isInside
        ),
    [minNodeSizes, reactFlowInstance]
  );

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!e.dataTransfer.types.find((t) => t === newNodeMimeType)) {
        return;
      }
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    [newNodeMimeType]
  );

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      console.log("XYFLOW KIE DIAGRAM: Node added (standalone)");
      e.preventDefault();
      if (!container.current || !reactFlowInstance) {
        return;
      }
      // we need to remove the wrapper bounds, in order to get the correct position
      const dropPoint = reactFlowInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
      if (e.dataTransfer.getData(newNodeMimeType)) {
        const typeOfNode = e.dataTransfer.getData(newNodeMimeType) as N;
        e.stopPropagation();

        // --------- This is where we draw the line between the diagram and the model.

        xyFlowReactKieDiagramStoreApi.setState((state) => {
          const { newNodeId } = onNodeAdded({
            state,
            dropPoint,
            type: typeOfNode,
          });
          state.xyFlowReactKieDiagram._selectedNodes = [newNodeId];
        });
      }
    },
    [container, newNodeMimeType, onNodeAdded, reactFlowInstance, xyFlowReactKieDiagramStoreApi]
  );

  const ongoingConnection = useXyFlowReactKieDiagramStore((s) => s.xyFlowReactKieDiagram.ongoingConnection);
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
      console.debug("XYFLOW KIE DIAGRAM: `onConnectStart`");
      xyFlowReactKieDiagramStoreApi.setState((state) => {
        state.xyFlowReactKieDiagram.ongoingConnection = newConnection;
      });
    },
    [xyFlowReactKieDiagramStoreApi]
  );

  const onConnectEnd = useCallback<RF.OnConnectEnd>(
    (e) => {
      if (!(e instanceof MouseEvent)) {
        console.debug("XYFLOW KIE DIAGRAM: Ignoring `onConnectEnd`. Not MouseEvent.");
        return;
      }

      console.debug("XYFLOW KIE DIAGRAM: `onConnectEnd`");

      xyFlowReactKieDiagramStoreApi.setState((state) => {
        const targetIsPane = (e.target as Element | null)?.classList?.contains("react-flow__pane");
        if (
          !targetIsPane ||
          !container.current ||
          !state.xyFlowReactKieDiagram.ongoingConnection ||
          !reactFlowInstance
        ) {
          return;
        }

        const dropPoint = reactFlowInstance.screenToFlowPosition({
          x: e.clientX,
          y: e.clientY,
        });

        // only try to create node if source handle is compatible
        if (!Object.values(nodeTypes).find((n) => n === state.xyFlowReactKieDiagram.ongoingConnection!.handleId)) {
          return;
        }

        if (!state.xyFlowReactKieDiagram.ongoingConnection.nodeId) {
          return;
        }

        const sourceNode = state
          .computed(state)
          .getDiagramData()
          .nodesById.get(state.xyFlowReactKieDiagram.ongoingConnection.nodeId);
        if (!sourceNode) {
          return;
        }

        const sourceNodeBounds = state.computed(state).getDiagramData().nodesById.get(sourceNode.id)?.data.shape[
          "dc:Bounds"
        ];
        if (!sourceNodeBounds) {
          return;
        }

        const newNodeType = state.xyFlowReactKieDiagram.ongoingConnection.handleId as N;
        const sourceNodeType = sourceNode.type as N;

        const edgeType = getDefaultEdgeTypeBetween(graphStructure, sourceNodeType as N, newNodeType);
        if (!edgeType) {
          throw new Error(`XYFLOW KIE DIAGRAM: Invalid structure: ${sourceNodeType} --(any)--> ${newNodeType}`);
        }

        // --------- This is where we draw the line between the diagram and the model.

        console.log("XYFLOW KIE DIAGRAM: Node added (connected)");
        const { newNodeId } = onConnectedNodeAdded({
          state,
          sourceNode,
          newNodeType,
          edgeType,
          dropPoint,
        });

        state.xyFlowReactKieDiagram._selectedNodes = [newNodeId];
      });

      // Indepdent of what happens in the state mutation above, we always need to reset the `ongoingConnection` at the end here.
      xyFlowReactKieDiagramStoreApi.setState((state) => {
        state.xyFlowReactKieDiagram.ongoingConnection = undefined;
      });
    },
    [xyFlowReactKieDiagramStoreApi, container, reactFlowInstance, nodeTypes, graphStructure, onConnectedNodeAdded]
  );

  const isValidConnection = useCallback<RF.IsValidConnection>(
    (edgeOrConnection) => {
      const state = xyFlowReactKieDiagramStoreApi.getState();
      const edgeId = state.xyFlowReactKieDiagram.edgeIdBeingUpdated;
      const edgeType = edgeId ? (reactFlowInstance?.getEdge(edgeId)?.type as E) : undefined;

      const ongoingConnectionHierarchy = buildHierarchy({
        nodeId: state.xyFlowReactKieDiagram.ongoingConnection?.nodeId,
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
    [xyFlowReactKieDiagramStoreApi, reactFlowInstance, graphStructure]
  );

  const onNodesChange = useCallback<RF.OnNodesChange>(
    (changes) => {
      if (!reactFlowInstance) {
        return;
      }

      const controlWaypointsByEdge = new Map<number, Set<number>>();

      xyFlowReactKieDiagramStoreApi.setState((state) => {
        for (const change of changes) {
          switch (change.type) {
            case "add":
              console.debug(`XYFLOW KIE DIAGRAM: 'onNodesChange' --> add '${change.item.id}'`);
              state.dispatch(state).setNodeStatus(change.item.id, { selected: true });
              break;
            case "dimensions":
              console.debug(`XYFLOW KIE DIAGRAM: 'onNodesChange' --> dimensions '${change.id}'`);
              state.dispatch(state).setNodeStatus(change.id, { resizing: change.resizing });
              if (change.dimensions) {
                const node = state.computed(state).getDiagramData().nodesById.get(change.id)!;
                // We only need to resize the node if its snapped dimensions change, as snapping is non-destructive.
                const snappedShape = snapShapeDimensions(
                  state.xyFlowReactKieDiagram.snapGrid,
                  node.data.shape,
                  minNodeSizes[node.type as N]({
                    snapGrid: state.xyFlowReactKieDiagram.snapGrid,
                  })
                );
                if (
                  snappedShape.width !== change.dimensions.width ||
                  snappedShape.height !== change.dimensions.height
                ) {
                  console.log("XYFLOW KIE DIAGRAM: Node resized");
                  onNodeResized({
                    state,
                    node,
                    newDimensions: { ...change.dimensions },
                  });
                }
              }
              break;
            case "position":
              console.debug(`XYFLOW KIE DIAGRAM: 'onNodesChange' --> position '${change.id}'`);
              state.dispatch(state).setNodeStatus(change.id, { dragging: change.dragging });

              if (change.positionAbsolute) {
                const node = state.computed(state).getDiagramData().nodesById.get(change.id)!;

                console.log("XYFLOW KIE DIAGRAM: Node repositioned");
                onNodeRepositioned({ state, controlWaypointsByEdge, node, newPosition: change.positionAbsolute });
              }
              break;
            case "remove":
              console.debug(`XYFLOW KIE DIAGRAM: 'onNodesChange' --> remove '${change.id}'`);
              const node = state.computed(state).getDiagramData().nodesById.get(change.id)!;
              console.log("XYFLOW KIE DIAGRAM: Node deleted");
              onNodeDeleted({ state, node });

              state.dispatch(state).setNodeStatus(node.id, { selected: false, dragging: false, resizing: false });
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
    [minNodeSizes, onNodeDeleted, onNodeRepositioned, onNodeResized, reactFlowInstance, xyFlowReactKieDiagramStoreApi]
  );

  const onNodeDrag = useCallback<RF.NodeDragHandler>(
    (e, node: RF.Node<NData, N>) => {
      nodeIdBeingDraggedRef.current = node.id;
      xyFlowReactKieDiagramStoreApi.setState((state) => {
        state.xyFlowReactKieDiagram.dropTargetNode = getFirstNodeFittingBounds(
          node.id,
          {
            "@_x": node.positionAbsolute?.x ?? 0,
            "@_y": node.positionAbsolute?.y ?? 0,
            "@_width": node.width ?? 0,
            "@_height": node.height ?? 0,
          },
          minNodeSizes[node.type as N],
          state.xyFlowReactKieDiagram.snapGrid
        ) as Draft<RF.Node<NData, N>>; // FIXME: Tiago: Not sure why NData is not assignable to Draft<NData>
      });
    },
    [xyFlowReactKieDiagramStoreApi, getFirstNodeFittingBounds, minNodeSizes]
  );

  const onNodeDragStart = useCallback<RF.NodeDragHandler>(
    (e, node: RF.Node<NData, N>, nodes) => {
      modelBeforeEditingRef.current = model;
      onNodeDrag(e, node, nodes);
    },
    [modelBeforeEditingRef, onNodeDrag, model]
  );

  const onNodeDragStop = useCallback<RF.NodeDragHandler>(
    (e, node: RF.Node<NData, N>) => {
      try {
        xyFlowReactKieDiagramStoreApi.setState((state) => {
          console.debug("XYFLOW KIE DIAGRAM: `onNodeDragStop`");
          const nodeBeingDragged = state.computed(state).getDiagramData().nodesById.get(nodeIdBeingDraggedRef.current!);
          nodeIdBeingDraggedRef.current = null;
          if (!nodeBeingDragged) {
            return;
          }

          // Validate
          const dropTargetNode = xyFlowReactKieDiagramStoreApi.getState().xyFlowReactKieDiagram.dropTargetNode;
          if (
            dropTargetNode?.type &&
            containmentMap.has(dropTargetNode.type) &&
            !state.computed(state).isDropTargetNodeValidForSelection
          ) {
            console.debug(
              `XYFLOW KIE DIAGRAM: Invalid containment: '${[
                ...state.computed(state).getDiagramData().selectedNodeTypes,
              ].join("', '")}' inside '${dropTargetNode.type}'. Ignoring nodes dropped.`
            );
            resetToBeforeEditingBegan();
            return;
          }

          const selectedNodes = [...state.computed(state).getDiagramData().selectedNodesById.values()];

          state.xyFlowReactKieDiagram.dropTargetNode = undefined;

          if (!node.dragging) {
            return;
          }

          console.log("XYFLOW KIE DIAGRAM: Node parented");
          // Un-parent
          if (nodeBeingDragged.data.parentXyFlowNode) {
            const p = state.computed(state).getDiagramData().nodesById.get(nodeBeingDragged.data.parentXyFlowNode.id);
            if (p?.type && nodeBeingDragged.type && containmentMap.get(nodeBeingDragged.type)?.has(p.type)) {
              onNodeUnparented({ state, exParentNode: p, activeNode: nodeBeingDragged, selectedNodes });
            } else {
              console.debug(
                `XYFLOW KIE DIAGRAM: Ignoring '${nodeBeingDragged.type}' with parent '${dropTargetNode?.type}' dropping somewhere..`
              );
            }
          }

          // // Parent
          if (dropTargetNode?.type && containmentMap.get(dropTargetNode.type)) {
            onNodeParented({ state, parentNode: dropTargetNode, activeNode: nodeBeingDragged, selectedNodes });
          } else {
            console.debug(
              `XYFLOW KIE DIAGRAM: Ignoring '${nodeBeingDragged.type}' dropped on top of '${dropTargetNode?.type}'`
            );
          }
        });
      } catch (e) {
        console.error(e);
        resetToBeforeEditingBegan();
      }
    },
    [containmentMap, onNodeParented, onNodeUnparented, xyFlowReactKieDiagramStoreApi, resetToBeforeEditingBegan]
  );

  const onEdgesChange = useCallback<RF.OnEdgesChange>(
    (changes) => {
      xyFlowReactKieDiagramStoreApi.setState((state) => {
        for (const change of changes) {
          switch (change.type) {
            case "select":
              console.debug(`XYFLOW KIE DIAGRAM: 'onEdgesChange' --> select '${change.id}'`);
              state.dispatch(state).setEdgeStatus(change.id, { selected: change.selected });
              break;
            case "remove":
              console.debug(`XYFLOW KIE DIAGRAM: 'onEdgesChange' --> remove '${change.id}'`);
              const edge = state.computed(state).getDiagramData().edgesById.get(change.id);
              if (edge?.data) {
                console.log("XYFLOW KIE DIAGRAM: Edge deleted");
                onEdgeDeleted({ state, edge });

                state.dispatch(state).setEdgeStatus(change.id, {
                  selected: false,
                  draggingWaypoint: false,
                });
              }
              break;
            case "add":
            case "reset":
              console.debug(`XYFLOW KIE DIAGRAM: 'onEdgesChange' --> add/reset '${change.item.id}'. Ignoring`);
          }
        }
      });
    },
    [onEdgeDeleted, xyFlowReactKieDiagramStoreApi]
  );

  const onEdgeUpdate = useCallback<RF.OnEdgeUpdateFunc<EData>>(
    (oldEdge, newConnection) => {
      console.debug("XYFLOW KIE DIAGRAM: `onEdgeUpdate`", oldEdge, newConnection);

      const state = xyFlowReactKieDiagramStoreApi.getState();
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

      console.log("XYFLOW KIE DIAGRAM: Edge updated");
      xyFlowReactKieDiagramStoreApi.setState((state) => {
        onEdgeUpdated({
          state,
          sourceNode,
          targetNode,
          sourceHandle: newConnection.sourceHandle as PositionalNodeHandleId,
          targetHandle: newConnection.targetHandle as PositionalNodeHandleId,
          lastWaypoint,
          firstWaypoint,
          edge: oldEdge,
        });
      });
    },
    [onEdgeUpdated, xyFlowReactKieDiagramStoreApi]
  );

  const onEdgeUpdateStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, edge: RF.Edge, handleType: RF.HandleType) => {
      console.debug("XYFLOW KIE DIAGRAM: `onEdgeUpdateStart`");
      xyFlowReactKieDiagramStoreApi.setState((state) => {
        state.xyFlowReactKieDiagram.edgeIdBeingUpdated = edge.id;
      });
    },
    [xyFlowReactKieDiagramStoreApi]
  );

  const onEdgeUpdateEnd = useCallback(
    (e: MouseEvent | TouchEvent, edge: RF.Edge, handleType: RF.HandleType) => {
      console.debug("XYFLOW KIE DIAGRAM: `onEdgeUpdateEnd`");

      // Needed for when the edge update operation doesn't change anything.
      xyFlowReactKieDiagramStoreApi.setState((state) => {
        state.xyFlowReactKieDiagram.ongoingConnection = undefined;
        state.xyFlowReactKieDiagram.edgeIdBeingUpdated = undefined;
      });
    },
    [xyFlowReactKieDiagramStoreApi]
  );

  // Override Reactflow's behavior by intercepting the keydown event using its `capture` variant.
  const handleRfKeyDownCapture = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        const s = xyFlowReactKieDiagramStoreApi.getState();
        if (s.computed(s).isDiagramEditingInProgress() && modelBeforeEditingRef.current) {
          console.debug(
            "XYFLOW KIE DIAGRAM: Intercepting Escape pressed and preventing propagation. Reverting `model` to what it was before editing began."
          );

          e.stopPropagation();
          e.preventDefault();

          resetToBeforeEditingBegan();
        } else if (!s.xyFlowReactKieDiagram.ongoingConnection) {
          xyFlowReactKieDiagramStoreApi.setState((state) => {
            if (
              state.computed(state).getDiagramData().selectedNodesById.size > 0 ||
              state.computed(state).getDiagramData().selectedEdgesById.size > 0
            ) {
              console.debug("XYFLOW KIE DIAGRAM: Esc pressed. Desselecting everything.");
              state.xyFlowReactKieDiagram._selectedNodes = [];
              state.xyFlowReactKieDiagram._selectedEdges = [];
              e.preventDefault();
            } else if (
              state.computed(state).getDiagramData().selectedNodesById.size <= 0 &&
              state.computed(state).getDiagramData().selectedEdgesById.size <= 0
            ) {
              console.debug("XYFLOW KIE DIAGRAM: Esc pressed. Closing all open panels.");
              console.log("XYFLOW KIE DIAGRAM: Esc pressed");
              e.preventDefault();
              onEscPressed();
            } else {
              // Let the
            }
          });
        } else {
          // Let the KeyboardShortcuts handle it.
        }
      }
    },
    [xyFlowReactKieDiagramStoreApi, modelBeforeEditingRef, resetToBeforeEditingBegan, onEscPressed]
  );

  const nodes = useXyFlowReactKieDiagramStore((s) => s.computed(s).getDiagramData().nodes);
  const edges = useXyFlowReactKieDiagramStore((s) => s.computed(s).getDiagramData().edges);

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
        nodeTypes={nodeComponents}
        edgeTypes={edgeComponents}
        snapToGrid={true}
        snapGrid={xyFlowSnapGrid}
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
  const ongoingConnection = useXyFlowReactKieDiagramStore((s) => s.xyFlowReactKieDiagram.ongoingConnection);
  const xyFlowStoreApi = RF.useStoreApi();
  useEffect(() => {
    xyFlowStoreApi.setState({
      connectionHandleId: ongoingConnection?.handleId,
      connectionHandleType: ongoingConnection?.handleType,
      connectionNodeId: ongoingConnection?.nodeId,
    });
  }, [ongoingConnection?.handleId, ongoingConnection?.handleType, ongoingConnection?.nodeId, xyFlowStoreApi]);

  return <></>;
}
