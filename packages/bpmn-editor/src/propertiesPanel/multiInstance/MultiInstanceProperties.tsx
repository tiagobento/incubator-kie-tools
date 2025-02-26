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

import { BPMN20__tProcess } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import * as React from "react";
import { Normalized } from "../../normalization/normalize";
import { ElementFilter } from "@kie-tools/xml-parser-ts/dist/elementFilter";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import { FormGroup } from "@patternfly/react-core/dist/js/components/Form";
import { CodeInput } from "../codeInput/CodeInput";
import { ToggleGroup, ToggleGroupItem } from "@patternfly/react-core/dist/js/components/ToggleGroup";
import { visitFlowElementsAndArtifacts } from "../../mutations/_elementVisitor";
import { addOrGetProcessAndDiagramElements } from "../../mutations/addOrGetProcessAndDiagramElements";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../../store/StoreContext";
import { TextInput } from "@patternfly/react-core/dist/js/components/TextInput";
import "./MultiInstanceProperties.css";
import { FormSelectOption } from "@patternfly/react-core/dist/js/components/FormSelect/FormSelectOption";
import { FormSelect } from "@patternfly/react-core/dist/js/components/FormSelect/FormSelect";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";

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
      <FormGroup label="Execution mode">
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
              ? element?.loopCharacteristics["inputDataItem"]?.["@_id"] || ""
              : ""
          }
          onChange={(newDataInput) =>
            bpmnEditorStoreApi.setState((s) => {
              const { process } = addOrGetProcessAndDiagramElements({
                definitions: s.bpmn.model.definitions,
              });

              visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                if (e["@_id"] === element?.["@_id"] && e.__$$element === element.__$$element) {
                  e.ioSpecification ??= {
                    "@_id": generateUuid(),
                    dataInput: [],
                    inputSet: [{ "@_id": generateUuid(), dataInputRefs: [] }],
                    outputSet: [],
                  };
                  e.ioSpecification.dataInput ??= [];

                  e.dataInputAssociation ??= [];

                  let multiInstanceDataInput = e.ioSpecification?.dataInput?.find((dataInput) =>
                    dataInput["@_itemSubjectRef"]?.includes("multiInstanceItemType")
                  );
                  const previousValue = multiInstanceDataInput?.["@_id"] || "";
                  if (multiInstanceDataInput) {
                    console.log("if");
                    multiInstanceDataInput["@_id"] = `${e["@_id"]}_${newDataInput}${inputX}`;
                    multiInstanceDataInput["@_itemSubjectRef"] =
                      `${e["@_id"]}_${multiInstanceItemType}_${newDataInput}`;
                    multiInstanceDataInput["@_name"] = newDataInput;
                  } else {
                    console.log("else");
                    multiInstanceDataInput = {
                      "@_id": `${e["@_id"]}_${newDataInput}${inputX}`,
                      "@_itemSubjectRef": `${e["@_id"]}_${multiInstanceItemType}_${newDataInput}`,
                      "@_name": newDataInput,
                    };
                    e.ioSpecification.dataInput.push(multiInstanceDataInput);
                  }

                  e.ioSpecification.inputSet[0] ??= {
                    "@_id": generateUuid(),
                    dataInputRefs: [
                      {
                        __$$text: "",
                      },
                    ],
                  };

                  e.ioSpecification.inputSet[0].dataInputRefs ??= [
                    {
                      __$$text: "",
                    },
                  ];

                  let multiInstanceDataInputRef = e.ioSpecification?.inputSet?.[0].dataInputRefs?.find(
                    (dataInputRefs) => dataInputRefs.__$$text === previousValue
                  );

                  if (multiInstanceDataInputRef) {
                    multiInstanceDataInputRef.__$$text = `${e["@_id"]}_${newDataInput}${inputX}`;
                  } else {
                    multiInstanceDataInputRef = {
                      __$$text: `${e["@_id"]}_${newDataInput}${inputX}`,
                    };
                    if (!e.ioSpecification?.inputSet[0].dataInputRefs) {
                      e.ioSpecification.inputSet[0].dataInputRefs = [
                        {
                          __$$text: `${e["@_id"]}_${newDataInput}${inputX}`,
                        },
                      ];
                    }
                    e.ioSpecification.inputSet[0].dataInputRefs.push(multiInstanceDataInputRef);
                  }

                  let multiInstanceDataInputAssociation = e.dataInputAssociation?.find(
                    (dataInputAssociation) => dataInputAssociation.targetRef.__$$text === previousValue
                  );

                  if (multiInstanceDataInputAssociation) {
                    multiInstanceDataInputAssociation.targetRef.__$$text = `${e["@_id"]}_${newDataInput}${inputX}`;
                    multiInstanceDataInputAssociation.sourceRef![0].__$$text = newDataInput;
                  } else {
                    multiInstanceDataInputAssociation = {
                      "@_id": generateUuid(),
                      targetRef: { __$$text: `${e["@_id"]}_${newDataInput}${inputX}` || "" },
                      sourceRef: [{ __$$text: newDataInput || "" }],
                    };
                    e.dataInputAssociation?.push(multiInstanceDataInputAssociation);
                  }

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

      <FormGroup label="Data output">
        <TextInput
          aria-label={"Data output"}
          type={"text"}
          isDisabled={isReadOnly}
          placeholder={"Enter a Data output..."}
          value={
            element?.loopCharacteristics?.__$$element === "multiInstanceLoopCharacteristics"
              ? element?.loopCharacteristics["outputDataItem"]?.["@_id"] || ""
              : ""
          }
          onChange={(newDataOutput) =>
            bpmnEditorStoreApi.setState((s) => {
              const { process } = addOrGetProcessAndDiagramElements({
                definitions: s.bpmn.model.definitions,
              });

              visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                if (e["@_id"] === element?.["@_id"] && e.__$$element === element.__$$element) {
                  e.ioSpecification ??= {
                    "@_id": generateUuid(),
                    dataOutput: [],
                    outputSet: [{ "@_id": generateUuid(), dataOutputRefs: [] }],
                    inputSet: [],
                  };
                  e.ioSpecification.dataOutput ??= [];

                  e.dataOutputAssociation ??= [];

                  let multiInstanceDataOutput = e.ioSpecification?.dataOutput?.find((dataOutput) =>
                    dataOutput["@_itemSubjectRef"]?.includes("multiInstanceItemType")
                  );
                  const previousValue = multiInstanceDataOutput?.["@_id"] || "";
                  if (multiInstanceDataOutput) {
                    multiInstanceDataOutput["@_id"] = `${e["@_id"]}_${newDataOutput}${outputX}`;
                    multiInstanceDataOutput["@_itemSubjectRef"] =
                      `${e["@_id"]}_${multiInstanceItemType}_${newDataOutput}`;
                    multiInstanceDataOutput["@_name"] = newDataOutput;
                  } else {
                    multiInstanceDataOutput = {
                      "@_id": `${e["@_id"]}_${newDataOutput}${outputX}`,
                      "@_itemSubjectRef": `${e["@_id"]}_${multiInstanceItemType}_${newDataOutput}`,
                      "@_name": newDataOutput,
                    };
                    e.ioSpecification.dataOutput.push(multiInstanceDataOutput);
                  }

                  e.ioSpecification.outputSet[0] ??= {
                    "@_id": generateUuid(),
                    dataOutputRefs: [
                      {
                        __$$text: "",
                      },
                    ],
                  };

                  e.ioSpecification.outputSet[0].dataOutputRefs ??= [
                    {
                      __$$text: "",
                    },
                  ];

                  let multiInstanceDataOutputRef = e.ioSpecification?.outputSet?.[0].dataOutputRefs?.find(
                    (dataOutputRefs) => dataOutputRefs.__$$text === previousValue
                  );

                  if (multiInstanceDataOutputRef) {
                    multiInstanceDataOutputRef.__$$text = `${e["@_id"]}_${newDataOutput}${outputX}`;
                  } else {
                    multiInstanceDataOutputRef = {
                      __$$text: `${e["@_id"]}_${newDataOutput}${outputX}`,
                    };
                    if (!e.ioSpecification?.outputSet[0].dataOutputRefs) {
                      e.ioSpecification.outputSet[0].dataOutputRefs = [
                        {
                          __$$text: `${e["@_id"]}_${newDataOutput}${outputX}`,
                        },
                      ];
                    }
                    e.ioSpecification.outputSet[0].dataOutputRefs.push(multiInstanceDataOutputRef);
                  }

                  let multiInstanceDataOutputAssociation = e.dataOutputAssociation?.find(
                    (dataOutputAssociation) =>
                      Array.isArray(dataOutputAssociation.sourceRef) &&
                      dataOutputAssociation.sourceRef[0].__$$text === previousValue
                  );

                  if (multiInstanceDataOutputAssociation) {
                    multiInstanceDataOutputAssociation.sourceRef![0].__$$text = `${e["@_id"]}_${newDataOutput}${outputX}`;
                    multiInstanceDataOutputAssociation.targetRef.__$$text = newDataOutput;
                  } else {
                    multiInstanceDataOutputAssociation = {
                      "@_id": generateUuid(),
                      sourceRef: [{ __$$text: `${e["@_id"]}_${newDataOutput}${outputX}` || "" }],
                      targetRef: { __$$text: newDataOutput || "" },
                    };
                    e.dataOutputAssociation?.push(multiInstanceDataOutputAssociation);
                  }

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
