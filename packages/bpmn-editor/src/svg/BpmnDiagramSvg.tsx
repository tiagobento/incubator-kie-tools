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

import { Text } from "@visx/text";
import * as React from "react";
import { useMemo } from "react";
import * as RF from "reactflow";
import { NodeType } from "../diagram/connections/graphStructure";
import { EdgeMarkers } from "../diagram/edges/EdgeMarkers";
import { AssociationPath, BpmnDiagramEdgeData, SequenceFlowPath } from "../diagram/edges/Edges";
import { EDGE_TYPES } from "../diagram/edges/EdgeTypes";
import { getSnappedMultiPointAnchoredEdgePath } from "../diagram/edges/getSnappedMultiPointAnchoredEdgePath";
import { BpmnDiagramNodeData } from "../diagram/nodes/Nodes";
import { assertUnreachable, getBpmnFontStyle, getNodeLabelPosition, getNodeStyle } from "../diagram/nodes/NodeStyle";
import {
  DataObjectNodeSvg,
  NodeLabelPosition,
  TaskNodeSvg,
  TextAnnotationNodeSvg,
  UnknownNodeSvg,
} from "../diagram/nodes/NodeSvgs";
import { NODE_TYPES } from "../diagram/nodes/NodeTypes";
import { SnapGrid } from "../store/Store";

export function BpmnDiagramSvg({
  nodes,
  edges,
  snapGrid,
}: {
  nodes: RF.Node<BpmnDiagramNodeData>[];
  edges: RF.Edge<BpmnDiagramEdgeData>[];
  snapGrid: SnapGrid;
}) {
  const { nodesSvg, nodesById } = useMemo(() => {
    const nodesById = new Map<string, RF.Node<BpmnDiagramNodeData>>();

    const nodesSvg = nodes.map((node) => {
      const { fontCssProperties: fontStyle } = getNodeStyle({
        bpmnFontStyle: getBpmnFontStyle({ isEnabled: true }),
      });

      nodesById.set(node.id, node);

      const { height, width, strokeWidth, strokeDasharray, ...style } = node.style!;

      const label = "BPMN Node"; // FIXME: Tiago: Node label

      return (
        <g data-kie-bpmn-node-id={node.id} key={node.id}>
          {node.type === NODE_TYPES.dataObject && (
            <DataObjectNodeSvg
              width={node.width!}
              height={node.height!}
              x={node.positionAbsolute!.x}
              y={node.positionAbsolute!.y}
              {...style}
              isIcon={false}
            />
          )}
          {node.type === NODE_TYPES.task && (
            <TaskNodeSvg
              width={node.width!}
              height={node.height!}
              x={node.positionAbsolute!.x}
              y={node.positionAbsolute!.y}
              {...style}
            />
          )}
          {node.type === NODE_TYPES.textAnnotation && (
            <TextAnnotationNodeSvg
              width={node.width!}
              height={node.height!}
              x={node.positionAbsolute!.x}
              y={node.positionAbsolute!.y}
              {...style}
            />
          )}
          {node.type === NODE_TYPES.unknown && (
            <UnknownNodeSvg
              width={node.width!}
              height={node.height!}
              x={node.positionAbsolute!.x}
              y={node.positionAbsolute!.y}
              {...style}
            />
          )}
          <>
            {label.split("\n").map((labelLine, i) => (
              <Text
                key={i}
                lineHeight={fontStyle.lineHeight}
                style={{ ...fontStyle }}
                dy={`calc(1.5em * ${i})`}
                {...getNodeLabelSvgTextAlignmentProps(node, getNodeLabelPosition({ nodeType: node.type as NodeType }))}
              >
                {labelLine}
              </Text>
            ))}
          </>
        </g>
      );
    });

    return { nodesSvg, nodesById };
  }, [nodes]);

  return (
    <>
      <EdgeMarkers />
      {edges.map((e) => {
        const s = nodesById?.get(e.source);
        const t = nodesById?.get(e.target);
        const { path } = getSnappedMultiPointAnchoredEdgePath({
          snapGrid,
          bpmnEdge: e.data?.bpmnEdge,
          bpmnShapeSource: e.data?.bpmnShapeSource,
          bpmnShapeTarget: e.data?.bpmnShapeTarget,
          sourceNodeBounds: {
            x: s?.positionAbsolute?.x,
            y: s?.positionAbsolute?.y,
            width: s?.width,
            height: s?.height,
          },
          targetNodeBounds: {
            x: t?.positionAbsolute?.x,
            y: t?.positionAbsolute?.y,
            width: t?.width,
            height: t?.height,
          },
        });
        return (
          <React.Fragment key={e.id}>
            {e.type === EDGE_TYPES.sequenceFlow && <SequenceFlowPath d={path} />}
            {e.type === EDGE_TYPES.association && <AssociationPath d={path} />}
          </React.Fragment>
        );
      })}
      {nodesSvg}
    </>
  );
}

const SVG_NODE_LABEL_TEXT_PADDING_ALL = 10;
const SVG_NODE_LABEL_TEXT_ADDITIONAL_PADDING_TOP_LEFT = 8;

export function getNodeLabelSvgTextAlignmentProps(n: RF.Node<BpmnDiagramNodeData>, labelPosition: NodeLabelPosition) {
  switch (labelPosition) {
    case "center-bottom":
      const cbTx = n.position.x! + n.width! / 2;
      const cbTy = n.position.y! + n.height! + 4;
      const cbWidth = n.width!;
      return {
        verticalAnchor: "start",
        textAnchor: "middle",
        transform: `translate(${cbTx},${cbTy})`,
        width: cbWidth,
      } as const;

    case "center-center":
      const ccTx = n.position.x! + n.width! / 2;
      const ccTy = n.position.y! + n.height! / 2;
      const ccWidth = n.width! - 2 * SVG_NODE_LABEL_TEXT_PADDING_ALL;
      return {
        verticalAnchor: "middle",
        textAnchor: "middle",
        transform: `translate(${ccTx},${ccTy})`,
        width: ccWidth,
      } as const;

    case "top-center":
      const tcTx = n.position.x! + n.width! / 2;
      const tcTy = n.position.y! + SVG_NODE_LABEL_TEXT_PADDING_ALL;
      const tcWidth = n.width! - 2 * SVG_NODE_LABEL_TEXT_PADDING_ALL;
      return {
        verticalAnchor: "start",
        textAnchor: "middle",
        transform: `translate(${tcTx},${tcTy})`,
        width: tcWidth,
      } as const;

    case "center-left":
      const clTx = n.position.x! + SVG_NODE_LABEL_TEXT_PADDING_ALL;
      const clTy = n.position.y! + n.height! / 2;
      const clWidth = n.width! - 2 * SVG_NODE_LABEL_TEXT_PADDING_ALL;
      return {
        verticalAnchor: "middle",
        textAnchor: "start",
        transform: `translate(${clTx},${clTy})`,
        width: clWidth,
      } as const;

    case "top-left":
      const tlTx = n.position.x! + SVG_NODE_LABEL_TEXT_PADDING_ALL + SVG_NODE_LABEL_TEXT_ADDITIONAL_PADDING_TOP_LEFT;
      const tlTy = n.position.y! + SVG_NODE_LABEL_TEXT_PADDING_ALL + SVG_NODE_LABEL_TEXT_ADDITIONAL_PADDING_TOP_LEFT;
      const tlWidth =
        n.width! - 2 * SVG_NODE_LABEL_TEXT_PADDING_ALL - 2 * SVG_NODE_LABEL_TEXT_ADDITIONAL_PADDING_TOP_LEFT;
      return {
        verticalAnchor: "start",
        textAnchor: "start",
        transform: `translate(${tlTx},${tlTy})`,
        width: tlWidth,
      } as const;
    default:
      assertUnreachable(labelPosition);
  }
}
