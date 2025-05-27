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
import { ElementFilter } from "@kie-tools/xml-parser-ts/dist/elementFilter";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import { InputGroup, InputGroupText } from "@patternfly/react-core/dist/js/components/InputGroup";
import { TextInput } from "@patternfly/react-core/dist/js/components/TextInput";
import { MessageEventSymbolSvg } from "../../diagram/nodes/NodeSvgs";
import { Normalized } from "../../normalization/normalize";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../../store/StoreContext";
import "./MessageSelector.css";

export type EventWithMessage =
  | undefined
  | Normalized<
      ElementFilter<
        Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>,
        "startEvent" | "intermediateCatchEvent" | "intermediateThrowEvent" | "endEvent" | "boundaryEvent"
      >
    >;

export type OnMessageChange = (newMessage: string) => void;

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

  return (
    <>
      <InputGroup>
        <InputGroupText>
          <svg width={40} height={40}>
            <MessageEventSymbolSvg
              stroke={"black"}
              cx={20}
              cy={20}
              innerCircleRadius={20}
              fill={"white"}
              filled={false}
            />
          </svg>
        </InputGroupText>
        <TextInput
          aria-label={"Message"}
          type={"text"}
          isDisabled={isReadOnly}
          value={value}
          onChange={onChange}
          placeholder={"Enter Message..."}
        />
      </InputGroup>
    </>
  );
}
