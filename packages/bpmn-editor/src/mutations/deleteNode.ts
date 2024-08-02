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

import { BPMN20__tDefinitions, BPMNDI__BPMNShape } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { ElementFilter } from "@kie-tools/xml-parser-ts/dist/elementFilter";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import { BpmnDiagramEdgeData, BpmnNodeElement } from "../diagram/BpmnDiagramDomain";
import { Normalized } from "../normalization/normalize";
import { NodeNature } from "./NodeNature";
import { addOrGetProcessAndDiagramElements } from "./addOrGetProcessAndDiagramElements";
import { deleteEdge } from "./deleteEdge";

export function deleteNode({
  definitions,
  __readonly_bpmnEdgeData,
  __readonly_nodeNature,
  __readonly_bpmnElementId,
}: {
  definitions: Normalized<BPMN20__tDefinitions>;
  __readonly_bpmnEdgeData: BpmnDiagramEdgeData[];
  __readonly_nodeNature: NodeNature;
  __readonly_bpmnElementId: string | undefined;
}): {
  deletedBpmnElement: BpmnNodeElement | undefined;
  deletedBpmnShape: Normalized<BPMNDI__BPMNShape> | undefined;
} {
  const { process, diagramElements } = addOrGetProcessAndDiagramElements({ definitions });

  // Delete Edges
  const nodeId = __readonly_bpmnElementId;

  for (let i = 0; i < __readonly_bpmnEdgeData.length; i++) {
    const drgEdge = __readonly_bpmnEdgeData[i];
    // Only delete edges that end at or start from the node being deleted.
    if (drgEdge.bpmnEdge?.["@_sourceElement"] === nodeId || drgEdge.bpmnEdge?.["@_targetElement"] === nodeId) {
      deleteEdge({
        definitions,
        __readonly_edge: {
          id: drgEdge["@_id"],
          bpmnElement: drgEdge.bpmnElement,
        },
      });
    }
  }

  let deletedBpmnElement: BpmnNodeElement | undefined = undefined;

  // Delete the bpmnElement itself
  if (__readonly_nodeNature === NodeNature.ARTIFACT) {
    const nodeIndex = (process.artifact ?? []).findIndex((a) => a["@_id"] === __readonly_bpmnElementId);
    deletedBpmnElement = process.artifact?.splice(nodeIndex, 1)?.[0] as typeof deletedBpmnElement;
  } else if (
    __readonly_nodeNature === NodeNature.PROCESS_FLOW_ELEMENT ||
    __readonly_nodeNature == NodeNature.CONTAINER
  ) {
    const nodeIndex = (process.flowElement ?? []).findIndex((d) => d["@_id"] === __readonly_bpmnElementId);
    deletedBpmnElement = process.flowElement?.splice(nodeIndex, 1)?.[0] as typeof deletedBpmnElement;
  } else if (__readonly_nodeNature === NodeNature.LANE) {
    const nodeIndex = (process.laneSet?.[0].lane ?? []).findIndex((d) => d["@_id"] === __readonly_bpmnElementId);
    const deletedLane = (process.laneSet?.[0].lane ?? [])?.splice(nodeIndex, 1)?.[0];
    deletedBpmnElement = deletedLane ? { ...deletedLane, __$$element: "lane" } : undefined;
  } else if (__readonly_nodeNature === NodeNature.UNKNOWN) {
    // Ignore. There's no bpmnElement here.
  } else {
    throw new Error(`BPMN MUTATION: Unknown node nature '${__readonly_nodeNature}'.`);
  }

  if (!deletedBpmnElement && __readonly_nodeNature !== NodeNature.UNKNOWN) {
    /**
     * We do not want to throw error in case of `nodeNature` equals to `NodeNature.UNKNOWN`.
     * In such scenario it is expected `bpmnElement` is undefined as we can not pair `bpmnElement` with the `BPMNShape`.
     * However we are still able to delete at least the selected `BPMNShape` from the diagram.
     */
    throw new Error(`BPMN MUTATION: Can't delete BPMN object that doesn't exist: ID=${__readonly_bpmnElementId}`);
  }

  let deletedBpmnShape: Normalized<BPMNDI__BPMNShape> | undefined;
  const bpmnShapeIndex = (diagramElements ?? []).findIndex((d) => d["@_bpmnElement"] === __readonly_bpmnElementId);
  if (bpmnShapeIndex >= 0) {
    deletedBpmnShape = diagramElements[bpmnShapeIndex] as typeof deletedBpmnShape;
    diagramElements.splice(bpmnShapeIndex, 1);
  }

  return {
    deletedBpmnElement,
    deletedBpmnShape,
  };
}
