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
import { BPMN20__tMessage, BPMN20__tProcess } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { ElementFilter } from "@kie-tools/xml-parser-ts/dist/elementFilter";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import { InputGroup, InputGroupText } from "@patternfly/react-core/dist/js/components/InputGroup";
import { MessageEventSymbolSvg } from "../../diagram/nodes/NodeSvgs";
import { Normalized } from "../../normalization/normalize";
import { useBpmnEditorStore } from "../../store/StoreContext";
import { FormSelect, FormSelectOption } from "@patternfly/react-core/dist/js/components/FormSelect";
import "./VariableSelector.css";
import CodeIcon from "@patternfly/react-icons/dist/js/icons/code-icon";
import { Icon } from "@patternfly/react-core/dist/js/components/Icon";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";

export type OnVariableChange = (e: React.FormEvent, newVariableRef: string) => void;

export function VariableSelector({
  value,
  onChange,
  omitIds,
}: {
  value: string | undefined;
  onChange: OnVariableChange;
  omitIds?: string[];
}) {
  const isReadOnly = useBpmnEditorStore((s) => s.settings.isReadOnly);

  const variablesById = useBpmnEditorStore(
    (s) =>
      new Map(
        s.bpmn.model.definitions.rootElement
          ?.find((s) => s.__$$element === "process")
          ?.property?.map((p) => [p["@_id"], p])
      )
  );

  return (
    <>
      <InputGroup>
        <InputGroupText>
          <Icon>
            <CodeIcon />
          </Icon>
        </InputGroupText>
        <FormSelect
          id={`variable-selector-${generateUuid()}`}
          onChange={onChange}
          value={value}
          isDisabled={isReadOnly}
        >
          <FormSelectOption label={"Select a Variable..."} isPlaceholder={true} isDisabled={true} />
          {[...variablesById.values()].map((v) => (
            <FormSelectOption key={v["@_id"]} label={v["@_name"] ?? `<Unknown>`} value={v["@_id"]} />
          ))}
        </FormSelect>
      </InputGroup>
    </>
  );
}
