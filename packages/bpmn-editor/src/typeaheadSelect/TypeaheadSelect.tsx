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

import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";
import { Button } from "@patternfly/react-core/dist/js/components/Button";
import { MenuToggle, MenuToggleElement } from "@patternfly/react-core/dist/js/components/MenuToggle";
import { Select, SelectList, SelectOption, SelectOptionProps } from "@patternfly/react-core/dist/js/components/Select";
import {
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
} from "@patternfly/react-core/dist/js/components/TextInputGroup";
import { TimesIcon } from "@patternfly/react-icons/dist/js/icons/times-icon";
import * as React from "react";
import { useMemo } from "react";

// Based on https://v5-archive.patternfly.org/components/menus/select/#typeahead-with-create-option
export function TypeaheadSelect({
  id,
  options,
  onCreateNewOption,
  createNewOptionLabel,
  selected,
  setSelected,
  isDisabled,
}: {
  id: string;
  isDisabled?: boolean;
  selected: string | undefined;
  setSelected: (newSelected: string | undefined, newSelectedLabel: string | undefined) => void;
  options: SelectOptionProps[];
  onCreateNewOption: (newOptionLabel: string) => string;
  createNewOptionLabel: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState<string | undefined>();
  const [filterValue, setFilterValue] = React.useState<string>("");
  const [selectOptions, setSelectOptions] = React.useState<SelectOptionProps[]>(options);
  const [focusedItemIndex, setFocusedItemIndex] = React.useState<number | null>(null);
  const [activeItemId, setActiveItemId] = React.useState<string | null>(null);
  const textInputRef = React.useRef<HTMLInputElement>();

  const CREATE_NEW = useMemo(() => generateUuid(), []);

  React.useEffect(() => {
    const optionText = options.find((option) => option.value === selected)?.children;
    setInputValue(optionText as string);
    setFilterValue("");
  }, [options, selected]);

  React.useEffect(() => {
    let newSelectOptions: SelectOptionProps[] = options;

    // Filter menu items based on the text input value when one exists
    if (filterValue) {
      newSelectOptions = options.filter((menuItem) =>
        String(menuItem.children).toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    // If no option matches the filter exactly, display creation option
    if (!options.some((option) => String(option.children) === filterValue) && filterValue) {
      newSelectOptions = [
        {
          children: <i style={{ color: "#0067cc" }}>{`${createNewOptionLabel} "${filterValue}"`}</i>,
          value: CREATE_NEW,
        },
        ...newSelectOptions,
      ];
    }

    // Open the menu when the input value changes and the new value is not empty
    if (!isOpen && filterValue) {
      setIsOpen(true);
    }

    setSelectOptions(newSelectOptions);
  }, [filterValue, options]);

  const getSelectOptionId = (value: any) => `select-typeahead-${value?.replace(" ", "-")}`;

  const setActiveAndFocusedItem = (itemIndex: number) => {
    setFocusedItemIndex(itemIndex);
    const focusedItem = selectOptions[itemIndex];
    setActiveItemId(getSelectOptionId(focusedItem.value));
  };

  const resetActiveAndFocusedItem = () => {
    setFocusedItemIndex(null);
    setActiveItemId(null);
  };

  const closeMenu = () => {
    setIsOpen(false);
    resetActiveAndFocusedItem();
  };

  const onInputClick = () => {
    if (!isOpen) {
      setIsOpen(true);
    } else if (!inputValue) {
      closeMenu();
    }
  };

  const selectOption = (value: string | number, content: string | number) => {};

  const onSelect = (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
    if (value) {
      if (value === CREATE_NEW) {
        if (!options.some((item) => item.children === filterValue)) {
          const newValue = onCreateNewOption(filterValue);
          setSelected(newValue, filterValue);
        }
        setFilterValue("");
        closeMenu();
      } else {
        const optionText = selectOptions.find((option) => option.value === value)?.children;
        setInputValue(String(optionText));
        setSelected(String(value), String(optionText));

        setFilterValue("");
        closeMenu();
      }
    }
  };

  const onTextInputChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setInputValue(value);
    setFilterValue(value);

    resetActiveAndFocusedItem();
  };

  const handleMenuArrowKeys = (key: string) => {
    let indexToFocus = 0;

    if (!isOpen) {
      setIsOpen(true);
    }

    if (selectOptions.every((option) => option.isDisabled)) {
      return;
    }

    if (key === "ArrowUp") {
      // When no index is set or at the first index, focus to the last, otherwise decrement focus index
      if (focusedItemIndex === null || focusedItemIndex === 0) {
        indexToFocus = selectOptions.length - 1;
      } else {
        indexToFocus = focusedItemIndex - 1;
      }

      // Skip disabled options
      while (selectOptions[indexToFocus].isDisabled) {
        indexToFocus--;
        if (indexToFocus === -1) {
          indexToFocus = selectOptions.length - 1;
        }
      }
    }

    if (key === "ArrowDown") {
      // When no index is set or at the last index, focus to the first, otherwise increment focus index
      if (focusedItemIndex === null || focusedItemIndex === selectOptions.length - 1) {
        indexToFocus = 0;
      } else {
        indexToFocus = focusedItemIndex + 1;
      }

      // Skip disabled options
      while (selectOptions[indexToFocus].isDisabled) {
        indexToFocus++;
        if (indexToFocus === selectOptions.length) {
          indexToFocus = 0;
        }
      }
    }

    setActiveAndFocusedItem(indexToFocus);
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const focusedItem = focusedItemIndex !== null ? selectOptions[focusedItemIndex] : null;

    switch (event.key) {
      case "Enter":
        if (isOpen && focusedItem && !focusedItem.isAriaDisabled) {
          onSelect(undefined, focusedItem.value as string);
        }

        if (!isOpen) {
          setIsOpen(true);
        }

        break;
      case "ArrowUp":
      case "ArrowDown":
        event.preventDefault();
        handleMenuArrowKeys(event.key);
        break;
    }
  };

  const onToggleClick = () => {
    setIsOpen(!isOpen);
    textInputRef?.current?.focus();
  };

  const onClearButtonClick = () => {
    setSelected(undefined, undefined);
    setInputValue("");
    setFilterValue("");
    resetActiveAndFocusedItem();
    textInputRef?.current?.focus();
  };

  const onBlur = (e: React.MouseEvent) => {
    if ((e.relatedTarget as HTMLElement | undefined)?.id?.includes(CREATE_NEW)) {
      // If we're blurring the typeahead input because we're creating
      // a new element with a mouse click, then we don't need to do anything.
      return;
    }

    const optionText = options.find((option) => option.value === selected)?.children;
    setInputValue(optionText as string);
    setFilterValue("");
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      variant={"typeahead"}
      aria-label={"Typeahead creatable menu toggle"}
      onClick={onToggleClick}
      isExpanded={isOpen}
      isDisabled={isDisabled}
      isFullWidth={true}
    >
      <TextInputGroup isPlain>
        <TextInputGroupMain
          value={inputValue}
          onClick={onInputClick}
          onChange={onTextInputChange}
          onKeyDown={onInputKeyDown}
          onBlur={onBlur}
          id={"create-typeahead-select-input"}
          autoComplete={"off"}
          innerRef={textInputRef}
          placeholder={"<Undefined>"}
          {...(activeItemId && { "aria-activedescendant": activeItemId })}
          role={"combobox"}
          isExpanded={isOpen}
          aria-controls={"select-create-typeahead-listbox"}
        />

        <TextInputGroupUtilities {...(!inputValue ? { style: { display: "none" } } : {})}>
          <Button variant="plain" onClick={onClearButtonClick} aria-label="Clear input value">
            <TimesIcon aria-hidden />
          </Button>
        </TextInputGroupUtilities>
      </TextInputGroup>
    </MenuToggle>
  );

  return (
    <Select
      id={id}
      isOpen={isOpen}
      selected={selected}
      onSelect={onSelect}
      onOpenChange={(isOpen) => {
        !isOpen && closeMenu();
      }}
      popperProps={{
        appendTo: document.body,
      }}
      toggle={toggle}
      shouldFocusFirstItemOnOpen={false}
    >
      <SelectList id="select-create-typeahead-listbox">
        {selectOptions.length <= 0 && (
          <span style={{ padding: "8px" }}>
            <i>{`Type to create...`}</i>
          </span>
        )}
        {selectOptions.map((option, index) => (
          <SelectOption
            key={option.value || option.children}
            isFocused={focusedItemIndex === index}
            className={option.className}
            id={getSelectOptionId(option.value)}
            {...option}
            ref={null}
          />
        ))}
      </SelectList>
    </Select>
  );
}
