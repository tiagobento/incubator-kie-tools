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
import { addOrGetProcessAndDiagramElements } from "../../mutations/addOrGetProcessAndDiagramElements";
import { visitFlowElementsAndArtifacts } from "../../mutations/_elementVisitor";
import { Normalized } from "../../normalization/normalize";
import { BPMN20__tProcess } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { ElementFilter } from "@kie-tools/xml-parser-ts/dist/elementFilter";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import { CodeInput } from "../codeInput/CodeInput";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";
import { TextInput } from "@patternfly/react-core/dist/js/components/TextInput/TextInput";
import { Select } from "@patternfly/react-core/dist/js/components/Select/Select";

export type WithLinkExpression =
  | undefined
  | Normalized<
      ElementFilter<
        Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>,
        "intermediateThrowEvent" | "intermediateCatchEvent" | "boundaryEvent"
      >
    >;

export function LinkSelector({ element }: { element: WithLinkExpression }) {
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();
  const settings = useBpmnEditorStore((s) => s.settings);

  const currentValue =
    element?.eventDefinition?.find((eventDef) => eventDef.__$$element === "linkEventDefinition")?.["@_name"] || "";

  // const links: string[] = [];

  // const getDropdownValues = () => {
  //   bpmnEditorStoreApi.setState((s) => {
  //     const { process } = addOrGetProcessAndDiagramElements({
  //       definitions: s.bpmn.model.definitions,
  //     });
  //     visitFlowElementsAndArtifacts(process, ({ element: e }) => {
  //       if (e.__$$element === element?.__$$element) {
  //         const linkEventDefinition = e.eventDefinition?.find((event) => event.__$$element === "linkEventDefinition");
  //         if (linkEventDefinition) {
  //           links.push(linkEventDefinition["@_name"]);
  //         }
  //       }
  //     });
  //   });
  // };

  const handleValueChange = (newValue: string | undefined) => {
    bpmnEditorStoreApi.setState((s) => {
      const { process } = addOrGetProcessAndDiagramElements({
        definitions: s.bpmn.model.definitions,
      });
      visitFlowElementsAndArtifacts(process, ({ element: e }) => {
        if (e["@_id"] === element?.["@_id"] && e.__$$element === element.__$$element) {
          const linkEventDefinition = e.eventDefinition?.find((event) => event.__$$element === "linkEventDefinition");
          if (linkEventDefinition) {
            linkEventDefinition["@_name"] = newValue || "";
            // links.push(linkEventDefinition["@_name"]);
          }
        }
      });
    });
  };

  return (
    <FormSection>
      <FormGroup label="Link">
        <TextInput value={currentValue} onChange={handleValueChange} label={"Link"} />
        {/* <Select onToggle={() => getDropdownValues}></Select> */}
      </FormGroup>
    </FormSection>
  );
}
