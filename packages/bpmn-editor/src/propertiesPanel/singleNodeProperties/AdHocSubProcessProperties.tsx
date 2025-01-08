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

import { BPMN20__tAdHocSubProcess } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import * as React from "react";
import { Normalized } from "../../normalization/normalize";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../../store/StoreContext";
import { NameDocumentationAndId } from "../nameDocumentationAndId/NameDocumentationAndId";
import { OnEntryAndExitScriptsFormSection } from "../onEntryAndExitScripts/OnEntryAndExitScriptsFormSection";
import { SubProcessIcon } from "../../diagram/nodes/NodeIcons";
import { PropertiesPanelHeaderFormSection } from "./_PropertiesPanelHeaderFormSection";
import { VariablesFormSection } from "../variables/VariablesFormSection";
import { Divider } from "@patternfly/react-core/dist/js/components/Divider";
import { FormGroup } from "@patternfly/react-core/dist/js/components/Form";
import { CodeInput } from "../codeInput/CodeInput";
import { FormSelect, FormSelectOption } from "@patternfly/react-core/dist/js/components/FormSelect";
import { visitFlowElementsAndArtifacts } from "../../mutations/_elementVisitor";
import { addOrGetProcessAndDiagramElements } from "../../mutations/addOrGetProcessAndDiagramElements";
import {
  parseBpmn20Drools10MetaData,
  setBpmn20Drools10MetaData,
} from "@kie-tools/bpmn-marshaller/dist/drools-extension-metaData";
import { AdhocAutostartCheckbox } from "../adhocAutostartCheckbox/AdhocAutostartCheckbox";
import { SlaDueDateInput } from "../slaDueDate/SlaDueDateInput";
import { AsyncCheckbox } from "../asyncCheckbox/AsyncCheckbox";

export function AdHocSubProcessProperties({
  adHocSubProcess,
}: {
  adHocSubProcess: Normalized<BPMN20__tAdHocSubProcess> & { __$$element: "adHocSubProcess" };
}) {
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

  const isReadOnly = useBpmnEditorStore((s) => s.settings.isReadOnly);

  return (
    <>
      <PropertiesPanelHeaderFormSection
        title={adHocSubProcess["@_name"] || "Ad-hoc sub-process"}
        icon={<SubProcessIcon />}
      >
        <NameDocumentationAndId element={adHocSubProcess} />

        <Divider inset={{ default: "insetXs" }} />

        <SlaDueDateInput element={adHocSubProcess} />

        <AsyncCheckbox element={adHocSubProcess} />

        <Divider inset={{ default: "insetXs" }} />

        <CodeInput
          label={"Ad-hoc activation condition"}
          languages={["Drools"]}
          value={parseBpmn20Drools10MetaData(adHocSubProcess).get("customActivationCondition") ?? ""}
          onChange={(newCode) => {
            bpmnEditorStoreApi.setState((s) => {
              const { process } = addOrGetProcessAndDiagramElements({
                definitions: s.bpmn.model.definitions,
              });
              visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                if (e["@_id"] === adHocSubProcess["@_id"] && e.__$$element === adHocSubProcess.__$$element) {
                  setBpmn20Drools10MetaData(e, "customActivationCondition", newCode);
                }
              });
            });
          }}
        />

        <CodeInput
          label={"Ad-hoc completion condition"}
          languages={["MVEL", "Drools"]}
          value={""} // FIXME: Tiago
          onChange={(newCode) => {
            // FIXME: Tiago
          }}
        />

        <FormGroup label="Ad-hoc ordering">
          <FormSelect id={"select"} value={undefined} isDisabled={isReadOnly}>
            <FormSelectOption id={"none"} isPlaceholder={true} label={"-- None --"} />
          </FormSelect>
        </FormGroup>

        <AdhocAutostartCheckbox element={adHocSubProcess} />
      </PropertiesPanelHeaderFormSection>

      <VariablesFormSection p={adHocSubProcess} />

      <OnEntryAndExitScriptsFormSection element={adHocSubProcess} />
    </>
  );
}
