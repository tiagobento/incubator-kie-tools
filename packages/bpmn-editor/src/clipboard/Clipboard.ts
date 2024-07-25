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

import {
  BPMN20__tProcess,
  BPMNDI__BPMNEdge,
  BPMNDI__BPMNShape,
} from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import * as RF from "reactflow";
import { Normalized } from "../normalization/normalize";
import { State } from "../store/Store";
import { Unpacked } from "@kie-tools/xyflow-kie-diagram/dist/tsExt/tsExt";

export const BPMN_EDITOR_DIAGRAM_CLIPBOARD_MIME_TYPE = "application/json+kie-bpmn-editor--diagram" as const;

export type BpmnEditorDiagramClipboard = {
  mimeType: typeof BPMN_EDITOR_DIAGRAM_CLIPBOARD_MIME_TYPE;
  namespaceWhereClipboardWasCreatedFrom: string;
  processFlowElements: NonNullable<Unpacked<Normalized<BPMN20__tProcess>["flowElement"]>>[];
  artifacts: NonNullable<Unpacked<Normalized<BPMN20__tProcess>["artifact"]>>[];
  shapes: Normalized<BPMNDI__BPMNShape>[];
  edges: Normalized<BPMNDI__BPMNEdge>[];
};

export function buildClipboardFromDiagram(xyFlowState: RF.ReactFlowState, bpmnEditorState: State) {
  return undefined as any; // FIXME: Tiago: Implement (clipboard)
}

export function getClipboard<T extends { mimeType: string }>(text: string, mimeType: string): T | undefined {
  let potentialClipboard: T | undefined;
  try {
    potentialClipboard = JSON.parse(text);
  } catch (e) {
    console.debug("BPMN DIAGRAM: Ignoring pasted content. Not a valid JSON.");
    return undefined;
  }

  if (!potentialClipboard || potentialClipboard.mimeType !== mimeType) {
    console.debug("BPMN DIAGRAM: Ignoring pasted content. MIME type doesn't match.");
    return undefined;
  }

  return potentialClipboard;
}
