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

import { switchExpression } from "@kie-tools-core/switch-expression-ts";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";
import { BPMN20__tDefinitions } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { AutoPositionedEdgeMarker } from "@kie-tools/xyflow-react-kie-diagram/dist/edges/AutoPositionedEdgeMarker";
import { getDiBoundsCenterPoint } from "@kie-tools/xyflow-react-kie-diagram/dist/maths/DcMaths";
import { DC__Bounds } from "@kie-tools/xyflow-react-kie-diagram/dist/maths/model";
import { BpmnNodeType, NODE_TYPES } from "../diagram/BpmnDiagramDomain";
import { Normalized } from "../normalization/normalize";
import { addOrGetProcessAndDiagramElements } from "./addOrGetProcessAndDiagramElements";
import { NodeNature, nodeNatures } from "./NodeNature";

export function addConnectedNode({
  definitions,
  __readonly_sourceNode,
  __readonly_newNode,
}: {
  definitions: Normalized<BPMN20__tDefinitions>;
  __readonly_sourceNode: { type: BpmnNodeType; id: string; bounds: DC__Bounds; shapeId: string | undefined };
  __readonly_newNode: { type: BpmnNodeType; bounds: DC__Bounds };
}) {
  const newBpmnElementId = generateUuid();
  const newEdgeId = generateUuid();
  const nature = nodeNatures[__readonly_newNode.type];

  const { process, diagramElements } = addOrGetProcessAndDiagramElements({ definitions });

  if (nature === NodeNature.PROCESS_FLOW_ELEMENT) {
    process.flowElement ??= [];
    process.flowElement.push({
      __$$element: "sequenceFlow",
      "@_id": newEdgeId,
      "@_sourceRef": __readonly_sourceNode.id,
      "@_targetRef": newBpmnElementId,
    });
    process.flowElement?.push(
      switchExpression(
        __readonly_newNode.type as Exclude<
          BpmnNodeType,
          "node_group" | "node_textAnnotation" | "node_unknown" | "node_lane" | "node_dataObject" | "node_transaction"
        >,
        {
          [NODE_TYPES.task]: {
            "@_id": newBpmnElementId,
            "@_name": "New Task",
            __$$element: "task",
          },
          [NODE_TYPES.startEvent]: {
            "@_id": newBpmnElementId,
            __$$element: "startEvent",
          },
          [NODE_TYPES.intermediateCatchEvent]: {
            "@_id": newBpmnElementId,
            __$$element: "intermediateCatchEvent",
          },
          [NODE_TYPES.intermediateThrowEvent]: {
            "@_id": newBpmnElementId,
            __$$element: "intermediateThrowEvent",
          },
          [NODE_TYPES.endEvent]: {
            "@_id": newBpmnElementId,
            __$$element: "endEvent",
          },
          [NODE_TYPES.subProcess]: {
            "@_id": newBpmnElementId,
            "@_name": "New Sub-Process",
            __$$element: "subProcess",
          },
          [NODE_TYPES.gateway]: {
            "@_id": newBpmnElementId,
            __$$element: "exclusiveGateway",
          },
        }
      )
    );
  } else if (nature === NodeNature.ARTIFACT) {
    process.artifact ??= [];
    process.artifact.push(
      ...switchExpression(__readonly_newNode.type as Extract<BpmnNodeType, "node_group" | "node_textAnnotation">, {
        [NODE_TYPES.group]: [
          {
            "@_id": newBpmnElementId,
            __$$element: "group" as const,
            "@_name": "New group",
          },
        ],
        [NODE_TYPES.textAnnotation]: [
          {
            "@_id": newBpmnElementId,
            __$$element: "textAnnotation" as const,
            text: "New text annotation" as any,
          },
          {
            "@_id": newEdgeId,
            __$$element: "association" as const,
            "@_associationDirection": "Both" as const,
            "@_sourceRef": __readonly_sourceNode.id,
            "@_targetRef": newBpmnElementId,
          },
        ],
      })
    );
  } else {
    throw new Error(`BPMN MUTATION: Unknown node usage '${nature}'.`);
  }

  const newShapeId = generateUuid();
  // Add the new node shape
  diagramElements?.push({
    __$$element: "bpmndi:BPMNShape",
    "@_id": newShapeId,
    "@_bpmnElement": newBpmnElementId,
    "dc:Bounds": __readonly_newNode.bounds,
  });

  // Add the new edge shape
  diagramElements?.push({
    __$$element: "bpmndi:BPMNEdge",
    "@_id": generateUuid() + AutoPositionedEdgeMarker.TARGET,
    "@_bpmnElement": newEdgeId,
    "@_sourceElement": __readonly_sourceNode.shapeId,
    "@_targetElement": newShapeId,
    "di:waypoint": [
      getDiBoundsCenterPoint(__readonly_sourceNode.bounds),
      getDiBoundsCenterPoint(__readonly_newNode.bounds),
    ],
  });

  return { id: newBpmnElementId, href: newBpmnElementId };
}
