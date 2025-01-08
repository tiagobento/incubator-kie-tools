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
import { addOrGetProcessAndDiagramElements } from "../../mutations/addOrGetProcessAndDiagramElements";
import { visitFlowElementsAndArtifacts } from "../../mutations/_elementVisitor";
import { Normalized } from "../../normalization/normalize";
import { BPMN20__tProcess } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { ElementFilter } from "@kie-tools/xml-parser-ts/dist/elementFilter";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import { TextArea } from "@patternfly/react-core/dist/js/components/TextArea";
import "./SignalSelector.css";

export type WithSignal =
  | undefined
  | Normalized<
      ElementFilter<
        Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>,
        "startEvent" | "intermediateCatchEvent" | "intermediateThrowEvent" | "endEvent" | "boundaryEvent"
      >
    >;

export function SignalSelector({ element }: { element: WithSignal }) {
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();
  const settings = useBpmnEditorStore((s) => s.settings);

  return (
    <FormSection>
      <FormGroup label="Signal">
        <TextArea
          aria-label={"Signal"}
          type={"text"}
          isDisabled={settings.isReadOnly}
          value={
            element?.eventDefinition?.find((eventDef) => eventDef.__$$element === "signalEventDefinition")?.[
              "@_signalRef"
            ] || ""
          }
          onChange={(newSignal: string | undefined) =>
            bpmnEditorStoreApi.setState((s) => {
              const { process } = addOrGetProcessAndDiagramElements({
                definitions: s.bpmn.model.definitions,
              });
              visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                if (e["@_id"] === element?.["@_id"] && e.__$$element === element.__$$element) {
                  const signalEventDefinition = e.eventDefinition?.find(
                    (event) => event.__$$element === "signalEventDefinition"
                  );
                  if (signalEventDefinition) {
                    signalEventDefinition["@_signalRef"] = newSignal;
                  }
                }
              });
            })
          }
          placeholder={"-- None --"}
          style={{ resize: "vertical", minHeight: "40px" }}
          rows={1}
        />
      </FormGroup>
    </FormSection>
  );
}
