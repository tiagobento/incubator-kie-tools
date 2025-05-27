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
import { useCallback } from "react";
import * as RF from "reactflow";
import {
  BpmnNodeElement,
  BpmnNodeType,
  DEFAULT_NODE_SIZES,
  elementToNodeType,
  MIN_NODE_SIZES,
  NODE_TYPES,
} from "./BpmnDiagramDomain";
import {
  CallActivityIcon,
  DataObjectIcon,
  EndEventIcon,
  GatewayIcon,
  GroupIcon,
  IntermediateCatchEventIcon,
  IntermediateThrowEventIcon,
  LaneIcon,
  StartEventIcon,
  SubProcessIcon,
  TaskIcon,
  TextAnnotationIcon,
} from "./nodes/NodeIcons";
import { CodeIcon } from "@patternfly/react-icons/dist/js/icons/code-icon";
import { PeopleCarryIcon } from "@patternfly/react-icons/dist/js/icons/people-carry-icon";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../store/StoreContext";
import { BpmnDiagramLhsPanel } from "../store/Store";
import { addOrGetProcessAndDiagramElements } from "../mutations/addOrGetProcessAndDiagramElements";
import { Correlations } from "../propertiesPanel/correlations/Correlations";
import { Variables } from "../propertiesPanel/variables/Variables";
import { Button } from "@patternfly/react-core/dist/js/components/Button";
import { Icon } from "@patternfly/react-core/dist/js/components/Icon";
import { EmptyState, EmptyStateIcon, EmptyStateBody } from "@patternfly/react-core/dist/js/components/EmptyState";
import { Title } from "@patternfly/react-core/dist/js/components/Title";
import { Bullseye } from "@patternfly/react-core/dist/js/layouts/Bullseye";
import { addVariable } from "../mutations/addVariable";
import "./BpmnPalette.css";
import { snapShapeDimensions } from "@kie-tools/xyflow-react-kie-diagram/dist/snapgrid/SnapGrid";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";
import { NODE_LAYERS } from "@kie-tools/xyflow-react-kie-diagram/dist/nodes/Hooks";
import { getNewNodeDefaultName } from "../mutations/addStandaloneNode";

export const MIME_TYPE_FOR_BPMN_EDITOR_NEW_NODE_FROM_PALETTE = "application/kie-bpmn-editor--new-node-from-palette";

export function BpmnPalette({ pulse }: { pulse: boolean }) {
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

  const onDragStart = useCallback(
    <T extends BpmnNodeType>(
      event: React.DragEvent,
      nodeType: T,
      element: keyof typeof elementToNodeType /** This type could be better, filtering only the elements matching `nodeType` */
    ) => {
      event.dataTransfer.setData(
        MIME_TYPE_FOR_BPMN_EDITOR_NEW_NODE_FROM_PALETTE,
        JSON.stringify({ nodeType, element })
      );
      event.dataTransfer.effectAllowed = "move";

      // Remove default effect of dragging elements.
      const transparentDiv = document.createElement("div");
      transparentDiv.style.width = "1px";
      transparentDiv.style.height = "1px";
      transparentDiv.style.opacity = "0";
      document.body.appendChild(transparentDiv);
      event.dataTransfer.setDragImage(transparentDiv, 0, 0);
      setTimeout(() => {
        document.body.removeChild(transparentDiv);
      }, 0);

      bpmnEditorStoreApi.setState((s) => {
        const snapGrid = s.xyFlowReactKieDiagram.snapGrid;
        const bpmnShape = {
          "@_id": generateUuid(),
          "dc:Bounds": {
            ...DEFAULT_NODE_SIZES[nodeType]({ snapGrid }),
            "@_x": 0,
            "@_y": 0,
          },
        };

        const position = { x: bpmnShape["dc:Bounds"]["@_x"], y: bpmnShape["dc:Bounds"]["@_y"] };
        const dimensions = snapShapeDimensions(snapGrid, bpmnShape, MIN_NODE_SIZES[nodeType]({ snapGrid }));

        s.xyFlowReactKieDiagram.newNodeProjection = {
          id: generateUuid(),
          type: nodeType,
          hidden: true,
          position,
          width: dimensions.width,
          height: dimensions.height,
          data: {
            parentXyFlowNode: undefined,
            shape: bpmnShape,
            shapeIndex: -1,
            bpmnElement: {
              "@_id": generateUuid(),
              "@_name": getNewNodeDefaultName({ type: nodeType, element }),
              __$$element: element as any,
            },
          },
          zIndex: NODE_LAYERS.ATTACHED_NODES,
          style: {
            width: dimensions.width,
            height: dimensions.height,
            zIndex: NODE_LAYERS.ATTACHED_NODES,
          },
        };
      });
    },
    [bpmnEditorStoreApi]
  );

  const onDragEnd = useCallback(() => {
    // Makes sure there's no leftovers even when user pressed Esc during drag.
    bpmnEditorStoreApi.setState((s) => (s.xyFlowReactKieDiagram.newNodeProjection = undefined));
  }, [bpmnEditorStoreApi]);

  const nodesPalletePopoverRef = React.useRef<HTMLDivElement>(null);

  const openLhsPanel = useBpmnEditorStore((s) => s.diagram.openLhsPanel);

  const process = useBpmnEditorStore((s) =>
    s.bpmn.model.definitions.rootElement?.find((s) => s.__$$element === "process")
  );

  return (
    <>
      <RF.Panel position={"top-left"} className={"kie-bpmn-editor--top-left-panel"}>
        <div ref={nodesPalletePopoverRef} style={{ position: "absolute", left: 0, height: 0, zIndex: -1 }} />
        <aside
          className={"kie-bpmn-editor--variables-panel-toggle"}
          style={{ position: "relative", pointerEvents: "all" }}
        >
          {openLhsPanel === BpmnDiagramLhsPanel.VARIABLES && (
            <div
              className={"kie-bpmn-editor--palette-nodes-popover variables"}
              // style={{ maxHeight }}
            >
              <Variables p={process} EmptyState={VariablesEmptyState} />
            </div>
          )}
          <button
            title={"Process Variables"}
            className={`kie-bpmn-editor--variables-panel-toggle-button ${openLhsPanel === BpmnDiagramLhsPanel.VARIABLES ? "active" : ""}`}
            onClick={() => {
              bpmnEditorStoreApi.setState((s) => {
                s.diagram.openLhsPanel =
                  s.diagram.openLhsPanel === BpmnDiagramLhsPanel.VARIABLES
                    ? BpmnDiagramLhsPanel.NONE
                    : BpmnDiagramLhsPanel.VARIABLES;
              });
            }}
          >
            <Icon size={"sm"}>
              <CodeIcon />
            </Icon>
            &nbsp; Variables
          </button>
        </aside>
        <aside
          className={"kie-bpmn-editor--variables-panel-toggle"}
          style={{ position: "relative", pointerEvents: "all" }}
        >
          {openLhsPanel === BpmnDiagramLhsPanel.CORRELATIONS && (
            <div className={"kie-bpmn-editor--palette-nodes-popover correlations"}>
              <Correlations />
            </div>
          )}
          <button
            title={"Process Variables"}
            className={`kie-bpmn-editor--variables-panel-toggle-button ${openLhsPanel === BpmnDiagramLhsPanel.CORRELATIONS ? "active" : ""}`}
            onClick={() => {
              bpmnEditorStoreApi.setState((s) => {
                s.diagram.openLhsPanel =
                  s.diagram.openLhsPanel === BpmnDiagramLhsPanel.CORRELATIONS
                    ? BpmnDiagramLhsPanel.NONE
                    : BpmnDiagramLhsPanel.CORRELATIONS;
              });
            }}
          >
            <Icon size={"sm"}>
              <PeopleCarryIcon />
            </Icon>
            &nbsp; Correlations
          </button>
        </aside>
        <aside className={`kie-bpmn-editor--palette ${pulse ? "pulse" : ""}`} style={{ pointerEvents: "all" }}>
          <div
            title={"Start Events"}
            className={"kie-bpmn-editor--palette-button dndnode start-event"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.startEvent, "startEvent")}
            onDragEnd={onDragEnd}
            draggable={true}
          >
            <StartEventIcon />
          </div>
          <div
            title={"Intermediate Catch Events"}
            className={"kie-bpmn-editor--palette-button dndnode intermediate-catch-event"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.intermediateCatchEvent, "intermediateCatchEvent")}
            onDragEnd={onDragEnd}
            draggable={true}
          >
            <IntermediateCatchEventIcon />
          </div>
          <div
            title={"Intermediate Throw Events"}
            className={"kie-bpmn-editor--palette-button dndnode intermediate-throw-event"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.intermediateThrowEvent, "intermediateThrowEvent")}
            onDragEnd={onDragEnd}
            draggable={true}
          >
            <IntermediateThrowEventIcon />
          </div>
          <div
            title={"End Events"}
            className={"kie-bpmn-editor--palette-button dndnode end-event"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.endEvent, "endEvent")}
            onDragEnd={onDragEnd}
            draggable={true}
          >
            <EndEventIcon />
          </div>
          <div
            title={"Tasks"}
            className={"kie-bpmn-editor--palette-button dndnode task"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.task, "task")}
            onDragEnd={onDragEnd}
            draggable={true}
          >
            <TaskIcon />
          </div>
          <div
            title={"Call Activity"}
            className={"kie-bpmn-editor--palette-button dndnode callActivity"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.task, "callActivity")}
            onDragEnd={onDragEnd}
            draggable={true}
          >
            <CallActivityIcon />
          </div>
          <div
            title={"Sub-processes"}
            className={"kie-bpmn-editor--palette-button dndnode subProcess"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.subProcess, "subProcess")}
            onDragEnd={onDragEnd}
            draggable={true}
          >
            <SubProcessIcon />
          </div>
          <div
            title={"Gateways"}
            className={"kie-bpmn-editor--palette-button dndnode gateway"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.gateway, "parallelGateway")}
            onDragEnd={onDragEnd}
            draggable={true}
          >
            <GatewayIcon />
          </div>
          <div
            title={"Lanes"}
            className={"kie-bpmn-editor--palette-button dndnode lane"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.lane, "lane")}
            onDragEnd={onDragEnd}
            draggable={true}
          >
            <LaneIcon />
          </div>
        </aside>
        <br />
        <aside className={`kie-bpmn-editor--palette ${pulse ? "pulse" : ""}`} style={{ pointerEvents: "all" }}>
          <div
            title={"Data Object"}
            className={"kie-bpmn-editor--palette-button dndnode data-object"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.dataObject, "dataObject")}
            onDragEnd={onDragEnd}
            draggable={true}
          >
            <DataObjectIcon />
          </div>
        </aside>
        <br />
        <aside className={`kie-bpmn-editor--palette ${pulse ? "pulse" : ""}`} style={{ pointerEvents: "all" }}>
          <div
            title={"Group"}
            className={"kie-bpmn-editor--palette-button dndnode group"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.group, "group")}
            onDragEnd={onDragEnd}
            draggable={true}
          >
            <GroupIcon />
          </div>
          <div
            title={"Text Annotation"}
            className={"kie-bpmn-editor--palette-button dndnode text-annotation"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.textAnnotation, "textAnnotation")}
            onDragEnd={onDragEnd}
            draggable={true}
          >
            <TextAnnotationIcon />
          </div>
        </aside>
      </RF.Panel>
    </>
  );
}

function VariablesEmptyState({ addButton: _ }: { addButton: JSX.Element }) {
  const isReadOnly = useBpmnEditorStore((s) => s.settings.isReadOnly);
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

  return (
    <>
      <div className={"kie-bpmn-editor--correlations--empty-state"}>
        <Bullseye>
          <EmptyState>
            <EmptyStateIcon icon={CodeIcon} />
            <Title headingLevel="h4">{isReadOnly ? "No variables" : "No variables yet"}</Title>
            <EmptyStateBody style={{ padding: "0 25%" }}>
              {"Variables let you manage mutable data during the lifetime of a Process Instance."}
            </EmptyStateBody>
            <Button
              variant="primary"
              onClick={() => {
                bpmnEditorStoreApi.setState((s) => {
                  const { process } = addOrGetProcessAndDiagramElements({ definitions: s.bpmn.model.definitions });
                  addVariable({ definitions: s.bpmn.model.definitions, pId: process["@_id"] });
                });
              }}
            >
              {"Add Variable"}
            </Button>
          </EmptyState>
        </Bullseye>
      </div>
    </>
  );
}
