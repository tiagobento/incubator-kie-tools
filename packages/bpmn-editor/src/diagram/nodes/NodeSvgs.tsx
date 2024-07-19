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

import * as React from "react";
import { DEFAULT_INTRACTION_WIDTH } from "@kie-tools/reactflow-editors-base/dist/maths/DcMaths";
import { DEFAULT_NODE_FILL, DEFAULT_NODE_STROKE_COLOR } from "./NodeStyle";
import {
  containerNodeInteractionRectCssClassName,
  DEFAULT_NODE_STROKE_WIDTH,
  NodeSvgProps,
  normalize,
} from "@kie-tools/reactflow-editors-base/dist/nodes/NodeSvgs";

export function DataObjectNodeSvg(__props: NodeSvgProps & { isIcon: boolean; transform?: string }) {
  const {
    x,
    y,
    width,
    height,
    strokeWidth,
    props: { isIcon, ...props },
  } = normalize(__props);

  const bevel = 25;
  const arrowStartingX = 6;
  const arrowStartingY = 10;

  return (
    <>
      <polygon
        {...props}
        points={`0,0 0,${height} ${width},${height} ${width},${bevel} ${width - bevel},0 ${width - bevel},0`}
        fill={DEFAULT_NODE_FILL}
        stroke={DEFAULT_NODE_STROKE_COLOR}
        strokeLinejoin={"round"}
        strokeWidth={strokeWidth}
        transform={isIcon ? __props.transform : `translate(${x},${y})`}
      />
      {isIcon === false && (
        <>
          <polygon
            {...props}
            points={`${width - bevel},0 ${width - bevel},${bevel} ${width},${bevel}`}
            fill={DEFAULT_NODE_FILL}
            stroke={DEFAULT_NODE_STROKE_COLOR}
            strokeLinejoin={"round"}
            strokeWidth={strokeWidth}
            transform={`translate(${x},${y})`}
          />
          <polygon
            {...props}
            points={`${arrowStartingX},${arrowStartingY} ${arrowStartingX},20 20,20 20,26 30,15 20,4 20,${arrowStartingY} `}
            fill={DEFAULT_NODE_FILL}
            stroke={DEFAULT_NODE_STROKE_COLOR}
            strokeLinejoin={"round"}
            strokeWidth={strokeWidth}
            transform={`translate(${x},${y})`}
          />
        </>
      )}
    </>
  );
}

export function StartEventNodeSvg(__props: NodeSvgProps) {
  const {
    x,
    y,
    width,
    height,
    strokeWidth,
    props: { ...props },
  } = normalize(__props);

  return (
    <>
      <circle
        cx={x + width / 2}
        cy={y + height / 2}
        strokeWidth={strokeWidth}
        width={width}
        height={height}
        fill={"#e8fae6"}
        stroke={"#4aa241"}
        strokeLinejoin={"round"}
        r={width / 2}
        {...props}
      />
    </>
  );
}
export function IntermediateCatchEventNodeSvg(__props: NodeSvgProps & { rimWidth?: number }) {
  const {
    x,
    y,
    width,
    height,
    strokeWidth,
    props: { ..._props },
  } = normalize(__props);

  const { rimWidth, ...props } = { ..._props };

  const outerCirculeRadius = width / 2;
  const innerCircleRadius = outerCirculeRadius - (rimWidth ?? 5);

  return (
    <>
      <circle
        cx={x + width / 2}
        cy={y + height / 2}
        strokeWidth={strokeWidth}
        width={width}
        height={height}
        fill={"#fbefcf"}
        stroke={"#e6a000"}
        strokeLinejoin={"round"}
        r={outerCirculeRadius}
        {...props}
      />
      <circle
        cx={x + width / 2}
        cy={y + height / 2}
        strokeWidth={strokeWidth}
        width={width}
        height={height}
        fill={"#fbefcf"}
        stroke={"#e6a000"}
        strokeLinejoin={"round"}
        r={innerCircleRadius}
        {...props}
      />
    </>
  );
}
export function IntermediateThrowEventNodeSvg(__props: NodeSvgProps & { rimWidth?: number }) {
  const {
    x,
    y,
    width,
    height,
    strokeWidth,
    props: { ..._props },
  } = normalize(__props);

  const { rimWidth, ...props } = { ..._props };

  const outerCirculeRadius = width / 2;
  const innerCircleRadius = outerCirculeRadius - (rimWidth ?? 5);

  return (
    <>
      <circle
        cx={x + width / 2}
        cy={y + height / 2}
        strokeWidth={strokeWidth}
        width={width}
        height={height}
        fill={"#bddee1"}
        stroke={"#007a87"}
        strokeLinejoin={"round"}
        r={outerCirculeRadius}
        {...props}
      />
      <circle
        cx={x + width / 2}
        cy={y + height / 2}
        strokeWidth={strokeWidth}
        width={width}
        height={height}
        fill={"#bddee1"}
        stroke={"#007a87"}
        strokeLinejoin={"round"}
        r={innerCircleRadius}
        {...props}
      />
    </>
  );
}

export function EndEventNodeSvg(__props: NodeSvgProps) {
  const {
    x,
    y,
    width,
    height,
    strokeWidth,
    props: { ...props },
  } = normalize({ ...__props, strokeWidth: (__props.strokeWidth ?? DEFAULT_NODE_STROKE_WIDTH) * 2 });

  return (
    <>
      <circle
        cx={x + width / 2}
        cy={y + height / 2}
        strokeWidth={strokeWidth}
        width={width}
        height={height}
        fill={"#fce7e7"}
        stroke={"#a30000"}
        strokeLinejoin={"round"}
        r={width / 2}
        {...props}
      />
    </>
  );
}

export function TaskNodeSvg(__props: NodeSvgProps) {
  const {
    x,
    y,
    width,
    height,
    strokeWidth,
    props: { ...props },
  } = normalize(__props);

  return (
    <>
      <rect
        x={x}
        y={y}
        strokeWidth={strokeWidth}
        width={width}
        height={height}
        fill={DEFAULT_NODE_FILL}
        stroke={DEFAULT_NODE_STROKE_COLOR}
        strokeLinejoin={"round"}
        rx="5"
        ry="5"
        {...props}
      />
    </>
  );
}

export function SubProcessNodeSvg(__props: NodeSvgProps) {
  const {
    x,
    y,
    width,
    height,
    strokeWidth,
    props: { ...props },
  } = normalize(__props);

  return (
    <>
      <rect
        x={x}
        y={y}
        strokeWidth={strokeWidth}
        width={width}
        height={height}
        fill={DEFAULT_NODE_FILL}
        stroke={DEFAULT_NODE_STROKE_COLOR}
        strokeLinejoin={"round"}
        rx="5"
        ry="5"
        {...props}
      />
      <rect
        x={x + (width / 2 - width / 3 / 2)}
        y={y + (height - height / 3)}
        strokeWidth={strokeWidth}
        width={width / 3}
        height={height / 3}
        fill={"black"}
        stroke={"black"}
        strokeLinejoin={"round"}
        rx="0"
        ry="0"
        {...props}
      />
    </>
  );
}

export function GatewayNodeSvg(__props: NodeSvgProps) {
  const {
    x,
    y,
    width,
    height,
    strokeWidth,
    props: { ...props },
  } = normalize(__props);

  return (
    <>
      <rect
        x={8 + x}
        y={8 + y}
        transform={`rotate(45,${x + width / 2},${y + height / 2})`}
        strokeWidth={strokeWidth}
        width={width / 1.4} // sqrt(2)
        height={height / 1.4} // sqrt(2)
        fill={"#fef5ea"}
        stroke={"#ec7b08"}
        strokeLinejoin={"round"}
        rx="5"
        ry="5"
        {...props}
      />
    </>
  );
}

export function LaneNodeSvg(__props: NodeSvgProps) {
  const {
    x,
    y,
    width,
    height,
    strokeWidth,
    props: { ...props },
  } = normalize(__props);

  return (
    <>
      <rect
        x={x}
        y={y}
        strokeWidth={strokeWidth}
        width={width}
        height={height}
        fill={DEFAULT_NODE_FILL}
        stroke={DEFAULT_NODE_STROKE_COLOR}
        strokeLinejoin={"round"}
        rx="0"
        ry="0"
        {...props}
      />
      <rect
        x={x}
        y={y}
        strokeWidth={strokeWidth}
        width={width / 4}
        height={height}
        fill={DEFAULT_NODE_FILL}
        stroke={"black"}
        strokeLinejoin={"round"}
        rx="0"
        ry="0"
        {...props}
      />
    </>
  );
}

export function TextAnnotationNodeSvg(__props: NodeSvgProps & { showPlaceholder?: boolean }) {
  const { strokeWidth, x, y, width, height, props: _props } = normalize(__props);
  const { showPlaceholder, ...props } = _props;
  return (
    <>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={"transparent"}
        stroke={"transparent"}
        strokeLinejoin={"round"}
        transform={`translate(${x},${y})`}
      />
      <path
        {...props}
        x={x}
        y={y}
        fill={"transparent"}
        d={`M20,0 L0,0 M0,0 L0,${height} M0,${height} L20,${height}`}
        stroke={DEFAULT_NODE_STROKE_COLOR}
        strokeWidth={strokeWidth}
        strokeLinejoin={"round"}
        transform={`translate(${x},${y})`}
      />
      {showPlaceholder && (
        <text x={"20%"} y={"62.5%"} style={{ fontSize: "5em", fontWeight: "bold" }}>
          Text
        </text>
      )}
    </>
  );
}

export const GroupNodeSvg = React.forwardRef<SVGRectElement, NodeSvgProps & { strokeDasharray?: string }>(
  (__props, ref) => {
    const { strokeWidth, x, y, width, height, props } = normalize(__props);
    const {
      strokeWidth: interactionRectStrokeWidth,
      x: interactionRectX,
      y: interactionRectY,
      width: interactionRectWidth,
      height: interactionRectHeight,
      props: _interactionRectProps,
    } = normalize({ ...__props, strokeWidth: DEFAULT_INTRACTION_WIDTH / 2 });

    const { strokeDasharray: interactionRectStrokeDasharray, ...interactionRectProps } = _interactionRectProps;

    const strokeDasharray = props.strokeDasharray ?? "14,10,3,10";
    return (
      <>
        <rect
          {...props}
          x={x}
          y={y}
          width={width}
          height={height}
          fill={"transparent"}
          stroke={DEFAULT_NODE_STROKE_COLOR}
          strokeLinejoin={"round"}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          rx={40}
          ry={40}
        />
        <rect
          {...interactionRectProps}
          ref={ref}
          x={interactionRectX}
          y={interactionRectY}
          width={interactionRectWidth}
          height={interactionRectHeight}
          strokeWidth={interactionRectStrokeWidth}
          fill={"transparent"}
          stroke={"transparent"}
          rx={"30"}
          ry={"30"}
          className={containerNodeInteractionRectCssClassName}
        />
      </>
    );
  }
);

export function UnknownNodeSvg(_props: NodeSvgProps & { strokeDasharray?: string }) {
  const { strokeWidth, x, y, width, height, props } = normalize(_props);
  const strokeDasharray = props.strokeDasharray ?? "2,4";
  return (
    <>
      <rect
        {...props}
        x={x}
        y={y}
        width={width}
        height={height}
        fill={"transparent"}
        stroke={"red"}
        strokeLinejoin={"round"}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
      />
    </>
  );
}
