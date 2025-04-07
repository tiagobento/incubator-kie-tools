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
import { FormGroup } from "@patternfly/react-core/dist/js/components/Form";
import { FormSelect, FormSelectOption } from "@patternfly/react-core/dist/js/components/FormSelect";
import "./DataTypeSelector.css";
import { addOrGetProcessAndDiagramElements } from "../../mutations/addOrGetProcessAndDiagramElements";
import { visitFlowElementsAndArtifacts } from "../../mutations/_elementVisitor";
import { addOrGetItemDefinitions } from "../../mutations/addOrGetItemDefinitions";

const dataType = [
  { value: "Custom", label: "Custom..." },
  { value: "Boolean", label: "Boolean" },
  { value: "Float", label: "Float" },
  { value: "Integer", label: "Integer" },
  { value: "Object", label: "Object" },
  { value: "String", label: "String" },
];

export function DataTypeSelector({ element }: { element: any }) {
  const isReadOnly = useBpmnEditorStore((s) => s.settings.isReadOnly);
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();
  // const { itemDefinitions } = addOrGetItemDefinitions({
  //   definitions: s.bpmn.model.definitions,
  //   oldId: "tet",
  // });
  return (
    <FormGroup label="Data Type">
      <FormSelect
        id={"selected"}
        value={undefined}
        isDisabled={isReadOnly}
        onChange={(newValue) =>
          bpmnEditorStoreApi.setState((s) => {
            const { process } = addOrGetProcessAndDiagramElements({
              definitions: s.bpmn.model.definitions,
            });

            visitFlowElementsAndArtifacts(process, ({ element: e }) => {
              if (e["@_id"] === element?.["@_id"] && e.__$$element === element.__$$element) {
                addOrGetItemDefinitions({
                  definitions: s.bpmn.model.definitions,
                  oldId: `${e["@_id"]}`,
                  structureRef: "",
                });
              }
            });
          })
        }
      >
        {dataType.map((option) => (
          <FormSelectOption key={option.label} label={option.label} value={option.value} />
        ))}
      </FormSelect>
    </FormGroup>
  );
}
