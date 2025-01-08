import React, { useEffect, useRef, useState } from "react";
import { Dropdown } from "@patternfly/react-core/dist/js/components/Dropdown/Dropdown";
import { DropdownToggle } from "@patternfly/react-core/dist/js/components/Dropdown/DropdownToggle";
import { DropdownItem } from "@patternfly/react-core/dist/js/components/Dropdown/DropdownItem";
import { CheckIcon } from "@patternfly/react-icons/dist/js/icons/check-icon";
import { PlusCircleIcon } from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";

export function InteractiveDropdown(props: {
  value: string | null;
  onChange: (value: string) => void;
  items: string[];
  placeholder?: string;
}) {
  const { value, onChange, items, placeholder } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newItemInput, setNewItemInput] = useState("");
  const [customItems, setCustomItems] = useState<string[]>(items);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreatingNew && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreatingNew]);

  const toggleDropdown = (open: boolean) => {
    if (!isCreatingNew) {
      setIsOpen(open);
    }
  };

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  const saveNewItem = () => {
    if (newItemInput.trim()) {
      const newValue = newItemInput.trim();
      const updatedItems = [...customItems, newValue];
      setCustomItems(updatedItems);
      onChange(newValue);
      setIsCreatingNew(false);
      setNewItemInput("");
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      saveNewItem();
    }
  };

  return (
    <Dropdown
      isOpen={isOpen}
      toggle={<DropdownToggle onToggle={toggleDropdown}>{value || placeholder || "Select an option"}</DropdownToggle>}
      dropdownItems={
        isCreatingNew
          ? [
              <div key="new-item-input" style={{ display: "flex", alignItems: "center", padding: "10px" }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={newItemInput}
                  onChange={(e) => setNewItemInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter new item"
                />
                <CheckIcon onClick={saveNewItem} />
              </div>,
            ]
          : [
              <DropdownItem key="new-option" icon={<PlusCircleIcon />} onClick={() => setIsCreatingNew(true)}>
                New
              </DropdownItem>,
              ...customItems.map((item, index) => (
                <DropdownItem key={`custom-item-${index}`} onClick={() => handleSelect(item)}>
                  {item}
                </DropdownItem>
              )),
            ]
      }
    />
  );
}
