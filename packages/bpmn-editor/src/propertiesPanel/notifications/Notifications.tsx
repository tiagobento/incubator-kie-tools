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
import "./Notifications.css";
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

export function Notifications({
  isOpen,
  onClose,
  element,
}: {
  isOpen: boolean;
  onClose: () => void;
  element: Normalized<BPMN20__tUserTask> & { __$$element: "userTask" };
}) {
  const [notifications, setNotifications] = useState<
    {
      from: string;
      tousers: string;
      togroups: string;
      toemails: string;
      replyTo: string;
      subject: string;
      body: string;
      type: string;
      expiresAt: string;
    }[]
  >([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(undefined);
  const addNotification = () => {
    setNotifications([
      ...notifications,
      {
        from: "",
        tousers: "",
        togroups: "",
        toemails: "",
        replyTo: "",
        subject: "",
        body: "",
        type: "NotStartedNotify",
        expiresAt: "",
      },
    ]);
  };
  const typeOptions = [
    { value: "NotStartedNotify", label: "Not Started" },
    { value: "NotCompletedNotify", label: "Not Completed" },
  ];
  const periodUnits = [
    { value: "m", label: "minutes" },
    { value: "h", label: "hours" },
    { value: "d", label: "days" },
    { value: "M", label: "months" },
    { value: "y", label: "years" },
  ];
  const removeNotification = (index: number) => {
    setNotifications(notifications.filter((_, i) => i !== index));
  };
  const handleInputChange = (index: number, field: string, value: string | number) => {
    console.log(`Updating field: ${field}, value: ${value}`); // Log to debug
    setNotifications((prevNotifications) => {
      const updatedNotifications = [...prevNotifications];
      updatedNotifications[index] = { ...updatedNotifications[index], [field]: value };
      return updatedNotifications;
    });
  };
  useEffect(() => {
    if (isOpen && element) {
      const extractedNotifications = element?.dataInputAssociation
        ?.filter((association) => association.targetRef?.__$$text.includes("Notify"))
        ?.map((association) => {
          const assignment = association.assignment?.[0];
          if (assignment) {
            const notificationText = assignment.from.__$$text || "";
            const fromMatches = [...notificationText.matchAll(/from:([^ |]*)/g)];
            const bodyMatches = [...notificationText.matchAll(/body:([^ @\]]*)/g)];
            const subjectMatches = [...notificationText.matchAll(/subject:([^ |]*)/g)];
            const toEmailsMatches = [...notificationText.matchAll(/toemails:([^ |]*)/g)];
            const replyToMatches = [...notificationText.matchAll(/replyTo:([^ |]*)/g)];
            const usersMatches = [...notificationText.matchAll(/tousers:([^ |]*)/g)];
            const groupsMatches = [...notificationText.matchAll(/togroups:([^ |]*)/g)];
            let expiresAtMatches = [...notificationText.matchAll(/\]@\[([^ |]*)/g)];
            if (expiresAtMatches.length === 0) {
              expiresAtMatches = [...notificationText.matchAll(/@([^@]*)$/g)];
            }

            const from = fromMatches.map((match) => match[1]);
            const tousers = usersMatches.map((match) => match[1]);
            const togroups = groupsMatches.map((match) => match[1]);
            const toemails = toEmailsMatches.map((match) => match[1]);
            const replyTo = replyToMatches.map((match) => match[1]);
            const subject = subjectMatches.map((match) => match[1]);
            const body = bodyMatches.map((match) => match[1]);
            const expiresAt = expiresAtMatches.map((match) => match[1]);

            const notifications = [];
            const maxLength = Math.max(tousers.length);
            for (let i = 0; i < maxLength; i++) {
              notifications.push({
                from: from[i] || "",
                tousers: tousers[i] || "",
                togroups: togroups[i] || "",
                toemails: toemails[i] || "",
                replyTo: replyTo[i] || "",
                subject: subject[i] || "",
                body: body[i] || "",
                expiresAt: expiresAt[i] || "",
                type: association.targetRef.__$$text.includes("NotStartedNotify")
                  ? "NotStartedNotify"
                  : "NotCompletedNotify",
              });
            }
            return notifications;
          }
        })
        .flat()
        .filter(
          (
            item
          ): item is {
            from: string;
            expiresAt: string;
            tousers: string;
            togroups: string;
            toemails: string;
            replyTo: string;
            subject: string;
            body: string;
            type: string;
          } => item !== null
        );
      setNotifications(extractedNotifications || []);
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
          notifications.forEach((notification) => {
            let dataInput = e?.ioSpecification?.dataInput?.find((input) => input["@_name"] === notification.type);
            if (!dataInput) {
              dataInput = {
                "@_id": `${e["@_id"]}_${notification.type}InputX`,
                "@_drools:dtype": "Object",
                "@_itemSubjectRef": `_${e["@_id"]}_${notification.type}InputX`,
                "@_name": notification.type,
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
                "@_id": `${e["@_id"]}_dataInputAssociation_${notification.type}`,
                targetRef: { __$$text: dataInput["@_id"] },
                assignment: [],
              };
              e.dataInputAssociation?.push(dataInputAssociation);
            }
            const existingAssignment = dataInputAssociation?.assignment?.find(
              (assignment) => assignment["@_id"] === `${e["@_id"]}_assignment_${notification.type}`
            );
            const newEntry = `from:${notification.from} tousers:${notification.tousers} togroups:${notification.togroups} toemails:${notification.toemails} replyTo:${notification.replyTo} subject:${notification.subject} body:${notification.body}@${notification.expiresAt}`;

            if (existingAssignment) {
              const existingValues = new Set(existingAssignment?.from?.__$$text?.split(" "));
              const newValues = newEntry.split(" ");
              const uniqueValues = [...existingValues, ...newValues].join(" ");
              existingAssignment.from.__$$text = uniqueValues;
            } else {
              dataInputAssociation?.assignment?.push({
                "@_id": `${e["@_id"]}_assignment_${notification.type}`,
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
      className="kie-bpmn-editor--notifications--modal"
      aria-labelledby="Notifications"
      title="Notifications"
      variant={ModalVariant.large}
      isOpen={isOpen}
      onClose={onClose}
    >
      {notifications.length > 0 ? (
        <Form>
          <Grid md={12} style={{ padding: "0 8px" }}>
            <GridItem span={2}>
              <div style={entryStyle}>
                <b>Type</b>
              </div>
            </GridItem>
            <GridItem span={1}>
              <div style={entryStyle}>
                <b>Expires at</b>
              </div>
            </GridItem>
            <GridItem span={1}>
              <div style={entryStyle}>
                <b>From</b>
              </div>
            </GridItem>
            <GridItem span={1}>
              <div style={entryStyle}>
                <b>To:user(s)</b>
              </div>
            </GridItem>
            <GridItem span={1}>
              <div style={entryStyle}>
                <b>To:group(s)</b>
              </div>
            </GridItem>
            <GridItem span={1}>
              <div style={entryStyle}>
                <b>To:email(s)</b>
              </div>
            </GridItem>
            <GridItem span={1}>
              <div style={entryStyle}>
                <b>Reply to</b>
              </div>
            </GridItem>
            <GridItem span={1}>
              <div style={entryStyle}>
                <b>Subject</b>
              </div>
            </GridItem>
            <GridItem span={2}>
              <div style={entryStyle}>
                <b>Body</b>
              </div>
            </GridItem>
            <GridItem span={1} style={{ textAlign: "center" }}>
              <Button variant={ButtonVariant.plain} style={{ paddingLeft: 0 }} onClick={addNotification}>
                <PlusCircleIcon color="var(--pf-c-button--m-primary--BackgroundColor)" />
              </Button>
            </GridItem>
          </Grid>
          {notifications.map((entry, i) => (
            <div key={i} style={{ padding: "0 8px" }}>
              <Grid
                md={6}
                className={"kie-bpmn-editor--properties-panel--notification-entry"}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(undefined)}
              >
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
                <GridItem span={1}>
                  <TextArea
                    aria-label={"expires at"}
                    style={entryStyle}
                    type="text"
                    placeholder="Expires at..."
                    value={entry.expiresAt}
                    onChange={(e) => handleInputChange(i, "expiresAt", e)}
                  />
                </GridItem>
                <GridItem span={1}>
                  <TextArea
                    aria-label={"from"}
                    style={entryStyle}
                    type="text"
                    placeholder="From..."
                    value={entry.from}
                    onChange={(e) => handleInputChange(i, "from", e)}
                  />
                </GridItem>
                <GridItem span={1}>
                  <TextArea
                    aria-label={"to users"}
                    style={entryStyle}
                    type="text"
                    placeholder="To Users..."
                    value={entry.tousers}
                    onChange={(e) => handleInputChange(i, "tousers", e)}
                  />
                </GridItem>
                <GridItem span={1}>
                  <TextArea
                    aria-label={"to groups"}
                    style={entryStyle}
                    type="text"
                    placeholder="To Groups..."
                    value={entry.togroups}
                    onChange={(e) => handleInputChange(i, "togroups", e)}
                  />
                </GridItem>
                <GridItem span={1}>
                  <TextArea
                    aria-label={"to emails"}
                    style={entryStyle}
                    type="text"
                    placeholder="To Emails..."
                    value={entry.toemails}
                    onChange={(e) => handleInputChange(i, "toemails", e)}
                  />
                </GridItem>
                <GridItem span={1}>
                  <TextArea
                    aria-label={"reply to"}
                    style={entryStyle}
                    type="text"
                    placeholder="Reply to..."
                    value={entry.replyTo}
                    onChange={(e) => handleInputChange(i, "replyTo", e)}
                  />
                </GridItem>
                <GridItem span={1}>
                  <TextArea
                    aria-label={"subject"}
                    style={entryStyle}
                    type="text"
                    placeholder="Subject..."
                    value={entry.subject}
                    onChange={(e) => handleInputChange(i, "subject", e)}
                  />
                </GridItem>
                <GridItem span={2}>
                  <TextArea
                    aria-label={"body"}
                    style={entryStyle}
                    type="text"
                    placeholder="Body..."
                    value={entry.body}
                    onChange={(e) => handleInputChange(i, "body", e)}
                  />
                </GridItem>
                <GridItem span={1} style={{ textAlign: "right" }}>
                  {hoveredIndex === i && (
                    <Button
                      tabIndex={9999} // Prevent tab from going to this button
                      variant={ButtonVariant.plain}
                      style={{ paddingLeft: 0 }}
                      onClick={() => removeNotification(i)}
                    >
                      <TimesIcon />
                    </Button>
                  )}
                </GridItem>
              </Grid>
            </div>
          ))}
          <Button onClick={handleSubmit} className="kie-bpmn-editor--properties-panel--notification-submit-save-button">
            Save
          </Button>
        </Form>
      ) : (
        <div className="kie-bpmn-editor--notifications--empty-state">
          <Bullseye>
            <EmptyState>
              <EmptyStateIcon icon={CubesIcon} />
              <Title headingLevel="h4">No notifications yet</Title>
              <EmptyStateBody>
                {"This represents the empty state for notifications. You can add notifications to get started."}
              </EmptyStateBody>
              <Button variant="primary" onClick={addNotification}>
                Add notification
              </Button>
            </EmptyState>
          </Bullseye>
        </div>
      )}
    </Modal>
  );
}
