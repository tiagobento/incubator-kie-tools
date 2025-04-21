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

import { BPMN20__tUserTask } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import * as React from "react";
import { Normalized } from "../../normalization/normalize";
import { NameDocumentationAndId } from "../nameDocumentationAndId/NameDocumentationAndId";
import { BidirectionalDataMappingFormSection } from "../dataMapping/DataMappingFormSection";
import { ReassignmentsFormSection } from "../reassignments/Reassignments";
import { NotificationsFormSection } from "../notifications/Notifications";
import { OnEntryAndExitScriptsFormSection } from "../onEntryAndExitScripts/OnEntryAndExitScriptsFormSection";
import { TaskIcon } from "../../diagram/nodes/NodeIcons";
import { PropertiesPanelHeaderFormSection } from "./_PropertiesPanelHeaderFormSection";
import { Divider } from "@patternfly/react-core/dist/js/components/Divider";
import { AsyncCheckbox } from "../asyncCheckbox/AsyncCheckbox";
import { SlaDueDateInput } from "../slaDueDate/SlaDueDateInput";
import { MultiInstanceCheckbox } from "../multiInstanceCheckbox/MultiInstanceCheckbox";
import { MultiInstanceProperties } from "../multiInstance/MultiInstanceProperties";
import { AdhocAutostartCheckbox } from "../adhocAutostartCheckbox/AdhocAutostartCheckbox";
import { FormGroup } from "@patternfly/react-core/dist/js/components/Form";
import { TextArea } from "@patternfly/react-core/dist/js/components/TextArea/TextArea";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../../store/StoreContext";
import { visitFlowElementsAndArtifacts } from "../../mutations/_elementVisitor";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";
import { addOrGetProcessAndDiagramElements } from "../../mutations/addOrGetProcessAndDiagramElements";
import { Checkbox } from "@patternfly/react-core/dist/js/components/Checkbox/Checkbox";
import { TextInput } from "@patternfly/react-core/dist/js/components/TextInput";

const priorityInputX = "PriorityInputX";
const contentInputX = "ContentInputX";
const subjectInputX = "CommentInputX";
const taskNameInputX = "TaskNameInputX";
const descriptionInputX = "DescriptionInputX";
const skippableInputX = "SkippableInputX";
const createdByInputX = "CreatedByInputX";
const groupIdInputX = "GroupIdInputX";

export function UserTaskProperties({
  userTask,
}: {
  userTask: Normalized<BPMN20__tUserTask> & { __$$element: "userTask" };
}) {
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();
  const settings = useBpmnEditorStore((s) => s.settings);

  const handleChange = (fieldName: string, newValue: string | boolean) => {
    const valueAsString = String(newValue);
    bpmnEditorStoreApi.setState((s) => {
      const { process } = addOrGetProcessAndDiagramElements({
        definitions: s.bpmn.model.definitions,
      });

      visitFlowElementsAndArtifacts(process, ({ element: e }) => {
        if (e["@_id"] === userTask?.["@_id"] && e.__$$element === userTask.__$$element) {
          e.ioSpecification ??= {
            "@_id": "",
            inputSet: [],
            outputSet: [],
            dataInput: [],
          };

          e.ioSpecification.inputSet[0] ??= {
            "@_id": "",
            dataInputRefs: [],
          };

          e.ioSpecification.dataInput ??= [];

          let dataInput = e.ioSpecification.dataInput.find((input) => input["@_name"] === fieldName);

          if (!dataInput) {
            dataInput = {
              "@_id": `${e["@_id"]}_${fieldName}InputX`,
              "@_drools:dtype": "Object",
              "@_itemSubjectRef": `_${e["@_id"]}_${fieldName}InputXItem`,
              "@_name": fieldName,
            };
            e.ioSpecification.dataInput.push(dataInput);
          }

          e.ioSpecification.inputSet[0].dataInputRefs = e.ioSpecification.dataInput.map((input) => ({
            __$$text: input["@_id"],
          }));

          let dataInputAssociation = e.dataInputAssociation?.find(
            (association) => association.targetRef.__$$text === dataInput["@_id"]
          );

          if (!dataInputAssociation) {
            dataInputAssociation = {
              "@_id": `${e["@_id"]}_dataInputAssociation_${fieldName}`,
              targetRef: { __$$text: dataInput["@_id"] },
              assignment: [
                {
                  "@_id": `${e["@_id"]}_assignment_${fieldName}`,
                  from: {
                    "@_id": `${e["@_id"]}`,
                    __$$text: valueAsString,
                  },
                  to: { "@_id": e["@_id"], __$$text: `${e["@_id"]}_to_${fieldName}InputXItem` },
                },
              ],
            };
            e.dataInputAssociation ??= [];
            e.dataInputAssociation.push(dataInputAssociation);
          } else {
            if (dataInputAssociation.assignment?.[0]) {
              dataInputAssociation.assignment[0].from.__$$text = valueAsString;
            }
          }
        }
      });
    });
  };

  function setValue(fieldName: string) {
    return (
      userTask?.dataInputAssociation
        ?.find((association) =>
          association.assignment?.some((a) => a.from.__$$text && association.targetRef.__$$text.includes(fieldName))
        )
        ?.assignment?.find((a) => a.from.__$$text)?.from.__$$text || ""
    );
  }

  return (
    <>
      <PropertiesPanelHeaderFormSection
        title={userTask["@_name"] || "User task"}
        icon={<TaskIcon variant={userTask.__$$element} isIcon={true} />}
      >
        <NameDocumentationAndId element={userTask} />

        <Divider inset={{ default: "insetXs" }} />

        <FormGroup label="Task Name">
          <TextInput
            aria-label={"Task Name"}
            type={"text"}
            isDisabled={settings.isReadOnly}
            value={setValue(taskNameInputX)}
            onChange={(newTaskName) => handleChange("TaskName", newTaskName)}
            placeholder={"Enter task name..."}
          />
        </FormGroup>
        <FormGroup label="Subject">
          <TextInput
            aria-label={"Subject"}
            type={"text"}
            isDisabled={settings.isReadOnly}
            value={setValue(subjectInputX)}
            onChange={(newSubject) => handleChange("Comment", newSubject)}
            placeholder={"Enter subject..."}
          />
        </FormGroup>
        <FormGroup label="Content">
          <TextArea
            aria-label={"Content"}
            type={"text"}
            isDisabled={settings.isReadOnly}
            value={setValue(contentInputX)}
            onChange={(newContent) => handleChange("Content", newContent)}
            placeholder={"Enter content..."}
          />
        </FormGroup>

        <FormGroup label="Task Priority">
          <TextInput
            aria-label={"Task Priority"}
            type={"text"}
            isDisabled={settings.isReadOnly}
            value={setValue(priorityInputX)}
            onChange={(newPriority) => handleChange("Priority", newPriority)}
            placeholder={"Enter priority..."}
          />
        </FormGroup>
        <FormGroup label="Description">
          <TextArea
            aria-label={"Description"}
            type={"text"}
            isDisabled={settings.isReadOnly}
            value={setValue(descriptionInputX)}
            onChange={(newDescription) => handleChange("Description", newDescription)}
            placeholder={"Enter description..."}
            style={{ resize: "vertical", minHeight: "40px" }}
            rows={3}
          />
        </FormGroup>
        <FormGroup>
          <Checkbox
            label="Skippable"
            aria-label={"Skippable"}
            id="kie-bpmn-editor--properties-panel--skippable-checkbox"
            isDisabled={settings.isReadOnly}
            isChecked={setValue(skippableInputX) === "true" ? true : false}
            onChange={(newSkippable) => handleChange("Skippable", newSkippable)}
          />
        </FormGroup>

        <Divider inset={{ default: "insetXs" }} />

        <FormGroup label={"Actors"}>
          <TextInput
            aria-label={"Potential Owner"}
            type={"text"}
            isDisabled={settings.isReadOnly}
            value={
              userTask?.resourceRole?.find((role) => role.__$$element === "potentialOwner")
                ?.resourceAssignmentExpression?.expression?.__$$element === "formalExpression"
                ? userTask?.resourceRole?.find((role) => role.__$$element === "potentialOwner")
                    ?.resourceAssignmentExpression?.expression.__$$text ?? ""
                : ""
            }
            onChange={(newValue) =>
              bpmnEditorStoreApi.setState((s) => {
                const { process } = addOrGetProcessAndDiagramElements({
                  definitions: s.bpmn.model.definitions,
                });

                visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                  if (e["@_id"] === userTask?.["@_id"] && e.__$$element === userTask.__$$element) {
                    e.resourceRole ??= [];
                    e.resourceRole[0] ??= {
                      "@_id": generateUuid(),
                      __$$element: "potentialOwner",
                    };
                    e.resourceRole[0].resourceAssignmentExpression ??= {
                      "@_id": generateUuid(),
                      expression: {
                        "@_id": generateUuid(),
                        __$$element: "formalExpression",
                      },
                    };
                    e.resourceRole[0].resourceAssignmentExpression.expression.__$$text = newValue;
                  }
                });
              })
            }
            placeholder={"Enter Actors..."}
          />
        </FormGroup>

        <FormGroup label={"Groups"}>
          <TextInput
            aria-label={"Groups"}
            type={"text"}
            isDisabled={settings.isReadOnly}
            value={setValue(groupIdInputX)}
            onChange={(newGroups) => handleChange("GroupId", newGroups)}
            placeholder={"Enter groups..."}
          />
        </FormGroup>

        <FormGroup label={"Created by"}>
          <TextInput
            aria-label={"Created by"}
            type={"text"}
            isDisabled={settings.isReadOnly}
            value={setValue(createdByInputX)}
            onChange={(newCreatedBy) => handleChange("CreatedBy", newCreatedBy)}
            placeholder={"Enter creator..."}
          />
        </FormGroup>

        <Divider inset={{ default: "insetXs" }} />

        <SlaDueDateInput element={userTask} />
        <AsyncCheckbox element={userTask} />
        <AdhocAutostartCheckbox element={userTask} />

        <Divider inset={{ default: "insetXs" }} />

        <MultiInstanceCheckbox element={userTask} />
        {userTask.loopCharacteristics?.__$$element === "multiInstanceLoopCharacteristics" && (
          <MultiInstanceProperties element={userTask} />
        )}
      </PropertiesPanelHeaderFormSection>

      <BidirectionalDataMappingFormSection element={userTask} />

      <ReassignmentsFormSection element={userTask} />

      <NotificationsFormSection element={userTask} />

      <OnEntryAndExitScriptsFormSection element={userTask} />
    </>
  );
}
