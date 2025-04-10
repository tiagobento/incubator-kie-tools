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

import { ClipboardCopy } from "@patternfly/react-core/dist/js/components/ClipboardCopy";
import { FormGroup, FormSection } from "@patternfly/react-core/dist/js/components/Form";
import { TextArea } from "@patternfly/react-core/dist/js/components/TextArea";
import { TextInput } from "@patternfly/react-core/dist/js/components/TextInput";
import * as React from "react";
import { updateFlowElement, updateLane } from "../../mutations/renameNode";
import { Normalized } from "../../normalization/normalize";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../../store/StoreContext";
import {
  BPMN20__tAssociation,
  BPMN20__tGroup,
  BPMN20__tLane,
  BPMN20__tProcess,
} from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import { visitFlowElementsAndArtifacts, visitLanes } from "../../mutations/_elementVisitor";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";
import { addOrGetProcessAndDiagramElements } from "../../mutations/addOrGetProcessAndDiagramElements";
import { useCallback } from "react";
import { setBpmn20Drools10MetaData } from "@kie-tools/bpmn-marshaller/dist/drools-extension-metaData";

export function NameDocumentationAndId({
  element,
}: {
  element: Normalized<
    | Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>
    | (BPMN20__tLane & { __$$element: "lane" })
    | (BPMN20__tAssociation & { __$$element: "association" })
    | (BPMN20__tGroup & { __$$element: "group" })
  >;
}) {
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();
  const settings = useBpmnEditorStore((s) => s.settings);

  const onNameChanged = useCallback(
    (newName: string) => {
      bpmnEditorStoreApi.setState((s) => {
        if (element.__$$element === "lane") {
          updateLane({
            definitions: s.bpmn.model.definitions,
            newLane: { "@_name": newName },
            id: element["@_id"],
          });
        } else {
          updateFlowElement({
            definitions: s.bpmn.model.definitions,
            id: element["@_id"],
            newFlowElement: { "@_name": newName },
          });
          if (
            element.__$$element === "sequenceFlow" ||
            element.__$$element === "userTask" ||
            element.__$$element === "complexGateway" ||
            element.__$$element === "parallelGateway" ||
            element.__$$element === "exclusiveGateway" ||
            element.__$$element === "inclusiveGateway"
          ) {
            const { process } = addOrGetProcessAndDiagramElements({
              definitions: s.bpmn.model.definitions,
            });
            visitFlowElementsAndArtifacts(process, ({ element: e }) => {
              if (e["@_id"] === element?.["@_id"] && e.__$$element === element.__$$element) {
                setBpmn20Drools10MetaData(e, "elementname", e["@_name"] || "");
              }
            });
          }
        }
      });
    },
    [element, bpmnEditorStoreApi]
  );

  const onDocumentationChanged = useCallback(
    (newDocumentation) =>
      bpmnEditorStoreApi.setState((s) => {
        const { process } = addOrGetProcessAndDiagramElements({
          definitions: s.bpmn.model.definitions,
        });
        if (element.__$$element === "lane") {
          visitLanes(process, ({ lane: e }) => {
            if (e["@_id"] === element["@_id"]) {
              e.documentation ??= [];
              e.documentation[0] = {
                "@_id": generateUuid(),
                __$$text: newDocumentation,
              };
            }
          });
        } else {
          visitFlowElementsAndArtifacts(process, ({ element: e }) => {
            if (e["@_id"] === element["@_id"] && e.__$$element === element.__$$element) {
              e.documentation ??= [];
              e.documentation[0] = {
                "@_id": generateUuid(),
                __$$text: newDocumentation,
              };
            }
          });
        }
      }),
    [bpmnEditorStoreApi, element]
  );

  return (
    <FormSection>
      {element.__$$element !== "association" && element.__$$element !== "group" && (
        <FormGroup label="Name">
          <TextInput
            isDisabled={settings.isReadOnly}
            id={element["@_id"]}
            name={element["@_name"]}
            value={element["@_name"] || ""}
            placeholder={"Enter a name..."}
            onChange={onNameChanged}
          />
        </FormGroup>
      )}

      <FormGroup label="Documentation">
        <TextArea
          aria-label={"Documentation"}
          type={"text"}
          isDisabled={settings.isReadOnly}
          value={element?.documentation?.[0].__$$text || ""}
          onChange={onDocumentationChanged}
          placeholder={"Enter documentation..."}
          style={{ resize: "vertical", minHeight: "40px" }}
          rows={3}
        />
      </FormGroup>

      <FormGroup label="ID">
        <ClipboardCopy isReadOnly={settings.isReadOnly} hoverTip="Copy" clickTip="Copied">
          {element["@_id"]}
        </ClipboardCopy>
      </FormGroup>
    </FormSection>
  );
}
