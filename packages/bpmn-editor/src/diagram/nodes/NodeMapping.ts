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

import {
  OutgoingStuffNodePanelEdgeMapping,
  OutgoingStuffNodePanelNodeMapping,
} from "@kie-tools/reactflow-editors-base/dist/nodes/OutgoingStuffNodePanel";
import { BpmnEdgeType, BpmnNodeType } from "../BpmnGraphStructure";
import { EDGE_TYPES } from "../edges/EdgeTypes";
import { NODE_TYPES } from "./NodeTypes";

export const bpmnNodesOutgoingStuffNodePanelMapping: OutgoingStuffNodePanelNodeMapping<
  Exclude<BpmnNodeType, typeof NODE_TYPES.dataObject | typeof NODE_TYPES.unknown | typeof NODE_TYPES.group>
> = {
  node_startEvent: {
    actionTitle: "Add Start Event",
    icon: undefined as any,
  },
  node_intermediateCatchEvent: {
    actionTitle: "Add Intermediate Catch Event",
    icon: undefined as any,
  },
  node_intermediateThrowEvent: {
    actionTitle: "Add Intermediate Throw Event",
    icon: undefined as any,
  },
  node_endEvent: {
    actionTitle: "Add End Event",
    icon: undefined as any,
  },
  node_task: {
    actionTitle: "Add Task",
    icon: undefined as any,
  },
  node_subProcess: {
    actionTitle: "Add Sub-Process",
    icon: undefined as any,
  },
  node_gateway: {
    actionTitle: "Add Gateway",
    icon: undefined as any,
  },
  node_textAnnotation: {
    actionTitle: "Add Text Annotation",
    icon: undefined as any,
  },
};

export const bpmnEdgesOutgoingStuffNodePanelMapping: OutgoingStuffNodePanelEdgeMapping<BpmnEdgeType> = {
  [EDGE_TYPES.sequenceFlow]: {
    actionTitle: "Add Sequence Flow",
    icon: undefined as any,
  },
  [EDGE_TYPES.association]: {
    actionTitle: "Add Association",
    icon: undefined as any,
  },
};
