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

import { switchExpression } from "@kie-tools-core/switch-expression-ts";
import { NodeBpmnObjects } from "./Nodes";

export const NODE_TYPES = {
  startEvent: "node_startEvent" as const,
  intermediateCatchEvent: "node_intermediateCatchEvent" as const,
  intermediateThrowEvent: "node_intermediateThrowEvent" as const,
  endEvent: "node_endEvent" as const,
  task: "node_task" as const,
  subProcess: "node_subProcess" as const,
  gateway: "node_gateway" as const,
  dataObject: "node_dataObject" as const,
  textAnnotation: "node_textAnnotation" as const,
  unknown: "node_unknown" as const,
  group: "node_group" as const,
  // lane: "node_lane" as const,
  // custom: "node_custom" as const,
};

export function getNodeTypeFromBpmnObject(bpmnObject: NodeBpmnObjects) {
  if (!bpmnObject) {
    return NODE_TYPES.unknown;
  }

  const type = switchExpression(bpmnObject.__$$element, {
    dataObject: NODE_TYPES.dataObject,
    task: NODE_TYPES.task,
    textAnnotation: NODE_TYPES.textAnnotation,
    default: undefined,
  });

  return type;
}
