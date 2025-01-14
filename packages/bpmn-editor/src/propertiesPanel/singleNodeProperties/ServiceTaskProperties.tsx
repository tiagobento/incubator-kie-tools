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

import { BPMN20__tServiceTask } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import * as React from "react";
import { Normalized } from "../../normalization/normalize";
import { NameDocumentationAndId } from "../nameDocumentationAndId/NameDocumentationAndId";
import { BidirectionalAssignmentsFormSection } from "../assignments/AssignmentsFormSection";
import { OnEntryAndExitScriptsFormSection } from "../onEntryAndExitScripts/OnEntryAndExitScriptsFormSection";
import { TaskIcon } from "../../diagram/nodes/NodeIcons";
import { PropertiesPanelHeaderFormSection } from "./_PropertiesPanelHeaderFormSection";
import { Divider } from "@patternfly/react-core/dist/js/components/Divider";
import { FormGroup } from "@patternfly/react-core/dist/js/components/Form";
import { AdhocAutostartCheckbox } from "../adhocAutostartCheckbox/AdhocAutostartCheckbox";
import { AsyncCheckbox } from "../asyncCheckbox/AsyncCheckbox";
import { MultiInstanceProperties } from "../multiInstance/MultiInstanceProperties";
import { MultiInstanceCheckbox } from "../multiInstanceCheckbox/MultiInstanceCheckbox";
import { SlaDueDateInput } from "../slaDueDate/SlaDueDateInput";
import {
  BUSINESS_RULE_TASK_IMPLEMENTATIONS,
  SERVICE_TASK_IMPLEMENTATIONS,
} from "@kie-tools/bpmn-marshaller/dist/drools-extension";
import { ToggleGroup, ToggleGroupItem } from "@patternfly/react-core/dist/js/components/ToggleGroup";
import { visitFlowElementsAndArtifacts } from "../../mutations/_elementVisitor";
import { addOrGetProcessAndDiagramElements } from "../../mutations/addOrGetProcessAndDiagramElements";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../../store/StoreContext";
import { TextInput } from "@patternfly/react-core/dist/js/components/TextInput";

export function ServiceTaskProperties({
  serviceTask,
}: {
  serviceTask: Normalized<BPMN20__tServiceTask> & { __$$element: "serviceTask" };
}) {
  const isReadOnly = useBpmnEditorStore((s) => s.settings.isReadOnly);
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

  return (
    <>
      <PropertiesPanelHeaderFormSection
        title={serviceTask["@_name"] || "Service task"}
        icon={<TaskIcon variant={serviceTask.__$$element} isIcon={true} />}
      >
        <NameDocumentationAndId element={serviceTask} />

        <Divider inset={{ default: "insetXs" }} />

        <FormGroup
          label="Implementation"
          // helperText={
          //   "Consectetur adipiscing elit. Lorem ipsum dolor sit amet, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
          // } // FIXME: Tiago -> Description
        >
          <ToggleGroup aria-label="Implementation">
            <ToggleGroupItem
              text="Java"
              isDisabled={isReadOnly}
              isSelected={
                (serviceTask["@_implementation"] ?? serviceTask["@_drools:serviceimplementation"]) ===
                SERVICE_TASK_IMPLEMENTATIONS.java
              }
              onChange={() => {
                bpmnEditorStoreApi.setState((s) => {
                  const { process } = addOrGetProcessAndDiagramElements({
                    definitions: s.bpmn.model.definitions,
                  });
                  visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                    if (e["@_id"] === serviceTask["@_id"] && e.__$$element === serviceTask.__$$element) {
                      e["@_implementation"] = SERVICE_TASK_IMPLEMENTATIONS.java;
                      e["@_drools:serviceimplementation"] = SERVICE_TASK_IMPLEMENTATIONS.java;
                    }
                  });
                });
              }}
            />
            <ToggleGroupItem
              text="Web service"
              isDisabled={isReadOnly}
              isSelected={
                (serviceTask["@_implementation"] ?? serviceTask["@_drools:serviceimplementation"]) ===
                SERVICE_TASK_IMPLEMENTATIONS.webService
              }
              onChange={() => {
                bpmnEditorStoreApi.setState((s) => {
                  const { process } = addOrGetProcessAndDiagramElements({
                    definitions: s.bpmn.model.definitions,
                  });
                  visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                    if (e["@_id"] === serviceTask["@_id"] && e.__$$element === serviceTask.__$$element) {
                      e["@_implementation"] = SERVICE_TASK_IMPLEMENTATIONS.webService;
                      e["@_drools:serviceimplementation"] = SERVICE_TASK_IMPLEMENTATIONS.webService;
                    }
                  });
                });
              }}
            />
          </ToggleGroup>
        </FormGroup>

        <FormGroup label="Interface">
          <TextInput
            aria-label={"Interface"}
            type={"text"}
            isDisabled={isReadOnly}
            placeholder={"Enter an interface..."}
            value={serviceTask["@_drools:serviceinterface"]}
            onChange={(newInterface) =>
              bpmnEditorStoreApi.setState((s) => {
                const { process } = addOrGetProcessAndDiagramElements({
                  definitions: s.bpmn.model.definitions,
                });
                visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                  if (e["@_id"] === serviceTask["@_id"]) {
                    serviceTask["@_drools:serviceinterface"] = newInterface;
                  }
                });
              })
            }
          />
        </FormGroup>

        <FormGroup label="Operation">
          <TextInput
            aria-label={"Operation"}
            type={"text"}
            isDisabled={isReadOnly}
            placeholder={"Enter an operation..."}
            value={serviceTask["@_drools:serviceoperation"]}
            onChange={(newOperation) =>
              bpmnEditorStoreApi.setState((s) => {
                const { process } = addOrGetProcessAndDiagramElements({
                  definitions: s.bpmn.model.definitions,
                });
                visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                  if (e["@_id"] === serviceTask["@_id"]) {
                    serviceTask["@_drools:serviceoperation"] = newOperation;
                  }
                });
              })
            }
          />
        </FormGroup>

        <Divider inset={{ default: "insetXs" }} />

        <SlaDueDateInput element={serviceTask} />
        <AsyncCheckbox element={serviceTask} />
        <AdhocAutostartCheckbox element={serviceTask} />

        <Divider inset={{ default: "insetXs" }} />

        <MultiInstanceCheckbox element={serviceTask} />
        {serviceTask.loopCharacteristics?.__$$element === "multiInstanceLoopCharacteristics" && (
          <MultiInstanceProperties element={serviceTask} />
        )}
      </PropertiesPanelHeaderFormSection>

      <BidirectionalAssignmentsFormSection element={serviceTask} />

      <OnEntryAndExitScriptsFormSection element={serviceTask} />
    </>
  );
}
