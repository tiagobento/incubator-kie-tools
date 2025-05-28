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
import "./MessageSelector.css";

export type EventWithMessage =
  | undefined
  | Normalized<
      ElementFilter<
        Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>,
        "startEvent" | "intermediateCatchEvent" | "intermediateThrowEvent" | "endEvent" | "boundaryEvent"
      >
    >;

export type OnMessageChange = (e: React.FormEvent, newMessageRef: string) => void;

export function MessageSelector({
  value,
  onChange,
  omitIds,
}: {
  value: string | undefined;
  onChange: OnMessageChange;
  omitIds?: string[];
}) {
  const isReadOnly = useBpmnEditorStore((s) => s.settings.isReadOnly);

  const messagesById = useBpmnEditorStore(
    (s) =>
      new Map(
        s.bpmn.model.definitions.rootElement
          ?.filter((e) => e.__$$element === "message")
          .map((m) => [m["@_id"], m] as [string, BPMN20__tMessage])
      )
  );

  return (
    <>
      <InputGroup>
        <InputGroupText>
          <svg width={30} height={30}>
            <MessageEventSymbolSvg
              stroke={"black"}
              cx={15}
              cy={15}
              innerCircleRadius={15}
              fill={"white"}
              filled={false}
            />
          </svg>
        </InputGroupText>
        <FormSelect onChange={onChange} value={value} isDisabled={isReadOnly}>
          <FormSelectOption label={"Select a Message..."} isPlaceholder={true} isDisabled={true} />
          {value && <FormSelectOption label={`Remove '${messagesById.get(value)?.["@_name"]}'...`} />}
          {[...messagesById.values()].map((m) => (
            <FormSelectOption key={m["@_id"]} label={m["@_name"] ?? `<Unknown>`} value={m["@_id"]} />
          ))}
        </FormSelect>
      </InputGroup>
    </>
  );
}
