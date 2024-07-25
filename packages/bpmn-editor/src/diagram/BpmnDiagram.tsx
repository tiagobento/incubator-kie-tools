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
  Diagram,
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
} from "@kie-tools/xyflow-kie-diagram/dist/diagram/Diagram";
import { ConnectionLine as ReactFlowDiagramConnectionLine } from "@kie-tools/xyflow-kie-diagram/dist/edges/ConnectionLine";
import { EdgeMarkers } from "@kie-tools/xyflow-kie-diagram/dist/edges/EdgeMarkers";
import * as React from "react";
import { useCallback, useState } from "react";
import * as RF from "reactflow";
import { useBpmnEditor } from "../BpmnEditorContext";
import { normalize } from "../normalization/normalize";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../store/StoreContext";
import { BpmnDiagramCommands } from "./BpmnDiagramCommands";
import { BpmnDiagramEmptyState } from "./BpmnDiagramEmptyState";
import { TopRightCornerPanels } from "./BpmnDiagramTopRightPanels";
import {
  BPMN_CONTAINMENT_MAP,
  CONNECTION_LINE_EDGE_COMPONENTS_MAPPING,
  CONNECTION_LINE_NODE_COMPONENT_MAPPING,
  XY_FLOW_EDGE_TYPES,
  XY_FLOW_NODE_TYPES,
} from "./BpmnDiagramDomain";
import { BpmnEdgeType } from "./BpmnDiagramDomain";
import { BpmnNodeType } from "./BpmnDiagramDomain";
import { BPMN_GRAPH_STRUCTURE } from "./BpmnDiagramDomain";
import { BpmnPalette, MIME_TYPE_FOR_BPMN_EDITOR_NEW_NODE_FROM_PALETTE } from "./BpmnPalette";
import { DiagramContainerContextProvider } from "./DiagramContainerContext";
import { BpmnDiagramEdgeData } from "./BpmnDiagramDomain";
import { DEFAULT_NODE_SIZES } from "./BpmnDiagramDomain";
import { MIN_NODE_SIZES } from "./BpmnDiagramDomain";
import { NODE_TYPES } from "./BpmnDiagramDomain";
import { BpmnNodeElement } from "./BpmnDiagramDomain";
import { BpmnDiagramNodeData } from "./BpmnDiagramDomain";
import { BpmnDiagramLhsPanel } from "../store/Store";

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
      state.xyFlowKieDiagram.draggingNodes = [];
      state.xyFlowKieDiagram.draggingWaypoints = [];
      state.xyFlowKieDiagram.resizingNodes = [];
      state.xyFlowKieDiagram.dropTargetNode = undefined;
      state.xyFlowKieDiagram.edgeIdBeingUpdated = undefined;
    });
  }, [bpmnEditorStoreApi, bpmnModelBeforeEditingRef]);

  const nodes = useBpmnEditorStore((s) => s.computed(s).getDiagramData().nodes);

  const isEmptyStateShowing = showEmptyState && nodes.length === 0;

  // nodes

  const onNodeAdded = useCallback<OnNodeAdded<BpmnNodeType, BpmnDiagramNodeData>>(() => {
    console.log("BPMN EDITOR DIAGRAM: onNodeAdded");
  }, []);

  const onConnectedNodeAdded = useCallback<
    OnConnectedNodeAdded<BpmnNodeType, BpmnEdgeType, BpmnDiagramNodeData>
  >(() => {
    console.log("BPMN EDITOR DIAGRAM: onConnectedNodeAdded");
  }, []);

  const onNodeRepositioned = useCallback<OnNodeRepositioned<BpmnNodeType, BpmnDiagramNodeData>>(
    ({ node, newPosition }) => {
      console.log("BPMN EDITOR DIAGRAM: onNodeRepositioned");

      bpmnEditorStoreApi.setState((s) => {
        const shape = (s.bpmn.model.definitions["bpmndi:BPMNDiagram"] ?? [])
          .flatMap((d) => d["bpmndi:BPMNPlane"]["di:DiagramElement"])
          .filter((bpmnElement) => bpmnElement?.__$$element === "bpmndi:BPMNShape")
          .filter((bpmnShape) => bpmnShape?.["@_bpmnElement"] === node.id)?.[0] as BPMNDI__BPMNShape;

        shape["dc:Bounds"]["@_x"] = newPosition.x;
        shape["dc:Bounds"]["@_y"] = newPosition.y;
      });
    },
    [bpmnEditorStoreApi]
  );

  const onNodeDeleted = useCallback<OnNodeDeleted<BpmnNodeType, BpmnDiagramNodeData>>(
    ({ node }) => {
      console.log("BPMN EDITOR DIAGRAM: onNodeDeleted");

      bpmnEditorStoreApi.setState((s) => {
        const process = s.bpmn.model.definitions.rootElement?.find(
          (s) => s.__$$element === "process"
        ) as BPMN20__tProcess;

        if (process) {
          process.artifact = process.artifact?.filter((s) => s["@_id"] !== node.id);
          process.flowElement = process.flowElement?.filter((s) => s["@_id"] !== node.id);
        }

        const plane = s.bpmn.model.definitions["bpmndi:BPMNDiagram"]?.[0]?.["bpmndi:BPMNPlane"];
        if (plane) {
          plane["di:DiagramElement"] = plane["di:DiagramElement"]?.filter((s) => s["@_bpmnElement"] !== node.id);
        }
      });
    },
    [bpmnEditorStoreApi]
  );

  const onNodeUnparented = useCallback<OnNodeUnparented<BpmnNodeType, BpmnDiagramNodeData>>(() => {
    console.log("BPMN EDITOR DIAGRAM: onNodeUnparented");
  }, []);

  const onNodeParented = useCallback<OnNodeParented<BpmnNodeType, BpmnDiagramNodeData>>(() => {
    console.log("BPMN EDITOR DIAGRAM: onNodeParented");
  }, []);

  const onNodeResized = useCallback<OnNodeResized<BpmnNodeType, BpmnDiagramNodeData>>(() => {
    console.log("BPMN EDITOR DIAGRAM: onNodeResized");
  }, []);

  // edges

  const onEdgeAdded = useCallback<
    OnEdgeAdded<BpmnNodeType, BpmnEdgeType, BpmnDiagramNodeData, BpmnDiagramEdgeData>
  >(() => {
    console.log("BPMN EDITOR DIAGRAM: onEdgeAdded");
  }, []);

  const onEdgeUpdated = useCallback<
    OnEdgeUpdated<BpmnNodeType, BpmnEdgeType, BpmnDiagramNodeData, BpmnDiagramEdgeData>
  >(() => {
    console.log("BPMN EDITOR DIAGRAM: onEdgeUpdated");
  }, []);

  const onEdgeDeleted = useCallback<OnEdgeDeleted<BpmnEdgeType, BpmnDiagramEdgeData>>(() => {
    console.log("BPMN EDITOR DIAGRAM: onEdgeDeleted");
  }, []);

  // misc

  const onEscPressed = useCallback<OnEscPressed>(() => {
    bpmnEditorStoreApi.setState((state) => {
      state.diagram.propertiesPanel.isOpen = false;
      state.diagram.overlaysPanel.isOpen = false;
      state.diagram.openLhsPanel = BpmnDiagramLhsPanel.NONE;
    });
  }, [bpmnEditorStoreApi]);

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

  return (
    <>
      {isEmptyStateShowing && <BpmnDiagramEmptyState setShowEmptyState={setShowEmptyState} />}
      <DiagramContainerContextProvider container={container}>
        <svg style={{ position: "absolute", top: 0, left: 0 }}>
          <EdgeMarkers />
        </svg>

        <Diagram
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
        </Diagram>
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
