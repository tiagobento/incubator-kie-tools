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
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../../store/StoreContext";
import { FormGroup, FormSection } from "@patternfly/react-core/dist/js/components/Form";
import { FormSelect, FormSelectOption } from "@patternfly/react-core/dist/js/components/FormSelect";
import { Normalized } from "../../normalization/normalize";
import {
  BPMN20__tMessageEventDefinition,
  BPMN20__tProcess,
} from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { ElementFilter } from "@kie-tools/xml-parser-ts/dist/elementFilter";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import "./MessageSelector.css";
import { BPMN20__tMessage, BPMN20__tDefinitions } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { addOrGetProcessAndDiagramElements } from "../../mutations/addOrGetProcessAndDiagramElements";
import { visitFlowElementsAndArtifacts } from "../../mutations/_elementVisitor";
import { TextArea } from "@patternfly/react-core/dist/js/components/TextArea/TextArea";
import { TextInput } from "@patternfly/react-core/dist/js/components/TextInput";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";
import { updateFlowElement } from "../../mutations/renameNode";

export type WithMessage =
  | undefined
  | Normalized<
      ElementFilter<
        Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>,
        "startEvent" | "intermediateCatchEvent" | "intermediateThrowEvent" | "endEvent" | "boundaryEvent"
      >
    >;

export function MessageSelector({ element }: { element: WithMessage }) {
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();
  const settings = useBpmnEditorStore((s) => s.settings);

  return (
    <FormSection>
      <FormGroup label="Message">
        <TextArea
          aria-label={"Message"}
          type={"text"}
          isDisabled={settings.isReadOnly}
          value={
            element?.eventDefinition?.find((eventDef) => eventDef.__$$element === "messageEventDefinition")?.[
              "@_drools:msgref"
            ] || ""
          }
          onChange={(newMessage: string | undefined) =>
            bpmnEditorStoreApi.setState((s) => {
              const { process } = addOrGetProcessAndDiagramElements({
                definitions: s.bpmn.model.definitions,
              });
              visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                if (e["@_id"] === element?.["@_id"] && e.__$$element === element.__$$element) {
                  const messageEventDefinition = e.eventDefinition?.find(
                    (event) => event.__$$element === "messageEventDefinition"
                  );
                  if (messageEventDefinition) {
                    messageEventDefinition["@_drools:msgref"] = newMessage;
                    messageEventDefinition["@_messageRef"] = e["@_id"];
                  }
                }
              });
            })
          }
          placeholder={"Enter message..."}
          style={{ resize: "vertical", minHeight: "40px" }}
          rows={1}
        />
      </FormGroup>
    </FormSection>
  );
}
