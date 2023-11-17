import * as React from "react";
import { useState, useMemo, useCallback } from "react";
import { FormSection } from "@patternfly/react-core/dist/js/components/Form";
import { PencilAltIcon } from "@patternfly/react-icons/dist/js/icons/pencil-alt-icon";
import { PropertiesPanelHeader } from "./PropertiesPanelHeader";
import { useDmnEditorStoreApi } from "../store/Store";
import { NumberInput } from "@patternfly/react-core/dist/js/components/NumberInput";
import { DMNDI15__DMNShape } from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { addOrGetDrd } from "../mutations/addOrGetDrd";
import { ToggleGroup, ToggleGroupItem } from "@patternfly/react-core/dist/js/components/ToggleGroup";
import { Select, SelectVariant, SelectOption } from "@patternfly/react-core/dist/js/components/Select";
import { useInViewSelect } from "../responsiveness/useInViewSelect";
import { useDmnEditor } from "../DmnEditorContext";
import { useDmnEditorDerivedStore } from "../store/DerivedStore";
import "./FontOptions.css";

// https://www.w3schools.com/cssref/css_websafe_fonts.php
// Array of [name, family]
const WEBSAFE_FONTS_LIST = [
  "Arial",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Times New Roman",
  "Georgia",
  "Garamond",
  "Courier New",
  "Brush Script MT",
];

const DEFAULT_FONT_SIZE = 16;
const MAX_FONT_SIZE = 72;
const MIN_FONT_SIZE = 0;

enum FontStyleToggleOptions {
  BOLD = "bold",
  ITALIC = "italic",
  UNDERLINE = "underline",
  STRIKE_THROUGH = "strike-through",
  FONT_COLOR = "font-color",
}

export function FontOptions({ startExpanded, nodeIds }: { startExpanded: boolean; nodeIds: string[] }) {
  const dmnEditorStoreApi = useDmnEditorStoreApi();
  const [isStyleSectionExpanded, setStyleSectionExpanded] = useState<boolean>(startExpanded);

  const { dmnShapesByHref } = useDmnEditorDerivedStore();
  const shapes = useMemo(() => nodeIds.map((nodeId) => dmnShapesByHref.get(nodeId)), [dmnShapesByHref, nodeIds]);
  const shapesStyle = useMemo(() => shapes.map((shape) => shape?.["di:Style"]), [shapes]);

  const fontFamily = useMemo(() => shapesStyle[0]?.["@_fontFamily"], [shapesStyle]);
  const isFontBold = useMemo(() => shapesStyle[0]?.["@_fontBold"] ?? false, [shapesStyle]);
  const isFontItalic = useMemo(() => shapesStyle[0]?.["@_fontItalic"] ?? false, [shapesStyle]);
  const isFontUnderline = useMemo(() => shapesStyle[0]?.["@_fontUnderline"], [shapesStyle]);
  const isFontStrikeThrough = useMemo(() => shapesStyle[0]?.["@_fontStrikeThrough"] ?? false, [shapesStyle]);
  const fontSize = useMemo(() => shapesStyle[0]?.["@_fontSize"] ?? DEFAULT_FONT_SIZE, [shapesStyle]);
  const fontColor = useMemo(() => {
    const b = (shapesStyle[0]?.["dmndi:FontColor"]?.["@_blue"] ?? 0).toString(16);
    const g = (shapesStyle[0]?.["dmndi:FontColor"]?.["@_green"] ?? 0).toString(16);
    const r = (shapesStyle[0]?.["dmndi:FontColor"]?.["@_red"] ?? 0).toString(16);
    return `#${r.length === 1 ? "0" + r : r}${g.length === 1 ? "0" + g : g}${b.length === 1 ? "0" + b : b}`;
  }, [shapesStyle]);

  const editShapeStyle = useCallback(
    (callback: (shape: DMNDI15__DMNShape[]) => void) => {
      dmnEditorStoreApi.setState((state) => {
        const { diagramElements } = addOrGetDrd({
          definitions: state.dmn.model.definitions,
          drdIndex: state.diagram.drdIndex,
        });
        const _shapes = shapes.map((shape) => diagramElements[shape?.index ?? 0]);
        _shapes.forEach((_shape, i, _shapes) => {
          _shapes[i]["di:Style"] ??= { __$$element: "dmndi:DMNStyle" };
        });
        callback(_shapes);
      });
    },
    [dmnEditorStoreApi, shapes]
  );

  const { dmnEditorRootElementRef } = useDmnEditor();
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  const inViewTimezoneSelect = useInViewSelect(dmnEditorRootElementRef, toggleRef);
  const [isFontFamilySelectOpen, setFontFamilySelectOpen] = useState(false);

  const onSelectFont = useCallback(
    (e, value, isPlaceholder) => {
      if (isPlaceholder) {
        editShapeStyle((shapes) => {
          shapes.forEach((shape, i, shapes) => {
            shape["di:Style"]!["@_fontFamily"] ??= undefined;
          });
        });
        return;
      }
      editShapeStyle((shapes) => {
        shapes.forEach((shape, i, shapes) => {
          shape["di:Style"]!["@_fontFamily"] = value;
        });
      });
    },
    [editShapeStyle]
  );

  const validateFontSize = useCallback((value?: number): number => {
    if (value === undefined) {
      return DEFAULT_FONT_SIZE;
    }
    if (value >= MAX_FONT_SIZE) {
      return MAX_FONT_SIZE;
    }
    if (value <= MIN_FONT_SIZE) {
      return MIN_FONT_SIZE;
    }
    return value;
  }, []);

  const onMinus = useCallback(() => {
    editShapeStyle((shapes) => {
      shapes.forEach((shape) => {
        shape["di:Style"]!["@_fontSize"] = validateFontSize(
          (shape!["di:Style"]?.["@_fontSize"] ?? DEFAULT_FONT_SIZE) - 1
        );
      });
    });
  }, [editShapeStyle, validateFontSize]);

  const onChange = useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      editShapeStyle((shapes) => {
        shapes.forEach((shape) => {
          shape["di:Style"]!["@_fontSize"] = +(event.target as HTMLInputElement).value;
        });
      });
    },
    [editShapeStyle]
  );

  const onPlus = useCallback(() => {
    editShapeStyle((shapes) => {
      shapes.forEach((shape) => {
        shape["di:Style"]!["@_fontSize"] = validateFontSize(
          (shape!["di:Style"]?.["@_fontSize"] ?? DEFAULT_FONT_SIZE) + 1
        );
      });
    });
  }, [editShapeStyle, validateFontSize]);

  const onChangeBold = useCallback(() => {
    editShapeStyle((shapes) => {
      shapes.forEach((shape) => {
        shape["di:Style"]!["@_fontBold"] = !shape?.["di:Style"]?.["@_fontBold"] ?? true;
      });
    });
  }, [editShapeStyle]);

  const onChangeItalic = useCallback(() => {
    editShapeStyle((shapes) => {
      shapes.forEach((shape) => {
        shape["di:Style"]!["@_fontItalic"] = !shape?.["di:Style"]?.["@_fontItalic"] ?? true;
      });
    });
  }, [editShapeStyle]);

  const onChangeUnderline = useCallback(() => {
    editShapeStyle((shapes) => {
      shapes.forEach((shape) => {
        shape["di:Style"]!["@_fontUnderline"] = !shape?.["di:Style"]?.["@_fontUnderline"] ?? true;
      });
    });
  }, [editShapeStyle]);

  const onChangeStrikeThrough = useCallback(() => {
    editShapeStyle((shapes) => {
      shapes.forEach((shape) => {
        shape["di:Style"]!["@_fontStrikeThrough"] = !shape?.["di:Style"]?.["@_fontStrikeThrough"] ?? true;
      });
    });
  }, [editShapeStyle]);

  const colorPickerRef = React.useRef<HTMLInputElement>(null);

  const onChangeColor = useCallback(
    (newColor: string) => {
      const withoutHash = newColor.replace("#", "");
      editShapeStyle((shapes) => {
        shapes.forEach((shape) => {
          shape!["di:Style"]!["dmndi:FontColor"] ??= { "@_blue": 0, "@_green": 0, "@_red": 0 };
          shape!["di:Style"]!["dmndi:FontColor"]["@_red"] = parseInt(withoutHash.slice(0, 2), 16);
          shape!["di:Style"]!["dmndi:FontColor"]["@_green"] = parseInt(withoutHash.slice(2, 4), 16);
          shape!["di:Style"]!["dmndi:FontColor"]["@_blue"] = parseInt(withoutHash.slice(4, 6), 16);
        });
      });
    },
    [editShapeStyle]
  );

  return (
    <>
      <PropertiesPanelHeader
        icon={<PencilAltIcon width={16} height={36} style={{ marginLeft: "12px" }} />}
        expands={true}
        fixed={false}
        isSectionExpanded={isStyleSectionExpanded} // TODO LUIZ: isStyleSectionExpanded
        toogleSectionExpanded={() => setStyleSectionExpanded((prev) => !prev)}
        title={"Font"}
      />
      {isStyleSectionExpanded && (
        <FormSection style={{ paddingLeft: "20px", marginTop: "0px" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div className={"kie-dmn-editor--font-options-toggle-group"}>
              <NumberInput
                aria-label={"Font size"}
                className={"kie-dmn-editor--font-options-toggle-group-item-number-input"}
                value={fontSize}
                isDisabled={false}
                widthChars={2}
                onMinus={onMinus}
                onChange={onChange}
                onPlus={onPlus}
                inputName="Font size"
                inputAriaLabel="Font size"
                minusBtnAriaLabel="minus"
                plusBtnAriaLabel="plus"
              />
              <ToggleGroup areAllGroupsDisabled={false} aria-label="Default with multiple selectable">
                <ToggleGroupItem
                  aria-label={"Toggle font bold"}
                  className={"kie-dmn-editor--font-options-toggle-group-item"}
                  text={
                    <div>
                      <b>B</b>
                    </div>
                  }
                  key={FontStyleToggleOptions.BOLD}
                  buttonId={FontStyleToggleOptions.BOLD}
                  isSelected={isFontBold}
                  onChange={onChangeBold}
                />
                <ToggleGroupItem
                  aria-label={"Toggle font italic"}
                  className={"kie-dmn-editor--font-options-toggle-group-item-italic"}
                  text={
                    <div>
                      <i style={{ fontFamily: "serif" }}>I</i>
                    </div>
                  }
                  key={FontStyleToggleOptions.ITALIC}
                  buttonId={FontStyleToggleOptions.ITALIC}
                  isSelected={isFontItalic}
                  onChange={onChangeItalic}
                />
                <ToggleGroupItem
                  key={FontStyleToggleOptions.UNDERLINE}
                  className={"kie-dmn-editor--font-options-toggle-group-item"}
                  text={
                    <div>
                      <u>U</u>
                    </div>
                  }
                  aria-label={"Toggle font underline"}
                  buttonId={FontStyleToggleOptions.UNDERLINE}
                  isSelected={isFontUnderline}
                  onChange={onChangeUnderline}
                />
                <ToggleGroupItem
                  key={FontStyleToggleOptions.STRIKE_THROUGH}
                  className={"kie-dmn-editor--font-options-toggle-group-item"}
                  text={
                    <div>
                      <p style={{ textDecoration: "line-through" }}>S</p>
                    </div>
                  }
                  aria-label={"Toggle font strike through"}
                  buttonId={FontStyleToggleOptions.STRIKE_THROUGH}
                  isSelected={isFontStrikeThrough}
                  onChange={onChangeStrikeThrough}
                />
                <ToggleGroupItem
                  key={FontStyleToggleOptions.FONT_COLOR}
                  className={"kie-dmn-editor--font-options-toggle-group-item-color-picker"}
                  aria-label={"Toggle font strike through"}
                  buttonId={FontStyleToggleOptions.FONT_COLOR}
                  onClick={() => colorPickerRef.current?.click()}
                  text={<ColorPicker colorPickerRef={colorPickerRef} fontColor={fontColor} onChange={onChangeColor} />}
                />
              </ToggleGroup>
            </div>
            <br />
            <Select
              toggleRef={toggleRef}
              variant={SelectVariant.single}
              aria-label={"Select font style"}
              isOpen={isFontFamilySelectOpen}
              onSelect={onSelectFont}
              onToggle={() => setFontFamilySelectOpen((prev) => !prev)}
              selections={fontFamily ?? ""}
              isDisabled={false}
              maxHeight={inViewTimezoneSelect.maxHeight}
              direction={inViewTimezoneSelect.direction}
            >
              {WEBSAFE_FONTS_LIST.map((fontName, index) => (
                <SelectOption key={index} value={fontName} style={{ fontFamily: fontName }} />
              ))}
            </Select>
          </div>
        </FormSection>
      )}
    </>
  );
}

export function ColorPicker(props: {
  fontColor: string;
  onChange: (newColor: string) => void;
  colorPickerRef: React.RefObject<HTMLInputElement>;
}) {
  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
          alignItems: "center",
        }}
        onClick={() => props.colorPickerRef.current?.click()}
      >
        <p>A</p>
        <div style={{ height: "4px", width: "18px", backgroundColor: props.fontColor }} />
        <input
          ref={props.colorPickerRef}
          aria-label={"Font color"}
          type={"color"}
          disabled={false}
          value={props.fontColor}
          style={{ opacity: "0", width: 0, height: 0 }}
          onChange={(e) => props.onChange(e.currentTarget.value)}
        />
      </div>
    </>
  );
}
