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

import { NodeType } from "../diagram/connections/graphStructure";
import { NODE_TYPES } from "../diagram/nodes/NodeTypes";

export enum NodeNature {
  TOP_LEVEL = "TOP_LEVEL",
  PROCESS_FLOW_ELEMENT = "PROCESS_FLOW_ELEMENT",
  ARTIFACT = "ARTIFACT",
  UNKNOWN = "UNKNOWN",
}

export const nodeNatures: Record<NodeType, NodeNature> = {
  // TOP_LEVEL
  [NODE_TYPES.dataObject]: NodeNature.TOP_LEVEL,
  [NODE_TYPES.lane]: NodeNature.TOP_LEVEL,

  // PROCESS_FLOW_ELELEMENT
  [NODE_TYPES.task]: NodeNature.PROCESS_FLOW_ELEMENT,
  [NODE_TYPES.startEvent]: NodeNature.PROCESS_FLOW_ELEMENT,
  [NODE_TYPES.endEvent]: NodeNature.PROCESS_FLOW_ELEMENT,
  [NODE_TYPES.intermediateEvent]: NodeNature.PROCESS_FLOW_ELEMENT,
  [NODE_TYPES.gateway]: NodeNature.PROCESS_FLOW_ELEMENT,
  [NODE_TYPES.custom]: NodeNature.PROCESS_FLOW_ELEMENT,
  [NODE_TYPES.subprocess]: NodeNature.PROCESS_FLOW_ELEMENT,

  // ARTIFACT
  [NODE_TYPES.textAnnotation]: NodeNature.ARTIFACT,
  [NODE_TYPES.group]: NodeNature.ARTIFACT,
  [NODE_TYPES.unknown]: NodeNature.UNKNOWN,
};
