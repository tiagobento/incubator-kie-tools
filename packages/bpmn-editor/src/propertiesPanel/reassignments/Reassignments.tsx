import * as React from "react";
import { useState, useMemo } from "react";
import { Button, ButtonVariant } from "@patternfly/react-core/dist/js/components/Button/Button";
import { Modal, ModalVariant } from "@patternfly/react-core/dist/js/components/Modal";
import { Grid, GridItem } from "@patternfly/react-core/dist/js/layouts/Grid";
import { PlusCircleIcon } from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import { TimesIcon } from "@patternfly/react-icons/dist/js/icons/times-icon";
import { Bullseye } from "@patternfly/react-core/dist/js/layouts/Bullseye";
import { EmptyState, EmptyStateBody, EmptyStateIcon } from "@patternfly/react-core/dist/js/components/EmptyState";
import { Title } from "@patternfly/react-core/dist/js/components/Title";
import { Dropdown, DropdownItem, DropdownToggle } from "@patternfly/react-core/dist/js/components/Dropdown";
// import CubesIcon from "@patternfly/react-icons/dist/js/icons/cubes-icon";
import "./Reassignments.css";

function DropdownWithAdd({ items, setItems }: { items: string[]; setItems: (items: string[]) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [selectedItem, setSelectedItem] = useState<string | undefined>(undefined);

  const handleAddItem = () => {
    if (newItem && !items.includes(newItem)) {
      setItems([...items, newItem]);
      setSelectedItem(newItem);
    }
    setNewItem("");
    setIsOpen(false);
  };

  const handleSelectItem = (item: string) => {
    setSelectedItem(item);
    setIsOpen(false);
  };

  return (
    <Dropdown
      toggle={<DropdownToggle onToggle={() => setIsOpen(!isOpen)}>{selectedItem || "Select or add..."}</DropdownToggle>}
      isOpen={isOpen}
      dropdownItems={[
        ...items.map((item) => (
          <DropdownItem key={item} onClick={() => handleSelectItem(item)}>
            {item}
          </DropdownItem>
        )),
        <DropdownItem key="add-new" isDisabled>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="text"
              placeholder="Add new..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddItem();
              }}
              style={{
                flex: 1,
                padding: "4px",
                borderRadius: "4px",
              }}
            />
            <Button variant="link" onClick={handleAddItem} isDisabled={newItem.trim() === ""} aria-label="Add new item">
              ✓
            </Button>
          </div>
        </DropdownItem>,
      ]}
    />
  );
}

export function Reassignments({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [reassignments, setReassignments] = useState<
    { users: string; groups: string; type: string; period: number | ""; periodUnit: string }[]
  >([]);
  const [users, setUsers] = useState<string[]>(["User 1", "User 2"]);
  const [groups, setGroups] = useState<string[]>(["Group A", "Group B"]);
  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(undefined);
  const [openTypeIndex, setOpenTypeIndex] = useState<number | null>(null);
  const [openPeriodUnitIndex, setOpenPeriodUnitIndex] = useState<number | null>(null);

  const addReassignment = () => {
    setReassignments([
      ...reassignments,
      { users: "", groups: "", type: "Not Completed", period: "", periodUnit: "minutes" },
    ]);
  };

  const removeReassignment = (index: number) => {
    setReassignments(reassignments.filter((_, i) => i !== index));
  };

  const entryStyle = {
    width: "100%",
    maxWidth: "80px",
    padding: "4px",
    borderRadius: "4px",
  };

  const typeOptions = ["Not Completed", "Not Started"];
  const periodUnits = ["minutes", "hours", "days", "months", "years"];

  return (
    <Modal
      className="kie-bpmn-editor--reassignments--modal"
      aria-labelledby="Reassignments"
      title="Reassignments"
      variant={ModalVariant.large}
      isOpen={isOpen}
      onClose={onClose}
    >
      {reassignments.length > 0 ? (
        <>
          <Grid md={12} style={{ padding: "0 8px" }}>
            <GridItem span={3}>
              <b>Users</b>
            </GridItem>
            <GridItem span={3}>
              <b>Groups</b>
            </GridItem>
            <GridItem span={2}>
              <b>Type</b>
            </GridItem>
            <GridItem span={3}>
              <b>Period</b>
            </GridItem>
            <GridItem span={1} style={{ textAlign: "center" }}>
              <Button variant={ButtonVariant.plain} onClick={addReassignment}>
                <PlusCircleIcon />
              </Button>
            </GridItem>
          </Grid>
          {reassignments.map((entry, i) => (
            <Grid
              md={12}
              key={i}
              className="kie-reassignments--entry"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(undefined)}
              style={{ padding: "0 8px" }}
            >
              <GridItem span={3}></GridItem>
              <GridItem span={3}>
                <DropdownWithAdd items={groups} setItems={setGroups} />
              </GridItem>
              <GridItem span={2}>
                <Dropdown
                  toggle={
                    <DropdownToggle onToggle={() => setOpenTypeIndex(openTypeIndex === i ? null : i)}>
                      {entry.type}
                    </DropdownToggle>
                  }
                  isOpen={openTypeIndex === i}
                  dropdownItems={typeOptions.map((opt) => (
                    <DropdownItem
                      key={opt}
                      onClick={() => {
                        const updated = [...reassignments];
                        updated[i].type = opt;
                        setReassignments(updated);
                        setOpenTypeIndex(null);
                      }}
                    >
                      {opt}
                    </DropdownItem>
                  ))}
                />
              </GridItem>
              <GridItem span={3} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  style={entryStyle}
                  type="number"
                  placeholder="Period..."
                  value={entry.period}
                  onChange={(e) => {
                    const updated = [...reassignments];
                    updated[i].period = parseInt(e.target.value) || "";
                    setReassignments(updated);
                  }}
                />
                <Dropdown
                  toggle={
                    <DropdownToggle onToggle={() => setOpenPeriodUnitIndex(openPeriodUnitIndex === i ? null : i)}>
                      {entry.periodUnit}
                    </DropdownToggle>
                  }
                  isOpen={openPeriodUnitIndex === i}
                  dropdownItems={periodUnits.map((unit) => (
                    <DropdownItem
                      key={unit}
                      onClick={() => {
                        const updated = [...reassignments];
                        updated[i].periodUnit = unit;
                        setReassignments(updated);
                        setOpenPeriodUnitIndex(null);
                      }}
                    >
                      {unit}
                    </DropdownItem>
                  ))}
                />
              </GridItem>
              <GridItem span={1} style={{ textAlign: "right" }}>
                {hoveredIndex === i && (
                  <Button variant={ButtonVariant.plain} onClick={() => removeReassignment(i)}>
                    <TimesIcon />
                  </Button>
                )}
              </GridItem>
            </Grid>
          ))}
        </>
      ) : (
        <div className="kie-bpmn-editor--reassignments--empty-state">
          <Bullseye>
            <EmptyState>
              {/* <EmptyStateIcon icon={CubesIcon} /> */}
              <Title headingLevel="h4">No reassignments yet</Title>
              <EmptyStateBody>
                {"This represents the empty state for reassignments. You can add reassignments to get started."}
              </EmptyStateBody>
              <Button variant="primary" onClick={addReassignment}>
                Add reassignment
              </Button>
            </EmptyState>
          </Bullseye>
        </div>
      )}
    </Modal>
  );
}
