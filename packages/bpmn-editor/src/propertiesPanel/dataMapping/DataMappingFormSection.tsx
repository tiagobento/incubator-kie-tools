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
import { Form, FormSection } from "@patternfly/react-core/dist/js/components/Form";
import { SectionHeader } from "@kie-tools/xyflow-react-kie-diagram/dist/propertiesPanel/SectionHeader";
import { Button, ButtonVariant } from "@patternfly/react-core/dist/js/components/Button";
import { EditIcon } from "@patternfly/react-icons/dist/js/icons/edit-icon";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BPMN20__tDataInputAssociation,
  BPMN20__tDataOutputAssociation,
  BPMN20__tProcess,
} from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { Modal, ModalVariant } from "@patternfly/react-core/dist/js/components/Modal/Modal";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";
import { EmptyState, EmptyStateIcon, EmptyStateBody } from "@patternfly/react-core/dist/js/components/EmptyState";
import { Title } from "@patternfly/react-core/dist/js/components/Title";
import { Bullseye } from "@patternfly/react-core/dist/js/layouts/Bullseye";
import { Grid, GridItem } from "@patternfly/react-core/dist/js/layouts/Grid";
import { TimesIcon } from "@patternfly/react-icons/dist/js/icons/times-icon";
import { EyeIcon } from "@patternfly/react-icons/dist/js/icons/eye-icon";
import { addOrGetProcessAndDiagramElements } from "../../mutations/addOrGetProcessAndDiagramElements";
import { PlusCircleIcon } from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import { visitFlowElementsAndArtifacts } from "../../mutations/_elementVisitor";
import { ElementFilter } from "@kie-tools/xml-parser-ts/dist/elementFilter";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import { Normalized } from "../../normalization/normalize";
import { Divider } from "@patternfly/react-core/dist/js/components/Divider";
import { Alert } from "@patternfly/react-core/dist/js/components/Alert/Alert";
import { CubesIcon } from "@patternfly/react-icons/dist/js/icons/cubes-icon";
import { TextInput } from "@patternfly/react-core/dist/js/components/TextInput";
import { DATA_INPUT_RESERVED_NAMES } from "@kie-tools/bpmn-marshaller/dist/drools-extension";
import { ItemDefinitionRefSelector } from "../itemDefinitionRefSelector/ItemDefinitionRefSelector";
import "./DataMappingFormSection.css";

type WithDataMapping = Normalized<
  ElementFilter<
    Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>,
    "callActivity" | "businessRuleTask" | "userTask" | "serviceTask" | "scriptTask"
  >
>;

type WithOutputDataMapping = Normalized<
  ElementFilter<
    Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>,
    "startEvent" | "intermediateCatchEvent" | "boundaryEvent"
  >
>;

type WithInputDataMapping = Normalized<
  ElementFilter<Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>, "endEvent" | "intermediateThrowEvent">
>;

type DataMapping = {
  name: string;
  dtype: string;
  value: string;
};

const entryStyle = {
  padding: "4px",
  margin: "8px",
  width: "calc(100% - 2 * 4px - 2 * 8px)",
};

export function DataMappingFormSection({
  sectionLabel,
  children,
  onModalStateChange,
}: React.PropsWithChildren<{
  sectionLabel?: string;
  onModalStateChange?: (isOpen: boolean) => void;
}>) {
  const isReadOnly = useBpmnEditorStore((s) => s.settings.isReadOnly);
  const [showDataMappingModal, setShowDataMappingModal] = useState(false);
  useEffect(() => {
    onModalStateChange?.(showDataMappingModal);
  }, [showDataMappingModal, onModalStateChange]);

  return (
    <>
      <FormSection
        title={
          <SectionHeader
            expands={"modal"}
            icon={<div style={{ marginLeft: "12px", width: "16px", height: "36px", lineHeight: "36px" }}>{"⇆"}</div>}
            title={"Data mapping" + sectionLabel}
            toogleSectionExpanded={() => setShowDataMappingModal(true)}
            action={
              <Button
                title={"Manage"}
                variant={ButtonVariant.plain}
                onClick={() => setShowDataMappingModal(true)}
                style={{ paddingBottom: 0, paddingTop: 0 }}
              >
                {isReadOnly ? <EyeIcon /> : <EditIcon />}
              </Button>
            }
          />
        }
      />
      <Modal
        title="Data mapping"
        className={"kie-bpmn-editor--data-mappings--modal"}
        aria-labelledby={"Data mapping"}
        variant={ModalVariant.large}
        isOpen={showDataMappingModal}
        onClose={() => setShowDataMappingModal(false)}
      >
        {children}
      </Modal>
    </>
  );
}

export function BidirectionalDataMappingFormSection({ element }: { element: WithDataMapping }) {
  const [isDataMappingModalOpen, setDataMappingModalOpen] = useState(false);

  const inputCount = element?.ioSpecification?.dataInput?.filter(
    (dataInput) => !DATA_INPUT_RESERVED_NAMES.has(dataInput["@_name"]!)
  ).length;

  const outputCount = element?.ioSpecification?.dataOutput?.filter(
    (dataOutput) => !DATA_INPUT_RESERVED_NAMES.has(dataOutput["@_name"]!)
  ).length;

  const sectionLabel = useMemo(() => {
    if (inputCount && inputCount > 0 && outputCount && outputCount > 0) {
      return ` (in: ${inputCount}, out: ${outputCount})`;
    } else if (inputCount && inputCount > 0) {
      return ` (in: ${inputCount}, out: -)`;
    } else if (outputCount && outputCount > 0) {
      return ` (in: -, out: ${outputCount})`;
    } else {
      return "";
    }
  }, [inputCount, outputCount]);

  return (
    <DataMappingFormSection sectionLabel={sectionLabel} onModalStateChange={setDataMappingModalOpen}>
      <div className="kie-bpmn-editor--data-mappings--modal-section" style={{ height: "50%" }}>
        <DataMappingsList section={"input"} element={element} isOpen={isDataMappingModalOpen} />
      </div>
      <div className="kie-bpmn-editor--data-mappings--modal-section" style={{ height: "50%" }}>
        <DataMappingsList section={"output"} element={element} isOpen={isDataMappingModalOpen} />
      </div>
    </DataMappingFormSection>
  );
}

export function InputOnlyAssociationFormSection({ element }: { element: WithInputDataMapping }) {
  const inputCount = element.dataInputAssociation?.length ?? 0;
  const sectionLabel = useMemo(() => {
    if (inputCount > 0) {
      return ` (in: ${inputCount})`;
    } else {
      return ` (in: -)`;
    }
  }, [inputCount]);

  return (
    <DataMappingFormSection sectionLabel={sectionLabel}>
      <div className="kie-bpmn-editor--data-mappings--modal-section" style={{ height: "100%" }}>
        <DataMappingsList section={"input"} element={element} />
      </div>
    </DataMappingFormSection>
  );
}

export function OutputOnlyAssociationFormSection({ element }: { element: WithOutputDataMapping }) {
  const outputCount = element.dataOutputAssociation?.length ?? 0;
  const sectionLabel = useMemo(() => {
    if (outputCount > 0) {
      return ` (out: ${outputCount})`;
    } else {
      return ` (out: -)`;
    }
  }, [outputCount]);

  return (
    <DataMappingFormSection sectionLabel={sectionLabel}>
      <div className="kie-bpmn-editor--data-mappings--modal-section" style={{ height: "100%" }}>
        <DataMappingsList section={"output"} element={element} />
      </div>
    </DataMappingFormSection>
  );
}

export function DataMappingsList({
  isOpen,
  section,
  element,
}:
  | {
      isOpen?: boolean;
      section: "input";
      element: WithDataMapping | (WithInputDataMapping & { dataOutputAssociation?: BPMN20__tDataOutputAssociation[] });
    }
  | {
      isOpen?: boolean;
      section: "output";
      element: WithDataMapping | (WithOutputDataMapping & { dataInputAssociation?: BPMN20__tDataInputAssociation[] });
    }) {
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();
  const isReadOnly = bpmnEditorStoreApi((s) => s.settings.isReadOnly);

  const [inputDataMapping, setInputDataMapping] = useState<DataMapping[]>([]);
  const [outputDataMapping, setOutputDataMapping] = useState<DataMapping[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(undefined);
  const [onSaveMessage, setOnSaveMessage] = useState<string | null>(null);

  const handleInputChange = useCallback(
    (index: number, propertyName: keyof DataMapping, value: string | number) => {
      if (section === "input") {
        setInputDataMapping((prevInputDataMapping) => {
          const updatedInputDataMapping = [...prevInputDataMapping];
          updatedInputDataMapping[index] = { ...updatedInputDataMapping[index], [propertyName]: value };
          return updatedInputDataMapping;
        });
      } else {
        setOutputDataMapping((prevOutputDataMapping) => {
          const updatedOutputDataMapping = [...prevOutputDataMapping];
          updatedOutputDataMapping[index] = { ...updatedOutputDataMapping[index], [propertyName]: value };
          return updatedOutputDataMapping;
        });
      }
    },
    [section]
  );

  const itemDefinitionIdByDataTypes = useBpmnEditorStore(
    (s) =>
      new Map(
        s.bpmn.model.definitions.rootElement
          ?.filter((r) => r.__$$element === "itemDefinition")
          .map((i) => [i["@_structureRef"], i["@_id"]])
      )
  );

  const { title, lastColumnLabel, entryTitle } = useMemo(() => {
    if (section === "input") {
      return {
        title: "Inputs",
        entryTitle: "Input",
        lastColumnLabel: "Source",
      } as const;
    } else {
      return {
        title: "Outputs",
        entryTitle: "Output",
        lastColumnLabel: "Target",
      } as const;
    }
  }, [section]);

  const titleComponent = useMemo(() => <Title headingLevel="h2">{title}</Title>, [title]);

  const addDataMapping = useCallback(() => {
    if (section === "input") {
      setInputDataMapping([...inputDataMapping, { name: "", dtype: "", value: "" }]);
    } else {
      setOutputDataMapping([...outputDataMapping, { name: "", dtype: "", value: "" }]);
    }
  }, [inputDataMapping, outputDataMapping, section]);

  const removeDataMapping = useCallback(
    (index: number) => {
      if (section === "input") {
        setInputDataMapping(inputDataMapping.filter((_, i) => i !== index));
      } else {
        setOutputDataMapping(outputDataMapping.filter((_, i) => i !== index));
      }
    },
    [inputDataMapping, outputDataMapping, section]
  );

  // populates intermediary `assignments` state from the model
  useEffect(() => {
    if (isOpen || !element) {
      return;
    }

    // activities
    if (
      element.__$$element === "callActivity" ||
      element.__$$element === "businessRuleTask" ||
      element.__$$element === "userTask" ||
      element.__$$element === "serviceTask" ||
      element.__$$element === "scriptTask"
    ) {
      if (section === "input") {
        setInputDataMapping(
          element?.ioSpecification?.dataInput?.flatMap((dataInput) => {
            const assignment = element.dataInputAssociation?.find(
              (association) => association.targetRef?.__$$text === dataInput["@_id"]
            )?.assignment?.[0];

            return !assignment
              ? []
              : {
                  name: dataInput?.["@_name"] || "",
                  dtype: dataInput?.["@_drools:dtype"] || "",
                  value: assignment.from.__$$text || "",
                };
          }) || []
        );
      } else if (section === "output") {
        setOutputDataMapping(
          element?.dataOutputAssociation?.flatMap((association) => {
            const assignment = association.assignment?.[0];
            if (!assignment) {
              return [];
            }

            const dataOutput = element.ioSpecification?.dataOutput?.find(
              (output) => output["@_id"] === association.targetRef?.__$$text
            );

            return {
              name: dataOutput?.["@_name"] || "",
              dtype: dataOutput?.["@_drools:dtype"] || "",
              value: assignment.to.__$$text || "",
            };
          }) || []
        );
      }
    }

    // end/throw
    else if (element.__$$element === "endEvent" || element.__$$element === "intermediateThrowEvent") {
      setInputDataMapping(
        element?.dataInputAssociation?.flatMap((association) => {
          const assignment = association.assignment?.[0];
          if (!assignment) {
            return [];
          }

          const dataInput = element.dataInput?.find((input) => input["@_id"] === association.targetRef?.__$$text);
          return {
            name: dataInput?.["@_name"] || "",
            dtype: dataInput?.["@_drools:dtype"] || "",
            value: assignment.from.__$$text || "",
          };
        }) || []
      );
    }

    // start/catch/boundary
    else if (
      element.__$$element === "startEvent" ||
      element.__$$element === "intermediateCatchEvent" ||
      element.__$$element === "boundaryEvent"
    ) {
      setOutputDataMapping(
        element?.dataOutputAssociation?.flatMap((association) => {
          const assignment = association.assignment?.[0];
          if (!assignment) {
            return [];
          }

          const dataOutput = element.dataOutput?.find((output) => output["@_id"] === association.targetRef?.__$$text);
          return {
            name: dataOutput?.["@_name"] || "",
            dtype: dataOutput?.["@_drools:dtype"] || "",
            value: assignment.to.__$$text || "",
          };
        }) || []
      );
    }
  }, [element, isOpen, section]);

  const handleSubmitForNodesWithInputDataMapping = useCallback(
    (
      elementWithData: WithInputDataMapping | NonNullable<WithDataMapping["ioSpecification"]>,
      elementWithAssociation: WithInputDataMapping | WithDataMapping
    ) => {
      elementWithData.dataInput = [];
      elementWithAssociation.dataInputAssociation = [];

      inputDataMapping.forEach((dataMapping) => {
        const dataInput = {
          "@_id": generateUuid(),
          "@_drools:dtype": dataMapping.dtype,
          "@_itemSubjectRef": itemDefinitionIdByDataTypes.get(dataMapping.dtype),
          "@_name": dataMapping.name,
        };

        elementWithData.dataInput?.push(dataInput);

        elementWithAssociation.dataInputAssociation?.push({
          "@_id": generateUuid(),
          targetRef: { __$$text: dataInput["@_id"] },
          assignment: [
            {
              "@_id": generateUuid(),
              from: { "@_id": generateUuid(), __$$text: dataMapping.value },
              to: { "@_id": generateUuid(), __$$text: dataInput["@_id"] },
            },
          ],
        });
      });

      setOnSaveMessage("Input Data Mapping saved successfully!");
      setTimeout(() => {
        setOnSaveMessage(null);
      }, 1500);
    },
    [inputDataMapping, itemDefinitionIdByDataTypes]
  );

  const handleSubmitForNodesWithOutputDataMapping = useCallback(
    (
      elementWithData: WithOutputDataMapping | NonNullable<WithDataMapping["ioSpecification"]>,
      elementWithAssociation: WithOutputDataMapping | WithDataMapping
    ) => {
      elementWithData.dataOutput = [];
      elementWithAssociation.dataOutputAssociation = [];

      outputDataMapping.forEach((dataMapping) => {
        const dataOutput = {
          "@_id": generateUuid(),
          "@_drools:dtype": dataMapping.dtype,
          "@_itemSubjectRef": itemDefinitionIdByDataTypes.get(dataMapping.dtype),
          "@_name": dataMapping.name,
        };

        elementWithData.dataOutput?.push(dataOutput);

        elementWithAssociation.dataOutputAssociation?.push({
          "@_id": generateUuid(),
          targetRef: { __$$text: dataOutput["@_id"] },
          assignment: [
            {
              "@_id": generateUuid(),
              from: { "@_id": generateUuid(), __$$text: dataOutput["@_id"] },
              to: { "@_id": generateUuid(), __$$text: dataMapping.value },
            },
          ],
        });
      });

      setOnSaveMessage("Output Data Mapping saved successfully!");
      setTimeout(() => {
        setOnSaveMessage(null);
      }, 1500);
    },
    [itemDefinitionIdByDataTypes, outputDataMapping]
  );

  const handleSubmitForNodesWithInputAndOutputDataMapping = useCallback(
    (e: WithDataMapping) => {
      e.ioSpecification = {
        "@_id": generateUuid(),
        inputSet: [],
        outputSet: [],
        dataInput: [],
        dataOutput: [],
      };

      if (section === "input") {
        handleSubmitForNodesWithInputDataMapping(e.ioSpecification, e);

        e.ioSpecification!.inputSet[0] ??= {
          "@_id": generateUuid(),
          dataInputRefs: [],
        };

        for (let i = 0; i < (e.ioSpecification.dataInput ?? []).length; i++) {
          const dataInput = e.ioSpecification.dataInput![i];
          e.ioSpecification.inputSet[0].dataInputRefs!.push({ __$$text: dataInput["@_id"] });
        }

        setOnSaveMessage("Input Data Mapping saved successfully!");
        setTimeout(() => {
          setOnSaveMessage(null);
        }, 1500);
      } else if (section === "output") {
        handleSubmitForNodesWithOutputDataMapping(e.ioSpecification, e);

        e.ioSpecification!.outputSet[0] ??= {
          "@_id": generateUuid(),
          dataOutputRefs: [],
        };

        for (let i = 0; i < (e.ioSpecification.dataOutput ?? []).length; i++) {
          const dataOutput = e.ioSpecification.dataOutput![i];
          e.ioSpecification.outputSet[0].dataOutputRefs!.push({ __$$text: dataOutput["@_id"] });
        }

        setOnSaveMessage("Output Data Mapping saved successfully!");
        setTimeout(() => {
          setOnSaveMessage(null);
        }, 1500);
      }
    },
    [section, handleSubmitForNodesWithInputDataMapping, handleSubmitForNodesWithOutputDataMapping]
  );

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
            if (
              element.__$$element === "callActivity" ||
              element.__$$element === "businessRuleTask" ||
              element.__$$element === "userTask" ||
              element.__$$element === "serviceTask" ||
              element.__$$element === "scriptTask"
            ) {
              handleSubmitForNodesWithInputAndOutputDataMapping(e as WithDataMapping);
            } else if (element.__$$element === "endEvent" || element.__$$element === "intermediateThrowEvent") {
              handleSubmitForNodesWithInputDataMapping(e as WithInputDataMapping, e as WithInputDataMapping);
            } else if (
              element.__$$element === "startEvent" ||
              element.__$$element === "intermediateCatchEvent" ||
              element.__$$element === "boundaryEvent"
            ) {
              handleSubmitForNodesWithOutputDataMapping(e as WithOutputDataMapping, e as WithOutputDataMapping);
            }
          }
        });
      });
    },
    [
      bpmnEditorStoreApi,
      element,
      handleSubmitForNodesWithInputAndOutputDataMapping,
      handleSubmitForNodesWithInputDataMapping,
      handleSubmitForNodesWithOutputDataMapping,
    ]
  );

  return (
    <>
      {onSaveMessage && (
        <div>
          <Alert variant="success" title={onSaveMessage} isInline />
        </div>
      )}
      {((inputDataMapping.length > 0 || outputDataMapping.length > 0) && (
        <Form onSubmit={handleSubmit} style={{ gridRowGap: 0 }}>
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
                <GridItem span={1} style={{ textAlign: "right" }}>
                  <Button variant={ButtonVariant.plain} style={{ paddingLeft: 0 }} onClick={addDataMapping}>
                    <PlusCircleIcon color="var(--pf-c-button--m-primary--BackgroundColor)" />
                  </Button>
                </GridItem>
              </Grid>
            </div>
          </div>
          {section === "input" &&
            inputDataMapping.flatMap((entry, i) =>
              DATA_INPUT_RESERVED_NAMES.has(entry.name) ? (
                []
              ) : (
                <div key={i} style={{ padding: "0 8px" }}>
                  <Grid
                    md={6}
                    className={"kie-bpmn-editor--properties-panel--data-mapping-entry"}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(undefined)}
                  >
                    <GridItem span={5}>
                      <TextInput
                        aria-label={"name"}
                        autoFocus={true}
                        style={entryStyle}
                        type="text"
                        isRequired={true}
                        placeholder="Name..."
                        value={entry.name}
                        onChange={(e, value) => handleInputChange(i, "name", value)}
                      />
                    </GridItem>
                    <GridItem span={3}>
                      <ItemDefinitionRefSelector
                        value={itemDefinitionIdByDataTypes.get(entry.dtype) ?? entry.dtype}
                        onChange={(_, newDataType) => {
                          handleInputChange(i, "dtype", newDataType!);
                        }}
                      />
                    </GridItem>
                    <GridItem span={3}>
                      <TextInput
                        aria-label={"value"}
                        style={entryStyle}
                        type="text"
                        placeholder={`${lastColumnLabel}...`}
                        value={entry.value}
                        onChange={(e, value) => handleInputChange(i, "value", value)}
                      />
                    </GridItem>
                    <GridItem span={1} style={{ textAlign: "right" }}>
                      {hoveredIndex === i && (
                        <Button
                          tabIndex={9999} // Prevent tab from going to this button
                          variant={ButtonVariant.plain}
                          style={{ paddingLeft: 0 }}
                          onClick={() => removeDataMapping(i)}
                        >
                          <TimesIcon />
                        </Button>
                      )}
                    </GridItem>
                  </Grid>
                </div>
              )
            )}
          {section === "output" &&
            outputDataMapping.map((entry, i) => (
              <div key={i} style={{ padding: "0 8px" }}>
                <Grid
                  md={6}
                  className={"kie-bpmn-editor--properties-panel--data-mapping-entry"}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(undefined)}
                >
                  <GridItem span={5}>
                    <TextInput
                      aria-label={"name"}
                      autoFocus={true}
                      style={entryStyle}
                      type="text"
                      isRequired={true}
                      placeholder="Name..."
                      value={entry.name}
                      onChange={(e, value) => handleInputChange(i, "name", value)}
                    />
                  </GridItem>
                  <GridItem span={3}>
                    <ItemDefinitionRefSelector
                      value={itemDefinitionIdByDataTypes.get(entry.dtype) ?? entry.dtype}
                      onChange={(_, newDataType) => {
                        handleInputChange(i, "dtype", newDataType!);
                      }}
                    />
                  </GridItem>
                  <GridItem span={3}>
                    <TextInput
                      aria-label={"value"}
                      style={entryStyle}
                      type="text"
                      placeholder={`${lastColumnLabel}...`}
                      value={entry.value}
                      onChange={(e, value) => handleInputChange(i, "value", value)}
                    />
                  </GridItem>
                  <GridItem span={1} style={{ textAlign: "right" }}>
                    {hoveredIndex === i && (
                      <Button
                        tabIndex={9999} // Prevent tab from going to this button
                        variant={ButtonVariant.plain}
                        style={{ paddingLeft: 0 }}
                        onClick={() => removeDataMapping(i)}
                      >
                        <TimesIcon />
                      </Button>
                    )}
                  </GridItem>
                </Grid>
              </div>
            ))}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px", paddingRight: "8px" }}>
            <Button variant="primary" type="submit" isDisabled={isReadOnly} onMouseUp={(e) => e.currentTarget.blur()}>
              Save
            </Button>
          </div>
        </Form>
      )) || (
        <>
          {titleComponent}
          <div className={"kie-bpmn-editor--data-mappings--empty-state"}>
            <Bullseye>
              <EmptyState>
                <EmptyStateIcon icon={CubesIcon} />
                <Title headingLevel="h4">
                  {isReadOnly ? `No ${entryTitle} data mappings` : `No ${entryTitle} data mappings yet`}
                </Title>
                <EmptyStateBody style={{ padding: "0 25%" }}>
                  {"This represents the empty state for data mapping. You can add data mappings to get started."}
                </EmptyStateBody>
                <Button variant="primary" onClick={addDataMapping}>
                  {`Add ${entryTitle} data mapping`}
                </Button>
              </EmptyState>
            </Bullseye>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px", paddingRight: "8px" }}>
            <Button
              variant="primary"
              onClick={handleSubmit}
              isDisabled={isReadOnly}
              onMouseUp={(e) => e.currentTarget.blur()}
            >
              Save
            </Button>
          </div>
        </>
      )}
    </>
  );
}
