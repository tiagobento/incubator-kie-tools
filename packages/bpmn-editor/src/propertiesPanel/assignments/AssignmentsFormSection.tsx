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
} from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { Modal, ModalVariant } from "@patternfly/react-core/dist/js/components/Modal/Modal";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";
import "./AssignmentsFormSection.css";
import { EmptyState, EmptyStateIcon, EmptyStateBody } from "@patternfly/react-core/dist/js/components/EmptyState";
import { Title } from "@patternfly/react-core/dist/js/components/Title";
import { Bullseye } from "@patternfly/react-core/dist/js/layouts/Bullseye";
import { Grid, GridItem } from "@patternfly/react-core/dist/js/layouts/Grid";
import { CubesIcon } from "@patternfly/react-icons/dist/js/icons/cubes-icon";
import { TimesIcon } from "@patternfly/react-icons/dist/js/icons/times-icon";
import { EyeIcon } from "@patternfly/react-icons/dist/js/icons/eye-icon";
import { addOrGetProcessAndDiagramElements } from "../../mutations/addOrGetProcessAndDiagramElements";
import { PlusCircleIcon } from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import { visitFlowElementsAndArtifacts } from "../../mutations/_elementVisitor";
import { ElementFilter } from "@kie-tools/xml-parser-ts/dist/elementFilter";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import { Normalized } from "../../normalization/normalize";
import { Divider } from "@patternfly/react-core/dist/js/components/Divider";

export type WithAssignments = Normalized<
  ElementFilter<
    Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>,
    "callActivity" | "businessRuleTask" | "userTask" | "serviceTask" | "scriptTask"
  >
>;

export type WithOutputAssignments = Normalized<
  ElementFilter<
    Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>,
    "startEvent" | "intermediateCatchEvent" | "boundaryEvent"
  >
>;

export type WithInputAssignments = Normalized<
  ElementFilter<Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>, "endEvent" | "intermediateThrowEvent">
>;

export function AssignmentsFormSection({ sectionLabel, children }: React.PropsWithChildren<{ sectionLabel: string }>) {
  const isReadOnly = useBpmnEditorStore((s) => s.settings.isReadOnly);

  const [showAssignmentsModal, setShowAssignmentsModal] = useState(false);

  return (
    <>
      <FormSection
        title={
          <SectionHeader
            expands={"modal"}
            icon={<div style={{ marginLeft: "12px", width: "16px", height: "36px", lineHeight: "36px" }}>{"⇆"}</div>}
            title={"Assignments" + sectionLabel}
            toogleSectionExpanded={() => setShowAssignmentsModal(true)}
            action={
              <Button
                title={"Manage"}
                variant={ButtonVariant.plain}
                onClick={() => setShowAssignmentsModal(true)}
                // style={{ paddingBottom: 0, paddingTop: 0 }}
              >
                {isReadOnly ? <EyeIcon /> : <EditIcon />}
              </Button>
            }
          />
        }
      />
      <Modal
        title="Assignments"
        className={"kie-bpmn-editor--assignments--modal"}
        aria-labelledby={"Assignments"}
        variant={ModalVariant.large}
        isOpen={showAssignmentsModal}
        onClose={() => setShowAssignmentsModal(false)}
      >
        {children}
      </Modal>
    </>
  );
}

export function BidirectionalAssignmentsFormSection({ element }: { element: WithAssignments }) {
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
    <AssignmentsFormSection sectionLabel={sectionLabel}>
      <div className="kie-bpmn-editor--assignments--modal-section" style={{ height: "50%" }}>
        <AssignmentList section={"input"} element={element} />
      </div>
      <div className="kie-bpmn-editor--assignments--modal-section" style={{ height: "50%" }}>
        <AssignmentList section={"output"} element={element} />
      </div>
    </AssignmentsFormSection>
  );
}

export function InputOnlyAssociationFormSection({ element }: { element: WithInputAssignments }) {
  const inputCount = element.dataInputAssociation?.length ?? 0;
  const sectionLabel = useMemo(() => {
    if (inputCount > 0) {
      return ` (in: ${inputCount})`;
    } else {
      return ` (in: -)`;
    }
  }, [inputCount]);

  return (
    <AssignmentsFormSection sectionLabel={sectionLabel}>
      <div className="kie-bpmn-editor--assignments--modal-section" style={{ height: "100%" }}>
        <AssignmentList section={"input"} element={element} />
      </div>
    </AssignmentsFormSection>
  );
}

export function OutputOnlyAssociationFormSection({ element }: { element: WithOutputAssignments }) {
  const outputCount = element.dataOutputAssociation?.length ?? 0;
  const sectionLabel = useMemo(() => {
    if (outputCount > 0) {
      return ` (out: ${outputCount})`;
    } else {
      return ` (out: -)`;
    }
  }, [outputCount]);

  return (
    <AssignmentsFormSection sectionLabel={sectionLabel}>
      <div className="kie-bpmn-editor--assignments--modal-section" style={{ height: "100%" }}>
        <AssignmentList section={"output"} element={element} />
      </div>
    </AssignmentsFormSection>
  );
}

export function AssignmentList({
  section,
  element,
}:
  | {
      section: "input";
      element: WithAssignments | (WithInputAssignments & { dataOutputAssociation?: BPMN20__tDataOutputAssociation[] });
    }
  | {
      section: "output";
      element: WithAssignments | (WithOutputAssignments & { dataInputAssociation?: BPMN20__tDataInputAssociation[] });
    }) {
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

  const isReadOnly = useBpmnEditorStore((s) => s.settings.isReadOnly);

  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(undefined);
  const { title, associationsPropName, lastColumnLabel, entryTitle } = useMemo(() => {
    if (section === "input") {
      return {
        title: "Inputs",
        entryTitle: "Input",
        associationsPropName: "dataInputAssociation",
        lastColumnLabel: "Source",
      } as const;
    } else {
      return {
        title: "Outputs",
        entryTitle: "Output",
        associationsPropName: "dataOutputAssociation",
        lastColumnLabel: "Target",
      } as const;
    }
  }, [section]);

  const count = element[associationsPropName]?.length ?? 0;

  const addAtEnd = React.useCallback(() => {
    bpmnEditorStoreApi.setState((s) => {
      const { process } = addOrGetProcessAndDiagramElements({ definitions: s.bpmn.model.definitions });
      visitFlowElementsAndArtifacts(process, ({ element: e }) => {
        if (e["@_id"] === element["@_id"] && e.__$$element === element.__$$element) {
          (e as typeof element)[associationsPropName] ??= [];
          (e as typeof element)[associationsPropName]?.push({
            "@_id": generateUuid(),
            targetRef: { __$$text: "" },
          });
        }
      });
    });
  }, [associationsPropName, bpmnEditorStoreApi, element]);

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
          {element[associationsPropName]?.map((entry, i) => (
            <div key={i} style={{ padding: "0 8px" }}>
              <Grid
                md={6}
                className={"kie-bpmn-editor--properties-panel--assignment-entry"}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(undefined)}
              >
                <GridItem span={5}>
                  <input
                    autoFocus={true}
                    style={entryStyle}
                    type="text"
                    placeholder="Name..."
                    value={element.dataInputAssociation?.[0].assignment?.[0].inputName?.[0]?.__$$text || ""}
                    onChange={(newInputName) =>
                      bpmnEditorStoreApi.setState((s) => {
                        const { process } = addOrGetProcessAndDiagramElements({
                          definitions: s.bpmn.model.definitions,
                        });
                        visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                          if (e["@_id"] === element["@_id"] && e.__$$element === element.__$$element) {
                            // e.inputName = newInputName;
                          }
                        });
                      })
                    }
                  />
                </GridItem>
                <GridItem span={3}>
                  <input
                    style={entryStyle}
                    type="text"
                    placeholder="Data Type..."
                    value={element.dataInputAssociation?.[0].assignment?.[0].inputDataType?.[0]?.__$$text || ""}
                    onChange={(e) =>
                      bpmnEditorStoreApi.setState((s) => {
                        const { process } = addOrGetProcessAndDiagramElements({
                          definitions: s.bpmn.model.definitions,
                        });
                      })
                    }
                  />
                </GridItem>
                <GridItem span={3}>
                  <input
                    style={entryStyle}
                    type="text"
                    placeholder={`${lastColumnLabel}...`}
                    value={element.dataInputAssociation?.[0].assignment?.[0].inputSource?.[0]?.__$$text || ""}
                    onChange={(e) =>
                      bpmnEditorStoreApi.setState((s) => {
                        const { process } = addOrGetProcessAndDiagramElements({
                          definitions: s.bpmn.model.definitions,
                        });
                      })
                    }
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
                            if (e["@_id"] === element["@_id"] && e.__$$element === element.__$$element) {
                              (e as typeof element)[associationsPropName]?.splice(i, 1);
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
          <div className={"kie-bpmn-editor--assignments--empty-state"}>
            <Bullseye>
              <EmptyState>
                <Title headingLevel="h4">
                  {isReadOnly ? `No ${entryTitle} assignments` : `No ${entryTitle} assignments yet`}
                </Title>
                <EmptyStateBody style={{ padding: "0 25%" }}>
                  {`This represents an the empty state pattern in Patternfly 4. Hopefully it's simple enough to use but flexible.`}
                </EmptyStateBody>
                <Button variant="primary" onClick={addAtEnd}>
                  {`Add ${entryTitle} assignment`}
                </Button>
              </EmptyState>
            </Bullseye>
          </div>
        </>
      )}
    </>
  );
}
