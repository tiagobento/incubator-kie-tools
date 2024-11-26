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
import { BPMN20__tProcess } from "@kie-tools/bpmn-marshaller/src/schemas/bpmn-2_0/ts-gen/types";
import { ElementFilter } from "@kie-tools/xml-parser-ts/dist/elementFilter";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import { useCallback, useMemo } from "react";
import { visitFlowElementsAndArtifacts } from "../../../mutations/_elementVisitor";
import { addOrGetProcessAndDiagramElements } from "../../../mutations/addOrGetProcessAndDiagramElements";
import { Normalized } from "../../../normalization/normalize";
import { useBpmnEditorStoreApi } from "../../../store/StoreContext";
import { SubProcessIcon } from "../NodeIcons";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";

export type SubProcess = Normalized<
  ElementFilter<
    Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>,
    "adHocSubProcess" | "subProcess" | "transaction"
  >
>;

export function useSubProcessNodeMorphingActions(subProcess: SubProcess) {
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

  const morphSubProcess = useCallback(
    (subProcessElement: SubProcess["__$$element"] | "eventSubProcess" | "multiInstanceSubProcess") => {
      // 1 - Sub process
      // 2 - Event sub process
      // 3 - Ad-hoc sub-process
      // 4 - Transaction
      bpmnEditorStoreApi.setState((s) => {
        const { process } = addOrGetProcessAndDiagramElements({
          definitions: s.bpmn.model.definitions,
        });
        visitFlowElementsAndArtifacts(process, ({ array, index, owner, element }) => {
          if (element["@_id"] === subProcess["@_id"] && element.__$$element === subProcess.__$$element) {
            if (subProcessElement === "eventSubProcess") {
              array[index] = {
                "@_id": element["@_id"], // keeps old ID
                "@_name": element["@_name"], // keeps old Name
                __$$element: "subProcess",
                "@_triggeredByEvent": true,
              };
            } else if (subProcessElement === "multiInstanceSubProcess") {
              array[index] = {
                "@_id": element["@_id"], // keeps old ID
                "@_name": element["@_name"], // keeps old Name
                __$$element: "subProcess",
                loopCharacteristics: {
                  "@_id": generateUuid(),
                  __$$element: "multiInstanceLoopCharacteristics",
                },
              };
            } else {
              array[index] = {
                "@_id": element["@_id"], // keeps old ID
                "@_name": element["@_name"], // keeps old Name
                __$$element: subProcessElement,
              };
            }
            return false; // Will stop visiting.
          }
        });
      });
    },
    [bpmnEditorStoreApi, subProcess]
  );

  const morphingActions = useMemo(() => {
    return [
      {
        icon: <SubProcessIcon variant={"other"} />,
        key: "1",
        title: "Sub-process",
        id: "subProcess",
        action: () => morphSubProcess("subProcess"),
      } as const,
      {
        icon: <SubProcessIcon variant={"event"} />,
        key: "2",
        title: "Event",
        id: "eventSubProcess",
        action: () => morphSubProcess("eventSubProcess"),
      } as const,
      {
        icon: <>|||</>,
        key: "3",
        title: "Multi-instance",
        id: "multiInstanceSubProcess",
        action: () => morphSubProcess("multiInstanceSubProcess"),
      } as const,
      {
        icon: <>~</>,
        key: "4",
        title: "Ad-hoc",
        id: "adHocSubProcess",
        action: () => morphSubProcess("adHocSubProcess"),
      } as const,
      {
        icon: <SubProcessIcon variant={"transaction"} />,
        key: "5",
        title: "Transaction",
        id: "transaction",
        action: () => morphSubProcess("transaction"),
      } as const,
    ];
  }, [morphSubProcess]);

  return morphingActions;
}
