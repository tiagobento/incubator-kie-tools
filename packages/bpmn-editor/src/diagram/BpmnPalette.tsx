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

  return (
    <>
      <RF.Panel position={"top-left"} style={{ marginTop: "78px" }}>
        <div ref={nodesPalletePopoverRef} style={{ position: "absolute", left: 0, height: 0, zIndex: -1 }} />
        <aside className={`kie-bpmn-editor--palette ${pulse ? "pulse" : ""}`}>
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
        <aside className={`kie-bpmn-editor--palette ${pulse ? "pulse" : ""}`}>
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
        <aside className={`kie-bpmn-editor--palette ${pulse ? "pulse" : ""}`}>
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
