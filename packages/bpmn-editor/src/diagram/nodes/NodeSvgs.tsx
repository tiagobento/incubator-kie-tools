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
import { DEFAULT_INTRACTION_WIDTH } from "@kie-tools/xyflow-react-kie-diagram/dist/maths/DcMaths";
import { DEFAULT_NODE_FILL, DEFAULT_NODE_STROKE_COLOR } from "./NodeStyle";
import {
  containerNodeInteractionRectCssClassName,
  DEFAULT_NODE_STROKE_WIDTH,
  NodeSvgProps,
  normalize,
} from "@kie-tools/xyflow-react-kie-diagram/dist/nodes/NodeSvgs";
import { containerNodeVisibleRectCssClassName } from "@kie-tools/xyflow-react-kie-diagram/dist/nodes/NodeSvgs";
import { ActivityNodeMarker, EventVariant, GatewayVariant, SubProcessVariant, TaskVariant } from "../BpmnDiagramDomain";
import { useMemo } from "react";

export function DataObjectNodeSvg(
  __props: NodeSvgProps & { isIcon?: boolean; showFoldedPage?: boolean; showArrow?: boolean; transform?: string }
) {
  const {
    x,
    y,
    width,
    height,
    strokeWidth,
    props: { isIcon: _isIcon, showFoldedPage: _showFoldedPage, showArrow: _showArrow, ...props },
  } = normalize(__props);

  const bevel = 25;
  const arrowStartingX = 6;
  const arrowStartingY = 10;

  const showFoldedPage = _showFoldedPage ?? false;
  const showArrow = _showArrow ?? false;
  const isIcon = _isIcon ?? false;

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
      {showFoldedPage === true && (
        <polygon
          {...props}
          points={`${width - bevel},0 ${width - bevel},${bevel} ${width},${bevel}`}
          fill={DEFAULT_NODE_FILL}
          stroke={DEFAULT_NODE_STROKE_COLOR}
          strokeLinejoin={"round"}
          strokeWidth={strokeWidth}
          transform={`translate(${x},${y})`}
        />
      )}
      {showArrow === true && (
        <polygon
          {...props}
          points={`${arrowStartingX},${arrowStartingY} ${arrowStartingX},20 20,20 20,26 30,15 20,4 20,${arrowStartingY} `}
          fill={DEFAULT_NODE_FILL}
          stroke={DEFAULT_NODE_STROKE_COLOR}
          strokeLinejoin={"round"}
          strokeWidth={strokeWidth}
          transform={`translate(${x},${y})`}
        />
      )}
    </>
  );
}

const deg30 = Math.PI / 6;
const cos30 = Math.cos(deg30);
const sin30 = Math.sin(deg30);

export const NODE_COLORS = {
  startEvent: {
    foreground: "#4aa241",
    background: "#e8fae6",
  },
  intermediateCatchEvent: {
    foreground: "#e6a000",
    background: "#fbefcf",
  },
  boundaryEvent: {
    foreground: "#e6a000",
    background: "#fbefcf",
  },
  intermediateThrowEvent: {
    foreground: "#007a87",
    background: "#bddee1",
  },
  endEvent: {
    foreground: "#a30000",
    background: "#fce7e7",
  },
  gateway: {
    background: "#fef5ea",
    foreground: "#ec7b08",
  },
  task: {
    foreground: "black",
    background: "#efefef",
  },
  subProcess: {
    foreground: "black",
    background: "#efefef",
  },
} as const;

export function StartEventNodeSvg(__props: NodeSvgProps & { variant: EventVariant | "none" }) {
  const {
    x,
    y,
    width,
    height,
    strokeWidth,
    props: { ..._props },
  } = normalize(__props);

  const { variant, ...props } = { ..._props };

  const cx = x + width / 2;
  const cy = y + height / 2;

  const r = width / 2;

  return (
    <>
      <circle
        cx={cx}
        cy={cy}
        strokeWidth={strokeWidth}
        width={width}
        height={height}
        fill={NODE_COLORS.startEvent.background}
        stroke={NODE_COLORS.startEvent.foreground}
        strokeLinejoin={"round"}
        r={r}
        {...props}
      />
      <EventVariantSymbolSvg
        variant={variant}
        fill={NODE_COLORS.startEvent.background}
        filled={false}
        stroke={NODE_COLORS.startEvent.foreground}
        x={x}
        y={y}
        cx={cx}
        cy={cy}
        innerCircleRadius={r - 5}
        outerCircleRadius={r}
      />
    </>
  );
}
export function IntermediateCatchEventNodeSvg(
  __props: NodeSvgProps & { rimWidth?: number; variant: EventVariant | "none" }
) {
  const {
    x,
    y,
    width,
    height,
    strokeWidth,
    props: { ..._props },
  } = normalize(__props);

  const { rimWidth, variant, ...props } = { ..._props };

  const outerCircleRadius = width / 2;
  const innerCircleRadius = outerCircleRadius - (rimWidth ?? 5);

  const cx = x + width / 2;
  const cy = y + height / 2;

  return (
    <>
      <circle
        cx={cx}
        cy={cy}
        strokeWidth={strokeWidth}
        width={width}
        height={height}
        fill={NODE_COLORS.intermediateCatchEvent.background}
        stroke={NODE_COLORS.intermediateCatchEvent.foreground}
        strokeLinejoin={"round"}
        r={outerCircleRadius}
        {...props}
      />
      <circle
        cx={cx}
        cy={cy}
        strokeWidth={strokeWidth}
        width={width}
        height={height}
        fill={NODE_COLORS.intermediateCatchEvent.background}
        stroke={NODE_COLORS.intermediateCatchEvent.foreground}
        strokeLinejoin={"round"}
        r={innerCircleRadius}
        {...props}
      />
      <EventVariantSymbolSvg
        variant={variant}
        fill={NODE_COLORS.intermediateCatchEvent.background}
        filled={false}
        stroke={NODE_COLORS.intermediateCatchEvent.foreground}
        x={x}
        y={y}
        cx={cx}
        cy={cy}
        innerCircleRadius={innerCircleRadius}
        outerCircleRadius={outerCircleRadius}
      />
    </>
  );
}
export function IntermediateThrowEventNodeSvg(
  __props: NodeSvgProps & { rimWidth?: number; variant: EventVariant | "none" }
) {
  const {
    x,
    y,
    width,
    height,
    strokeWidth,
    props: { ..._props },
  } = normalize(__props);

  const { rimWidth, variant, ...props } = { ..._props };

  const outerCircleRadius = width / 2;
  const innerCircleRadius = outerCircleRadius - (rimWidth ?? 5);

  const cx = x + width / 2;
  const cy = y + height / 2;

  return (
    <>
      <circle
        cx={x + width / 2}
        cy={y + height / 2}
        strokeWidth={strokeWidth}
        width={width}
        height={height}
        fill={NODE_COLORS.intermediateThrowEvent.background}
        stroke={NODE_COLORS.intermediateThrowEvent.foreground}
        strokeLinejoin={"round"}
        r={outerCircleRadius}
        {...props}
      />
      <circle
        cx={x + width / 2}
        cy={y + height / 2}
        strokeWidth={strokeWidth}
        width={width}
        height={height}
        fill={NODE_COLORS.intermediateThrowEvent.background}
        stroke={NODE_COLORS.intermediateThrowEvent.foreground}
        strokeLinejoin={"round"}
        r={innerCircleRadius}
        {...props}
      />
      <EventVariantSymbolSvg
        variant={variant}
        fill={NODE_COLORS.intermediateThrowEvent.background}
        filled={true}
        stroke={NODE_COLORS.intermediateThrowEvent.foreground}
        x={x}
        y={y}
        cx={cx}
        cy={cy}
        innerCircleRadius={innerCircleRadius}
        outerCircleRadius={outerCircleRadius}
      />
    </>
  );
}
export function EndEventNodeSvg(__props: NodeSvgProps & { variant: EventVariant | "none" }) {
  const {
    x,
    y,
    width,
    height,
    strokeWidth,
    props: { ..._props },
  } = normalize(__props);

  const { variant, ...props } = { ..._props };

  const cx = x + width / 2;
  const cy = y + height / 2;

  const r = width / 2;

  return (
    <>
      <circle
        cx={cx}
        cy={cy}
        strokeWidth={strokeWidth}
        width={width}
        height={height}
        fill={NODE_COLORS.endEvent.background}
        stroke={NODE_COLORS.endEvent.foreground}
        strokeLinejoin={"round"}
        r={r}
        {...props}
      />
      <EventVariantSymbolSvg
        variant={variant}
        fill={NODE_COLORS.endEvent.background}
        filled={true}
        stroke={NODE_COLORS.endEvent.foreground}
        x={x}
        y={y}
        cx={cx}
        cy={cy}
        innerCircleRadius={r - 5}
        outerCircleRadius={r}
      />
    </>
  );
}
export function TaskNodeSvg(
  __props: NodeSvgProps & {
    markers?: (ActivityNodeMarker | "CallActivityPaletteIcon")[];
    variant?: TaskVariant | "none";
  }
) {
  const {
    x,
    y,
    width,
    height,
    strokeWidth,
    props: { ..._props },
  } = normalize(__props);

  const { markers: _markers, variant: _variant, ...props } = { ..._props };

  const markers = useMemo(() => new Set(_markers), [_markers]);
  const variant = _variant ?? "none";

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
        rx="3"
        ry="3"
        {...props}
      />
      {markers.has("CallActivityPaletteIcon") && (
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
      )}
      <ActivityNodeIcons x={x} y={y} width={width} height={height} icons={markers as Set<ActivityNodeMarker>} />
    </>
  );
}
export function GatewayNodeSvg(__props: NodeSvgProps & { variant: GatewayVariant | "none" }) {
  const {
    x,
    y,
    width,
    height,
    strokeWidth,
    props: { ..._props },
  } = normalize(__props);

  const { variant, ...props } = { ..._props };

  return (
    <>
      <rect
        x={8 + x}
        y={8 + y}
        transform={`rotate(45,${x + width / 2},${y + height / 2})`}
        strokeWidth={strokeWidth}
        width={width / 1.4} // sqrt(2)
        height={height / 1.4} // sqrt(2)
        fill={NODE_COLORS.gateway.background}
        stroke={NODE_COLORS.gateway.foreground}
        strokeLinejoin={"round"}
        rx="5"
        ry="5"
        {...props}
      />
      {variant === "parallelGateway" && (
        <>
          <line
            strokeLinecap={"round"}
            x1="18"
            y1={1 + height / 2}
            x2={width - 16}
            y2={1 + height / 2}
            stroke={NODE_COLORS.gateway.foreground}
            strokeWidth="6"
          />
          <line
            strokeLinecap={"round"}
            x1={1 + width / 2}
            y1="18"
            x2={1 + width / 2}
            y2={height - 16}
            stroke={NODE_COLORS.gateway.foreground}
            strokeWidth="6"
          />
        </>
      )}
      {variant === "exclusiveGateway" && (
        <>
          <g transform={`rotate(45,${x + width / 2},${y + height / 2})`}>
            <line
              strokeLinecap={"round"}
              x1="18"
              y1={1 + height / 2}
              x2={width - 16}
              y2={1 + height / 2}
              stroke={NODE_COLORS.gateway.foreground}
              strokeWidth="6"
            />
            <line
              strokeLinecap={"round"}
              x1={1 + width / 2}
              y1="18"
              x2={1 + width / 2}
              y2={height - 16}
              stroke={NODE_COLORS.gateway.foreground}
              strokeWidth="6"
            />
          </g>
        </>
      )}
      {variant === "inclusiveGateway" && (
        <>
          <circle
            cx={x + width / 2}
            cy={y + height / 2}
            strokeWidth={6}
            width={width / 2}
            height={height / 2}
            stroke={NODE_COLORS.gateway.foreground}
            strokeLinejoin={"round"}
            fill="transparent"
            r={width / 5}
            {...props}
          />
        </>
      )}
      {variant === "eventBasedGateway" && <>{/* TODO: Tiago */}</>}
      {variant === "complexGateway" && <>{/* TODO: Tiago */}</>}
    </>
  );
}

export const LaneNodeSvg = React.forwardRef<SVGRectElement, NodeSvgProps & { gutterWidth?: number }>((__props, ref) => {
  const { gutterWidth: _gutterWidth, ..._props } = { ...__props };
  const { x, y, width, height, strokeWidth, props } = normalize(_props);

  const {
    strokeWidth: interactionRectStrokeWidth,
    x: interactionRectX,
    y: interactionRectY,
    width: interactionRectWidth,
    height: interactionRectHeight,
    props: _interactionRectProps,
  } = normalize({ ..._props, strokeWidth: DEFAULT_INTRACTION_WIDTH / 2 });

  const { ...interactionRectProps } = _interactionRectProps;

  const gutterWidth = _gutterWidth ?? 40;

  return (
    <>
      <rect
        {...props}
        x={x}
        y={y}
        width={width}
        height={height}
        strokeWidth={strokeWidth}
        fill={"transparent"}
        stroke={DEFAULT_NODE_STROKE_COLOR}
        strokeLinejoin={"round"}
        rx={"3"}
        ry={"3"}
        className={containerNodeVisibleRectCssClassName}
      />
      <line
        x1={x + gutterWidth}
        y1={y}
        x2={x + gutterWidth}
        y2={y + height}
        stroke={DEFAULT_NODE_STROKE_COLOR}
        strokeWidth={strokeWidth}
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
        strokeLinejoin={"round"}
        rx={"0"}
        ry={"0"}
        className={containerNodeInteractionRectCssClassName}
      />
    </>
  );
});

export const SubProcessNodeSvg = React.forwardRef<
  SVGRectElement,
  NodeSvgProps & {
    borderRadius?: number;
    rimWidth?: number;
    icons?: ActivityNodeMarker[];
    variant?: SubProcessVariant;
  }
>((__props, ref) => {
  const {
    rimWidth: _rimWidth,
    borderRadius: _borderRadius,
    icons: _icons,
    variant: _variant,
    ..._props
  } = { ...__props };
  const { x, y, width, height, strokeWidth, props } = normalize(_props);

  const {
    strokeWidth: interactionRectStrokeWidth,
    x: interactionRectX,
    y: interactionRectY,
    width: interactionRectWidth,
    height: interactionRectHeight,
    props: _interactionRectProps,
  } = normalize({ ..._props, strokeWidth: DEFAULT_INTRACTION_WIDTH / 2 });

  const { ...interactionRectProps } = _interactionRectProps;

  const icons = useMemo(() => new Set(_icons), [_icons]);
  const variant = _variant ?? "other";
  const rimWidth = variant === "transaction" ? _rimWidth ?? 5 : 0;
  const borderRadius = variant === "transaction" ? _borderRadius ?? 10 : 2;

  return (
    <>
      {variant === "transaction" && (
        <rect
          {...props}
          x={x + rimWidth}
          y={y + rimWidth}
          width={width - rimWidth * 2}
          height={height - rimWidth * 2}
          strokeWidth={strokeWidth}
          fill={"transparent"}
          stroke={DEFAULT_NODE_STROKE_COLOR}
          strokeLinejoin={"round"}
          rx={borderRadius - rimWidth}
          ry={borderRadius - rimWidth}
          className={containerNodeVisibleRectCssClassName}
        />
      )}
      <rect
        {...props}
        x={x}
        y={y}
        width={width}
        height={height}
        strokeWidth={strokeWidth}
        fill={"transparent"}
        stroke={DEFAULT_NODE_STROKE_COLOR}
        strokeDasharray={variant === "event" ? "10,5" : undefined}
        strokeLinejoin={"round"}
        rx={borderRadius}
        ry={borderRadius}
        className={containerNodeVisibleRectCssClassName}
      />
      {/* ↓ interaction rect */}
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
        strokeLinejoin={"round"}
        rx={"0"}
        ry={"0"}
        className={containerNodeInteractionRectCssClassName}
      />
      <ActivityNodeIcons x={x} y={y} width={width} height={height} icons={icons} />
    </>
  );
});

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

export function EventVariantSymbolSvg({
  variant,
  stroke,
  strokeWidth,
  cx,
  cy,
  x,
  y,
  innerCircleRadius,
  outerCircleRadius,
  fill,
  filled,
}: {
  variant: EventVariant | "none";
  stroke: string;
  strokeWidth?: number;
  cx: number;
  cy: number;
  x: number;
  y: number;
  innerCircleRadius: number;
  outerCircleRadius: number;
  fill?: string;
  filled: boolean;
}) {
  return (
    <>
      {variant === "messageEventDefinition" && (
        <MessageEventSymbolSvg
          fill={fill ?? "none"}
          filled={filled}
          stroke={stroke}
          cx={cx}
          cy={cy}
          innerCircleRadius={innerCircleRadius}
        />
      )}
      {variant === "timerEventDefinition" && (
        <TimerEventSymbolSvg
          filled={filled}
          stroke={stroke}
          cx={cx}
          cy={cy}
          innerCircleRadius={innerCircleRadius}
          outerCircleRadius={outerCircleRadius}
        />
      )}
      {variant === "errorEventDefinition" && (
        <ErrorEventSymbolSvg
          filled={filled}
          stroke={stroke}
          cx={cx}
          cy={cy}
          innerCircleRadius={innerCircleRadius}
          outerCircleRadius={outerCircleRadius}
        />
      )}
      {variant === "escalationEventDefinition" && (
        <EscalationEventSymbolSvg
          filled={filled}
          stroke={stroke}
          cx={cx}
          cy={cy}
          innerCircleRadius={innerCircleRadius}
        />
      )}
      {variant === "cancelEventDefinition" && (
        <CancelEventSymbolSvg filled={filled} stroke={stroke} cx={cx} cy={cy} innerCircleRadius={innerCircleRadius} />
      )}
      {variant === "compensateEventDefinition" && (
        <CompensationEventSymbolSvg
          filled={filled}
          stroke={stroke}
          x={x}
          y={y}
          cx={cx}
          cy={cy}
          innerCircleRadius={innerCircleRadius}
          outerCircleRadius={outerCircleRadius}
        />
      )}
      {variant === "conditionalEventDefinition" && (
        <ConditionalEventSymbolSvg
          filled={filled}
          stroke={stroke}
          cx={cx}
          cy={cy}
          outerCircleRadius={outerCircleRadius}
        />
      )}
      {variant === "linkEventDefinition" && (
        <LinkEventSymbolSvg filled={filled} stroke={stroke} cx={cx} cy={cy} innerCircleRadius={innerCircleRadius} />
      )}
      {variant === "signalEventDefinition" && (
        <SignalEventSymbolSvg
          filled={filled}
          stroke={stroke}
          strokeWidth={strokeWidth}
          x={x}
          y={y}
          cx={cx}
          cy={cy}
          innerCircleRadius={innerCircleRadius}
          outerCircleRadius={outerCircleRadius}
        />
      )}

      {variant === "terminateEventDefinition" && (
        <>
          <circle
            cx={cx}
            cy={cy}
            strokeWidth={strokeWidth ?? 2.5}
            fill={NODE_COLORS.endEvent.foreground}
            stroke={NODE_COLORS.endEvent.foreground}
            strokeLinejoin={"round"}
            r={outerCircleRadius / 2}
          />
        </>
      )}
      {/* multiple */}
      {/* parallel multiple */}
    </>
  );
}

export function MessageEventSymbolSvg({
  stroke,
  cx,
  cy,
  innerCircleRadius,
  fill,
  filled,
}: {
  stroke: string;
  cx: number;
  cy: number;
  innerCircleRadius: number;
  fill: string;
  filled: boolean;
}) {
  const bodyWidth = innerCircleRadius * 1.2;
  const bodyHeight = innerCircleRadius * 0.8;

  const envelopeBody = {
    topLeft: { x: cx - bodyWidth / 2, y: cy - bodyHeight / 2 },
    bottomRight: { x: cx + bodyWidth / 2, y: cy + bodyHeight / 2 },
  };

  const flapHeight = bodyHeight * 0.5;
  const envelopeFlap = [
    { x: envelopeBody.topLeft.x, y: envelopeBody.topLeft.y },
    { x: envelopeBody.bottomRight.x, y: envelopeBody.topLeft.y },
    { x: cx, y: envelopeBody.topLeft.y + flapHeight },
  ];

  return (
    <>
      <rect
        x={envelopeBody.topLeft.x}
        y={envelopeBody.topLeft.y}
        width={bodyWidth}
        height={bodyHeight}
        strokeWidth={1.5}
        strokeLinejoin={"round"}
        fill={filled ? stroke : fill}
        stroke={stroke}
      />

      <polygon
        points={envelopeFlap.map((point) => `${point.x},${point.y}`).join(" ")}
        strokeWidth={1.5}
        strokeLinejoin={"round"}
        fill={filled ? stroke : fill}
        stroke={stroke}
      />

      {filled && (
        <>
          <line
            x1={envelopeFlap[0].x}
            y1={envelopeFlap[0].y}
            x2={envelopeFlap[2].x}
            y2={envelopeFlap[2].y}
            stroke={fill}
            strokeWidth={1.5}
          />
          <line
            x1={envelopeFlap[1].x}
            y1={envelopeFlap[1].y}
            x2={envelopeFlap[2].x}
            y2={envelopeFlap[2].y}
            stroke={fill}
            strokeWidth={1.5}
          />
        </>
      )}
    </>
  );
}

export function TimerEventSymbolSvg({
  stroke,
  cx,
  cy,
  innerCircleRadius,
  outerCircleRadius,
  filled,
}: {
  stroke: string;
  cx: number;
  cy: number;
  innerCircleRadius: number;
  outerCircleRadius: number;
  filled: boolean;
}) {
  const padding = 1.2 * (outerCircleRadius - innerCircleRadius);
  const clockRadius = innerCircleRadius - padding;

  const shortHandLength = clockRadius * 0.5;
  const longHandLength = clockRadius * 0.9;

  const hourHandAngle = Math.PI / 12;
  const minuteHandAngle = (-5 * Math.PI) / 12;

  const hourHand = {
    x: cx + shortHandLength * Math.cos(hourHandAngle),
    y: cy + shortHandLength * Math.sin(hourHandAngle),
  };

  const minuteHand = {
    x: cx + longHandLength * Math.cos(minuteHandAngle),
    y: cy + longHandLength * Math.sin(minuteHandAngle),
  };

  return (
    <>
      <circle
        cx={cx}
        cy={cy}
        r={clockRadius}
        stroke={stroke}
        strokeWidth={1.5}
        fill={filled ? stroke : "transparent"}
      />

      <line
        x1={cx}
        y1={cy}
        x2={hourHand.x}
        y2={hourHand.y}
        stroke={filled ? "transparent" : stroke}
        strokeWidth={1.5}
      />

      <line
        x1={cx}
        y1={cy}
        x2={minuteHand.x}
        y2={minuteHand.y}
        stroke={filled ? "transparent" : stroke}
        strokeWidth={1.5}
      />

      {Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 12) * 2 * Math.PI;
        const x1 = cx + clockRadius * Math.cos(angle);
        const y1 = cy + clockRadius * Math.sin(angle);
        const x2 = cx + (clockRadius - padding * 0.5) * Math.cos(angle);
        const y2 = cy + (clockRadius - padding * 0.5) * Math.sin(angle);

        return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={1.5} />;
      })}
    </>
  );
}

export function ErrorEventSymbolSvg({
  stroke,
  cx,
  cy,
  innerCircleRadius,
  outerCircleRadius,
  filled,
}: {
  stroke: string;
  cx: number;
  cy: number;
  innerCircleRadius: number;
  outerCircleRadius: number;
  filled: boolean;
}) {
  const padding = 1.5 * (outerCircleRadius - innerCircleRadius);
  const hx = innerCircleRadius - padding;
  const hy = innerCircleRadius - padding;

  const scaleFactor = 20;
  const shiftLeft = 3.5;
  const shiftUp = 1;

  const points = [
    { x: cx - shiftLeft, y: cy },
    { x: cx - hx * 0.037 * scaleFactor - shiftLeft, y: cy + hy * 0.052 * scaleFactor - shiftUp },
    { x: cx - hx * 0.003 * scaleFactor - shiftLeft, y: cy - hy * 0.05 * scaleFactor - shiftUp },
    { x: cx + hx * 0.027 * scaleFactor - shiftLeft, y: cy + hy * 0.016 * scaleFactor - shiftUp },
    { x: cx + hx * 0.058 * scaleFactor - shiftLeft, y: cy - hy * 0.046 * scaleFactor - shiftUp },
    { x: cx + hx * 0.029 * scaleFactor - shiftLeft, y: cy + hy * 0.066 * scaleFactor - shiftUp },
    { x: cx - shiftLeft, y: cy },
  ];

  return (
    <>
      <polygon
        points={points.map((point) => `${point.x},${point.y}`).join(" ")}
        strokeWidth={1.5}
        strokeLinejoin={"round"}
        fill={filled ? stroke : "transparent"}
        stroke={stroke}
      />
    </>
  );
}

export function EscalationEventSymbolSvg({
  stroke,
  cx,
  cy,
  innerCircleRadius,
  filled,
}: {
  stroke: string;
  cx: number;
  cy: number;
  innerCircleRadius: number;
  filled: boolean;
}) {
  const arrowHeight = innerCircleRadius * 1.2;
  const arrowBaseWidth = innerCircleRadius * 1;

  const arrow = [
    { x: cx - arrowBaseWidth / 2, y: cy + arrowHeight / 2 }, // left
    { x: cx, y: cy - arrowHeight / 2 }, // top center
    { x: cx + arrowBaseWidth / 2, y: cy + arrowHeight / 2 }, // right
    { x: cx, y: cy + arrowHeight / 20 }, // mid center
  ] as const;

  return (
    <>
      <polygon
        points={arrow.map((point) => `${point.x},${point.y}`).join(" ")}
        strokeWidth={1.5}
        strokeLinejoin={"round"}
        fill={filled ? stroke : "transparent"}
        stroke={stroke}
      />
    </>
  );
}

export function CancelEventSymbolSvg({
  stroke,
  cx,
  cy,
  innerCircleRadius,
  filled,
}: {
  stroke: string;
  cx: number;
  cy: number;
  innerCircleRadius: number;
  filled: boolean;
}) {
  const farXPoint = 1.3;
  const closeXPoint = 1.7;
  const lowYPoint = 9;
  const highYPoint = 5;

  const cross = [
    { x: cx - innerCircleRadius / farXPoint, y: cy - innerCircleRadius + lowYPoint }, // upper left point 1
    { x: cx - innerCircleRadius / closeXPoint, y: cy - innerCircleRadius + highYPoint }, // upper left point 2
    { x: cx, y: cy - innerCircleRadius / highYPoint }, // upper joiner
    { x: cx + innerCircleRadius / closeXPoint, y: cy - innerCircleRadius + highYPoint }, // upper right point 2
    { x: cx + innerCircleRadius / farXPoint, y: cy - innerCircleRadius + lowYPoint }, // upper right point 1
    { x: cx + innerCircleRadius / highYPoint, y: cy }, // right joiner
    { x: cx + innerCircleRadius / farXPoint, y: cy + innerCircleRadius - lowYPoint }, // lower right point 2
    { x: cx + innerCircleRadius / closeXPoint, y: cy + innerCircleRadius - highYPoint }, // lower right point 1
    { x: cx, y: cy + innerCircleRadius / highYPoint }, // lower joiner
    { x: cx - innerCircleRadius / closeXPoint, y: cy + innerCircleRadius - highYPoint }, // lower left point 1
    { x: cx - innerCircleRadius / farXPoint, y: cy + innerCircleRadius - lowYPoint }, // lower left point 2
    { x: cx - innerCircleRadius / highYPoint, y: cy }, // left joiner
  ] as const;

  return (
    <>
      <polygon
        points={cross.map((point) => `${point.x},${point.y}`).join(" ")}
        strokeWidth={1.5}
        strokeLinejoin={"round"}
        fill={filled ? stroke : "transparent"}
        stroke={stroke}
      />
    </>
  );
}

export function CompensationEventSymbolSvg({
  stroke,
  cx,
  cy,
  x,
  y,
  innerCircleRadius,
  outerCircleRadius,
  filled,
}: {
  stroke: string;
  cx: number;
  cy: number;
  x: number;
  y: number;
  innerCircleRadius: number;
  outerCircleRadius: number;
  filled: boolean;
}) {
  const padding = 1.5 * (outerCircleRadius - innerCircleRadius);

  const hx = x + innerCircleRadius - padding * 0.6;
  const hy = y + innerCircleRadius - padding * 0.2;

  const rightOffset = 0.15 * innerCircleRadius;

  const firstTriangle = [
    { x: cx + hx - rightOffset, y: cy - hy + (outerCircleRadius - innerCircleRadius) },
    { x: cx - rightOffset, y: cy },
    { x: cx + hx - rightOffset, y: cy + hy - (outerCircleRadius - innerCircleRadius) },
  ] as const;

  const secondTriangle = [
    { x: cx - rightOffset, y: cy - hy + (outerCircleRadius - innerCircleRadius) },
    { x: cx - hx - rightOffset, y: cy },
    { x: cx - rightOffset, y: cy + hy - (outerCircleRadius - innerCircleRadius) },
  ] as const;

  return (
    <>
      <polygon
        points={firstTriangle.map((point) => `${point.x},${point.y}`).join(" ")}
        strokeWidth={1.5}
        strokeLinejoin={"round"}
        fill={filled ? stroke : "transparent"}
        stroke={stroke}
      />
      <polygon
        points={secondTriangle.map((point) => `${point.x},${point.y}`).join(" ")}
        strokeWidth={1.5}
        strokeLinejoin={"round"}
        fill={filled ? stroke : "transparent"}
        stroke={stroke}
      />
    </>
  );
}

export function ConditionalEventSymbolSvg({
  stroke,
  cx,
  cy,
  outerCircleRadius,
  filled,
}: {
  stroke: string;
  cx: number;
  cy: number;
  outerCircleRadius: number;
  filled: boolean;
}) {
  const squareSize = outerCircleRadius * 1.1;
  const lineSpacing = squareSize / 5;
  const lineThickness = 2;

  return (
    <>
      <rect
        x={cx - squareSize / 2}
        y={cy - squareSize / 2}
        width={squareSize}
        height={squareSize}
        fill={filled ? stroke : "transparent"}
        stroke={stroke}
        strokeWidth={1.5}
      />

      {[...Array(4)].map((_, index) => (
        <line
          key={index}
          x1={cx - squareSize / 2 + 5}
          y1={cy - squareSize / 2 + lineSpacing * (index + 1)}
          x2={cx + squareSize / 2 - 5}
          y2={cy - squareSize / 2 + lineSpacing * (index + 1)}
          stroke={stroke}
          strokeWidth={lineThickness}
        />
      ))}
    </>
  );
}

export function LinkEventSymbolSvg({
  stroke,
  cx,
  cy,
  innerCircleRadius,
  filled,
}: {
  stroke: string;
  cx: number;
  cy: number;
  innerCircleRadius: number;
  filled: boolean;
}) {
  const arrowHeight = innerCircleRadius * 1.2;
  const arrowBaseWidth = innerCircleRadius * 1;
  const shiftLeft = 7;
  const rectangleHeight = 5;
  const arrowPadding = 2;

  const arrow = [
    { x: cx - arrowBaseWidth / 2 - shiftLeft, y: cy + arrowHeight / 2 - rectangleHeight }, // bottom left rectangle
    { x: cx - arrowBaseWidth / 2 - shiftLeft, y: cy - arrowHeight / 2 + rectangleHeight }, // top left rectangle
    { x: cx + arrowBaseWidth / 2, y: cy - arrowHeight / 2 + rectangleHeight }, // top right rectangle
    { x: cx + arrowBaseWidth / 2, y: cy - arrowHeight / 2 - arrowPadding }, // upper arrow start
    { x: cx + arrowBaseWidth / 2 + 8, y: cy }, // arrow point
    { x: cx + arrowBaseWidth / 2, y: cy + arrowHeight / 2 + arrowPadding }, // lower arrow start
    { x: cx + arrowBaseWidth / 2, y: cy + arrowHeight / 2 - rectangleHeight }, // bottom right rectangle
  ] as const;

  return (
    <>
      <polygon
        points={arrow.map((point) => `${point.x},${point.y}`).join(" ")}
        strokeWidth={1.5}
        strokeLinejoin={"round"}
        fill={filled ? stroke : "transparent"}
        stroke={stroke}
      />
    </>
  );
}

export function SignalEventSymbolSvg({
  stroke,
  strokeWidth,
  cx,
  cy,
  x,
  y,
  innerCircleRadius,
  outerCircleRadius,
  filled,
}: {
  stroke: string;
  strokeWidth?: number;
  cx: number;
  cy: number;
  x: number;
  y: number;
  innerCircleRadius: number;
  outerCircleRadius: number;
  filled: boolean;
}) {
  const padding = 1.5 * (outerCircleRadius - innerCircleRadius);
  const hx = x + innerCircleRadius - padding;
  const hy = y + innerCircleRadius - padding;
  const triangle = [
    { x: cx + cos30 * hx, y: padding / 4 + cy + sin30 * hy }, // right
    { x: cx - cos30 * hx, y: padding / 4 + cy + sin30 * hy }, // left
    { x: cx, y: padding / 4 + cy - hy }, // top
  ] as const;

  return (
    <>
      <polygon
        points={triangle.map((point) => `${point.x},${point.y}`).join(" ")}
        strokeWidth={strokeWidth ?? 1.5}
        strokeLinejoin={"round"}
        fill={filled ? stroke : "transparent"}
        stroke={stroke}
      />
    </>
  );
}

export function ActivityNodeIcons({
  x,
  y,
  width,
  height,
  icons,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  icons: Set<ActivityNodeMarker>;
}) {
  return (
    <>
      {icons.has(ActivityNodeMarker.Loop) && (
        <text
          fontSize="2em"
          textAnchor={"middle"}
          dominantBaseline={"auto"}
          fontWeight={"bold"}
          transform={`translate(${x + width / 2}, ${y + height - 5}) rotate(0)`}
        >
          ↻
        </text>
      )}
      {icons.has(ActivityNodeMarker.AdHocSubProcess) && (
        <text
          fontSize="2em"
          textAnchor={"middle"}
          dominantBaseline={"auto"}
          fontWeight={"bold"}
          transform={`translate(${x + width / 2}, ${y + height - 5}) rotate(0)`}
        >
          ~
        </text>
      )}
      {icons.has(ActivityNodeMarker.Compensation) && (
        <text
          fontSize="2em"
          textAnchor={"middle"}
          dominantBaseline={"auto"}
          transform={`translate(${x + width / 2}, ${y + height - 5}) rotate(0)`}
        >
          ⏪
        </text>
      )}
      {icons.has(ActivityNodeMarker.Collapsed) && (
        <>
          <rect
            x={x + width / 2 - 15}
            y={y + height - 20 - DEFAULT_NODE_STROKE_WIDTH}
            width={30}
            height={20}
            fill={"transparent"}
            stroke={DEFAULT_NODE_STROKE_COLOR}
            strokeWidth={DEFAULT_NODE_STROKE_WIDTH}
          />
          <text
            fontSize="2em"
            textAnchor={"middle"}
            dominantBaseline={"auto"}
            fontWeight={"bold"}
            x={x + width / 2}
            y={1 + y + height}
          >
            +
          </text>
        </>
      )}
      {icons.has(ActivityNodeMarker.MultiInstanceParallel) && (
        <text
          fontSize="2em"
          textAnchor={"middle"}
          dominantBaseline={"auto"}
          fontWeight={"bold"}
          transform={`translate(${x + width / 2 - 7}, ${y + height - 15}) rotate(90)`}
        >
          ☰
        </text>
      )}
      {icons.has(ActivityNodeMarker.MultiInstanceSequential) && (
        <text
          fontSize="2em"
          textAnchor={"middle"}
          dominantBaseline={"auto"}
          fontWeight={"bold"}
          transform={`translate(${x + width / 2}, ${y + height - 5}) rotate(0)`}
        >
          ☰
        </text>
      )}
    </>
  );
}
