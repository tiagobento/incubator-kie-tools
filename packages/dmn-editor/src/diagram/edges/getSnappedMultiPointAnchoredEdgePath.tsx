import * as RF from "reactflow";
import { getDiscretelyAutoPositionedEdgeParamsForRfNodes } from "../maths/Maths";
import {
  DC__Point,
  DMNDI13__DMNEdge,
  DMNDI13__DMNShape,
} from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_4/ts-gen/types";
import { snapPoint } from "../SnapGrid";
import { getDistance, getNodeCenterPoint, getNodeIntersection, pointsToPath } from "../maths/DmnMaths";
import { AutoMarker } from "./AutoMarker";

export function getSnappedMultiPointAnchoredEdgePath({
  dmnEdge,
  sourceNode,
  targetNode,
  dmnShapeSource,
  dmnShapeTarget,
}: {
  dmnEdge: DMNDI13__DMNEdge | undefined;
  sourceNode: RF.Node<any, string | undefined> | undefined;
  targetNode: RF.Node<any, string | undefined> | undefined;
  dmnShapeSource: DMNDI13__DMNShape | undefined;
  dmnShapeTarget: DMNDI13__DMNShape | undefined;
}) {
  if (!sourceNode || !targetNode) {
    return { path: undefined, points: [] };
  }

  const points: DC__Point[] = new Array(Math.max(2, dmnEdge?.["di:waypoint"]?.length ?? 0));

  const discreteAuto = getDiscretelyAutoPositionedEdgeParamsForRfNodes(sourceNode, targetNode);

  if (dmnEdge?.["@_id"]?.endsWith(AutoMarker.BOTH)) {
    points[0] = { "@_x": discreteAuto.sx, "@_y": discreteAuto.sy };
    points[points.length - 1] = { "@_x": discreteAuto.tx, "@_y": discreteAuto.ty };
  } else if (dmnEdge?.["@_id"]?.endsWith(AutoMarker.SOURCE)) {
    points[0] = { "@_x": discreteAuto.sx, "@_y": discreteAuto.sy };
  } else if (dmnEdge?.["@_id"]?.endsWith(AutoMarker.TARGET)) {
    points[points.length - 1] = { "@_x": discreteAuto.tx, "@_y": discreteAuto.ty };
  }

  ///////

  if (!dmnEdge?.["di:waypoint"]) {
    console.warn("No waypoints found. Creating a default straight line.");
    points[0] = { "@_x": discreteAuto.sx, "@_y": discreteAuto.sy };
    points[points.length - 1] = { "@_x": discreteAuto.tx, "@_y": discreteAuto.ty };
  } else if (dmnEdge?.["di:waypoint"].length < 2) {
    console.warn("Invalid waypoints for edge. Creating a default straight line.");
    points[0] = { "@_x": discreteAuto.sx, "@_y": discreteAuto.sy };
    points[points.length - 1] = { "@_x": discreteAuto.tx, "@_y": discreteAuto.ty };
  } else {
    const firstWaypoint = dmnEdge["di:waypoint"][0];
    const secondWaypoint = points[1] ?? dmnEdge["di:waypoint"][1];
    const src = getSnappedHandlePosition(
      dmnShapeSource!,
      firstWaypoint,
      sourceNode,
      points.length === 2 ? getNodeCenterPoint(targetNode) : snapPoint(secondWaypoint)
    );
    points[0] ??= src.point;

    const lastWaypoint = dmnEdge["di:waypoint"][dmnEdge["di:waypoint"].length - 1];
    const secondToLastWaypoint = points[points.length - 2] ?? dmnEdge["di:waypoint"][dmnEdge["di:waypoint"].length - 2];
    const tgt = getSnappedHandlePosition(
      dmnShapeTarget!,
      lastWaypoint,
      targetNode,
      points.length === 2 ? getNodeCenterPoint(sourceNode) : snapPoint(secondToLastWaypoint)
    );
    points[points.length - 1] ??= tgt.point;
  }

  ///////

  // skip first and last elements, as they are pre-filled using the logic below.
  for (let i = 1; i < points.length - 1; i++) {
    points[i] = snapPoint({ ...(dmnEdge?.["di:waypoint"] ?? [])[i] });
  }

  return { path: pointsToPath(points), points };
}

export function getSnappedHandlePosition(
  shape: DMNDI13__DMNShape,
  waypoint: DC__Point,
  snappedNode: RF.Node,
  snappedWaypoint2: DC__Point
) {
  const x = shape?.["dc:Bounds"]?.["@_x"] ?? 0;
  const y = shape?.["dc:Bounds"]?.["@_y"] ?? 0;
  const w = shape?.["dc:Bounds"]?.["@_width"] ?? 0;
  const h = shape?.["dc:Bounds"]?.["@_height"] ?? 0;

  const xx = snappedNode.positionAbsolute?.x ?? 0;
  const yy = snappedNode.positionAbsolute?.y ?? 0;
  const ww = snappedNode.width ?? 0;
  const hh = snappedNode.height ?? 0;

  const center = { "@_x": x + w / 2, "@_y": y + h / 2 };
  const left = { "@_x": x, "@_y": y + h / 2 };
  const right = { "@_x": x + w, "@_y": y + h / 2 };
  const top = { "@_x": x + w / 2, "@_y": y };
  const bottom = { "@_x": x + w / 2, "@_y": y + h };

  if (getDistance(center, waypoint) <= 1) {
    return {
      pos: "center",
      point: getNodeIntersection(snappedNode, snappedWaypoint2),
    };
  } else if (getDistance(top, waypoint) <= 1) {
    return {
      pos: "top",
      point: { "@_x": xx + ww / 2, "@_y": yy },
    };
  } else if (getDistance(right, waypoint) <= 1) {
    return {
      pos: "right",
      point: { "@_x": xx + ww, "@_y": yy + hh / 2 },
    };
  } else if (getDistance(bottom, waypoint) <= 1) {
    return {
      pos: "bottom",
      point: { "@_x": xx + ww / 2, "@_y": yy + hh },
    };
  } else if (getDistance(left, waypoint) <= 1) {
    return {
      pos: "left",
      point: { "@_x": xx, "@_y": yy + hh / 2 },
    };
  } else {
    console.warn("Can't find match of NSWE/Center handles. Using Center as default.");
    return {
      pos: "center",
      point: getNodeIntersection(snappedNode, snappedWaypoint2),
    };
  }
}