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

import {
  BPMN20__tItemDefinition,
  BPMN20__tProcess,
} from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import * as React from "react";
import { Normalized } from "../../normalization/normalize";
import { ElementFilter } from "@kie-tools/xml-parser-ts/dist/elementFilter";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import { FormGroup } from "@patternfly/react-core/dist/js/components/Form";
import { CodeInput } from "../codeInput/CodeInput";
import { SERVICE_TASK_IMPLEMENTATIONS } from "@kie-tools/bpmn-marshaller/dist/drools-extension";
import { ToggleGroup, ToggleGroupItem } from "@patternfly/react-core/dist/js/components/ToggleGroup";
import { visitFlowElementsAndArtifacts } from "../../mutations/_elementVisitor";
import { addOrGetProcessAndDiagramElements } from "../../mutations/addOrGetProcessAndDiagramElements";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../../store/StoreContext";
import { TextInput } from "@patternfly/react-core/dist/js/components/TextInput";
import { updateItemDefinition } from "../../mutations/renameNode";
import "./MultiInstanceProperties.css";
import { FormSelectOption } from "@patternfly/react-core/dist/js/components/FormSelect/FormSelectOption";
import { FormSelect } from "@patternfly/react-core/dist/js/components/FormSelect/FormSelect";

export type WithMultiInstanceProperties = Normalized<
  ElementFilter<
    Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>,
    "callActivity" | "subProcess" | "userTask" | "serviceTask"
  >
>;

export function MultiInstanceProperties({ element }: { element: WithMultiInstanceProperties }) {
  const isReadOnly = useBpmnEditorStore((s) => s.settings.isReadOnly);
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

  const inputX = "InputX";
  const outputX = "OutputX";
  const multiInstanceItemType = "multiInstanceItemType";

  return (
    <>
      <FormGroup
        label="Execution mode"
        // helperText={
        //   "Consectetur adipiscing elit. Lorem ipsum dolor sit amet, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
        // } // FIXME: Tiago -> Description
      >
        <ToggleGroup aria-label="Execution mode">
          <ToggleGroupItem
            text="Parallel"
            isDisabled={isReadOnly}
            isSelected={
              element?.loopCharacteristics?.__$$element === "multiInstanceLoopCharacteristics"
                ? element?.loopCharacteristics["@_isSequential"] === undefined
                : false
            }
            onChange={() => {
              bpmnEditorStoreApi.setState((s) => {
                const { process } = addOrGetProcessAndDiagramElements({
                  definitions: s.bpmn.model.definitions,
                });
                visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                  if (
                    e["@_id"] === element["@_id"] &&
                    e.__$$element === element.__$$element &&
                    e.loopCharacteristics?.__$$element === "multiInstanceLoopCharacteristics"
                  ) {
                    e.loopCharacteristics["@_isSequential"] = undefined;
                  }
                });
              });
            }}
          />
          <ToggleGroupItem
            text="Sequential"
            isDisabled={isReadOnly}
            isSelected={
              element?.loopCharacteristics?.__$$element === "multiInstanceLoopCharacteristics"
                ? element?.loopCharacteristics["@_isSequential"] === true
                : false
            }
            onChange={() => {
              bpmnEditorStoreApi.setState((s) => {
                const { process } = addOrGetProcessAndDiagramElements({
                  definitions: s.bpmn.model.definitions,
                });
                visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                  if (
                    e["@_id"] === element["@_id"] &&
                    e.__$$element === element.__$$element &&
                    e.loopCharacteristics?.__$$element === "multiInstanceLoopCharacteristics"
                  ) {
                    e.loopCharacteristics["@_isSequential"] = true;
                  }
                });
              });
            }}
          />
        </ToggleGroup>
      </FormGroup>

      <FormGroup label="Data input">
        <TextInput
          aria-label={"Data input"}
          type={"text"}
          isDisabled={isReadOnly}
          placeholder={"Enter a Data input..."}
          value={
            element?.loopCharacteristics?.__$$element === "multiInstanceLoopCharacteristics"
              ? element?.loopCharacteristics["inputDataItem"]?.["@_id"] ?? ""
              : undefined
          }
          onChange={(newDataInput) =>
            bpmnEditorStoreApi.setState((s) => {
              const { process } = addOrGetProcessAndDiagramElements({
                definitions: s.bpmn.model.definitions,
              });

              visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                if (e["@_id"] === element?.["@_id"] && e.__$$element === element.__$$element) {
                  e.ioSpecification ??= {
                    "@_id": "",
                    inputSet: [
                      {
                        "@_id": "",
                        dataInputRefs: [{ __$$text: "" }],
                      },
                    ],
                    outputSet: [],
                  };

                  e.ioSpecification.dataInput ??= [
                    {
                      "@_id": "",
                    },
                  ];

                  e.ioSpecification.dataInput[0]["@_id"] = `${e["@_id"]}_${newDataInput}${inputX}`;
                  e.ioSpecification.dataInput[0]["@_itemSubjectRef"] =
                    `${e["@_id"]}_${multiInstanceItemType}_${newDataInput}`;
                  e.ioSpecification.dataInput[0]["@_name"] = newDataInput;

                  e.ioSpecification.inputSet[0] ??= {
                    "@_id": "",
                    dataInputRefs: [{ __$$text: `${e["@_id"]}_${newDataInput}${inputX}` }],
                  };

                  e.ioSpecification.inputSet[0].dataInputRefs ??= [
                    { __$$text: `${e["@_id"]}${newDataInput}${inputX}` },
                  ];
                  e.ioSpecification.inputSet[0].dataInputRefs[0].__$$text = `${e["@_id"]}${newDataInput}${inputX}`;

                  e.dataInputAssociation ??= [
                    {
                      "@_id": "",
                      targetRef: { __$$text: "" },
                      transformation: undefined,
                      sourceRef: [{ __$$text: "" }],
                    },
                  ];

                  e.dataInputAssociation[0].sourceRef ??= [];
                  e.dataInputAssociation[0].sourceRef[0].__$$text = newDataInput;
                  e.dataInputAssociation[0].targetRef.__$$text = `${e["@_id"]}_${newDataInput}${inputX}`;

                  if (e.loopCharacteristics?.__$$element === "multiInstanceLoopCharacteristics") {
                    e.loopCharacteristics.inputDataItem ??= {
                      "@_id": "",
                    };
                    e.loopCharacteristics.inputDataItem["@_id"] = newDataInput;
                    e.loopCharacteristics.inputDataItem["@_itemSubjectRef"] =
                      `${e["@_id"]}_${multiInstanceItemType}_${newDataInput}`;
                    e.loopCharacteristics.inputDataItem["@_name"] = newDataInput;
                  }
                }
              });
            })
          }
        />
      </FormGroup>

      <FormGroup label="Data Output">
        <TextInput
          aria-label={"Data Output"}
          type={"text"}
          isDisabled={isReadOnly}
          placeholder={"Enter a Data Output..."}
          value={
            element?.loopCharacteristics?.__$$element === "multiInstanceLoopCharacteristics"
              ? element?.loopCharacteristics["outputDataItem"]?.["@_id"] ?? ""
              : undefined
          }
          onChange={(newDataOutput) =>
            bpmnEditorStoreApi.setState((s) => {
              const { process } = addOrGetProcessAndDiagramElements({
                definitions: s.bpmn.model.definitions,
              });

              visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                if (e["@_id"] === element?.["@_id"] && e.__$$element === element.__$$element) {
                  e.ioSpecification ??= {
                    "@_id": "",
                    inputSet: [],
                    outputSet: [
                      {
                        "@_id": "",
                        dataOutputRefs: [{ __$$text: "" }],
                      },
                    ],
                  };

                  e.ioSpecification.dataOutput ??= [
                    {
                      "@_id": "",
                    },
                  ];

                  e.ioSpecification.dataOutput[0]["@_id"] = `${e["@_id"]}_${newDataOutput}${outputX}`;
                  e.ioSpecification.dataOutput[0]["@_itemSubjectRef"] =
                    `${e["@_id"]}_${multiInstanceItemType}_${newDataOutput}`;
                  e.ioSpecification.dataOutput[0]["@_name"] = newDataOutput;

                  e.ioSpecification.outputSet[0] ??= {
                    "@_id": "",
                    dataOutputRefs: [{ __$$text: `${e["@_id"]}_${newDataOutput}${outputX}` }],
                  };

                  e.ioSpecification.outputSet[0].dataOutputRefs ??= [
                    { __$$text: `${e["@_id"]}${newDataOutput}${outputX}` },
                  ];
                  e.ioSpecification.outputSet[0].dataOutputRefs[0].__$$text = `${e["@_id"]}${newDataOutput}${outputX}`;

                  e.dataOutputAssociation ??= [
                    {
                      "@_id": "",
                      targetRef: { __$$text: "" },
                      transformation: undefined,
                      sourceRef: [{ __$$text: "" }],
                    },
                  ];

                  e.dataOutputAssociation[0].sourceRef ??= [];
                  e.dataOutputAssociation[0].sourceRef[0].__$$text = `${e["@_id"]}_${newDataOutput}${outputX}`;
                  e.dataOutputAssociation[0].targetRef.__$$text = newDataOutput;

                  if (e.loopCharacteristics?.__$$element === "multiInstanceLoopCharacteristics") {
                    e.loopCharacteristics.outputDataItem ??= {
                      "@_id": "",
                    };
                    e.loopCharacteristics.outputDataItem["@_id"] = newDataOutput;
                    e.loopCharacteristics.outputDataItem["@_itemSubjectRef"] =
                      `${e["@_id"]}_${multiInstanceItemType}_${newDataOutput}`;
                    e.loopCharacteristics.outputDataItem["@_name"] = newDataOutput;
                  }
                }
              });
            })
          }
        />
      </FormGroup>

      <FormGroup label={"Collection input"}></FormGroup>
      <FormSelect id={"select"} value={undefined} isDisabled={isReadOnly}>
        <FormSelectOption id={"none"} isPlaceholder={true} label={"-- Select a value --"} />
      </FormSelect>

      <FormGroup label={"Collection output"}></FormGroup>
      <FormSelect id={"select"} value={undefined} isDisabled={isReadOnly}>
        <FormSelectOption id={"none"} isPlaceholder={true} label={"-- Select a value --"} />
      </FormSelect>

      <CodeInput
        label={"Completion condition"}
        languages={["MVEL"]}
        value={
          element?.loopCharacteristics?.__$$element === "multiInstanceLoopCharacteristics"
            ? element?.loopCharacteristics?.completionCondition?.__$$text || ""
            : ""
        }
        onChange={(newCompletionCondition) => {
          bpmnEditorStoreApi.setState((s) => {
            const { process } = addOrGetProcessAndDiagramElements({
              definitions: s.bpmn.model.definitions,
            });

            visitFlowElementsAndArtifacts(process, ({ element: e }) => {
              if (
                e["@_id"] === element?.["@_id"] &&
                e.__$$element === element.__$$element &&
                e.loopCharacteristics?.__$$element === "multiInstanceLoopCharacteristics"
              ) {
                e.loopCharacteristics.completionCondition ??= {
                  __$$text: "",
                  "@_id": "",
                };
                e.loopCharacteristics.completionCondition.__$$text = newCompletionCondition;
              }
            });
          });
        }}
      />
    </>
  );
}
