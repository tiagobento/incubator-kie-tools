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

import { BPMN20__tBusinessRuleTask } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import * as React from "react";
import { Normalized } from "../../normalization/normalize";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../../store/StoreContext";
import { NameDocumentationAndId } from "../nameDocumentationAndId/NameDocumentationAndId";
import { BidirectionalAssignmentsFormSection } from "../assignments/AssignmentsFormSection";
import { OnEntryAndExitScriptsFormSection } from "../onEntryAndExitScripts/OnEntryAndExitScriptsFormSection";
import { PropertiesPanelHeaderFormSection } from "./_PropertiesPanelHeaderFormSection";
import { TaskIcon } from "../../diagram/nodes/NodeIcons";
import { Divider } from "@patternfly/react-core/dist/js/components/Divider";
import { AdhocAutostartCheckbox } from "../adhocAutostartCheckbox/AdhocAutostartCheckbox";
import { AsyncCheckbox } from "../asyncCheckbox/AsyncCheckbox";
import { SlaDueDateInput } from "../slaDueDate/SlaDueDateInput";
import { FormGroup } from "@patternfly/react-core/dist/js/components/Form";
import { BUSINESS_RULE_TASK_IMPLEMENTATIONS } from "@kie-tools/bpmn-marshaller/dist/drools-extension";
import { ToggleGroup } from "@patternfly/react-core/dist/js/components/ToggleGroup/ToggleGroup";
import { visitFlowElementsAndArtifacts } from "../../mutations/_elementVisitor";
import { ToggleGroupItem } from "@patternfly/react-core/dist/js/components/ToggleGroup";
import { addOrGetProcessAndDiagramElements } from "../../mutations/addOrGetProcessAndDiagramElements";
import { FormSelect, FormSelectOption } from "@patternfly/react-core/dist/js/components/FormSelect";
import { TextInput } from "@patternfly/react-core/dist/js/components/TextInput";

export function BusinessRuleTaskProperties({
  businessRuleTask,
}: {
  businessRuleTask: Normalized<BPMN20__tBusinessRuleTask> & { __$$element: "businessRuleTask" };
}) {
  const isReadOnly = useBpmnEditorStore((s) => s.settings.isReadOnly);

  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

  return (
    <>
      <PropertiesPanelHeaderFormSection
        title={businessRuleTask["@_name"] || "Business rule task"}
        icon={<TaskIcon variant={businessRuleTask.__$$element} isIcon={true} />}
      >
        <NameDocumentationAndId element={businessRuleTask} />
        <Divider inset={{ default: "insetXs" }} />
        <FormGroup
          label="Implementation"
          // helperText={
          //   "Consectetur adipiscing elit. Lorem ipsum dolor sit amet, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
          // } // FIXME: Tiago -> Description
        >
          <ToggleGroup aria-label="Implementation">
            <ToggleGroupItem
              text="DRL"
              isDisabled={isReadOnly}
              isSelected={businessRuleTask["@_implementation"] === BUSINESS_RULE_TASK_IMPLEMENTATIONS.drools}
              onChange={() => {
                bpmnEditorStoreApi.setState((s) => {
                  const { process } = addOrGetProcessAndDiagramElements({
                    definitions: s.bpmn.model.definitions,
                  });
                  visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                    if (e["@_id"] === businessRuleTask["@_id"] && e.__$$element === businessRuleTask.__$$element) {
                      e["@_implementation"] = BUSINESS_RULE_TASK_IMPLEMENTATIONS.drools;
                    }
                  });
                });
              }}
            />
            <ToggleGroupItem
              text="DMN"
              isDisabled={isReadOnly}
              isSelected={businessRuleTask["@_implementation"] === BUSINESS_RULE_TASK_IMPLEMENTATIONS.dmn}
              onChange={() => {
                bpmnEditorStoreApi.setState((s) => {
                  const { process } = addOrGetProcessAndDiagramElements({
                    definitions: s.bpmn.model.definitions,
                  });
                  visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                    if (e["@_id"] === businessRuleTask["@_id"] && e.__$$element === businessRuleTask.__$$element) {
                      e["@_implementation"] = BUSINESS_RULE_TASK_IMPLEMENTATIONS.dmn;
                    }
                  });
                });
              }}
            />
          </ToggleGroup>
        </FormGroup>
        {businessRuleTask["@_implementation"] === BUSINESS_RULE_TASK_IMPLEMENTATIONS.drools && (
          <>
            <FormGroup label="Rule flow group">
              <FormSelect id={"select"} value={undefined} isDisabled={isReadOnly}>
                <FormSelectOption id={"none"} isPlaceholder={true} label={"-- None --"} />
                {/* FIXME: Tiago */}
              </FormSelect>
            </FormGroup>
          </>
        )}{" "}
        <FormSelectOption id={"none"} isPlaceholder={true} label={"-- None --"} />
        {businessRuleTask["@_implementation"] === BUSINESS_RULE_TASK_IMPLEMENTATIONS.dmn && (
          <>
            <FormGroup label="DMN File">
              <FormSelect id={"select"} value={undefined} isDisabled={isReadOnly}>
                <FormSelectOption id={"none"} isPlaceholder={true} label={"-- None --"} />
                {/* FIXME: Tiago */}
              </FormSelect>
            </FormGroup>

            <FormGroup label="DMN Namespace">
              <TextInput
                aria-label={"DMN Namespace"}
                type={"text"}
                isDisabled={isReadOnly}
                placeholder={"Enter a Namespace..."}
                value={""} // FIXME: Tiago
                onChange={(newNamespace) =>
                  bpmnEditorStoreApi.setState((s) => {
                    const { process } = addOrGetProcessAndDiagramElements({
                      definitions: s.bpmn.model.definitions,
                    });
                    visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                      if (e["@_id"] === businessRuleTask["@_id"]) {
                        // FIXME: Tiago
                        console.log(newNamespace);
                      }
                    });
                  })
                }
              />
            </FormGroup>

            <FormGroup label="DMN Name">
              <TextInput
                aria-label={"DMN Name"}
                type={"text"}
                isDisabled={isReadOnly}
                placeholder={"Enter a Name..."}
                value={""} // FIXME: Tiago
                onChange={(newName) =>
                  bpmnEditorStoreApi.setState((s) => {
                    const { process } = addOrGetProcessAndDiagramElements({
                      definitions: s.bpmn.model.definitions,
                    });
                    visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                      if (e["@_id"] === businessRuleTask["@_id"]) {
                        // FIXME: Tiago
                        console.log(newName);
                      }
                    });
                  })
                }
              />
            </FormGroup>
          </>
        )}
        <Divider inset={{ default: "insetXs" }} />
        <SlaDueDateInput element={businessRuleTask} />
        <AsyncCheckbox element={businessRuleTask} />
        <AdhocAutostartCheckbox element={businessRuleTask} />
        <Divider inset={{ default: "insetXs" }} />
      </PropertiesPanelHeaderFormSection>

      <BidirectionalAssignmentsFormSection element={businessRuleTask} />

      <OnEntryAndExitScriptsFormSection element={businessRuleTask} />
    </>
  );
}
