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
import { FormSection } from "@patternfly/react-core/dist/js/components/Form";
import { SectionHeader } from "@kie-tools/xyflow-react-kie-diagram/dist/propertiesPanel/SectionHeader";
import { Button, ButtonVariant } from "@patternfly/react-core/dist/js/components/Button";
import { EditIcon } from "@patternfly/react-icons/dist/js/icons/edit-icon";
import { useMemo, useState } from "react";
import {
  BPMN20__tDataInputAssociation,
  BPMN20__tDataOutputAssociation,
  BPMN20__tProcess,
  BPMN20__tUserTask,
} from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { Modal, ModalVariant } from "@patternfly/react-core/dist/js/components/Modal/Modal";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";
import "./ReassignmentsFormSection.css";
import { EmptyState, EmptyStateBody } from "@patternfly/react-core/dist/js/components/EmptyState";
import { Title } from "@patternfly/react-core/dist/js/components/Title";
import { Bullseye } from "@patternfly/react-core/dist/js/layouts/Bullseye";
import { Grid, GridItem } from "@patternfly/react-core/dist/js/layouts/Grid";
import { TimesIcon } from "@patternfly/react-icons/dist/js/icons/times-icon";
import { EyeIcon } from "@patternfly/react-icons/dist/js/icons/eye-icon";
import { addOrGetProcessAndDiagramElements } from "../../mutations/addOrGetProcessAndDiagramElements";
import { PlusCircleIcon } from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import { visitFlowElementsAndArtifacts } from "../../mutations/_elementVisitor";
import { Normalized } from "../../normalization/normalize";
import { Divider } from "@patternfly/react-core/dist/js/components/Divider";
import { setBpmn20Drools10MetaData } from "@kie-tools/bpmn-marshaller/dist/drools-extension-metaData";
import { TextArea } from "@patternfly/react-core/dist/js/components/TextArea/TextArea";

export type WithReassignments = Normalized<BPMN20__tUserTask> & { __$$element: "userTask" };

export function ReassignmentsFormSection({
  sectionLabel,
  children,
}: React.PropsWithChildren<{ sectionLabel: string }>) {
  const isReadOnly = useBpmnEditorStore((s) => s.settings.isReadOnly);

  const [showReassignmentsModal, setShowReassignmentsModal] = useState(false);

  return (
    <>
      <FormSection
        title={
          <SectionHeader
            expands={"modal"}
            icon={<div style={{ marginLeft: "12px", width: "16px", height: "36px", lineHeight: "36px" }}>{"⇆"}</div>}
            title={"Reassignments" + sectionLabel}
            toogleSectionExpanded={() => setShowReassignmentsModal(true)}
            action={
              <Button
                title={"Manage"}
                variant={ButtonVariant.plain}
                onClick={() => setShowReassignmentsModal(true)}
                // style={{ paddingBottom: 0, paddingTop: 0 }}
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
        {children}
      </Modal>
    </>
  );
}

export function BidirectionalReassignmentsFormSection({ element }: { element: WithReassignments }) {
  const inputCount = element.dataInputAssociation?.length ?? 0;
  const outputCount = element.dataOutputAssociation?.length ?? 0;
  const sectionLabel = useMemo(() => {
    if (inputCount > 0 && outputCount > 0) {
      return ` (in: ${inputCount}, out: ${outputCount})`;
    } else if (inputCount > 0) {
      return ` (in: ${inputCount}, out: -)`;
    } else if (outputCount > 0) {
      return ` (in: -, out: ${outputCount})`;
    } else {
      return "";
    }
  }, [inputCount, outputCount]);

  return (
    <ReassignmentsFormSection sectionLabel={sectionLabel}>
      <div className="kie-bpmn-editor--reassignments--modal-section" style={{ height: "50%" }}>
        <ReassignmentList userTask={element} />
      </div>
      <div className="kie-bpmn-editor--reassignments--modal-section" style={{ height: "50%" }}>
        <ReassignmentList userTask={element} />
      </div>
    </ReassignmentsFormSection>
  );
}

export function ReassignmentList({
  userTask,
}: {
  userTask: Normalized<BPMN20__tUserTask> & { __$$element: "userTask" };
}) {
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

  const isReadOnly = useBpmnEditorStore((s) => s.settings.isReadOnly);
  const handleChange = (fieldName: string, newValue: string | boolean) => {
    const valueAsString = String(newValue);
    bpmnEditorStoreApi.setState((s) => {
      const { process } = addOrGetProcessAndDiagramElements({
        definitions: s.bpmn.model.definitions,
      });

      visitFlowElementsAndArtifacts(process, ({ element: e }) => {
        if (e["@_id"] === userTask?.["@_id"] && e.__$$element === userTask.__$$element) {
          setBpmn20Drools10MetaData(e, "elementname", e["@_name"] || "");
          if ("ioSpecification" in e) {
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
          }
          if ("dataInputAssociation" in e) {
            let dataInputAssociation = e.dataInputAssociation?.find(
              (association) => association.targetRef.__$$text === `${e["@_id"]}_${fieldName}InputX`
            );

            if (!dataInputAssociation) {
              dataInputAssociation = {
                "@_id": `${e["@_id"]}_dataInputAssociation_${fieldName}`,
                targetRef: { __$$text: `${e["@_id"]}_${fieldName}InputX` },
                assignment: [
                  {
                    "@_id": `${e["@_id"]}_reassignment_${fieldName}`,
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

  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(undefined);
  const { title, associationsPropName, lastColumnLabel, entryTitle } = useMemo(() => {
    return {
      title: "Outputs",
      entryTitle: "Output",
      associationsPropName: "dataOutputAssociation",
      lastColumnLabel: "Target",
    } as const;
  }, []);

  const count = userTask[associationsPropName]?.length ?? 0;

  const addAtEnd = React.useCallback(() => {
    bpmnEditorStoreApi.setState((s) => {
      const { process } = addOrGetProcessAndDiagramElements({ definitions: s.bpmn.model.definitions });
      visitFlowElementsAndArtifacts(process, ({ element: e }) => {
        if (e["@_id"] === userTask["@_id"] && e.__$$element === userTask.__$$element) {
          (e as typeof userTask)[associationsPropName] ??= [];
          (e as typeof userTask)[associationsPropName]?.push({
            "@_id": generateUuid(),
            targetRef: { __$$text: "" },
          });
        }
      });
    });
  }, [associationsPropName, bpmnEditorStoreApi, userTask]);

  const addButton = useMemo(
    () => (
      <Button variant={ButtonVariant.plain} style={{ paddingLeft: 0 }} onClick={addAtEnd}>
        <PlusCircleIcon color="var(--pf-c-button--m-primary--BackgroundColor)" />
      </Button>
    ),
    [addAtEnd]
  );

  const entryStyle = {
    padding: "4px",
    margin: "8px",
    width: "calc(100% - 2 * 4px - 2 * 8px)",
  };

  const titleComponent = useMemo(() => <Title headingLevel="h2">{title}</Title>, [title]);

  return (
    <>
      {(count > 0 && (
        <>
          <div style={{ position: "sticky", top: "0", backdropFilter: "blur(8px)" }}>
            {titleComponent}
            <Divider style={{ margin: "8px 0" }} inset={{ default: "insetMd" }} />
            <div style={{ padding: "0 8px" }}>
              <Grid md={6} style={{ alignItems: "center" }}>
                <GridItem span={5}>
                  <div style={entryStyle}>
                    <b>Name</b>
                  </div>
                </GridItem>
                <GridItem span={3}>
                  <div style={entryStyle}>
                    <b>Data Type</b>
                  </div>
                </GridItem>
                <GridItem span={3}>
                  <div style={entryStyle}>
                    <b>{lastColumnLabel}</b>
                  </div>
                </GridItem>
                <GridItem span={1}>
                  <div style={{ textAlign: "right" }}>{!isReadOnly && addButton}</div>
                </GridItem>
              </Grid>
            </div>
          </div>
          {userTask[associationsPropName]?.map((entry, i) => (
            <div key={i} style={{ padding: "0 8px" }}>
              <Grid
                md={6}
                className={"kie-bpmn-editor--properties-panel--reassignment-entry"}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(undefined)}
              >
                <GridItem span={5}>
                  <TextArea
                    autoFocus={true}
                    style={entryStyle}
                    type="text"
                    placeholder="Name..."
                    value={setValue("nameInputX")}
                    onChange={(newName) => handleChange("name", newName)}
                  />
                </GridItem>
                <GridItem span={3}>
                  <TextArea
                    style={entryStyle}
                    type="text"
                    placeholder="Data Type..."
                    value={setValue("DataTypeX")}
                    onChange={(newDataType) => handleChange("DataType", newDataType)}
                  />
                </GridItem>
                <GridItem span={3}>
                  <TextArea
                    style={entryStyle}
                    type="text"
                    placeholder={`${lastColumnLabel}...`}
                    value={setValue("inputSourceX")}
                    onChange={(newInputSource) => handleChange("InputSource", newInputSource)}
                  />
                </GridItem>
                <GridItem span={1} style={{ textAlign: "right" }}>
                  {hoveredIndex === i && (
                    <Button
                      tabIndex={9999} // Prevent tab from going to this button
                      variant={ButtonVariant.plain}
                      style={{ paddingLeft: 0 }}
                      onClick={() => {
                        bpmnEditorStoreApi.setState((s) => {
                          const { process } = addOrGetProcessAndDiagramElements({
                            definitions: s.bpmn.model.definitions,
                          });
                          visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                            if (e["@_id"] === userTask["@_id"] && e.__$$element === userTask.__$$element) {
                              (e as typeof userTask)[associationsPropName]?.splice(i, 1);
                            }
                          });
                        });
                      }}
                    >
                      <TimesIcon />
                    </Button>
                  )}
                </GridItem>
              </Grid>
            </div>
          ))}
        </>
      )) || (
        <>
          {titleComponent}
          <div className={"kie-bpmn-editor--reassignments--empty-state"}>
            <Bullseye>
              <EmptyState>
                <Title headingLevel="h4">
                  {isReadOnly ? `No ${entryTitle} reassignments` : `No ${entryTitle} reassignments yet`}
                </Title>
                <EmptyStateBody style={{ padding: "0 25%" }}>
                  {`This represents an the empty state pattern in Patternfly 4. Hopefully it's simple enough to use but flexible.`}
                </EmptyStateBody>
                <Button variant="primary" onClick={addAtEnd}>
                  {`Add ${entryTitle} reassignment`}
                </Button>
              </EmptyState>
            </Bullseye>
          </div>
        </>
      )}
    </>
  );
}
