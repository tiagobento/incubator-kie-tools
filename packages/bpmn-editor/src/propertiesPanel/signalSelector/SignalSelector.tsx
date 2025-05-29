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
import { BPMN20__tSignal, BPMN20__tProcess } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { ElementFilter } from "@kie-tools/xml-parser-ts/dist/elementFilter";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import { InputGroup, InputGroupText } from "@patternfly/react-core/dist/js/components/InputGroup";
import { SignalEventSymbolSvg } from "../../diagram/nodes/NodeSvgs";
import { Normalized } from "../../normalization/normalize";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../../store/StoreContext";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";
import { TypeaheadSelect } from "../../typeaheadSelect/TypeaheadSelect";
import { useCallback, useMemo } from "react";
import { addOrGetSignals } from "../../mutations/addOrGetSignals";
import "./SignalSelector.css";

export type EventWithSignal =
  | undefined
  | Normalized<
      ElementFilter<
        Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>,
        "startEvent" | "intermediateCatchEvent" | "intermediateThrowEvent" | "endEvent" | "boundaryEvent"
      >
    >;

export type OnSignalChange = (newSignalRef: string) => void;

export function SignalSelector({
  value,
  onChange,
  omitValues,
}: {
  value: string | undefined;
  onChange: OnSignalChange;
  omitValues?: string[];
}) {
  const isReadOnly = useBpmnEditorStore((s) => s.settings.isReadOnly);

  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

  const signalsById = useBpmnEditorStore(
    (s) =>
      new Map(
        s.bpmn.model.definitions.rootElement
          ?.filter((e) => e.__$$element === "signal")
          .map((m) => [m["@_id"], m] as [string, BPMN20__tSignal])
      )
  );

  const omitIdsSet = useMemo(() => new Set<string | undefined>(omitValues), [omitValues]);

  const options = useMemo(
    () =>
      [...signalsById.values()]
        .filter((m) => !omitIdsSet.has(m["@_id"]))
        .map((m) => ({ value: m["@_id"], children: m["@_name"] })),
    [signalsById, omitIdsSet]
  );

  const onCreate = useCallback(
    (newSignalName: string) => {
      let newSignalId: string;
      bpmnEditorStoreApi.setState((s) => {
        newSignalId = addOrGetSignals({
          definitions: s.bpmn.model.definitions,
          signalName: newSignalName,
        }).signalRef;
      });
      return newSignalId!;
    },
    [bpmnEditorStoreApi]
  );

  return (
    <>
      <InputGroup>
        <InputGroupText>
          <svg width={30} height={30}>
            <SignalEventSymbolSvg
              stroke={"black"}
              cx={16}
              cy={16}
              innerCircleRadius={13}
              filled={false}
              x={0}
              y={0}
              outerCircleRadius={15}
            />
          </svg>
        </InputGroupText>
        <TypeaheadSelect
          id={`signal-selector-${generateUuid()}`}
          setSelected={onChange}
          selected={value}
          isDisabled={isReadOnly}
          options={options}
          onCreateNewOption={onCreate}
          createNewOptionLabel={"Create Signal"}
        />
      </InputGroup>
    </>
  );
}
