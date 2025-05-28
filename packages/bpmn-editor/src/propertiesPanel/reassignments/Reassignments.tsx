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
import { useState, useMemo, useEffect, useCallback } from "react";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../../store/StoreContext";
import { Button, ButtonVariant } from "@patternfly/react-core/dist/js/components/Button/Button";
import { Modal, ModalVariant } from "@patternfly/react-core/dist/js/components/Modal";
import { Grid, GridItem } from "@patternfly/react-core/dist/js/layouts/Grid";
import { PlusCircleIcon } from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import { TimesIcon } from "@patternfly/react-icons/dist/js/icons/times-icon";
import { Bullseye } from "@patternfly/react-core/dist/js/layouts/Bullseye";
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateIcon,
} from "@patternfly/react-core/dist/js/components/EmptyState";
import { Title } from "@patternfly/react-core/dist/js/components/Title";
import { visitFlowElementsAndArtifacts } from "../../mutations/_elementVisitor";
import { setBpmn20Drools10MetaData } from "@kie-tools/bpmn-marshaller/dist/drools-extension-metaData";
import { addOrGetProcessAndDiagramElements } from "../../mutations/addOrGetProcessAndDiagramElements";
import { BPMN20__tUserTask } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { Normalized } from "../../normalization/normalize";
import { FormSelect } from "@patternfly/react-core/dist/js/components/FormSelect/FormSelect";
import { FormSelectOption } from "@patternfly/react-core/dist/js/components/FormSelect/FormSelectOption";
import { CubesIcon } from "@patternfly/react-icons/dist/js/icons/cubes-icon";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";
import { Form } from "@patternfly/react-core/dist/js/components/Form/Form";
import { Alert } from "@patternfly/react-core/dist/js/components/Alert/Alert";
import { EyeIcon } from "@patternfly/react-icons/dist/js/icons/eye-icon";
import { EditIcon } from "@patternfly/react-icons/dist/js/icons/edit-icon";
import { SectionHeader } from "@kie-tools/xyflow-react-kie-diagram/dist/propertiesPanel/SectionHeader";
import { FormSection } from "@patternfly/react-core/dist/js/components/Form/FormSection";
import { RedoIcon } from "@patternfly/react-icons/dist/js/icons/redo-icon";
import { TextInput } from "@patternfly/react-core/dist/js/components/TextInput";
import { USER_TASK_IO_SPECIFICATION_DATA_INPUTS_CONSTANTS_FOR_DMN_BINDING } from "@kie-tools/bpmn-marshaller/dist/drools-extension";
import "./Reassignments.css";

type Reassignment = {
  users: string;
  groups: string;
  type: string;
  period: number;
  periodUnit: string;
};

const typeOptions = [
  {
    value: USER_TASK_IO_SPECIFICATION_DATA_INPUTS_CONSTANTS_FOR_DMN_BINDING.NOT_STARTED_REASSIGN,
    label: "Not Started",
  },
  {
    value: USER_TASK_IO_SPECIFICATION_DATA_INPUTS_CONSTANTS_FOR_DMN_BINDING.NOT_COMPLETED_REASSIGN,
    label: "Not Completed",
  },
];

const periodUnits = [
  { value: "m", label: "minutes" },
  { value: "h", label: "hours" },
  { value: "d", label: "days" },
  { value: "M", label: "months" },
  { value: "y", label: "years" },
];

const entryStyle = {
  padding: "4px",
  margin: "8px",
  width: "calc(100% - 2 * 4px - 2 * 8px)",
};

export function ReassignmentsFormSection({
  element,
}: {
  element: Normalized<BPMN20__tUserTask> & { __$$element: "userTask" };
}) {
  const isReadOnly = useBpmnEditorStore((s) => s.settings.isReadOnly);
  const [showReassignmentsModal, setShowReassignmentsModal] = useState(false);

  const count = useMemo(() => {
    return (
      element?.dataInputAssociation
        ?.filter(
          (dataInputAssociation) =>
            dataInputAssociation.targetRef?.__$$text.includes(
              USER_TASK_IO_SPECIFICATION_DATA_INPUTS_CONSTANTS_FOR_DMN_BINDING.NOT_STARTED_REASSIGN
            ) ||
            dataInputAssociation.targetRef?.__$$text.includes(
              USER_TASK_IO_SPECIFICATION_DATA_INPUTS_CONSTANTS_FOR_DMN_BINDING.NOT_COMPLETED_REASSIGN
            )
        )
        ?.reduce((acc, association) => {
          const assignment = association.assignment?.[0];
          if (!assignment) {
            return acc;
          }
          const reassignmentText = assignment.from.__$$text || "";
          const periodMatches = [...reassignmentText.matchAll(/(\d+)([mhdMy])/g)];
          return acc + periodMatches.length;
        }, 0) || 0
    );
  }, [element?.dataInputAssociation]);

  const sectionLabel = useMemo(() => {
    if (count > 0) {
      return ` (${count})`;
    } else {
      return "";
    }
  }, [count]);

  return (
    <>
      <FormSection
        title={
          <SectionHeader
            expands={"modal"}
            icon={<RedoIcon width={16} height={36} style={{ marginLeft: "12px" }} />}
            title={"Reassignments" + sectionLabel}
            toogleSectionExpanded={() => setShowReassignmentsModal(true)}
            action={
              <Button
                title={"Manage"}
                variant={ButtonVariant.plain}
                isDisabled={isReadOnly}
                onClick={() => setShowReassignmentsModal(true)}
                style={{ paddingBottom: 0, paddingTop: 0 }}
              >
                {isReadOnly ? <EyeIcon /> : <EditIcon />}
              </Button>
            }
          />
        }
      />
      <Modal
        title="Reassignments"
        className={"kie-bpmn-editor--reassignments--modal"}
        aria-labelledby={"Reassignments"}
        variant={ModalVariant.large}
        isOpen={showReassignmentsModal}
        onClose={() => setShowReassignmentsModal(false)}
      >
        <div style={{ height: "100%" }}>
          <Reassignments element={element} />
        </div>
      </Modal>
    </>
  );
}

export function Reassignments({ element }: { element: Normalized<BPMN20__tUserTask> & { __$$element: "userTask" } }) {
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();
  const [reassignments, setReassignments] = useState<Reassignment[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(undefined);
  const [onSaveMessage, setOnSaveMessage] = useState<string | null>(null);

  const addReassignment = useCallback(() => {
    setReassignments([
      ...reassignments,
      {
        users: "",
        groups: "",
        type: USER_TASK_IO_SPECIFICATION_DATA_INPUTS_CONSTANTS_FOR_DMN_BINDING.NOT_STARTED_REASSIGN,
        period: 0,
        periodUnit: "m",
      },
    ]);
  }, [reassignments]);

  const removeReassignment = useCallback(
    (index: number) => {
      setReassignments(reassignments.filter((_, i) => i !== index));
    },
    [reassignments]
  );

  const handleInputChange = useCallback((index: number, propertyName: keyof Reassignment, value: string | number) => {
    setReassignments((prevReassignments) => {
      const updatedReassignments = [...prevReassignments];
      updatedReassignments[index] = { ...updatedReassignments[index], [propertyName]: value };
      return updatedReassignments;
    });
  }, []);

  //populates intermediary `reassignments` state from the model
  useEffect(() => {
    if (!element) {
      return;
    }
    const extractedReassignments = element?.dataInputAssociation
      ?.filter(
        (dataInputAssociation) =>
          dataInputAssociation.targetRef?.__$$text.includes(
            USER_TASK_IO_SPECIFICATION_DATA_INPUTS_CONSTANTS_FOR_DMN_BINDING.NOT_STARTED_REASSIGN
          ) ||
          dataInputAssociation.targetRef?.__$$text.includes(
            USER_TASK_IO_SPECIFICATION_DATA_INPUTS_CONSTANTS_FOR_DMN_BINDING.NOT_COMPLETED_REASSIGN
          )
      )
      ?.flatMap((association) => {
        const assignment = association.assignment?.[0];
        if (!assignment) {
          return [];
        }
        const reassignmentText = assignment.from.__$$text || "";
        const usersMatches = [...reassignmentText.matchAll(/users:([^|]*)/g)];
        const groupsMatches = [...reassignmentText.matchAll(/groups:([^\]]*)/g)];
        const periodMatches = [...reassignmentText.matchAll(/(\d+)([mhdMy])/g)];

        const users = usersMatches.map((match) => match[1]);
        const groups = groupsMatches.map((match) => match[1]);
        const periods = periodMatches.map((match) => parseInt(match[1]));
        const periodUnits = periodMatches.map((match) => match[2]);

        const reassignments = [];
        for (let i = 0; i < users.length; i++) {
          reassignments.push({
            users: users[i] || "",
            groups: groups[i] || "",
            type: association.targetRef.__$$text.includes(
              USER_TASK_IO_SPECIFICATION_DATA_INPUTS_CONSTANTS_FOR_DMN_BINDING.NOT_STARTED_REASSIGN
            )
              ? USER_TASK_IO_SPECIFICATION_DATA_INPUTS_CONSTANTS_FOR_DMN_BINDING.NOT_STARTED_REASSIGN
              : USER_TASK_IO_SPECIFICATION_DATA_INPUTS_CONSTANTS_FOR_DMN_BINDING.NOT_COMPLETED_REASSIGN,
            period: periods[i] || 0,
            periodUnit: periodUnits[i] || "m",
          });
        }
        return reassignments;
      });

    setReassignments(extractedReassignments || []);
  }, [element]);

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (!event.target.checkValidity()) {
        event.target.reportValidity();
        return;
      }
      bpmnEditorStoreApi.setState((s) => {
        const { process } = addOrGetProcessAndDiagramElements({
          definitions: s.bpmn.model.definitions,
        });
        visitFlowElementsAndArtifacts(process, ({ element: e }) => {
          if (e["@_id"] === element?.["@_id"] && e.__$$element === element.__$$element) {
            setBpmn20Drools10MetaData(e, "elementname", e["@_name"] || "");
            e.ioSpecification ??= {
              "@_id": generateUuid(),
              inputSet: [],
              outputSet: [],
              dataInput: [],
            };
            e.ioSpecification.dataInput ??= [];
            e.dataInputAssociation ??= [];

            e.ioSpecification.dataInput = e.ioSpecification.dataInput?.filter(
              (dataInput) =>
                !dataInput["@_name"]?.includes(
                  USER_TASK_IO_SPECIFICATION_DATA_INPUTS_CONSTANTS_FOR_DMN_BINDING.NOT_STARTED_REASSIGN
                ) &&
                !dataInput["@_name"]?.includes(
                  USER_TASK_IO_SPECIFICATION_DATA_INPUTS_CONSTANTS_FOR_DMN_BINDING.NOT_COMPLETED_REASSIGN
                )
            );
            if (e.ioSpecification?.inputSet?.[0]?.dataInputRefs) {
              e.ioSpecification.inputSet[0].dataInputRefs = e.ioSpecification.inputSet[0].dataInputRefs?.filter(
                (dataInputRefs) =>
                  !dataInputRefs.__$$text.includes(
                    USER_TASK_IO_SPECIFICATION_DATA_INPUTS_CONSTANTS_FOR_DMN_BINDING.NOT_STARTED_REASSIGN
                  ) &&
                  !dataInputRefs.__$$text?.includes(
                    USER_TASK_IO_SPECIFICATION_DATA_INPUTS_CONSTANTS_FOR_DMN_BINDING.NOT_COMPLETED_REASSIGN
                  )
              );
            }
            e.dataInputAssociation = e.dataInputAssociation?.filter(
              (dataInputAssociation) =>
                !dataInputAssociation.targetRef.__$$text.includes(
                  USER_TASK_IO_SPECIFICATION_DATA_INPUTS_CONSTANTS_FOR_DMN_BINDING.NOT_STARTED_REASSIGN
                ) &&
                !dataInputAssociation.targetRef.__$$text.includes(
                  USER_TASK_IO_SPECIFICATION_DATA_INPUTS_CONSTANTS_FOR_DMN_BINDING.NOT_COMPLETED_REASSIGN
                )
            );

            reassignments.forEach((reassignment) => {
              let dataInput = e?.ioSpecification?.dataInput?.find((input) => input["@_name"] === reassignment.type);
              if (!dataInput) {
                dataInput = {
                  "@_id": `${e["@_id"]}_${reassignment.type}InputX`,
                  "@_drools:dtype": "Object",
                  "@_itemSubjectRef": `_${e["@_id"]}_${reassignment.type}InputX`,
                  "@_name": reassignment.type,
                };
                e?.ioSpecification?.dataInput?.push(dataInput);
              }
              let inputSet = e.ioSpecification?.inputSet[0];
              if (!inputSet) {
                inputSet = {
                  "@_id": `${e["@_id"]}_${reassignment.type}InputX`,
                  dataInputRefs: [
                    {
                      __$$text: `${e["@_id"]}_${reassignment.type}InputX`,
                    },
                  ],
                };
                e.ioSpecification?.inputSet.push(inputSet);
              } else {
                e.ioSpecification?.inputSet[0].dataInputRefs?.push({
                  __$$text: `${e["@_id"]}_${reassignment.type}InputX`,
                });
              }
              let dataInputAssociation = e.dataInputAssociation?.find(
                (association) => association.targetRef.__$$text === dataInput["@_id"]
              );
              if (!dataInputAssociation) {
                dataInputAssociation = {
                  "@_id": `${e["@_id"]}_dataInputAssociation_${reassignment.type}`,
                  targetRef: { __$$text: dataInput["@_id"] },
                  assignment: [],
                };
                e.dataInputAssociation?.push(dataInputAssociation);
              }
              const existingAssignment = dataInputAssociation?.assignment?.find(
                (assignment) => assignment["@_id"] === `${e["@_id"]}_assignment_${reassignment.type}`
              );
              const newEntry = `users:${reassignment.users}|groups:${reassignment.groups}]@[${reassignment.period}${reassignment.periodUnit}`;
              if (existingAssignment) {
                const existingValues = new Set(existingAssignment?.from?.__$$text?.split(" "));
                const newValues = newEntry.split(" ");
                const uniqueValues = [...existingValues, ...newValues].join(" ");
                existingAssignment.from.__$$text = uniqueValues;
              } else {
                dataInputAssociation?.assignment?.push({
                  "@_id": `${e["@_id"]}_assignment_${reassignment.type}`,
                  from: {
                    "@_id": `${e["@_id"]}`,
                    __$$text: newEntry,
                  },
                  to: { "@_id": dataInput["@_id"], __$$text: dataInput["@_id"] },
                });
              }
            });
          }
        });
      });

      setOnSaveMessage("Reassignments saved successfully!");

      setTimeout(() => {
        setOnSaveMessage(null);
      }, 1500);
    },
    [bpmnEditorStoreApi, element, reassignments]
  );

  return (
    <>
      {onSaveMessage && (
        <div>
          <Alert variant="success" title={onSaveMessage} isInline />
        </div>
      )}
      {(reassignments.length > 0 && (
        <Form onSubmit={handleSubmit}>
          <Grid md={12} style={{ padding: "0 8px" }}>
            <GridItem span={3}>
              <div style={entryStyle}>
                <b>Users</b>
              </div>
            </GridItem>
            <GridItem span={3}>
              <div style={entryStyle}>
                <b>Groups</b>
              </div>
            </GridItem>
            <GridItem span={2}>
              <div style={entryStyle}>
                <b>Type</b>
              </div>
            </GridItem>
            <GridItem span={3}>
              <div style={entryStyle}>
                <b>Period</b>
              </div>
            </GridItem>
            <GridItem span={1} style={{ textAlign: "right" }}>
              <Button variant={ButtonVariant.plain} style={{ paddingLeft: 0 }} onClick={addReassignment}>
                <PlusCircleIcon color="var(--pf-c-button--m-primary--BackgroundColor)" />
              </Button>
            </GridItem>
          </Grid>
          {reassignments.map((entry, i) => (
            <div key={i} style={{ padding: "0 8px" }}>
              <Grid
                md={6}
                className={"kie-bpmn-editor--properties-panel--reassignment-entry"}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(undefined)}
              >
                <GridItem span={3}>
                  <TextInput
                    aria-label={"users"}
                    autoFocus={true}
                    style={entryStyle}
                    type="text"
                    placeholder="Users..."
                    value={entry.users}
                    onChange={(e, value) => handleInputChange(i, "users", value)}
                  />
                </GridItem>
                <GridItem span={3}>
                  <TextInput
                    aria-label={"groups"}
                    style={entryStyle}
                    type="text"
                    placeholder="Groups..."
                    value={entry.groups}
                    onChange={(e, value) => handleInputChange(i, "groups", value)}
                  />
                </GridItem>
                <GridItem span={2}>
                  <FormSelect
                    aria-label={"type"}
                    type={"text"}
                    value={entry.type}
                    onChange={(e, value) => handleInputChange(i, "type", value)}
                    style={entryStyle}
                  >
                    {typeOptions.map((option) => (
                      <FormSelectOption key={option.label} label={option.label} value={option.value} />
                    ))}
                  </FormSelect>
                </GridItem>
                <GridItem span={3}>
                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                    <input
                      aria-label={"period"}
                      style={entryStyle}
                      type="number"
                      required
                      placeholder="Enter value"
                      value={entry.period}
                      onChange={(e) => handleInputChange(i, "period", e.target.value)}
                    />
                    <FormSelect
                      aria-label={"period unit"}
                      type={"text"}
                      value={entry.periodUnit}
                      onChange={(e, value) => handleInputChange(i, "periodUnit", value)}
                      style={entryStyle}
                    >
                      {periodUnits.map((option) => (
                        <FormSelectOption key={option.label} label={option.label} value={option.value} />
                      ))}
                    </FormSelect>
                  </div>
                </GridItem>
                <GridItem span={1} style={{ textAlign: "right" }}>
                  {hoveredIndex === i && (
                    <Button
                      tabIndex={9999} // Prevent tab from going to this button
                      variant={ButtonVariant.plain}
                      style={{ paddingLeft: 0 }}
                      onClick={() => removeReassignment(i)}
                    >
                      <TimesIcon />
                    </Button>
                  )}
                </GridItem>
              </Grid>
            </div>
          ))}
          <Button
            type="submit"
            className="kie-bpmn-editor--properties-panel--reassignment-submit-save-button"
            onMouseUp={(e) => e.currentTarget.blur()}
          >
            Save
          </Button>
        </Form>
      )) || (
        <div className="kie-bpmn-editor--reassignments--empty-state">
          <Bullseye>
            <EmptyState>
              <EmptyStateIcon icon={CubesIcon} />
              <Title headingLevel="h4">No reassignments yet</Title>
              <EmptyStateBody>
                {"This represents the empty state for reassignments. You can add reassignments to get started."}
              </EmptyStateBody>
              <br />
              <EmptyStateActions>
                <Button variant="primary" onClick={addReassignment}>
                  Add reassignment
                </Button>
              </EmptyStateActions>
            </EmptyState>
          </Bullseye>
          <Button
            variant="primary"
            onClick={handleSubmit}
            className="kie-bpmn-editor--properties-panel--reassignment-submit-save-button"
            onMouseUp={(e) => e.currentTarget.blur()}
          >
            Save
          </Button>
        </div>
      )}
    </>
  );
}
