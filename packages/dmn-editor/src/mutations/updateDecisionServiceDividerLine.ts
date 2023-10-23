import {
  DC__Bounds,
  DMN15__tDecisionService,
  DMN15__tDefinitions,
  DMNDI15__DMNDecisionServiceDividerLine,
  DMNDI15__DMNShape,
} from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { addOrGetDefaultDiagram } from "./addOrGetDefaultDiagram";
import { snapShapeDimensions, snapShapePosition } from "../diagram/SnapGrid";
import { MIN_NODE_SIZES } from "../diagram/nodes/DefaultSizes";
import { SnapGrid } from "../store/Store";
import { NODE_TYPES } from "../diagram/nodes/NodeTypes";

export const DECISION_SERVICE_DIVIDER_LINE_PADDING = 100;

export function updateDecisionServiceDividerLine({
  definitions,
  dmnShapesByHref,
  shapeIndex,
  localYPosition,
  drgElementIndex,
  snapGrid,
}: {
  definitions: DMN15__tDefinitions;
  dmnShapesByHref: Map<string, DMNDI15__DMNShape & { index: number }>;
  shapeIndex: number;
  localYPosition: number;
  drgElementIndex: number;
  snapGrid: SnapGrid;
}) {
  const { diagramElements } = addOrGetDefaultDiagram({ definitions });

  const shape = diagramElements?.[shapeIndex] as DMNDI15__DMNShape | undefined;
  const shapeBounds = shape?.["dc:Bounds"];
  if (!shapeBounds) {
    throw new Error("Cannot reposition divider line of non-existent shape bounds");
  }

  const ds = definitions.drgElement![drgElementIndex] as DMN15__tDecisionService;
  if (!ds) {
    throw new Error("Cannot reposition divider line of non-existent Decision Service");
  }

  const decisionMinSizes = MIN_NODE_SIZES[NODE_TYPES.decision](snapGrid);
  const decisionServiceMinSizes = MIN_NODE_SIZES[NODE_TYPES.decisionService](snapGrid);

  const snappedPosition = snapShapePosition(snapGrid, shape);
  const snappedDimensions = snapShapeDimensions(snapGrid, shape, decisionServiceMinSizes);

  const upperLimit = (ds.outputDecision ?? []).reduce((acc, od) => {
    const v =
      snapShapePosition(snapGrid, dmnShapesByHref.get(od["@_href"])!).y +
      snapShapeDimensions(snapGrid, dmnShapesByHref.get(od["@_href"])!, decisionMinSizes).height;
    return v > acc ? v : acc;
  }, snappedPosition.y + DECISION_SERVICE_DIVIDER_LINE_PADDING);

  const lowerLimit = (ds.encapsulatedDecision ?? []).reduce((acc, ed) => {
    const v = snapShapePosition(snapGrid, dmnShapesByHref.get(ed["@_href"])!).y;
    return v < acc ? v : acc;
  }, snappedPosition.y + snappedDimensions.height - DECISION_SERVICE_DIVIDER_LINE_PADDING);

  const newDividerLineYPosition = Math.max(upperLimit, Math.min(snappedPosition.y + localYPosition, lowerLimit));

  shape["dmndi:DMNDecisionServiceDividerLine"] ??= getCentralizedDecisionServiceDividerLine(shapeBounds);
  shape["dmndi:DMNDecisionServiceDividerLine"]["di:waypoint"]![0]["@_y"] = newDividerLineYPosition;
  shape["dmndi:DMNDecisionServiceDividerLine"]["di:waypoint"]![1]["@_y"] = newDividerLineYPosition;
}

export function getCentralizedDecisionServiceDividerLine(bounds: DC__Bounds): DMNDI15__DMNDecisionServiceDividerLine {
  return {
    "di:waypoint": [
      { "@_x": bounds["@_x"], "@_y": bounds["@_y"] + bounds["@_height"] / 2 },
      {
        "@_x": bounds["@_x"] + bounds["@_height"],
        "@_y": bounds["@_y"] + bounds["@_height"] / 2,
      },
    ],
  };
}
