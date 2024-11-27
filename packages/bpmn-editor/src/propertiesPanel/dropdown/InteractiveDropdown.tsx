import React, { useEffect, useRef, useState } from "react";
import { Dropdown } from "@patternfly/react-core/dist/js/components/Dropdown/Dropdown";
import { DropdownToggle } from "@patternfly/react-core/dist/js/components/Dropdown/DropdownToggle";
import { DropdownItem } from "@patternfly/react-core/dist/js/components/Dropdown/DropdownItem";
import { CheckIcon } from "@patternfly/react-icons/dist/js/icons/check-icon";
import { PlusCircleIcon } from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";

const InteractiveDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newItemInput, setNewItemInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreatingNew && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreatingNew]);

  const handleToggle = (shouldOpen: boolean) => {
    // Only close if not in "create new" mode
    if (!isCreatingNew) {
      setIsOpen(shouldOpen);
    }
  };

  const handleNewItemInput = (value: string) => {
    setNewItemInput(value);
  };

  const saveNewItem = () => {
    if (newItemInput.trim()) {
      const updatedItems = [...customItems, newItemInput.trim()];
      setCustomItems(updatedItems);
      setSelectedValue(newItemInput.trim());
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
    <div style={{ width: "200px" }}>
      <Dropdown
        isOpen={isOpen}
        toggle={<DropdownToggle onToggle={handleToggle}>{selectedValue || "Select an option"}</DropdownToggle>}
        dropdownItems={
          isCreatingNew
            ? [
                <div key="new-item-input" style={{ display: "flex", alignItems: "center", padding: "10px" }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={newItemInput}
                    onChange={(e) => handleNewItemInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter new item"
                    style={{ marginRight: "10px", flexGrow: 1 }}
                  />
                  <CheckIcon onClick={saveNewItem} style={{ cursor: "pointer", color: "green" }} />
                </div>,
              ]
            : [
                <DropdownItem
                  key="new-option"
                  icon={<PlusCircleIcon />}
                  onClick={() => {
                    setIsCreatingNew(true);
                  }}
                >
                  New
                </DropdownItem>,
                ...customItems.map((item, index) => (
                  <DropdownItem
                    key={`custom-item-${index}`}
                    onClick={() => {
                      setSelectedValue(item);
                      setIsOpen(false);
                    }}
                  >
                    {item}
                  </DropdownItem>
                )),
              ]
        }
      />
    </div>
  );
};
export default InteractiveDropdown;
