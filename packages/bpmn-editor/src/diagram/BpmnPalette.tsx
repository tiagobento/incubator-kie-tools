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
  DataObjectIcon,
  EndEventIcon,
  GatewayIcon,
  GroupIcon,
  IntermediateCatchEventIcon,
  LaneIcon,
  StartEventIcon,
  SubProcessIcon,
  TaskIcon,
  TextAnnotationIcon,
  TransactionIcon,
} from "./nodes/NodeIcons";
import { BpmnNodeType } from "./BpmnDiagramDomain";
import { NODE_TYPES } from "./BpmnDiagramDomain";

export const MIME_TYPE_FOR_BPMN_EDITOR_NEW_NODE_FROM_PALETTE = "application/kie-bpmn-editor--new-node-from-palette";

export function BpmnPalette({ pulse }: { pulse: boolean }) {
  const onDragStart = useCallback((event: React.DragEvent, nodeType: BpmnNodeType) => {
    event.dataTransfer.setData(MIME_TYPE_FOR_BPMN_EDITOR_NEW_NODE_FROM_PALETTE, nodeType);
    event.dataTransfer.effectAllowed = "move";
  }, []);

  const nodesPalletePopoverRef = React.useRef<HTMLDivElement>(null);

  return (
    <>
      <RF.Panel position={"top-left"} style={{ marginTop: "78px" }}>
        <div ref={nodesPalletePopoverRef} style={{ position: "absolute", left: 0, height: 0, zIndex: -1 }} />
        <aside className={`kie-bpmn-editor--palette ${pulse ? "pulse" : ""}`}>
          <div
            title={"Start Event"}
            className={"kie-bpmn-editor--palette-button dndnode start-event"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.startEvent)}
            draggable={true}
          >
            <StartEventIcon />
          </div>
          <div
            title={"Intermediate Catch Event"}
            className={"kie-bpmn-editor--palette-button dndnode intermediate-catch-event"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.intermediateCatchEvent)}
            draggable={true}
          >
            <IntermediateCatchEventIcon />
          </div>
          <div
            title={"End Event"}
            className={"kie-bpmn-editor--palette-button dndnode end-event"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.endEvent)}
            draggable={true}
          >
            <EndEventIcon />
          </div>
          <div
            title={"Task"}
            className={"kie-bpmn-editor--palette-button dndnode task"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.task)}
            draggable={true}
          >
            <TaskIcon />
          </div>
          <div
            title={"Sub-process"}
            className={"kie-bpmn-editor--palette-button dndnode subProcess"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.subProcess)}
            draggable={true}
          >
            <SubProcessIcon />
          </div>
          <div
            title={"Gateway"}
            className={"kie-bpmn-editor--palette-button dndnode gateway"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.gateway)}
            draggable={true}
          >
            <GatewayIcon />
          </div>
          <div
            title={"Lane"}
            className={"kie-bpmn-editor--palette-button dndnode lane"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.lane)}
            draggable={true}
          >
            <LaneIcon />
          </div>
          <div
            title={"Transaction"}
            className={"kie-bpmn-editor--palette-button dndnode transaction"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.transaction)}
            draggable={true}
          >
            <TransactionIcon />
          </div>
        </aside>
        <br />
        <aside className={`kie-bpmn-editor--palette ${pulse ? "pulse" : ""}`}>
          <div
            title={"Data Object"}
            className={"kie-bpmn-editor--palette-button dndnode data-object"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.dataObject)}
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
            onDragStart={(event) => onDragStart(event, NODE_TYPES.group)}
            draggable={true}
          >
            <GroupIcon />
          </div>
          <div
            title={"Text Annotation"}
            className={"kie-bpmn-editor--palette-button dndnode text-annotation"}
            onDragStart={(event) => onDragStart(event, NODE_TYPES.textAnnotation)}
            draggable={true}
          >
            <TextAnnotationIcon />
          </div>
        </aside>
      </RF.Panel>
    </>
  );
}
