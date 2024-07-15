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

import { NODE_TYPES } from "../nodes/NodeTypes";
import { EDGE_TYPES } from "../edges/EdgeTypes";

type Values<T> = T[keyof T];

export type NodeType = Values<typeof NODE_TYPES>;
export type EdgeType = Values<typeof EDGE_TYPES>;

export const graphStructure: Map<NodeType, Map<EdgeType, Set<NodeType>>> = new Map([
  [NODE_TYPES.dataObject, new Map<EdgeType, Set<NodeType>>([])],
  [NODE_TYPES.task, new Map<EdgeType, Set<NodeType>>([])],
  [NODE_TYPES.textAnnotation, new Map<EdgeType, Set<NodeType>>([])],
]);

export const outgoingStructure = {
  [NODE_TYPES.dataObject]: {
    nodes: [],
    edges: [],
  },
  [NODE_TYPES.task]: {
    nodes: [],
    edges: [],
  },
  [NODE_TYPES.textAnnotation]: {
    nodes: [],
    edges: [],
  },
};

export const containment = new Map<NodeType, Set<NodeType>>([[NODE_TYPES.lane, new Set([NODE_TYPES.task])]]);

function outgoingNodes(srcNodeType: NodeType): NodeType[] {
  return Array.from((graphStructure.get(srcNodeType) ?? new Map()).values()).flatMap((tgt) => [...tgt]);
}

function outgoingEdges(srcNodeType: NodeType): EdgeType[] {
  return Array.from((graphStructure.get(srcNodeType) ?? new Map()).keys());
}

export function getDefaultEdgeTypeBetween(source: NodeType, target: NodeType): EdgeType | undefined {
  const edges = getEdgeTypesBetween(source, target);
  if (edges.length > 1) {
    console.debug(
      `Multiple edges possible for ${source} --> ${target}. Choosing first one in structure definition: ${edges[0]}.`
    );
  }

  return edges[0];
}

export function getEdgeTypesBetween(source: NodeType, target: NodeType): EdgeType[] {
  const sourceStructure = graphStructure.get(source);
  if (!sourceStructure) {
    return [];
  }

  const possibleEdges: EdgeType[] = [];
  for (const [e, t] of [...sourceStructure.entries()]) {
    if (t.has(target)) {
      possibleEdges.push(e);
    }
  }

  return possibleEdges;
}
