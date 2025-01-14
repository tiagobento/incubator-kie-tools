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
import { CallActivityIcon, TaskIcon } from "../NodeIcons";

export type Task = Normalized<
  ElementFilter<
    Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>,
    "task" | "scriptTask" | "serviceTask" | "businessRuleTask" | "userTask" | "callActivity"
  >
>;

export function useTaskNodeMorphingActions(task: Task) {
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

  const morphTask = useCallback(
    (taskElement: Task["__$$element"]) => {
      // 1 - Task
      // 2 - User
      // 3 - Business Rule
      // 4 - Service
      // 5 - Script
      // 6 - Call activity
      bpmnEditorStoreApi.setState((s) => {
        const { process } = addOrGetProcessAndDiagramElements({
          definitions: s.bpmn.model.definitions,
        });
        visitFlowElementsAndArtifacts(process, ({ array, index, owner, element }) => {
          if (element["@_id"] === task["@_id"] && element.__$$element === task.__$$element) {
            array[index] = {
              "@_id": element["@_id"], // keeps old ID
              "@_name": element["@_name"], // keeps old Name
              __$$element: taskElement,
            };
            return false; // Will stop visiting.
          }
        });
      });
    },
    [bpmnEditorStoreApi, task]
  );

  const morphingActions = useMemo(() => {
    return [
      {
        icon: <TaskIcon />,
        key: "1",
        title: "Task",
        id: "task",
        action: () => morphTask("task"),
      } as const,
      {
        icon: <TaskIcon variant={"userTask"} isIcon={true} />,
        key: "2",
        title: "User task",
        id: "userTask",
        action: () => morphTask("userTask"),
      } as const,
      {
        icon: <TaskIcon variant={"businessRuleTask"} isIcon={true} />,
        key: "3",
        title: "Business Rule task",
        id: "businessRuleTask",
        action: () => morphTask("businessRuleTask"),
      } as const,
      {
        icon: <TaskIcon variant={"serviceTask"} isIcon={true} />,
        key: "4",
        title: "Service task",
        id: "serviceTask",
        action: () => morphTask("serviceTask"),
      } as const,
      {
        icon: <TaskIcon variant={"scriptTask"} isIcon={true} />,
        key: "5",
        title: "Script task",
        id: "scriptTask",
        action: () => morphTask("scriptTask"),
      } as const,
      {
        icon: <CallActivityIcon />,
        key: "6",
        title: "Call activity",
        id: "callActivity",
        action: () => morphTask("callActivity"),
      } as const,
    ];
  }, [morphTask]);

  return morphingActions;
}
