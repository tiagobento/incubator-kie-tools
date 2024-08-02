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
import { Normalized } from "../normalization/normalize";
import { BPMN20__tDefinitions } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { BpmnNodeType, NODE_TYPES } from "../diagram/BpmnDiagramDomain";
import { DC__Bounds } from "@kie-tools/xyflow-react-kie-diagram/dist/maths/model";
import { NodeNature, nodeNatures } from "./NodeNature";
import { addOrGetProcessAndDiagramElements } from "./addOrGetProcessAndDiagramElements";

export function addStandaloneNode({
  definitions,
  __readonly_newNode: __readonly_newNode,
}: {
  definitions: Normalized<BPMN20__tDefinitions>;
  __readonly_newNode: { type: BpmnNodeType; bounds: DC__Bounds };
}) {
  const newBpmnElementId = generateUuid();
  const nature = nodeNatures[__readonly_newNode.type];

  const { process, diagramElements } = addOrGetProcessAndDiagramElements({ definitions });

  if (nature === NodeNature.PROCESS_FLOW_ELEMENT) {
    process.flowElement ??= [];
    process.flowElement?.push(
      switchExpression(
        __readonly_newNode.type as Exclude<
          BpmnNodeType,
          "node_group" | "node_textAnnotation" | "node_unknown" | "node_lane" | "node_transaction"
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
          [NODE_TYPES.dataObject]: {
            "@_id": newBpmnElementId,
            "@_name": "New Data Object",
            __$$element: "dataObject",
          },
        }
      )
    );
  } else if (nature === NodeNature.ARTIFACT) {
    process.artifact ??= [];
    process.artifact?.push(
      ...switchExpression(__readonly_newNode.type as Extract<BpmnNodeType, "node_group" | "node_textAnnotation">, {
        [NODE_TYPES.textAnnotation]: [
          {
            "@_id": newBpmnElementId,
            __$$element: "textAnnotation" as const,
            text: "New text annotation" as any,
          },
        ],
        [NODE_TYPES.group]: [
          {
            "@_id": newBpmnElementId,
            __$$element: "group" as const,
            "@_name": "New group",
          },
        ],
      })
    );
  } else if (nature === NodeNature.CONTAINER) {
    process.flowElement ??= [];
    process.flowElement.push({
      __$$element: "transaction",
      "@_id": newBpmnElementId,
    });
  } else if (nature === NodeNature.LANE) {
    process.laneSet ??= [{ "@_id": generateUuid() }];
    process.laneSet[0].lane ??= [];
    process.laneSet[0].lane.push({
      "@_id": newBpmnElementId,
      "@_name": "New Lane",
    });
  }
  //
  else {
    throw new Error(`Unknown node nature '${nature}'.`);
  }

  // Add the new node shape
  const shapeId = generateUuid();
  diagramElements?.push({
    __$$element: "bpmndi:BPMNShape",
    "@_id": shapeId,
    "@_bpmnElement": newBpmnElementId,
    "dc:Bounds": __readonly_newNode.bounds,
  });

  return { id: newBpmnElementId, shapeId };
}
