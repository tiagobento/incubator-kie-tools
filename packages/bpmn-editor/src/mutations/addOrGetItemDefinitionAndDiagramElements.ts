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

import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";
import { BPMN20__tDefinitions, BPMNDI__BPMNPlane } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { ElementFilter } from "@kie-tools/xml-parser-ts/dist/elementFilter";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import { Normalized } from "../normalization/normalize";

/**
 * Assumes a single itemDefinition is present together with a single diagram.
 */
export function addOrGetitemDefinitionAndDiagramElements({
  definitions,
}: {
  definitions: Normalized<BPMN20__tDefinitions>;
}): {
  itemDefinition: ElementFilter<Unpacked<Normalized<BPMN20__tDefinitions["rootElement"]>>, "itemDefinition">;
  diagramElements: NonNullable<Normalized<BPMNDI__BPMNPlane["di:DiagramElement"]>>;
} {
  definitions.rootElement ??= [];

  let itemDefinition = definitions.rootElement?.filter((s) => s.__$$element === "itemDefinition")[0];
  if (!itemDefinition) {
    itemDefinition = {
      __$$element: "itemDefinition",
      "@_id": generateUuid(),
    };
    definitions.rootElement?.push(itemDefinition);
  }

  let diagramElements: NonNullable<Normalized<BPMNDI__BPMNPlane["di:DiagramElement"]>>;
  const diagram = (definitions["bpmndi:BPMNDiagram"] ??= []);
  if (diagram.length !== 0) {
    diagramElements = diagram[0]["bpmndi:BPMNPlane"]["di:DiagramElement"] ?? [];
  } else {
    diagram.push({
      "@_id": generateUuid(),
      "bpmndi:BPMNPlane": {
        "@_id": generateUuid(),
        "di:DiagramElement": (diagramElements = []),
      },
    });
  }

  return { itemDefinition, diagramElements };
}
