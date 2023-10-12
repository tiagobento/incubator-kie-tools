import { DC__Dimension } from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { SnapGrid } from "../../store/Store";
import { snapPoint } from "../SnapGrid";
import { NodeType } from "../connections/graphStructure";
import { NODE_TYPES } from "./NodeTypes";
import { CONTAINER_NODES_DESIRABLE_PADDING } from "../maths/DmnMaths";

export const MIN_NODE_SIZES: Record<NodeType, (snapGrid: SnapGrid) => DC__Dimension> = {
  [NODE_TYPES.inputData]: (snapGrid) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.decision]: (snapGrid) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.bkm]: (snapGrid) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.knowledgeSource]: (snapGrid) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.decisionService]: (snapGrid) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(
      snapGrid,
      NODE_MIN_WIDTH + CONTAINER_NODES_DESIRABLE_PADDING * 2,
      NODE_MIN_HEIGHT * 2 + CONTAINER_NODES_DESIRABLE_PADDING * 2
    );
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.textAnnotation]: (snapGrid) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid, 200, 200);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.group]: (snapGrid) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(
      snapGrid,
      NODE_MIN_WIDTH + CONTAINER_NODES_DESIRABLE_PADDING * 2,
      NODE_MIN_HEIGHT + CONTAINER_NODES_DESIRABLE_PADDING * 2
    );
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
};

export const DEFAULT_NODE_SIZES: Record<NodeType, (snapGrid: SnapGrid) => DC__Dimension> = {
  [NODE_TYPES.inputData]: (snapGrid) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.decision]: (snapGrid) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.bkm]: (snapGrid) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.knowledgeSource]: (snapGrid) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.decisionService]: (snapGrid) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid, NODE_MIN_WIDTH * 2, NODE_MIN_WIDTH * 2); // This is not a mistake, we want the DecisionService node to be a bigger square.
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.textAnnotation]: (snapGrid) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid, 200, 200);
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
  [NODE_TYPES.group]: (snapGrid) => {
    const snappedMinSize = MIN_SIZE_FOR_NODES(snapGrid, NODE_MIN_WIDTH * 2, NODE_MIN_WIDTH * 2); // This is not a mistake, we want the Group node to be a bigger square.
    return {
      "@_width": snappedMinSize.width,
      "@_height": snappedMinSize.height,
    };
  },
};

export const DECISION_SERVICE_COLLAPSED_DIMENSIONS = {
  width: 300,
  height: 100,
};

const NODE_MIN_WIDTH = 160;
const NODE_MIN_HEIGHT = 80;

const MIN_SIZE_FOR_NODES = (grid: SnapGrid, width = NODE_MIN_WIDTH, height = NODE_MIN_HEIGHT) => {
  const snapped = snapPoint(grid, { "@_x": width, "@_y": height }, "ceil");
  return { width: snapped["@_x"], height: snapped["@_y"] };
};
