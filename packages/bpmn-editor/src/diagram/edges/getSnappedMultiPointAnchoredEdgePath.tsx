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
import {
  BPMNDI__BPMNEdge,
  BPMNDI__BPMNShape,
  DC__Point,
} from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { Normalized } from "../../normalization/normalize";
import { SnapGrid } from "../../store/Store";
import { snapPoint } from "../SnapGrid";
import { PositionalNodeHandleId } from "../connections/PositionalNodeHandles";
import { getHandlePosition, getLineRectangleIntersectionPoint, pointsToPath } from "../maths/DiMaths";
import { Bounds, getBoundsCenterPoint, getDiscretelyAutoPositionedEdgeParams } from "../maths/Maths";
import { AutoPositionedEdgeMarker } from "./AutoPositionedEdgeMarker";

export function getSnappedMultiPointAnchoredEdgePath({
  snapGrid,
  bpmnEdge,
  sourceNodeBounds,
  targetNodeBounds,
  bpmnShapeSource,
  bpmnShapeTarget,
}: {
  snapGrid: SnapGrid;
  bpmnEdge: Normalized<BPMNDI__BPMNEdge> | undefined;
  sourceNodeBounds: Bounds | undefined;
  targetNodeBounds: Bounds | undefined;
  bpmnShapeSource: Normalized<BPMNDI__BPMNShape> | undefined;
  bpmnShapeTarget: Normalized<BPMNDI__BPMNShape> | undefined;
}) {
  if (!sourceNodeBounds || !targetNodeBounds) {
    return { path: undefined, points: [] };
  }

  const points: DC__Point[] = new Array(Math.max(2, bpmnEdge?.["di:waypoint"]?.length ?? 0));

  const discreteAuto = getDiscretelyAutoPositionedEdgeParams(sourceNodeBounds, targetNodeBounds);

  if (bpmnEdge?.["@_id"]?.endsWith(AutoPositionedEdgeMarker.BOTH)) {
    points[0] = { "@_x": discreteAuto.sx, "@_y": discreteAuto.sy };
    points[points.length - 1] = { "@_x": discreteAuto.tx, "@_y": discreteAuto.ty };
  } else if (bpmnEdge?.["@_id"]?.endsWith(AutoPositionedEdgeMarker.SOURCE)) {
    points[0] = { "@_x": discreteAuto.sx, "@_y": discreteAuto.sy };
  } else if (bpmnEdge?.["@_id"]?.endsWith(AutoPositionedEdgeMarker.TARGET)) {
    points[points.length - 1] = { "@_x": discreteAuto.tx, "@_y": discreteAuto.ty };
  }

  ///////

  if (!bpmnEdge?.["di:waypoint"]) {
    console.warn("BPMN DIAGRAM: No waypoints found. Creating a default straight line.");
    points[0] = { "@_x": discreteAuto.sx, "@_y": discreteAuto.sy };
    points[points.length - 1] = { "@_x": discreteAuto.tx, "@_y": discreteAuto.ty };
  } else if (bpmnEdge?.["di:waypoint"].length < 2) {
    console.warn("BPMN DIAGRAM: Invalid waypoints for edge. Creating a default straight line.");
    points[0] = { "@_x": discreteAuto.sx, "@_y": discreteAuto.sy };
    points[points.length - 1] = { "@_x": discreteAuto.tx, "@_y": discreteAuto.ty };
  } else {
    const firstWaypoint = bpmnEdge["di:waypoint"][0];
    const secondWaypoint = points[1] ?? bpmnEdge["di:waypoint"][1];
    const sourceHandlePoint = getSnappedHandlePosition(
      bpmnShapeSource!,
      sourceNodeBounds,
      firstWaypoint,
      points.length === 2 ? getBoundsCenterPoint(targetNodeBounds) : snapPoint(snapGrid, secondWaypoint)
    );
    points[0] ??= sourceHandlePoint;

    const lastWaypoint = bpmnEdge["di:waypoint"][bpmnEdge["di:waypoint"].length - 1];
    const secondToLastWaypoint =
      points[points.length - 2] ?? bpmnEdge["di:waypoint"][bpmnEdge["di:waypoint"].length - 2];
    const targetHandlePoint = getSnappedHandlePosition(
      bpmnShapeTarget!,
      targetNodeBounds,
      lastWaypoint,
      points.length === 2 ? getBoundsCenterPoint(sourceNodeBounds) : snapPoint(snapGrid, secondToLastWaypoint)
    );
    points[points.length - 1] ??= targetHandlePoint;
  }

  ///////

  // skip first and last elements, as they are pre-filled using the logic below.
  for (let i = 1; i < points.length - 1; i++) {
    points[i] = snapPoint(snapGrid, { ...(bpmnEdge?.["di:waypoint"] ?? [])[i] });
  }

  return { path: pointsToPath(points), points };
}

export function getSnappedHandlePosition(
  shape: Normalized<BPMNDI__BPMNShape>,
  snappedNode: Bounds,
  originalHandleWaypoint: DC__Point,
  snappedSecondWaypoint: DC__Point
): DC__Point {
  const { handlePosition } = getHandlePosition({ shapeBounds: shape["dc:Bounds"], waypoint: originalHandleWaypoint });

  const centerHandleWaypoint = getBoundsCenterPoint(snappedNode);

  const nodeRectangle = {
    x: snappedNode.x ?? 0,
    y: snappedNode.y ?? 0,
    width: snappedNode.width ?? 0,
    height: snappedNode.height ?? 0,
  };

  return switchExpression(handlePosition, {
    [PositionalNodeHandleId.Top]: { "@_x": nodeRectangle.x + nodeRectangle.width / 2, "@_y": nodeRectangle.y },
    [PositionalNodeHandleId.Right]: {
      "@_x": nodeRectangle.x + nodeRectangle.width,
      "@_y": nodeRectangle.y + nodeRectangle.height / 2,
    },
    [PositionalNodeHandleId.Bottom]: {
      "@_x": nodeRectangle.x + nodeRectangle.width / 2,
      "@_y": nodeRectangle.y + nodeRectangle.height,
    },
    [PositionalNodeHandleId.Left]: { "@_x": nodeRectangle.x, "@_y": nodeRectangle.y + nodeRectangle.height / 2 },
    [PositionalNodeHandleId.Center]: getLineRectangleIntersectionPoint(
      snappedSecondWaypoint,
      centerHandleWaypoint,
      nodeRectangle
    ),
  });
}
