import {
  DMN15__tDefinitions,
  DMNDI15__DMNEdge,
  DMNDI15__DMNShape,
} from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { TargetHandleId } from "../diagram/connections/NodeHandles";
import { getHandlePosition } from "../diagram/maths/DmnMaths";
import { switchExpression } from "@kie-tools-core/switch-expression-ts";
import { addOrGetDefaultDiagram } from "./addOrGetDefaultDiagram";

export function resizeNode({
  definitions,
  change,
}: {
  definitions: DMN15__tDefinitions;
  change: {
    shapeIndex: number;
    dimension: { "@_width": number; "@_height": number };
    sourceEdgeIndexes: number[];
    targetEdgeIndexes: number[];
  };
}) {
  const edgeIndexesAlreadyUpdated = new Set<number>();

  const { diagramElements } = addOrGetDefaultDiagram({ definitions });

  const shapeBounds = (diagramElements?.[change.shapeIndex] as DMNDI15__DMNShape | undefined)?.["dc:Bounds"];
  if (!shapeBounds) {
    throw new Error("Cannot resize non-existent shape bounds");
  }

  const deltaWidth = change.dimension["@_width"] - (shapeBounds?.["@_width"] ?? 0);
  const deltaHeight = change.dimension["@_height"] - (shapeBounds?.["@_height"] ?? 0);

  const offsetByPosition = (position: TargetHandleId) => {
    return switchExpression(position, {
      [TargetHandleId.TargetCenter]: { x: deltaWidth / 2, y: deltaHeight / 2 },
      [TargetHandleId.TargetTop]: { x: deltaWidth / 2, y: 0 },
      [TargetHandleId.TargetRight]: { x: deltaWidth, y: deltaHeight / 2 },
      [TargetHandleId.TargetBottom]: { x: deltaWidth / 2, y: deltaHeight },
      [TargetHandleId.TargetLeft]: { x: 0, y: deltaHeight / 2 },
    });
  };

  const offsetEdges = (args: { edgeIndexes: number[]; waypoint: "last" | "first" }) => {
    for (const edgeIndex of args.edgeIndexes) {
      if (edgeIndexesAlreadyUpdated.has(edgeIndex)) {
        continue;
      }

      edgeIndexesAlreadyUpdated.add(edgeIndex);

      const edge = diagramElements[edgeIndex] as DMNDI15__DMNEdge | undefined;
      if (!edge || !edge["di:waypoint"]) {
        throw new Error("Cannot reposition non-existent edge");
      }

      const waypoint = switchExpression(args.waypoint, {
        first: edge["di:waypoint"][0],
        last: edge["di:waypoint"][edge["di:waypoint"].length - 1],
      });

      const offset = offsetByPosition(getHandlePosition({ shapeBounds, waypoint: waypoint }));
      waypoint["@_x"] += offset.x;
      waypoint["@_y"] += offset.y;
    }
  };

  offsetEdges({ edgeIndexes: change.sourceEdgeIndexes, waypoint: "first" });
  offsetEdges({ edgeIndexes: change.targetEdgeIndexes, waypoint: "last" });

  // Update at the end because we need the original shapeBounds value to correctly identify the position of the edges
  shapeBounds["@_width"] = change.dimension["@_width"];
  shapeBounds["@_height"] = change.dimension["@_height"];
}
