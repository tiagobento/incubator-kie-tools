import * as React from "react";
import { useState } from "react";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../../store/StoreContext";
import { FormGroup } from "@patternfly/react-core/dist/js/components/Form";
import { addOrGetProcessAndDiagramElements } from "../../mutations/addOrGetProcessAndDiagramElements";
import { visitFlowElementsAndArtifacts } from "../../mutations/_elementVisitor";
import { Radio } from "@patternfly/react-core/dist/js/components/Radio";
import { TextInput } from "@patternfly/react-core/dist/js/components/TextInput";
import { Select, SelectOption } from "@patternfly/react-core/dist/js/components/Select";
import { Normalized } from "../../normalization/normalize";
import { BPMN20__tProcess } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { ElementFilter } from "@kie-tools/xml-parser-ts/dist/elementFilter";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";
import "./TimerOptions.css";
import { DatePicker } from "@patternfly/react-core/dist/js/components/DatePicker";
import { BPMN20__tFormalExpression } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";

export type WithTimer =
  | undefined
  | Normalized<
      ElementFilter<
        Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>,
        "startEvent" | "intermediateCatchEvent" | "intermediateThrowEvent" | "endEvent" | "boundaryEvent"
      >
    >;

export function TimerOptions({ element }: { element: WithTimer }) {
  const isReadOnly = useBpmnEditorStore((s) => s.settings.isReadOnly);
  const [selectedOption, setSelectedOption] = useState<string | undefined>(undefined);
  const [isoCronType, setIsoCronType] = useState<string | undefined>("ISO");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("");

  const handleOptionChange = (value: string) => {
    setSelectedOption(value);
    setInputValue("");
    setIsoCronType(undefined);
  };

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleDateChange = (event: React.FormEvent<HTMLInputElement>, value: string, date?: Date) => {
    setSelectedDate(value);
  };
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();
  const settings = useBpmnEditorStore((s) => s.settings);

  return (
    <FormGroup label="Timer options" fieldId="timer-options">
      <div className="radio-group">
        <Radio
          id="fire-once"
          name="timer-options"
          label="Fire once after duration"
          // Check if timeDuration has a value
          isChecked={
            selectedOption === "fire-once" ||
            !!element?.eventDefinition?.find((eventDef) => eventDef.__$$element === "timerEventDefinition")
              ?.timeDuration?.__$$text
          }
          onChange={() => handleOptionChange("fire-once")}
          isDisabled={isReadOnly}
        />
        {selectedOption === "fire-once" && (
          <TextInput
            id="fire-once-input"
            value={
              element?.eventDefinition?.find((eventDef) => eventDef.__$$element === "timerEventDefinition")
                ?.timeDuration?.__$$text
            }
            onChange={(newTimeDuration) =>
              bpmnEditorStoreApi.setState((s) => {
                const { process } = addOrGetProcessAndDiagramElements({
                  definitions: s.bpmn.model.definitions,
                });
                visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                  if (e["@_id"] === element?.["@_id"] && e.__$$element === element.__$$element) {
                    let timerEventDefinition = e.eventDefinition?.find(
                      (event) => event.__$$element === "timerEventDefinition"
                    );
                    timerEventDefinition ??= {
                      "@_id": generateUuid(),
                      __$$element: "timerEventDefinition",
                    };

                    e.eventDefinition ??= [];
                    e.eventDefinition.push(timerEventDefinition);

                    timerEventDefinition.timeDuration = timerEventDefinition.timeDuration || { "@_id": generateUuid() };
                    timerEventDefinition.timeDuration.__$$text = newTimeDuration;
                  }
                });
              })
            }
            isDisabled={isReadOnly}
            type="text"
            placeholder="Enter duration or expression #{expression}"
            className="timer-input"
          />
        )}
      </div>

      <div className="radio-group">
        <Radio
          id="fire-multiple"
          name="timer-options"
          label="Fire multiple times"
          // Check if timeCycle has a value
          isChecked={
            selectedOption === "fire-multiple" ||
            !!element?.eventDefinition?.find((eventDef) => eventDef.__$$element === "timerEventDefinition")?.timeCycle
              ?.__$$text
          }
          onChange={() => handleOptionChange("fire-multiple")}
          isDisabled={isReadOnly}
        />
        {selectedOption === "fire-multiple" && (
          <div className="timer-options-multiple">
            <div className="dropdown-group">
              <Select
                id="iso-cron-select"
                isOpen={isDropdownOpen}
                onToggle={handleDropdownToggle}
                onSelect={(event, selection) => {
                  setIsoCronType(selection as string);
                  setIsDropdownOpen(false);
                }}
                selections={isoCronType}
                isDisabled={isReadOnly}
                className="iso-cron-select"
              >
                <SelectOption value="ISO" />
                <SelectOption value="Cron" />
              </Select>
              <TextInput
                id="fire-multiple-input"
                value={
                  element?.eventDefinition?.find((eventDef) => eventDef.__$$element === "timerEventDefinition")
                    ?.timeCycle?.__$$text
                }
                onChange={(newTimeCycle) =>
                  bpmnEditorStoreApi.setState((s) => {
                    const { process } = addOrGetProcessAndDiagramElements({
                      definitions: s.bpmn.model.definitions,
                    });
                    visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                      if (e["@_id"] === element?.["@_id"] && e.__$$element === element.__$$element) {
                        let timerEventDefinition = e.eventDefinition?.find(
                          (event) => event.__$$element === "timerEventDefinition"
                        );
                        timerEventDefinition ??= {
                          "@_id": generateUuid(),
                          __$$element: "timerEventDefinition",
                        };

                        e.eventDefinition ??= [];
                        e.eventDefinition.push(timerEventDefinition);

                        timerEventDefinition.timeCycle = timerEventDefinition.timeCycle || { "@_id": generateUuid() };
                        timerEventDefinition.timeCycle.__$$text = newTimeCycle;
                      }
                    });
                  })
                }
                isDisabled={isReadOnly}
                type="text"
                placeholder="Enter time cycle or expression #{expression}"
                className="timer-input"
              />
            </div>
          </div>
        )}
      </div>

      <div className="radio-group">
        <Radio
          id="fire-specific-date"
          name="timer-options"
          label="Fire at a specific date"
          // Check if timeDate has a value
          isChecked={
            selectedOption === "fire-specific-date" ||
            !!element?.eventDefinition?.find((eventDef) => eventDef.__$$element === "timerEventDefinition")?.timeDate
              ?.__$$text
          }
          onChange={() => handleOptionChange("fire-specific-date")}
          isDisabled={isReadOnly}
        />
        {selectedOption === "fire-specific-date" && (
          <div className="timer-options-specific-date">
            <TextInput
              id="specific-date-input"
              value={
                element?.eventDefinition?.find((eventDef) => eventDef.__$$element === "timerEventDefinition")?.timeDate
                  ?.__$$text
              }
              onChange={(newTimeDate) =>
                bpmnEditorStoreApi.setState((s) => {
                  const { process } = addOrGetProcessAndDiagramElements({
                    definitions: s.bpmn.model.definitions,
                  });
                  visitFlowElementsAndArtifacts(process, ({ element: e }) => {
                    if (e["@_id"] === element?.["@_id"] && e.__$$element === element.__$$element) {
                      let timerEventDefinition = e.eventDefinition?.find(
                        (event) => event.__$$element === "timerEventDefinition"
                      );
                      timerEventDefinition ??= {
                        "@_id": generateUuid(),
                        __$$element: "timerEventDefinition",
                      };

                      e.eventDefinition ??= [];
                      e.eventDefinition.push(timerEventDefinition);

                      timerEventDefinition.timeDate = timerEventDefinition.timeDate || { "@_id": generateUuid() };
                      timerEventDefinition.timeDate.__$$text = newTimeDate;
                    }
                  });
                })
              }
              isDisabled={isReadOnly}
              type="text"
              placeholder="Enter date value or expression #{expression}"
              className="timer-input"
            />
            <div className="datepicker-group">
              <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                inputProps={{
                  isDisabled: false,
                  placeholder: "Select a date",
                  "aria-label": "Date picker input",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </FormGroup>
  );
}
