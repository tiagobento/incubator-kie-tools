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

import { NODE_TYPES } from "./nodes/NodeTypes";
import { EDGE_TYPES } from "./edges/EdgeTypes";
import { GraphStructure, ContainmentMap } from "@kie-tools/reactflow-editors-base/dist/graph/graphStructure";

type Values<T> = T[keyof T];

export type BpmnNodeType = Values<typeof NODE_TYPES>;
export type BpmnEdgeType = Values<typeof EDGE_TYPES>;

export const bpmnGraphStructure: GraphStructure<BpmnNodeType, BpmnEdgeType> = new Map([
  [NODE_TYPES.dataObject, new Map([])],
  [NODE_TYPES.task, new Map([])],
  [NODE_TYPES.textAnnotation, new Map([])],
]);

export const bpmnGraphOutgoingStructure = {
  [NODE_TYPES.startEvent]: {
    nodes: [NODE_TYPES.task],
    edges: [EDGE_TYPES.sequenceFlow],
  },
  [NODE_TYPES.intermediateCatchEvent]: {
    nodes: [],
    edges: [],
  },
  [NODE_TYPES.intermediateThrowEvent]: {
    nodes: [],
    edges: [],
  },
  [NODE_TYPES.endEvent]: {
    nodes: [],
    edges: [],
  },
  [NODE_TYPES.task]: {
    nodes: [NODE_TYPES.task],
    edges: [EDGE_TYPES.sequenceFlow],
  },
  [NODE_TYPES.subProcess]: {
    nodes: [],
    edges: [],
  },
  [NODE_TYPES.gateway]: {
    nodes: [],
    edges: [],
  },
  [NODE_TYPES.dataObject]: {
    nodes: [],
    edges: [],
  },
  [NODE_TYPES.group]: {
    nodes: [],
    edges: [],
  },
  [NODE_TYPES.textAnnotation]: {
    nodes: [],
    edges: [],
  },
};

export const bpmnNodesContainmentMap: ContainmentMap<BpmnNodeType> = new Map([]);
