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
import { useEffect, useMemo, useState } from "react";
import {
  BPMN20__tDataInputAssociation,
  BPMN20__tDataOutputAssociation,
  BPMN20__tProcess,
  BPMN20__tUserTask,
} from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { Modal, ModalVariant } from "@patternfly/react-core/dist/js/components/Modal/Modal";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";
import "./AssignmentsFormSection.css";
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
import { setBpmn20Drools10MetaData } from "@kie-tools/bpmn-marshaller/dist/drools-extension-metaData";
import { TextArea } from "@patternfly/react-core/dist/js/components/TextArea/TextArea";
import { assign } from "lodash";
import { FormSelect } from "@patternfly/react-core/dist/js/components/FormSelect/FormSelect";
import { FormSelectOption } from "@patternfly/react-core/dist/js/components/FormSelect/FormSelectOption";

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

export const blacklistedNames = new Set([
  "TaskName",
  "NotStartedReassign",
  "NotCompletedReassign",
  "Skippable",
  "NotStartedNotify",
  "NotCompletedNotify",
]);

export function AssignmentsFormSection({
  sectionLabel,
  children,
}: React.PropsWithChildren<{
  sectionLabel?: string;
}>) {
  const isReadOnly = useBpmnEditorStore((s) => s.settings.isReadOnly);

  const [showAssignmentsModal, setShowAssignmentsModal] = useState(false);

  return (
    <>
      <FormSection
        title={
          <SectionHeader
            expands={"modal"}
            icon={<div style={{ marginLeft: "12px", width: "16px", height: "36px", lineHeight: "36px" }}>{"⇆"}</div>}
            title={
              "Assignments"
              // + sectionLabel
            }
            toogleSectionExpanded={() => setShowAssignmentsModal(true)}
            action={
              <Button
                title={"Manage"}
                variant={ButtonVariant.plain}
                onClick={() => setShowAssignmentsModal(true)}
                style={{ paddingBottom: 0, paddingTop: 0 }}
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
  // const inputCount = element.
  // const inputCount = element.dataInputAssociation?.length ?? 0;
  // const outputCount = element.dataOutputAssociation?.length ?? 0;
  // const sectionLabel = useMemo(() => {
  //   if (inputCount > 0 && outputCount > 0) {
  //     return ` (in: ${inputCount}, out: ${outputCount})`;
  //   } else if (inputCount > 0) {
  //     return ` (in: ${inputCount}, out: -)`;
  //   } else if (outputCount > 0) {
  //     return ` (in: -, out: ${outputCount})`;
  //   } else {
  //     return "";
  //   }
  // }, [inputCount, outputCount]);

  return (
    <AssignmentsFormSection
    // sectionLabel={sectionLabel}
    >
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
  // const inputCount = element.dataInput?.length ?? 0;
  const inputCount = element.dataInput
    ? element.dataInput.filter((input) => !blacklistedNames.has(input["@_name"] ?? "")).length
    : 0;

  // const inputCount = element.dataInputAssociation?.length ?? 0;
  // const sectionLabel = useMemo(() => {
  //   if (inputCount > 0) {
  //     return ` (in: ${inputCount})`;
  //   } else {
  //     return ` (in: -)`;
  //   }
  // }, [inputCount]);

  return (
    <AssignmentsFormSection
    // sectionLabel={sectionLabel}
    >
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
  const [inputAssignments, setInputAssignments] = useState<{ name: string; dataType: string; value: string }[]>([]);
  const [outputAssignments, setOutputAssignments] = useState<{ name: string; dataType: string; value: string }[]>([]);
  const isReadOnly = useBpmnEditorStore((s) => s.settings.isReadOnly);
  const dataType = [
    { value: "Custom", label: "Custom..." },
    { value: "Boolean", label: "Boolean" },
    { value: "Float", label: "Float" },
    { value: "Integer", label: "Integer" },
    { value: "Object", label: "Object" },
    { value: "String", label: "String" },
  ];
  const removeAssignment = (index: number) => {
    if (section === "input") {
      setInputAssignments(inputAssignments.filter((_, i) => i !== index));
    } else {
      setOutputAssignments(outputAssignments.filter((_, i) => i !== index));
    }
  };
  const handleInputChange = (index: number, field: string, value: string | number) => {
    if (section === "input") {
      setInputAssignments((prevInputAssignments) => {
        const updatedInputAssignments = [...prevInputAssignments];
        updatedInputAssignments[index] = { ...updatedInputAssignments[index], [field]: [value] };
        return updatedInputAssignments;
      });
    } else {
      setOutputAssignments((prevOutputAssignments) => {
        const updatedOutputAssignments = [...prevOutputAssignments];
        updatedOutputAssignments[index] = { ...updatedOutputAssignments[index], [field]: [value] };
        return updatedOutputAssignments;
      });
    }
  };
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

  // const count = element[associationsPropName]?.length ?? 0;

  useEffect(() => {
    if (element) {
      if (
        element.__$$element === "callActivity" ||
        element.__$$element === "businessRuleTask" ||
        element.__$$element === "userTask" ||
        element.__$$element === "serviceTask" ||
        element.__$$element === "scriptTask"
      ) {
        if (section === "input") {
          const extractedInputAssignments = element?.dataInputAssociation
            // ?.filter((association) => !association.targetRef?.__$$text.includes(blacklistedNames.toString()))
            ?.map((association) => {
              const assignment = association.assignment?.[0];
              if (assignment) {
                const value = assignment.from.__$$text || "";

                const dataInput = element.ioSpecification?.dataInput?.find(
                  (input) => input["@_id"] === association.targetRef?.__$$text
                );

                const name = dataInput?.["@_name"] || "";
                const dataType = dataInput?.["@_drools:dtype"] || "";

                return {
                  name: name,
                  dataType: dataType,
                  value: value,
                };
              }
            })
            .filter((item): item is { name: string; dataType: string; value: string } => item !== null);
          setInputAssignments(extractedInputAssignments || []);
        }
        if (section === "output") {
          const extractedOutputAssignments = element?.dataOutputAssociation
            ?.filter((association) => !association.targetRef?.__$$text.includes(blacklistedNames.toString()))
            ?.map((association) => {
              const assignment = association.assignment?.[0];
              if (assignment) {
                const value = assignment.to.__$$text || "";

                const dataOutput = element.ioSpecification?.dataOutput?.find(
                  (output) => output["@_id"] === association.targetRef?.__$$text
                );

                const name = dataOutput?.["@_name"] || "";
                const dataType = dataOutput?.["@_drools:dtype"] || "";

                return {
                  name: name,
                  dataType: dataType,
                  value: value,
                };
              }
            })
            .filter((item): item is { name: string; dataType: string; value: string } => item !== null);
          setOutputAssignments(extractedOutputAssignments || []);
        }
      } else if (element.__$$element === "endEvent" || element.__$$element === "intermediateThrowEvent") {
        const extractedInputAssignments = element?.dataInputAssociation
          // ?.filter((association) => !association.targetRef?.__$$text.includes(blacklistedNames.toString()))
          ?.map((association) => {
            const assignment = association.assignment?.[0];
            if (assignment) {
              const value = assignment.from.__$$text || "";

              const dataInput = element.dataInput?.find((input) => input["@_id"] === association.targetRef?.__$$text);

              const name = dataInput?.["@_name"] || "";
              const dataType = dataInput?.["@_drools:dtype"] || "";

              return {
                name: name,
                dataType: dataType,
                value: value,
              };
            }
          })
          .filter((item): item is { name: string; dataType: string; value: string } => item !== null);
        setInputAssignments(extractedInputAssignments || []);
      } else if (
        element.__$$element === "startEvent" ||
        element.__$$element === "intermediateCatchEvent" ||
        element.__$$element === "boundaryEvent"
      ) {
        const extractedOutputAssignments = element?.dataOutputAssociation
          // ?.filter((association) => !association.targetRef?.__$$text.includes(blacklistedNames.toString()))
          ?.map((association) => {
            const assignment = association.assignment?.[0];
            if (assignment) {
              const value = assignment.to.__$$text || "";

              const dataOutput = element.dataOutput?.find(
                (output) => output["@_id"] === association.targetRef?.__$$text
              );

              const name = dataOutput?.["@_name"] || "";
              const dataType = dataOutput?.["@_drools:dtype"] || "";

              return {
                name: name,
                dataType: dataType,
                value: value,
              };
            }
          })
          .filter((item): item is { name: string; dataType: string; value: string } => item !== null);

        setOutputAssignments(extractedOutputAssignments || []);
      }
    }
  }, [element, section]);

  const addAssignment = () => {
    if (section === "input") {
      setInputAssignments([...inputAssignments, { name: "", dataType: "", value: "" }]);
    } else {
      setOutputAssignments([...outputAssignments, { name: "", dataType: "", value: "" }]);
    }
  };

  const handleSubmit = () => {
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
            handleSubmitForWithAssignments(e as WithAssignments);
          } else if (element.__$$element === "endEvent" || element.__$$element === "intermediateThrowEvent") {
            handleSubmitForWithInputAssignments(e as WithInputAssignments);
          } else if (
            element.__$$element === "startEvent" ||
            element.__$$element === "intermediateCatchEvent" ||
            element.__$$element === "boundaryEvent"
          ) {
            handleSubmitForWithOutputAssignments(e as WithOutputAssignments);
          }
        }
      });
    });
  };

  const handleSubmitForWithAssignments = (e: WithAssignments) => {
    setBpmn20Drools10MetaData(e, "elementname", e["@_name"] || "");

    if (!e.ioSpecification) {
      e.ioSpecification = {
        "@_id": generateUuid(),
        inputSet: [],
        outputSet: [],
        dataInput: [],
        dataOutput: [],
      };
    }

    e.dataInputAssociation ??= [];
    e.dataOutputAssociation ??= [];
    console.log(section);
    if (section === "input") {
      inputAssignments.forEach((assignment, index) => {
        let dataInput = e.ioSpecification?.dataInput?.[index];
        dataInput = {
          "@_id": `${e["@_id"]}_${assignment.name}InputX`,
          "@_drools:dtype": assignment.dataType,
          "@_itemSubjectRef": `_${e["@_id"]}_${assignment.name}InputXItem`,
          "@_name": assignment.name,
        };
        e.ioSpecification?.dataInput?.push(dataInput);

        let dataInputAssociation = e.dataInputAssociation?.find(
          (association) => association.targetRef.__$$text === dataInput["@_id"]
        );

        if (!dataInputAssociation) {
          dataInputAssociation = {
            "@_id": `${e["@_id"]}_dataInputAssociation_${assignment.name}`,
            targetRef: { __$$text: dataInput["@_id"] },
            assignment: [],
          };
          e.dataInputAssociation?.push(dataInputAssociation);
        }
        dataInputAssociation.assignment = [
          {
            "@_id": `${e["@_id"]}_assignment_${assignment.name}`,
            from: { "@_id": `${e["@_id"]}`, __$$text: assignment.value },
            to: { "@_id": dataInput["@_id"], __$$text: dataInput["@_id"] },
          },
        ];
      });
    } else if (section === "output") {
      outputAssignments.forEach((assignment, index) => {
        let dataOutput = e.ioSpecification?.dataOutput?.[index];
        dataOutput = {
          "@_id": `${e["@_id"]}_${assignment.name}OutputX`,
          "@_drools:dtype": assignment.dataType,
          "@_itemSubjectRef": `_${e["@_id"]}_${assignment.name}OutputXItem`,
          "@_name": assignment.name,
        };
        e.ioSpecification?.dataOutput?.push(dataOutput);

        let dataOutputAssociation = e.dataOutputAssociation?.find(
          (association) => association.targetRef.__$$text === dataOutput["@_id"]
        );

        if (!dataOutputAssociation) {
          dataOutputAssociation = {
            "@_id": `${e["@_id"]}_dataOutputAssociation_${assignment.name}`,
            targetRef: { __$$text: dataOutput["@_id"] },
            assignment: [],
          };
          e.dataOutputAssociation?.push(dataOutputAssociation);
        }
        dataOutputAssociation.assignment = [
          {
            "@_id": `${e["@_id"]}_assignment_${assignment.name}`,
            from: { "@_id": dataOutput["@_id"], __$$text: dataOutput["@_id"] },
            to: { "@_id": `${e["@_id"]}`, __$$text: assignment.value },
          },
        ];
      });
    }
  };

  const handleSubmitForWithInputAssignments = (e: WithInputAssignments) => {
    e.dataInputAssociation ??= [];

    inputAssignments.forEach((assignment, index) => {
      let dataInput = e.dataInput?.[index];
      dataInput = {
        "@_id": `${e["@_id"]}_${assignment.name}InputX`,
        "@_drools:dtype": assignment.dataType,
        "@_itemSubjectRef": `_${e["@_id"]}_${assignment.name}InputXItem`,
        "@_name": assignment.name,
      };
      e.dataInput?.push(dataInput);

      let dataInputAssociation = e.dataInputAssociation?.find(
        (association) => association.targetRef.__$$text === dataInput["@_id"]
      );

      if (!dataInputAssociation) {
        dataInputAssociation = {
          "@_id": `${e["@_id"]}_dataInputAssociation_${assignment.name}`,
          targetRef: { __$$text: dataInput["@_id"] },
          assignment: [],
        };
        e.dataInputAssociation?.push(dataInputAssociation);
      }
      dataInputAssociation.assignment = [
        {
          "@_id": `${e["@_id"]}_assignment_${assignment.name}`,
          from: { "@_id": `${e["@_id"]}`, __$$text: assignment.value },
          to: { "@_id": dataInput["@_id"], __$$text: dataInput["@_id"] },
        },
      ];
    });
  };
  // e.dataInputAssociation ??= [];
  // e.dataInput ??= [];
  // outputAssignments.forEach((assignment) => {
  //   if (section === "output") {
  //     let dataInput = e?.dataInput?.find((output) => output["@_name"] === assignment.name);
  //     if (!dataInput) {
  //       dataInput = {
  //         "@_id": `${e["@_id"]}_${assignment.name}InputX`,
  //         "@_drools:dtype": assignment.dataType,
  //         "@_itemSubjectRef": `_${e["@_id"]}_${assignment.name}InputXItem`,
  //         "@_name": assignment.name,
  //       };
  //       e?.dataInput?.push(dataInput);
  //     }
  //     if (!e.inputSet) {
  //       e.inputSet = {
  //         "@_id": "",
  //         dataInputRefs: [{ __$$text: dataInput["@_id"] }],
  //       };
  //     }
  //     let dataInputAssociation = e.dataInputAssociation?.find(
  //       (association) => association.targetRef.__$$text === dataInput["@_id"]
  //     );
  //     if (!dataInputAssociation) {
  //       dataInputAssociation = {
  //         "@_id": `${e["@_id"]}_dataInputAssociation_${assignment.name}`,
  //         targetRef: { __$$text: dataInput["@_id"] },
  //         assignment: [],
  //       };
  //       e.dataInputAssociation?.push(dataInputAssociation);
  //     }
  //     const existingAssignment = dataInputAssociation?.assignment?.find(
  //       (assigned) => assigned["@_id"] === `${e["@_id"]}_assignment_${assignment.name}`
  //     );
  //     const newEntry = assignment.value;
  //     if (existingAssignment) {
  //       const existingValues = new Set(existingAssignment?.from?.__$$text?.split(" "));
  //       const newValues = newEntry.split(" ");
  //       const uniqueValues = [...existingValues, ...newValues].join(" ");
  //       existingAssignment.from.__$$text = uniqueValues;
  //     } else {
  //       dataInputAssociation?.assignment?.push({
  //         "@_id": `${e["@_id"]}_assignment_${assignment.name}`,
  //         from: {
  //           "@_id": `${e["@_id"]}`,
  //           __$$text: newEntry,
  //         },
  //         to: { "@_id": dataInput["@_id"], __$$text: dataInput["@_id"] },
  //       });
  //     }
  //   }
  // });
  // };

  const handleSubmitForWithOutputAssignments = (e: WithOutputAssignments) => {
    e.dataOutputAssociation ??= [];
    outputAssignments.forEach((assignment, index) => {
      let dataOutput = e.dataOutput?.[index];
      dataOutput = {
        "@_id": `${e["@_id"]}_${assignment.name}OutputX`,
        "@_drools:dtype": assignment.dataType,
        "@_itemSubjectRef": `_${e["@_id"]}_${assignment.name}OutputXItem`,
        "@_name": assignment.name,
      };
      e.dataOutput?.push(dataOutput);

      let dataOutputAssociation = e.dataOutputAssociation?.find(
        (association) => association.targetRef.__$$text === dataOutput["@_id"]
      );

      if (!dataOutputAssociation) {
        dataOutputAssociation = {
          "@_id": `${e["@_id"]}_dataOutputAssociation_${assignment.name}`,
          targetRef: { __$$text: dataOutput["@_id"] },
          assignment: [],
        };
        e.dataOutputAssociation?.push(dataOutputAssociation);
      }
      dataOutputAssociation.assignment = [
        {
          "@_id": `${e["@_id"]}_assignment_${assignment.name}`,
          from: { "@_id": dataOutput["@_id"], __$$text: dataOutput["@_id"] },
          to: { "@_id": `${e["@_id"]}`, __$$text: assignment.value },
        },
      ];
    });
  };

  //   e.dataOutputAssociation = [];
  //   e.dataOutput = [];

  //   outputAssignments.forEach((assignment) => {
  //     let dataOutput = e?.dataOutput?.find((output) => output["@_name"] === assignment.name);
  //     if (!dataOutput) {
  //       dataOutput = {
  //         "@_id": `${e["@_id"]}_${assignment.name}OutputX`,
  //         "@_drools:dtype": assignment.dataType,
  //         "@_itemSubjectRef": `_${e["@_id"]}_${assignment.name}OutputXItem`,
  //         "@_name": assignment.name,
  //       };
  //       e?.dataOutput?.push(dataOutput);
  //     }
  //     if (!e.outputSet) {
  //       e.outputSet = {
  //         "@_id": "",
  //         dataOutputRefs: [{ __$$text: dataOutput["@_id"] }],
  //       };
  //     }
  //     let dataOutputAssociation = e.dataOutputAssociation?.find(
  //       (association) => association.sourceRef?.[0].__$$text === dataOutput["@_id"]
  //     );
  //     if (!dataOutputAssociation) {
  //       dataOutputAssociation = {
  //         "@_id": `${e["@_id"]}_dataOutputAssociation_${assignment.name}`,
  //         sourceRef: [{ __$$text: dataOutput["@_id"] }],
  //         targetRef: { __$$text: "" }, //Mandatory field here, but targetRef not used in old editor for outputs, resulting in empty targetRef tags in the xml <targetRef></targetRef>
  //         assignment: [],
  //       };
  //       e.dataOutputAssociation?.push(dataOutputAssociation);
  //     }
  //     const existingAssignment = dataOutputAssociation?.assignment?.find(
  //       (assigned) => assigned["@_id"] === `${e["@_id"]}_assignment_${assignment.name}`
  //     );
  //     const newEntry = assignment.value;
  //     if (existingAssignment) {
  //       const existingValues = new Set(existingAssignment?.from?.__$$text?.split(" "));
  //       const newValues = newEntry.split(" ");
  //       const uniqueValues = [...existingValues, ...newValues].join(" ");
  //       existingAssignment.from.__$$text = uniqueValues;
  //     } else {
  //       dataOutputAssociation?.assignment?.push({
  //         "@_id": `${e["@_id"]}_assignment_${assignment.name}`,
  //         from: { "@_id": dataOutput["@_id"], __$$text: dataOutput["@_id"] },
  //         to: {
  //           "@_id": `${e["@_id"]}`,
  //           __$$text: newEntry,
  //         },
  //       });
  //     }
  //   });
  // };

  const entryStyle = {
    padding: "4px",
    margin: "8px",
    width: "calc(100% - 2 * 4px - 2 * 8px)",
  };

  const titleComponent = useMemo(() => <Title headingLevel="h2">{title}</Title>, [title]);

  return (
    <>
      {((inputAssignments.length > 0 || outputAssignments.length > 0) && (
        <Form>
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
                  <Button variant={ButtonVariant.plain} style={{ paddingLeft: 0 }} onClick={addAssignment}>
                    <PlusCircleIcon color="var(--pf-c-button--m-primary--BackgroundColor)" />
                  </Button>
                </GridItem>
              </Grid>
            </div>
          </div>
          {/* {element[associationsPropName]?.map((entry, i) => ( */}
          {section === "input" &&
            inputAssignments.map((entry, i) => (
              <div key={i} style={{ padding: "0 8px" }}>
                <Grid
                  md={6}
                  className={"kie-bpmn-editor--properties-panel--assignment-entry"}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(undefined)}
                >
                  <GridItem span={5}>
                    <TextArea
                      aria-label={"name"}
                      autoFocus={true}
                      style={entryStyle}
                      type="text"
                      placeholder="Name..."
                      value={entry.name}
                      onChange={(e) => handleInputChange(i, "name", e)}
                    />
                  </GridItem>
                  <GridItem span={3}>
                    <FormSelect
                      aria-label={"data type"}
                      type={"text"}
                      value={entry.dataType}
                      onChange={(e) => handleInputChange(i, "dataType", e)}
                      style={entryStyle}
                      rows={1}
                    >
                      {dataType.map((option) => (
                        <FormSelectOption key={option.label} label={option.label} value={option.value} />
                      ))}
                    </FormSelect>
                  </GridItem>
                  <GridItem span={3}>
                    <TextArea
                      aria-label={"value"}
                      style={entryStyle}
                      type="text"
                      placeholder={`${lastColumnLabel}...`}
                      value={entry.value}
                      onChange={(e) => handleInputChange(i, "value", e)}
                    />
                  </GridItem>
                  <GridItem span={1} style={{ textAlign: "right" }}>
                    {hoveredIndex === i && (
                      <Button
                        tabIndex={9999} // Prevent tab from going to this button
                        variant={ButtonVariant.plain}
                        style={{ paddingLeft: 0 }}
                        onClick={() => removeAssignment(i)}
                      >
                        <TimesIcon />
                      </Button>
                    )}
                  </GridItem>
                </Grid>
              </div>
            ))}
          {section === "output" &&
            outputAssignments.map((entry, i) => (
              <div key={i} style={{ padding: "0 8px" }}>
                <Grid
                  md={6}
                  className={"kie-bpmn-editor--properties-panel--assignment-entry"}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(undefined)}
                >
                  <GridItem span={5}>
                    <TextArea
                      aria-label={"name"}
                      autoFocus={true}
                      style={entryStyle}
                      type="text"
                      placeholder="Name..."
                      value={entry.name}
                      onChange={(e) => handleInputChange(i, "name", e)}
                    />
                  </GridItem>
                  <GridItem span={3}>
                    <FormSelect
                      aria-label={"data type"}
                      type={"text"}
                      value={entry.dataType}
                      onChange={(e) => handleInputChange(i, "dataType", e)}
                      style={entryStyle}
                      rows={1}
                    >
                      {dataType.map((option) => (
                        <FormSelectOption key={option.label} label={option.label} value={option.value} />
                      ))}
                    </FormSelect>
                  </GridItem>
                  <GridItem span={3}>
                    <TextArea
                      aria-label={"value"}
                      style={entryStyle}
                      type="text"
                      placeholder={`${lastColumnLabel}...`}
                      value={entry.value}
                      onChange={(e) => handleInputChange(i, "value", e)}
                    />
                  </GridItem>
                  <GridItem span={1} style={{ textAlign: "right" }}>
                    {hoveredIndex === i && (
                      <Button
                        tabIndex={9999} // Prevent tab from going to this button
                        variant={ButtonVariant.plain}
                        style={{ paddingLeft: 0 }}
                        onClick={() => removeAssignment(i)}
                      >
                        <TimesIcon />
                      </Button>
                    )}
                  </GridItem>
                </Grid>
              </div>
            ))}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px", paddingRight: "8px" }}>
            <Button
              variant="primary"
              onClick={handleSubmit}
              isDisabled={isReadOnly || (inputAssignments.length === 0 && outputAssignments.length === 0)}
            >
              Save
            </Button>
          </div>
        </Form>
      )) || (
        <>
          {titleComponent}
          <div className={"kie-bpmn-editor--assignments--empty-state"}>
            <Bullseye>
              <EmptyState>
                {/* <EmptyStateIcon /> */}
                <Title headingLevel="h4">
                  {isReadOnly ? `No ${entryTitle} assignments` : `No ${entryTitle} assignments yet`}
                </Title>
                <EmptyStateBody style={{ padding: "0 25%" }}>
                  {`This represents an the empty state pattern in Patternfly 4. Hopefully it's simple enough to use but flexible.`}
                </EmptyStateBody>
                <Button variant="primary" onClick={addAssignment}>
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
