import * as React from "react";
import { useState } from "react";
import { useBpmnEditorStore } from "../../store/StoreContext";
import { FormGroup } from "@patternfly/react-core/dist/js/components/Form";
import { Radio } from "@patternfly/react-core/dist/js/components/Radio";
import { TextInput } from "@patternfly/react-core/dist/js/components/TextInput";
import { Select, SelectOption } from "@patternfly/react-core/dist/js/components/Select";
import { Normalized } from "../../normalization/normalize";
import { BPMN20__tProcess } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { ElementFilter } from "@kie-tools/xml-parser-ts/dist/elementFilter";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import "./TimerOptions.css";
import { DatePicker } from "@patternfly/react-core/dist/js/components/DatePicker";

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

  return (
    <FormGroup label="Timer options" fieldId="timer-options">
      <div className="radio-group">
        <Radio
          id="fire-once"
          name="timer-options"
          label="Fire once after duration"
          isChecked={selectedOption === "fire-once"}
          onChange={() => handleOptionChange("fire-once")}
          isDisabled={isReadOnly}
        />
        {selectedOption === "fire-once" && (
          <TextInput
            id="fire-once-input"
            value={inputValue}
            onChange={setInputValue}
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
          isChecked={selectedOption === "fire-multiple"}
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
                value={inputValue}
                onChange={setInputValue}
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
          isChecked={selectedOption === "fire-specific-date"}
          onChange={() => handleOptionChange("fire-specific-date")}
          isDisabled={isReadOnly}
        />
        {selectedOption === "fire-specific-date" && (
          <div className="timer-options-specific-date">
            <TextInput
              id="specific-date-input"
              value={inputValue}
              onChange={setInputValue}
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
