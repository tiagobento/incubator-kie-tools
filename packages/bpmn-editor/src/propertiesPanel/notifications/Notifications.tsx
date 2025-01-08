import * as React from "react";
import { useState } from "react";
import { Modal, ModalVariant } from "@patternfly/react-core/dist/js/components/Modal";
import { Button, ButtonVariant } from "@patternfly/react-core/dist/js/components/Button";
import { Dropdown, DropdownItem, DropdownToggle } from "@patternfly/react-core/dist/js/components/Dropdown";
import { Grid, GridItem } from "@patternfly/react-core/dist/js/layouts/Grid";
import { Radio } from "@patternfly/react-core/dist/js/components/Radio";
import { Switch } from "@patternfly/react-core/dist/js/components/Switch";
import { TextInput } from "@patternfly/react-core/dist/js/components/TextInput";
import { TextArea } from "@patternfly/react-core/dist/js/components/TextArea";
import { Title } from "@patternfly/react-core/dist/js/components/Title";
import "./Notifications.css";
import { EmptyState } from "@patternfly/react-core/dist/js/components/EmptyState/EmptyState";
import { Bullseye } from "@patternfly/react-core/dist/js/layouts/Bullseye/Bullseye";
import { EmptyStateBody } from "@patternfly/react-core/dist/js/components/EmptyState/EmptyStateBody";
// import CubesIcon from "@patternfly/react-icons/dist/js/icons/cubes-icon";
import { EmptyStateIcon } from "@patternfly/react-core/dist/js/components/EmptyState/EmptyStateIcon";

export function Notifications({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [notifications, setNotifications] = useState<
    {
      id: string;
      message: string;
      type: string;
      timestamp: string;
      status: string;
    }[]
  >([]);
  const [taskStateType, setTaskStateType] = useState("Not started");
  const [taskExpiration, setTaskExpiration] = useState("Time period");
  const [notifyValue, setNotifyValue] = useState<number | "">("");
  const [notifyUnit, setNotifyUnit] = useState("minutes");
  const [isRepeat, setIsRepeat] = useState(false);
  const [from, setFrom] = useState<string | undefined>(undefined);
  const [toUsers, setToUsers] = useState<string | undefined>(undefined);
  const [replyTo, setReplyTo] = useState<string | undefined>(undefined);
  const [toGroups, setToGroups] = useState<string | undefined>(undefined);
  const [emails, setEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const addNotification = () => {
    const newNotification = {
      id: Math.random().toString(36).substr(2, 9),
      message: "",
      type: "Info",
      timestamp: new Date().toISOString(),
      status: "unread",
    };

    setNotifications([...notifications, newNotification]);
  };

  const removeNotification = (index: number) => {
    setNotifications(notifications.filter((_, i) => i !== index));
  };

  const periodUnits = ["minutes", "hours", "days", "months", "years"];

  return (
    <Modal
      className="notifications-modal"
      aria-labelledby="Notifications"
      title="Notifications"
      variant={ModalVariant.large}
      isOpen={isOpen}
      onClose={onClose}
    >
      {notifications.length > 0 ? (
        <>
          <Grid hasGutter>
            <GridItem span={12}>
              <Title headingLevel="h4">Task State Type</Title>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <Radio
                  label="Not started (Created, ready or reserved)"
                  isChecked={taskStateType === "Not started"}
                  onChange={() => setTaskStateType("Not started")}
                  id="task-state-not-started"
                  name="task-state-type"
                />
                <Radio
                  label="Not completed (Created, ready, reserved, in progress or suspended)"
                  isChecked={taskStateType === "Not completed"}
                  onChange={() => setTaskStateType("Not completed")}
                  id="task-state-not-completed"
                  name="task-state-type"
                />
              </div>
            </GridItem>

            <GridItem span={12}>
              <Title headingLevel="h4">Task Expiration Definition</Title>
              <Dropdown
                toggle={
                  <DropdownToggle
                    onToggle={() => setTaskExpiration(taskExpiration === "Time period" ? "" : "Time period")}
                  >
                    {taskExpiration}
                  </DropdownToggle>
                }
                isOpen={!!taskExpiration}
                dropdownItems={["Time period", "Expression", "Date/time"].map((option) => (
                  <DropdownItem key={option} onClick={() => setTaskExpiration(option)}>
                    {option}
                  </DropdownItem>
                ))}
              />
            </GridItem>

            <GridItem span={12}>
              <Title headingLevel="h4">Notify</Title>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <TextInput
                  type="number"
                  value={notifyValue}
                  onChange={(val) => setNotifyValue(val ? parseInt(val) : "")}
                  placeholder="Enter value"
                  style={{ width: "120px" }}
                />
                <Dropdown
                  toggle={
                    <DropdownToggle onToggle={() => setNotifyUnit(notifyUnit === "minutes" ? "" : "minutes")}>
                      {notifyUnit}
                    </DropdownToggle>
                  }
                  isOpen={!!notifyUnit}
                  dropdownItems={periodUnits.map((unit) => (
                    <DropdownItem key={unit} onClick={() => setNotifyUnit(unit)}>
                      {unit}
                    </DropdownItem>
                  ))}
                />
              </div>
            </GridItem>

            <GridItem span={12}>
              <Title headingLevel="h4">Notification Repeat</Title>
              <Switch
                id="notification-repeat"
                label="Yes"
                labelOff="No"
                isChecked={isRepeat}
                onChange={(checked) => setIsRepeat(checked)}
              />
            </GridItem>

            <GridItem span={12}>
              <Title headingLevel="h4">Message</Title>
              <Grid hasGutter>
                <GridItem span={6}>
                  <Dropdown
                    toggle={
                      <DropdownToggle onToggle={() => setFrom(from === "Select..." ? "" : "Select...")}>
                        {from || "From:"}
                      </DropdownToggle>
                    }
                    isOpen={!!from}
                    dropdownItems={["User A", "User B", "User C"].map((option) => (
                      <DropdownItem key={option} onClick={() => setFrom(option)}>
                        {option}
                      </DropdownItem>
                    ))}
                  />
                </GridItem>
                <GridItem span={6}>
                  <Dropdown
                    toggle={
                      <DropdownToggle onToggle={() => setToUsers(toUsers === "Select..." ? "" : "Select...")}>
                        {toUsers || "To: user(s)"}
                      </DropdownToggle>
                    }
                    isOpen={!!toUsers}
                    dropdownItems={["User X", "User Y", "User Z"].map((option) => (
                      <DropdownItem key={option} onClick={() => setToUsers(option)}>
                        {option}
                      </DropdownItem>
                    ))}
                  />
                </GridItem>
                <GridItem span={6}>
                  <Dropdown
                    toggle={
                      <DropdownToggle onToggle={() => setReplyTo(replyTo === "Select..." ? "" : "Select...")}>
                        {replyTo || "Reply to (optional)"}
                      </DropdownToggle>
                    }
                    isOpen={!!replyTo}
                    dropdownItems={["Reply A", "Reply B", "Reply C"].map((option) => (
                      <DropdownItem key={option} onClick={() => setReplyTo(option)}>
                        {option}
                      </DropdownItem>
                    ))}
                  />
                </GridItem>
                <GridItem span={6}>
                  <Dropdown
                    toggle={
                      <DropdownToggle onToggle={() => setToGroups(toGroups === "Select..." ? "" : "Select...")}>
                        {toGroups || "To: group(s)"}
                      </DropdownToggle>
                    }
                    isOpen={!!toGroups}
                    dropdownItems={["Group 1", "Group 2", "Group 3"].map((option) => (
                      <DropdownItem key={option} onClick={() => setToGroups(option)}>
                        {option}
                      </DropdownItem>
                    ))}
                  />
                </GridItem>
                <GridItem span={12}>
                  <TextInput value={emails} onChange={setEmails} placeholder="Enter emails separated by comma" />
                </GridItem>
                <GridItem span={12}>
                  <TextInput value={subject} onChange={setSubject} placeholder="Enter the subject here" />
                </GridItem>
                <GridItem span={12}>
                  <TextArea value={body} onChange={setBody} placeholder="Enter the body of your message here" />
                </GridItem>
              </Grid>
            </GridItem>

            <GridItem span={12} style={{ textAlign: "right" }}>
              <Button variant={ButtonVariant.primary} onClick={() => console.log("Submit notification")}>
                Submit
              </Button>
              <Button variant={ButtonVariant.link} onClick={onClose}>
                Cancel
              </Button>
            </GridItem>
          </Grid>
        </>
      ) : (
        <div className="kie-bpmn-editor--notifications--empty-state">
          <Bullseye>
            <EmptyState>
              {/* <EmptyStateIcon icon={CubesIcon} /> */}
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
