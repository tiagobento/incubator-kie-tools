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
import { Normalized } from "../normalization/normalize";
import { BpmnDiagramEdgeData } from "../diagram/BpmnDiagramDomain";
import { BPMN20__tDefinitions, BPMN20__tProcess } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { addOrGetProcessAndDiagramElements } from "./addOrGetProcessAndDiagramElements";

export function deleteEdge({
  definitions,
  edge,
}: {
  definitions: Normalized<BPMN20__tDefinitions>;
  edge: { id: string; bpmnElement: BpmnDiagramEdgeData["bpmnElement"] };
}) {
  const { process, diagramElements } = addOrGetProcessAndDiagramElements({ definitions });
  const bpmnElements: Normalized<BPMN20__tProcess>["flowElement" | "artifact"] =
    switchExpression(edge?.bpmnElement?.__$$element, {
      association: process.artifact,
      default: process.flowElement,
    }) ?? [];

  // Deleting the sequenceFlow/association
  const bpmnElementIndex = bpmnElements.findIndex((e) => e["@_id"] === edge.bpmnElement?.["@_id"]);
  if (bpmnElementIndex < 0) {
    throw new Error(`BPMN MUTATION: Can't find BPMN element with ID ${edge.bpmnElement?.["@_id"]}`);
  }

  const bpmnEdgeIndex = (diagramElements ?? []).findIndex((e) => e["@_bpmnElement"] === edge.bpmnElement?.["@_id"]);
  if (bpmnEdgeIndex < 0) {
    throw new Error(
      `BPMN MUTATION: Can't find BPMNEdge with referencing a BPMN element with ID ${edge.bpmnElement?.["@_id"]}`
    );
  }

  bpmnElements?.splice(bpmnElementIndex, 1);
  diagramElements?.splice(bpmnEdgeIndex, 1);
}
