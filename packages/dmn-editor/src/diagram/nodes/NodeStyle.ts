import React, { useMemo } from "react";
import { DMNDI15__DMNStyle } from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";

export interface NodeStyle {
  fontStyle: React.CSSProperties;
  shapeStyle: ShapeStyle;
}

export interface ShapeStyle {
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
}

export interface DmnFontStyle {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeThrough: boolean;
  family?: string;
  size?: number;
  color: string;
}

export interface Color {
  blue: number;
  green: number;
  red: number;
  opacity: number;
}

export const DEFAULT_NODE_FILL = "rgba(255, 255, 255, 1)";
export const DEFAULT_NODE_STROKE_WIDTH = 1.5;
export const DEFAULT_NODE_STROKE_COLOR = "rgba(0, 0, 0, 1)";
export const DEFAULT_FONT_COLOR = "rgba(0, 0, 0, 1)";

export function useNodeStyle(dmnStyle?: DMNDI15__DMNStyle): NodeStyle {
  const fillColor = useMemo(() => {
    const blue = dmnStyle?.["dmndi:FillColor"]?.["@_blue"];
    const green = dmnStyle?.["dmndi:FillColor"]?.["@_green"];
    const red = dmnStyle?.["dmndi:FillColor"]?.["@_red"];

    if (blue === undefined || green === undefined || red === undefined) {
      return DEFAULT_NODE_FILL;
    }

    return `rgba(${red}, ${green}, ${blue}, 0.9)`;
  }, [dmnStyle]);
  const strokeColor = useMemo(() => {
    const blue = dmnStyle?.["dmndi:StrokeColor"]?.["@_blue"];
    const green = dmnStyle?.["dmndi:StrokeColor"]?.["@_green"];
    const red = dmnStyle?.["dmndi:StrokeColor"]?.["@_red"];

    if (blue === undefined || green === undefined || red === undefined) {
      return DEFAULT_NODE_STROKE_COLOR;
    }
    return `rgba(${red}, ${green}, ${blue}, 1)`;
  }, [dmnStyle]);

  const fontProperties = useMemo(() => {
    const blue = dmnStyle?.["dmndi:FontColor"]?.["@_blue"];
    const green = dmnStyle?.["dmndi:FontColor"]?.["@_green"];
    const red = dmnStyle?.["dmndi:FontColor"]?.["@_red"];

    const fontColor =
      blue === undefined || green === undefined || red === undefined
        ? DEFAULT_FONT_COLOR
        : `rgba(${red}, ${green}, ${blue}, 1)`;

    return {
      bold: dmnStyle?.["@_fontBold"] ?? false,
      italic: dmnStyle?.["@_fontItalic"] ?? false,
      underline: dmnStyle?.["@_fontUnderline"] ?? false,
      strikeThrough: dmnStyle?.["@_fontStrikeThrough"] ?? false,
      family: dmnStyle?.["@_fontFamily"],
      size: dmnStyle?.["@_fontSize"],
      color: fontColor,
    };
  }, [dmnStyle]);

  return {
    fontStyle: getFonteStyle(fontProperties),
    shapeStyle: {
      fillColor,
      strokeColor,
      strokeWidth: DEFAULT_NODE_STROKE_WIDTH,
    },
  };
}

export function getFonteStyle(fontProperties?: DmnFontStyle): React.CSSProperties {
  let textDecoration = "";
  if (fontProperties?.underline) {
    textDecoration += "underline ";
  }
  if (fontProperties?.strikeThrough) {
    textDecoration += "line-through";
  }

  return {
    fontWeight: fontProperties?.bold ? "bold" : "",
    fontStyle: fontProperties?.italic ? "italic" : "",
    fontFamily: fontProperties?.family,
    textDecoration,
    fontSize: fontProperties?.size,
    color: fontProperties?.color,
  };
}
