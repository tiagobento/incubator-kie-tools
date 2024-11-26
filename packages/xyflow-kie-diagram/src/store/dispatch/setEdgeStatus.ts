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
  XyFlowDiagramState,
  XyFlowKieDiagramEdgeData,
  XyFlowKieDiagramEdgeStatus,
  XyFlowKieDiagramNodeData,
} from "../../store/State";

export function setEdgeStatus<
  S extends XyFlowDiagramState<S, N, NData, EData>,
  N extends string,
  NData extends XyFlowKieDiagramNodeData<N, NData>,
  EData extends XyFlowKieDiagramEdgeData,
>(edgeId: string, newStatus: Partial<XyFlowKieDiagramEdgeStatus>, s: XyFlowDiagramState<S, N, NData, EData>) {
  //selected
  if (newStatus.selected !== undefined) {
    if (newStatus.selected) {
      s.xyFlowKieDiagram._selectedEdges.push(edgeId);
    } else {
      s.xyFlowKieDiagram._selectedEdges = s.xyFlowKieDiagram._selectedEdges.filter((s) => s !== edgeId);
    }
  }
  //dragging
  if (newStatus.draggingWaypoint !== undefined) {
    if (newStatus.draggingWaypoint) {
      s.xyFlowKieDiagram.draggingWaypoints.push(edgeId);
    } else {
      s.xyFlowKieDiagram.draggingWaypoints = s.xyFlowKieDiagram.draggingWaypoints.filter((s) => s !== edgeId);
    }
  }
}
