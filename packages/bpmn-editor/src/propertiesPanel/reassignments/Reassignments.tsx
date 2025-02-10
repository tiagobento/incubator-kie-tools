import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../../store/StoreContext";
import { Button, ButtonVariant } from "@patternfly/react-core/dist/js/components/Button/Button";
import { Modal, ModalVariant } from "@patternfly/react-core/dist/js/components/Modal";
import { Grid, GridItem } from "@patternfly/react-core/dist/js/layouts/Grid";
import { PlusCircleIcon } from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import { TimesIcon } from "@patternfly/react-icons/dist/js/icons/times-icon";
import { Bullseye } from "@patternfly/react-core/dist/js/layouts/Bullseye";
import { EmptyState, EmptyStateBody, EmptyStateIcon } from "@patternfly/react-core/dist/js/components/EmptyState";
import { Title } from "@patternfly/react-core/dist/js/components/Title";
import { Dropdown, DropdownItem, DropdownToggle } from "@patternfly/react-core/dist/js/components/Dropdown";
import "./Reassignments.css";
import { visitFlowElementsAndArtifacts } from "../../mutations/_elementVisitor";
import { setBpmn20Drools10MetaData } from "@kie-tools/bpmn-marshaller/dist/drools-extension-metaData";
import { addOrGetProcessAndDiagramElements } from "../../mutations/addOrGetProcessAndDiagramElements";
import { BPMN20__tUserTask } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { Normalized } from "../../normalization/normalize";
import { TextArea } from "@patternfly/react-core/dist/js/components/TextArea/TextArea";
import { FormSelect } from "@patternfly/react-core/dist/js/components/FormSelect/FormSelect";
import { FormSelectOption } from "@patternfly/react-core/dist/js/components/FormSelect/FormSelectOption";
import { CubesIcon } from "@patternfly/react-icons/dist/js/icons/cubes-icon";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";
import { Form } from "@patternfly/react-core/dist/js/components/Form/Form";

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

export function Reassignments({
  isOpen,
  onClose,
  element,
}: {
  isOpen: boolean;
  onClose: () => void;
  element: Normalized<BPMN20__tUserTask> & { __$$element: "userTask" };
}) {
  const [reassignments, setReassignments] = useState<
    { users: string; groups: string; type: string; period: number | ""; periodUnit: string }[]
  >([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(undefined);
  const addReassignment = () => {
    setReassignments([
      ...reassignments,
      { users: "", groups: "", type: "NotStartedReassign", period: "", periodUnit: "m" },
    ]);
  };
  const typeOptions = [
    { value: "NotStartedReassign", label: "Not Started" },
    { value: "NotCompletedReassign", label: "Not Completed" },
  ];
  const periodUnits = [
    { value: "m", label: "minutes" },
    { value: "h", label: "hours" },
    { value: "d", label: "days" },
    { value: "M", label: "months" },
    { value: "y", label: "years" },
  ];
  const removeReassignment = (index: number) => {
    setReassignments(reassignments.filter((_, i) => i !== index));
  };
  const handleInputChange = (index: number, field: string, value: string | number) => {
    setReassignments((prevReassignments) => {
      const updatedReassignments = [...prevReassignments];
      updatedReassignments[index] = { ...updatedReassignments[index], [field]: value };
      return updatedReassignments;
    });
  };
  useEffect(() => {
    if (isOpen && element) {
      const extractedReassignments = element?.dataInputAssociation
        ?.filter((association) => association.targetRef?.__$$text.includes("Reassign"))
        ?.map((association) => {
          const assignment = association.assignment?.[0];

          if (assignment) {
            const reassignmentText = assignment.from.__$$text || "";
            const usersMatches = [...reassignmentText.matchAll(/users:([^ |]*)/g)];
            const groupsMatches = [...reassignmentText.matchAll(/groups:([^ \]]*)/g)];
            const periodMatches = [...reassignmentText.matchAll(/(\d+)([mhdMy])/g)];

            const users = usersMatches.map((match) => match[1]);
            const groups = groupsMatches.map((match) => match[1]);
            const periods = periodMatches.map((match) => parseInt(match[1]));
            const periodUnits = periodMatches.map((match) => match[2]);
            const reassignments = [];
            const maxLength = Math.max(users.length);
            for (let i = 0; i < maxLength; i++) {
              reassignments.push({
                users: users[i] || "",
                groups: groups[i] || "",
                type: association.targetRef.__$$text.includes("NotStartedReassign")
                  ? "NotStartedReassign"
                  : "NotCompletedReassign",
                period: periods[i] || "",
                periodUnit: periodUnits[i] || "m",
              });
            }
            return reassignments;
          }
        })
        .flat()
        .filter(
          (item): item is { users: string; groups: string; type: string; period: number | ""; periodUnit: string } =>
            item !== null
        );
      setReassignments(extractedReassignments || []);
    }
  }, [isOpen, element]);
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();
  const handleSubmit = () => {
    bpmnEditorStoreApi.setState((s) => {
      const { process } = addOrGetProcessAndDiagramElements({
        definitions: s.bpmn.model.definitions,
      });
      visitFlowElementsAndArtifacts(process, ({ element: e }) => {
        if (e["@_id"] === element?.["@_id"] && e.__$$element === element.__$$element) {
          setBpmn20Drools10MetaData(e, "elementname", e["@_name"] || "");
          e.ioSpecification = {
            "@_id": generateUuid(),
            inputSet: [{ "@_id": generateUuid(), dataInputRefs: [] }],
            outputSet: [],
            dataInput: [],
          };
          e.ioSpecification.dataInput = [];
          e.dataInputAssociation = [];
          reassignments.forEach((reassignment) => {
            let dataInput = e?.ioSpecification?.dataInput?.find((input) => input["@_name"] === reassignment.type);
            if (!dataInput) {
              dataInput = {
                "@_id": `${e["@_id"]}_${reassignment.type}InputX`,
                "@_drools:dtype": "Object",
                "@_itemSubjectRef": `_${e["@_id"]}_${reassignment.type}InputX`,
                "@_name": reassignment.type,
              };
              e?.ioSpecification?.dataInput?.push(dataInput);
            }
            if (!e?.ioSpecification?.inputSet[0]?.dataInputRefs?.some((ref) => ref.__$$text === dataInput["@_id"])) {
              e?.ioSpecification?.inputSet[0]?.dataInputRefs?.push({ __$$text: dataInput["@_id"] });
            }
            let dataInputAssociation = e.dataInputAssociation?.find(
              (association) => association.targetRef.__$$text === dataInput["@_id"]
            );
            if (!dataInputAssociation) {
              dataInputAssociation = {
                "@_id": `${e["@_id"]}_dataInputAssociation_${reassignment.type}`,
                targetRef: { __$$text: dataInput["@_id"] },
                assignment: [],
              };
              e.dataInputAssociation?.push(dataInputAssociation);
            }
            const existingAssignment = dataInputAssociation?.assignment?.find(
              (assignment) => assignment["@_id"] === `${e["@_id"]}_assignment_${reassignment.type}`
            );
            const newEntry = `users:${reassignment.users} groups:${reassignment.groups} ${reassignment.period}${reassignment.periodUnit}`;
            if (existingAssignment) {
              const existingValues = new Set(existingAssignment?.from?.__$$text?.split(" "));
              const newValues = newEntry.split(" ");
              const uniqueValues = [...existingValues, ...newValues].join(" ");
              existingAssignment.from.__$$text = uniqueValues;
            } else {
              dataInputAssociation?.assignment?.push({
                "@_id": `${e["@_id"]}_assignment_${reassignment.type}`,
                from: {
                  "@_id": `${e["@_id"]}`,
                  __$$text: newEntry,
                },
                to: { "@_id": dataInput["@_id"], __$$text: dataInput["@_id"] },
              });
            }
          });
        }
      });
    });
  };
  const entryStyle = {
    padding: "4px",
    margin: "8px",
    width: "calc(100% - 2 * 4px - 2 * 8px)",
  };
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
        <Form>
          <Grid md={12} style={{ padding: "0 8px" }}>
            <GridItem span={3}>
              <div style={entryStyle}>
                <b>Users</b>
              </div>
            </GridItem>
            <GridItem span={3}>
              <div style={entryStyle}>
                <b>Groups</b>
              </div>
            </GridItem>
            <GridItem span={2}>
              <div style={entryStyle}>
                <b>Type</b>
              </div>
            </GridItem>
            <GridItem span={3}>
              <div style={entryStyle}>
                <b>Period</b>
              </div>
            </GridItem>
            <GridItem span={1} style={{ textAlign: "center" }}>
              <Button variant={ButtonVariant.plain} style={{ paddingLeft: 0 }} onClick={addReassignment}>
                <PlusCircleIcon color="var(--pf-c-button--m-primary--BackgroundColor)" />
              </Button>
            </GridItem>
          </Grid>
          {reassignments.map((entry, i) => (
            <div key={i} style={{ padding: "0 8px" }}>
              <Grid
                md={6}
                className={"kie-bpmn-editor--properties-panel--reassignment-entry"}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(undefined)}
              >
                <GridItem span={3}>
                  <TextArea
                    aria-label={"users"}
                    autoFocus={true}
                    style={entryStyle}
                    type="text"
                    placeholder="Users..."
                    value={entry.users}
                    onChange={(e) => handleInputChange(i, "users", e)}
                  />
                </GridItem>
                <GridItem span={3}>
                  <TextArea
                    aria-label={"groups"}
                    style={entryStyle}
                    type="text"
                    placeholder="Groups..."
                    value={entry.groups}
                    onChange={(e) => handleInputChange(i, "groups", e)}
                  />
                </GridItem>
                <GridItem span={2}>
                  <FormSelect
                    aria-label={"type"}
                    type={"text"}
                    value={entry.type}
                    onChange={(e) => handleInputChange(i, "type", e)}
                    style={entryStyle}
                    rows={1}
                  >
                    {typeOptions.map((option) => (
                      <FormSelectOption key={option.label} label={option.label} value={option.value} />
                    ))}
                  </FormSelect>
                </GridItem>
                <GridItem span={2}>
                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                    <input
                      aria-label={"period"}
                      style={entryStyle}
                      type="number"
                      placeholder="Enter value"
                      value={entry.period}
                      onChange={(e) => handleInputChange(i, "period", e.target.value)}
                    />
                    <FormSelect
                      aria-label={"period unit"}
                      type={"text"}
                      value={entry.periodUnit}
                      onChange={(e) => handleInputChange(i, "periodUnit", e)}
                      style={entryStyle}
                      rows={1}
                    >
                      {periodUnits.map((option) => (
                        <FormSelectOption key={option.label} label={option.label} value={option.value} />
                      ))}
                    </FormSelect>
                  </div>
                </GridItem>
                <GridItem span={1} style={{ textAlign: "right" }}>
                  {hoveredIndex === i && (
                    <Button
                      tabIndex={9999} // Prevent tab from going to this button
                      variant={ButtonVariant.plain}
                      style={{ paddingLeft: 0 }}
                      onClick={() => removeReassignment(i)}
                    >
                      <TimesIcon />
                    </Button>
                  )}
                </GridItem>
              </Grid>
            </div>
          ))}
          <Button onClick={handleSubmit} className="kie-bpmn-editor--properties-panel--reassignment-submit-save-button">
            Save
          </Button>
        </Form>
      ) : (
        <div className="kie-bpmn-editor--reassignments--empty-state">
          <Bullseye>
            <EmptyState>
              <EmptyStateIcon icon={CubesIcon} />
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
