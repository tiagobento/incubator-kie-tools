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
import { BpmnNodeType, elementToNodeType, NODE_TYPES } from "./BpmnDiagramDomain";
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
import { EmptyState, EmptyStateIcon, EmptyStateBody } from "@patternfly/react-core/dist/js/components/EmptyState";
import { Title } from "@patternfly/react-core/dist/js/components/Title";
import { Bullseye } from "@patternfly/react-core/dist/js/layouts/Bullseye";
import { addVariable } from "../mutations/addVariable";
import "./BpmnPalette.css";

export const MIME_TYPE_FOR_BPMN_EDITOR_NEW_NODE_FROM_PALETTE = "application/kie-bpmn-editor--new-node-from-palette";

export function BpmnPalette({ pulse }: { pulse: boolean }) {
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
    },
    []
  );

  const nodesPalletePopoverRef = React.useRef<HTMLDivElement>(null);

  const openLhsPanel = useBpmnEditorStore((s) => s.diagram.openLhsPanel);
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

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
            <CodeIcon size={"sm"} /> Variables
          </button>
        </aside>
        <aside
          className={"kie-bpmn-editor--variables-panel-toggle"}
          style={{ position: "relative", pointerEvents: "all" }}
        >
          {openLhsPanel === BpmnDiagramLhsPanel.CORRELATIONS && (
            <div
              className={"kie-bpmn-editor--palette-nodes-popover correlations"}
              // style={{ maxHeight }}
            >
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
            <PeopleCarryIcon size={"sm"} /> Correlations
          </button>
        </aside>
        <aside className={`kie-bpmn-editor--palette ${pulse ? "pulse" : ""}`} style={{ pointerEvents: "all" }}>
          <div
            title={"Start Events"}
            className={"kie-bpmn-editor--palette-button dndnode start-event"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.startEvent, "startEvent")}
            draggable={true}
          >
            <StartEventIcon />
          </div>
          <div
            title={"Intermediate Catch Events"}
            className={"kie-bpmn-editor--palette-button dndnode intermediate-catch-event"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.intermediateCatchEvent, "intermediateCatchEvent")}
            draggable={true}
          >
            <IntermediateCatchEventIcon />
          </div>
          <div
            title={"Intermediate Throw Events"}
            className={"kie-bpmn-editor--palette-button dndnode intermediate-throw-event"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.intermediateThrowEvent, "intermediateThrowEvent")}
            draggable={true}
          >
            <IntermediateThrowEventIcon />
          </div>
          <div
            title={"End Events"}
            className={"kie-bpmn-editor--palette-button dndnode end-event"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.endEvent, "endEvent")}
            draggable={true}
          >
            <EndEventIcon />
          </div>
          <div
            title={"Tasks"}
            className={"kie-bpmn-editor--palette-button dndnode task"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.task, "task")}
            draggable={true}
          >
            <TaskIcon />
          </div>
          <div
            title={"Call Activity"}
            className={"kie-bpmn-editor--palette-button dndnode callActivity"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.task, "callActivity")}
            draggable={true}
          >
            <CallActivityIcon />
          </div>
          <div
            title={"Sub-processes"}
            className={"kie-bpmn-editor--palette-button dndnode subProcess"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.subProcess, "subProcess")}
            draggable={true}
          >
            <SubProcessIcon />
          </div>
          <div
            title={"Gateways"}
            className={"kie-bpmn-editor--palette-button dndnode gateway"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.gateway, "parallelGateway")}
            draggable={true}
          >
            <GatewayIcon />
          </div>
          <div
            title={"Lanes"}
            className={"kie-bpmn-editor--palette-button dndnode lane"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.lane, "lane")}
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
            draggable={true}
          >
            <GroupIcon />
          </div>
          <div
            title={"Text Annotation"}
            className={"kie-bpmn-editor--palette-button dndnode text-annotation"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.textAnnotation, "textAnnotation")}
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
