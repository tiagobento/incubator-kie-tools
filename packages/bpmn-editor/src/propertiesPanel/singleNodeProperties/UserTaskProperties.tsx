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

import { BPMN20__tDefinitions, BPMN20__tUserTask } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import * as React from "react";
import { Normalized } from "../../normalization/normalize";
import { NameDocumentationAndId } from "../nameDocumentationAndId/NameDocumentationAndId";
import { BidirectionalAssignmentsFormSection } from "../assignments/AssignmentsFormSection";
import { OnEntryAndExitScriptsFormSection } from "../onEntryAndExitScripts/OnEntryAndExitScriptsFormSection";
import { TaskIcon } from "../../diagram/nodes/NodeIcons";
import { PropertiesPanelHeaderFormSection } from "./_PropertiesPanelHeaderFormSection";
import { Divider } from "@patternfly/react-core/dist/js/components/Divider";
import { AsyncCheckbox } from "../asyncCheckbox/AsyncCheckbox";
import { SlaDueDateInput } from "../slaDueDate/SlaDueDateInput";
import { MultiInstanceCheckbox } from "../multiInstanceCheckbox/MultiInstanceCheckbox";
import { MultiInstanceProperties } from "../multiInstance/MultiInstanceProperties";
import { AdhocAutostartCheckbox } from "../adhocAutostartCheckbox/AdhocAutostartCheckbox";
import { FormGroup, FormSection } from "@patternfly/react-core/dist/js/components/Form";
import { TextArea } from "@patternfly/react-core/dist/js/components/TextArea/TextArea";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../../store/StoreContext";
import { Reassignments } from "../reassignments/Reassignments";
import { Notifications } from "../notifications/Notifications";

import { useState } from "react";
import { SectionHeader } from "@kie-tools/xyflow-react-kie-diagram/dist/propertiesPanel/SectionHeader";
import ExternalLinkAltIcon from "@patternfly/react-icons/dist/js/icons/external-link-alt-icon";
import { Button, ButtonVariant } from "@patternfly/react-core/dist/js/components/Button";
import EditIcon from "@patternfly/react-icons/dist/js/icons/edit-icon";
import { visitFlowElementsAndArtifacts } from "../../mutations/_elementVisitor";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";
import { addOrGetProcessAndDiagramElements } from "../../mutations/addOrGetProcessAndDiagramElements";
import { UserTaskStuff } from "../nameDocumentationAndId/UserTaskStuff";
import { Checkbox } from "@patternfly/react-core/dist/js/components/Checkbox/Checkbox";

export function UserTaskProperties({
  userTask,
}: {
  userTask: Normalized<BPMN20__tUserTask> & { __$$element: "userTask" };
}) {
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();
  const settings = useBpmnEditorStore((s) => s.settings);
  const [showReassignmentsModal, setShowReassignmentsModal] = useState(false);
  const closeReassignmentsModal = React.useCallback(() => {
    setShowReassignmentsModal(false);
  }, []);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const closeNotificationsModal = React.useCallback(() => {
    setShowNotificationsModal(false);
  }, []);

  return (
    <>
      <PropertiesPanelHeaderFormSection
        title={userTask["@_name"] || "User task"}
        icon={<TaskIcon variant={userTask.__$$element} isIcon={true} />}
      >
        <NameDocumentationAndId element={userTask} />

        <Divider inset={{ default: "insetXs" }} />

        <FormGroup label="Task">
          <TextArea
            aria-label={"Task Name"}
            type={"text"}
            isDisabled={settings.isReadOnly}
            value={userTask.taskName?.__$$text || ""}
            onChange={(newTaskName) =>
              bpmnEditorStoreApi.setState((s) => {
                const { process } = addOrGetProcessAndDiagramElements({
                  definitions: s.bpmn.model.definitions,
                });
                visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                  if (e["@_id"] === userTask["@_id"] && e.__$$element === userTask.__$$element) {
                    e.taskName = { __$$text: newTaskName };
                  }
                });
              })
            }
            placeholder={"Enter task name..."}
            style={{ resize: "vertical", minHeight: "40px" }}
            rows={1}
          />
        </FormGroup>
        <FormGroup label="Subject">
          <TextArea
            aria-label={"Subject"}
            type={"text"}
            isDisabled={settings.isReadOnly}
            value={userTask.dataInputAssociation?.[0].assignment?.[0].from?.__$$text ?? ""}
            onChange={(newsubject) =>
              bpmnEditorStoreApi.setState((s) => {
                const { process } = addOrGetProcessAndDiagramElements({
                  definitions: s.bpmn.model.definitions,
                });
                visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                  if (e["@_id"] === userTask["@_id"] && e.__$$element === userTask.__$$element) {
                    //  newsubject = e.dataInputAssociation?.[0].targetRef?.[0].from?.__$$text ?? '';
                  }
                });
              })
            }
            placeholder={"Enter subject..."}
            style={{ resize: "vertical", minHeight: "40px" }}
            rows={1}
          />
        </FormGroup>
        <FormGroup label="Content">
          <TextArea
            aria-label={"Content"}
            type={"text"}
            isDisabled={settings.isReadOnly}
            value={userTask.dataInputAssociation?.[0].assignment?.[0].from.__$$text}
            onChange={(newContent) =>
              bpmnEditorStoreApi.setState((s) => {
                const { process } = addOrGetProcessAndDiagramElements({
                  definitions: s.bpmn.model.definitions,
                });
                visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                  if (
                    e["@_id"] === userTask["@_id"] &&
                    e.__$$element === userTask.__$$element &&
                    e.dataInputAssociation !== undefined
                  ) {
                    if (e.dataInputAssociation[0].assignment?.[0] !== undefined) {
                      e.dataInputAssociation[0].targetRef = { __$$text: `${e["@_id"]}_ContentInputX` };
                      e.dataInputAssociation[0].assignment[0].from.__$$text = `![CDATA[${newContent}]]`;
                      e.dataInputAssociation[0].assignment[0].to.__$$text = `![CDATA[${e["@_id"]}_ContentInputX]]`;
                    }
                  }
                });
              })
            }
            placeholder={"Enter task name..."}
            style={{ resize: "vertical", minHeight: "40px" }}
            rows={3}
          />
        </FormGroup>
        <FormGroup label="Priority">
          <TextArea
            aria-label={"Task Name"}
            type={"text"}
            isDisabled={settings.isReadOnly}
            value={userTask.priority?.__$$text || ""}
            onChange={(newpriority) =>
              bpmnEditorStoreApi.setState((s) => {
                const { process } = addOrGetProcessAndDiagramElements({
                  definitions: s.bpmn.model.definitions,
                });
                visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                  if (e["@_id"] === userTask["@_id"] && e.__$$element === userTask.__$$element) {
                    e.priority = { __$$text: newpriority };
                  }
                });
              })
            }
            placeholder={"Enter priority..."}
            style={{ resize: "vertical", minHeight: "40px" }}
            rows={1}
          />
        </FormGroup>
        <FormGroup label="Description">
          <TextArea
            aria-label={"Task Name"}
            type={"text"}
            isDisabled={settings.isReadOnly}
            value={userTask["@_description"]}
            onChange={(newDescription) =>
              bpmnEditorStoreApi.setState((s) => {
                const { process } = addOrGetProcessAndDiagramElements({
                  definitions: s.bpmn.model.definitions,
                });
                visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                  if (e["@_id"] === userTask["@_id"] && e.__$$element === userTask.__$$element) {
                    e["@_description"] = newDescription;
                  }
                });
              })
            }
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
            isChecked={userTask["@_skippable"]}
            onChange={(checked) =>
              bpmnEditorStoreApi.setState((s) => {
                const { process } = addOrGetProcessAndDiagramElements({
                  definitions: s.bpmn.model.definitions,
                });
                visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                  if (e["@_id"] === userTask["@_id"] && e.__$$element === userTask.__$$element) {
                    e["@_skippable"] = checked;
                  }
                });
              })
            }
          />
        </FormGroup>

        <Divider inset={{ default: "insetXs" }} />

        <FormGroup label={"Actors"}></FormGroup>
        <FormGroup label={"Groups"}></FormGroup>
        <FormGroup label={"Created by"}></FormGroup>

        <Divider inset={{ default: "insetXs" }} />

        <Reassignments isOpen={showReassignmentsModal} onClose={closeReassignmentsModal} />
        <FormSection
          title={
            <SectionHeader
              expands={"modal"}
              icon={<ExternalLinkAltIcon width={16} height={36} style={{ marginLeft: "12px" }} />}
              title={"Reassignments"}
              toogleSectionExpanded={() => setShowReassignmentsModal(true)}
              action={
                <Button
                  title={"Manage"}
                  variant={ButtonVariant.plain}
                  isDisabled={settings.isReadOnly}
                  onClick={() => setShowReassignmentsModal(true)}
                  style={{ paddingBottom: 0, paddingTop: 0 }}
                >
                  <EditIcon />
                </Button>
              }
            />
          }
        />
        <Notifications isOpen={showNotificationsModal} onClose={closeNotificationsModal} />
        <FormSection
          title={
            <SectionHeader
              expands={"modal"}
              icon={<ExternalLinkAltIcon width={16} height={36} style={{ marginLeft: "12px" }} />}
              title={"Notifications"}
              toogleSectionExpanded={() => setShowNotificationsModal(true)}
              action={
                <Button
                  title={"Manage"}
                  variant={ButtonVariant.plain}
                  isDisabled={settings.isReadOnly}
                  onClick={() => setShowNotificationsModal(true)}
                  style={{ paddingBottom: 0, paddingTop: 0 }}
                >
                  <EditIcon />
                </Button>
              }
            />
          }
        />
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

      <BidirectionalAssignmentsFormSection element={userTask} />

      <OnEntryAndExitScriptsFormSection element={userTask} />
    </>
  );
}
