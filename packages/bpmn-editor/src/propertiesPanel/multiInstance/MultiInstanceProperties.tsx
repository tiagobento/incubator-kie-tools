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
import { BPMN20__tProcess } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
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
import { FormSelectOption } from "@patternfly/react-core/dist/js/components/FormSelect/FormSelectOption";
import { FormSelect } from "@patternfly/react-core/dist/js/components/FormSelect/FormSelect";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";
import { USER_TASK_IO_SPECIFICATION_DATA_INPUTS_CONSTANTS_FOR_DMN_BINDING } from "@kie-tools/bpmn-marshaller/dist/drools-extension";
import { ItemDefinitionRefSelector } from "../itemDefinitionRefSelector/ItemDefinitionRefSelector";
import { Divider } from "@patternfly/react-core/dist/js/components/Divider";
import "./MultiInstanceProperties.css";
import { VariableSelector } from "../variableSelector/VariableSelector";

export type WithMultiInstanceProperties = Normalized<
  ElementFilter<
    Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>,
    "callActivity" | "subProcess" | "userTask" | "serviceTask"
  >
>;

export function MultiInstanceProperties({ element }: { element: WithMultiInstanceProperties }) {
  const isReadOnly = useBpmnEditorStore((s) => s.settings.isReadOnly);
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

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
                const { process } = addOrGetProcessAndDiagramElements({ definitions: s.bpmn.model.definitions });
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
                const { process } = addOrGetProcessAndDiagramElements({ definitions: s.bpmn.model.definitions });
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

      <CodeInput
        label={"Completion condition"}
        languages={["MVEL"]}
        value={
          element?.loopCharacteristics?.__$$element === "multiInstanceLoopCharacteristics"
            ? element?.loopCharacteristics?.completionCondition?.__$$text
            : undefined
        }
        onChange={(e, newCompletionCondition) => {
          bpmnEditorStoreApi.setState((s) => {
            const { process } = addOrGetProcessAndDiagramElements({ definitions: s.bpmn.model.definitions });
            visitFlowElementsAndArtifacts(process, ({ element: e }) => {
              if (
                e["@_id"] === element?.["@_id"] &&
                e.__$$element === element.__$$element &&
                e.loopCharacteristics?.__$$element === "multiInstanceLoopCharacteristics"
              ) {
                e.loopCharacteristics.completionCondition ??= { "@_id": generateUuid(), __$$text: "" };
                e.loopCharacteristics.completionCondition.__$$text = newCompletionCondition;
              }
            });
          });
        }}
      />

      <Divider style={{ margin: "16px" }} />

      <FormGroup label={"Collection input"}>
        <VariableSelector
          value={
            element?.loopCharacteristics?.__$$element === "multiInstanceLoopCharacteristics"
              ? element?.loopCharacteristics["loopDataInputRef"]?.__$$text
              : undefined
          }
          onChange={(e, newVariableRef) => {
            bpmnEditorStoreApi.setState((s) => {
              const { process } = addOrGetProcessAndDiagramElements({ definitions: s.bpmn.model.definitions });
              visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                if (
                  e["@_id"] === element?.["@_id"] &&
                  e.__$$element === element.__$$element &&
                  e.loopCharacteristics?.__$$element === "multiInstanceLoopCharacteristics"
                ) {
                  e.loopCharacteristics.loopDataInputRef = { __$$text: newVariableRef };
                }
              });
            });
          }}
        />
      </FormGroup>

      <FormGroup label="Data input">
        <TextInput
          aria-label={"Data input"}
          type={"text"}
          isDisabled={isReadOnly}
          placeholder={"Enter a Data input..."}
          value={
            element?.loopCharacteristics?.__$$element === "multiInstanceLoopCharacteristics"
              ? element?.loopCharacteristics["inputDataItem"]?.["@_name"]
              : undefined
          }
          onChange={(e, newDataInput) =>
            bpmnEditorStoreApi.setState((s) => {
              const { process } = addOrGetProcessAndDiagramElements({ definitions: s.bpmn.model.definitions });
              visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                if (e["@_id"] === element?.["@_id"] && e.__$$element === element.__$$element) {
                  // TODO: Add dataMapping

                  if (e.loopCharacteristics?.__$$element === "multiInstanceLoopCharacteristics") {
                    e.loopCharacteristics.inputDataItem ??= { "@_id": generateUuid() };

                    e.loopCharacteristics.inputDataItem["@_name"] = newDataInput;
                  }
                }
              });
            })
          }
        />
      </FormGroup>

      <FormGroup label="Data Type">
        <ItemDefinitionRefSelector
          value={
            element?.loopCharacteristics?.__$$element === "multiInstanceLoopCharacteristics"
              ? element.loopCharacteristics["inputDataItem"]?.["@_itemSubjectRef"]
              : undefined
          }
          onChange={(newDataInputDataType) =>
            bpmnEditorStoreApi.setState((s) => {
              const { process } = addOrGetProcessAndDiagramElements({ definitions: s.bpmn.model.definitions });
              visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                if (
                  e["@_id"] === element?.["@_id"] &&
                  e.__$$element === element.__$$element &&
                  e.loopCharacteristics?.__$$element === "multiInstanceLoopCharacteristics"
                ) {
                  e.loopCharacteristics.inputDataItem ??= { "@_id": generateUuid() };

                  e.loopCharacteristics.inputDataItem["@_itemSubjectRef"] = newDataInputDataType;
                }
              });
            })
          }
        />
      </FormGroup>

      <Divider style={{ margin: "16px" }} />

      <FormGroup label={"Collection output"}>
        <VariableSelector
          value={
            element?.loopCharacteristics?.__$$element === "multiInstanceLoopCharacteristics"
              ? element?.loopCharacteristics["loopDataOutputRef"]?.__$$text
              : undefined
          }
          onChange={(e, newVariableRef) => {
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
                  e.loopCharacteristics.loopDataOutputRef = { __$$text: newVariableRef };
                }
              });
            });
          }}
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
              ? element?.loopCharacteristics["outputDataItem"]?.["@_name"]
              : undefined
          }
          onChange={(e, newDataOutput) =>
            bpmnEditorStoreApi.setState((s) => {
              const { process } = addOrGetProcessAndDiagramElements({ definitions: s.bpmn.model.definitions });
              visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                if (e["@_id"] === element?.["@_id"] && e.__$$element === element.__$$element) {
                  // TODO: Add dataMapping

                  if (e.loopCharacteristics?.__$$element === "multiInstanceLoopCharacteristics") {
                    e.loopCharacteristics.outputDataItem ??= { "@_id": generateUuid() };
                    e.loopCharacteristics.outputDataItem["@_name"] = newDataOutput;
                  }
                }
              });
            })
          }
        />
      </FormGroup>

      <FormGroup label="Data Type">
        <ItemDefinitionRefSelector
          value={
            element?.loopCharacteristics?.__$$element === "multiInstanceLoopCharacteristics"
              ? element.loopCharacteristics.outputDataItem?.["@_itemSubjectRef"]
              : undefined
          }
          onChange={(newDataOutputDataType) =>
            bpmnEditorStoreApi.setState((s) => {
              const { process } = addOrGetProcessAndDiagramElements({ definitions: s.bpmn.model.definitions });
              visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                if (
                  e["@_id"] === element?.["@_id"] &&
                  e.__$$element === element.__$$element &&
                  e.loopCharacteristics?.__$$element === "multiInstanceLoopCharacteristics"
                ) {
                  e.loopCharacteristics.outputDataItem ??= { "@_id": generateUuid() };
                  e.loopCharacteristics.outputDataItem["@_itemSubjectRef"] = newDataOutputDataType;
                }
              });
            })
          }
        />
      </FormGroup>
    </>
  );
}
