import { switchExpression } from "@kie-tools-core/switch-expression-ts";
import {
  DMN15__tDecisionService,
  DMN15__tDefinitions,
  DMNDI15__DMNEdge,
  DMNDI15__DMNShape,
} from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { snapShapeDimensions, snapShapePosition } from "../diagram/SnapGrid";
import { TargetHandleId } from "../diagram/connections/PositionalTargetNodeHandles";
import { NodeType } from "../diagram/connections/graphStructure";
import { getHandlePosition } from "../diagram/maths/DmnMaths";
import { MIN_NODE_SIZES } from "../diagram/nodes/DefaultSizes";
import { NODE_TYPES } from "../diagram/nodes/NodeTypes";
import { SnapGrid } from "../store/Store";
import { addOrGetDefaultDiagram } from "./addOrGetDefaultDiagram";

export function resizeNode({
  definitions,
  dmnShapesByHref,
  snapGrid,
  change,
}: {
  definitions: DMN15__tDefinitions;
  dmnShapesByHref: Map<string, DMNDI15__DMNShape & { index: number }>;
  snapGrid: SnapGrid;
  change: {
    nodeType: NodeType;
    isExternal: boolean;
    index: number;
    shapeIndex: number;
    dimension: { "@_width": number; "@_height": number };
    sourceEdgeIndexes: number[];
    targetEdgeIndexes: number[];
  };
}) {
  const edgeIndexesAlreadyUpdated = new Set<number>();

  const { diagramElements } = addOrGetDefaultDiagram({ definitions });

  const shape = diagramElements?.[change.shapeIndex] as DMNDI15__DMNShape | undefined;
  const shapeBounds = shape?.["dc:Bounds"];
  if (!shapeBounds) {
    throw new Error("Cannot resize non-existent shape bounds");
  }

  const limit = { x: 0, y: 0 };
  if (change.nodeType === NODE_TYPES.decisionService) {
    const ds = definitions.drgElement![change.index] as DMN15__tDecisionService;

    // We ignore handling the contents of the Decision Service when it is external
    if (!change.isExternal) {
      ds.encapsulatedDecision?.forEach((ed) => {
        const edShape = dmnShapesByHref.get(ed["@_href"])!;
        const dim = snapShapeDimensions(snapGrid, edShape, MIN_NODE_SIZES[NODE_TYPES.decision](snapGrid));
        const pos = snapShapePosition(snapGrid, edShape);
        if (pos.x + dim.width > limit.x) {
          limit.x = pos.x + dim.width;
        }

        if (pos.y + dim.height > limit.y) {
          limit.y = pos.y + dim.height;
        }
      });
    }
  }

  const snappedPosition = snapShapePosition(snapGrid, shape);
  const snappedDimensions = snapShapeDimensions(snapGrid, shape, MIN_NODE_SIZES[change.nodeType](snapGrid));

  const newDimensions = {
    width: Math.max(change.dimension["@_width"], limit.x - snappedPosition.x),
    height: Math.max(change.dimension["@_height"], limit.y - snappedPosition.y),
  };

  const deltaWidth = newDimensions.width - snappedDimensions.width;
  const deltaHeight = newDimensions.height - snappedDimensions.height;

  const offsetByPosition = (position: TargetHandleId | undefined) => {
    return switchExpression(position, {
      [TargetHandleId.TargetCenter]: { x: deltaWidth / 2, y: deltaHeight / 2 },
      [TargetHandleId.TargetTop]: { x: deltaWidth / 2, y: 0 },
      [TargetHandleId.TargetRight]: { x: deltaWidth, y: deltaHeight / 2 },
      [TargetHandleId.TargetBottom]: { x: deltaWidth / 2, y: deltaHeight },
      [TargetHandleId.TargetLeft]: { x: 0, y: deltaHeight / 2 },
    });
  };

  const offsetEdges = (args: { edgeIndexes: number[]; waypointSelector: "last" | "first" }) => {
    for (const edgeIndex of args.edgeIndexes) {
      if (edgeIndexesAlreadyUpdated.has(edgeIndex)) {
        continue;
      }

      edgeIndexesAlreadyUpdated.add(edgeIndex);

      const edge = diagramElements[edgeIndex] as DMNDI15__DMNEdge | undefined;
      if (!edge || !edge["di:waypoint"]) {
        throw new Error("Cannot reposition non-existent edge");
      }

      const waypoint = switchExpression(args.waypointSelector, {
        first: edge["di:waypoint"][0],
        last: edge["di:waypoint"][edge["di:waypoint"].length - 1],
      });

      const offset = offsetByPosition(getHandlePosition({ shapeBounds, waypoint }).handlePosition);
      waypoint["@_x"] += offset.x;
      waypoint["@_y"] += offset.y;
    }
  };

  // Reposition edges after resizing

  offsetEdges({ edgeIndexes: change.sourceEdgeIndexes, waypointSelector: "first" });
  offsetEdges({ edgeIndexes: change.targetEdgeIndexes, waypointSelector: "last" });

  // Update at the end because we need the original shapeBounds value to correctly identify the position of the edges

  shapeBounds["@_width"] = newDimensions.width;
  shapeBounds["@_height"] = newDimensions.height;
}
