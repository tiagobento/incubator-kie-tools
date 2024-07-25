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

import { useEdgeClassName } from "@kie-tools/xyflow-kie-diagram/dist/edges/Hooks";
import { PotentialWaypoint, Waypoints } from "@kie-tools/xyflow-kie-diagram/dist/edges/Waypoints";
import { useAlwaysVisibleEdgeUpdatersAtNodeBorders } from "@kie-tools/xyflow-kie-diagram/dist/edges/useAlwaysVisibleEdgeUpdatersAtNodeBorders";
import { usePathForEdgeWithWaypoints } from "@kie-tools/xyflow-kie-diagram/dist/edges/usePathForEdgeWithWaypoints";
import { usePotentialWaypointControls } from "@kie-tools/xyflow-kie-diagram/dist/edges/usePotentialWaypointControls";
import { DEFAULT_INTRACTION_WIDTH } from "@kie-tools/xyflow-kie-diagram/dist/maths/DcMaths";
import { propsHaveSameValuesDeep } from "@kie-tools/xyflow-kie-diagram/dist/memoization/memoization";
import { useIsHovered } from "@kie-tools/xyflow-kie-diagram/dist/reactExt/useIsHovered";
import * as React from "react";
import { useRef } from "react";
import * as RF from "reactflow";
import { AssociationPath, SequenceFlowPath } from "./EdgeSvgs";
import { BpmnDiagramEdgeData } from "../BpmnDiagramDomain";

const interactionStrokeProps: Partial<React.SVGAttributes<SVGPathElement>> = {
  strokeOpacity: 1,
  markerEnd: undefined,
  style: undefined,
  className: "react-flow__edge-interaction",
  stroke: "transparent",
  strokeLinecap: "round",
};

export const SequenceFlowEdge = React.memo((props: RF.EdgeProps<BpmnDiagramEdgeData>) => {
  const renderCount = useRef<number>(0);
  renderCount.current++;

  const { path, points: waypoints } = usePathForEdgeWithWaypoints(
    props.source,
    props.target,
    props.data?.bpmnEdge,
    props.data?.bpmnShapeSource,
    props.data?.bpmnShapeTarget
  );

  const interactionPathRef = React.useRef<SVGPathElement>(null);
  const isHovered = useIsHovered(interactionPathRef);

  const {
    onMouseMove: onMouseMoveOnEdge,
    onDoubleClick: onDoubleClickEdge,
    potentialWaypoint,
    isDraggingWaypoint,
  } = usePotentialWaypointControls(waypoints, props.selected, props.id, props.data?.bpmnEdgeIndex, interactionPathRef);

  const isConnecting = !!RF.useStore((s) => s.connectionNodeId);
  const className = useEdgeClassName(isConnecting, isDraggingWaypoint);

  useAlwaysVisibleEdgeUpdatersAtNodeBorders(interactionPathRef, props.source, props.target, waypoints);

  return (
    <>
      <SequenceFlowPath
        svgRef={interactionPathRef}
        d={path}
        {...interactionStrokeProps}
        className={`${interactionStrokeProps.className} ${className}`}
        strokeWidth={props.interactionWidth ?? DEFAULT_INTRACTION_WIDTH}
        onMouseMove={onMouseMoveOnEdge}
        onDoubleClick={onDoubleClickEdge}
        data-edgetype={"information-requirement"}
      />
      <SequenceFlowPath d={path} className={`xyflow-kie-diagram--edge ${className}`} />

      {props.selected && !isConnecting && props.data?.bpmnEdge && (
        <Waypoints
          edgeId={props.id}
          edgeIndex={props.data.bpmnEdgeIndex}
          waypoints={waypoints}
          onDragStop={onMouseMoveOnEdge}
        />
      )}
      {isHovered && potentialWaypoint && <PotentialWaypoint point={potentialWaypoint.point} />}
    </>
  );
}, propsHaveSameValuesDeep);

export const AssociationEdge = React.memo((props: RF.EdgeProps<BpmnDiagramEdgeData>) => {
  const renderCount = useRef<number>(0);
  renderCount.current++;

  const { path, points: waypoints } = usePathForEdgeWithWaypoints(
    props.source,
    props.target,
    props.data?.bpmnEdge,
    props.data?.bpmnShapeSource,
    props.data?.bpmnShapeTarget
  );

  const interactionPathRef = React.useRef<SVGPathElement>(null);
  const isHovered = useIsHovered(interactionPathRef);

  const {
    onMouseMove: onMouseMoveOnEdge,
    onDoubleClick: onDoubleClickEdge,
    potentialWaypoint,
    isDraggingWaypoint,
  } = usePotentialWaypointControls(waypoints, props.selected, props.id, props.data?.bpmnEdgeIndex, interactionPathRef);

  const isConnecting = !!RF.useStore((s) => s.connectionNodeId);
  const className = useEdgeClassName(isConnecting, isDraggingWaypoint);

  useAlwaysVisibleEdgeUpdatersAtNodeBorders(interactionPathRef, props.source, props.target, waypoints);

  return (
    <>
      <AssociationPath
        svgRef={interactionPathRef}
        d={path}
        {...interactionStrokeProps}
        className={`${interactionStrokeProps.className} ${className}`}
        strokeWidth={props.interactionWidth ?? DEFAULT_INTRACTION_WIDTH}
        onMouseMove={onMouseMoveOnEdge}
        onDoubleClick={onDoubleClickEdge}
        data-edgetype={"association"}
      />
      <AssociationPath d={path} className={`kie-bpmn-editor--edge ${className}`} />

      {props.selected && !isConnecting && props.data?.bpmnEdge && (
        <Waypoints
          edgeId={props.id}
          edgeIndex={props.data.bpmnEdgeIndex}
          waypoints={waypoints}
          onDragStop={onMouseMoveOnEdge}
        />
      )}
      {isHovered && potentialWaypoint && <PotentialWaypoint point={potentialWaypoint.point} />}
    </>
  );
}, propsHaveSameValuesDeep);
