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

import * as React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../../store/StoreContext";
import { Button, ButtonVariant } from "@patternfly/react-core/dist/js/components/Button/Button";
import { Modal, ModalVariant } from "@patternfly/react-core/dist/js/components/Modal";
import { Grid, GridItem } from "@patternfly/react-core/dist/js/layouts/Grid";
import { PlusCircleIcon } from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import { TimesIcon } from "@patternfly/react-icons/dist/js/icons/times-icon";
import { Bullseye } from "@patternfly/react-core/dist/js/layouts/Bullseye";
import { EmptyState, EmptyStateBody, EmptyStateIcon } from "@patternfly/react-core/dist/js/components/EmptyState";
import { Title } from "@patternfly/react-core/dist/js/components/Title";
import { visitFlowElementsAndArtifacts } from "../../mutations/_elementVisitor";
import { setBpmn20Drools10MetaData } from "@kie-tools/bpmn-marshaller/dist/drools-extension-metaData";
import { addOrGetProcessAndDiagramElements } from "../../mutations/addOrGetProcessAndDiagramElements";
import { addOrGetItemDefinitions } from "../../mutations/addOrGetItemDefinitions";
import { BPMN20__tUserTask } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { Normalized } from "../../normalization/normalize";
import { TextArea } from "@patternfly/react-core/dist/js/components/TextArea/TextArea";
import { FormSelect } from "@patternfly/react-core/dist/js/components/FormSelect/FormSelect";
import { FormSelectOption } from "@patternfly/react-core/dist/js/components/FormSelect/FormSelectOption";
import { CubesIcon } from "@patternfly/react-icons/dist/js/icons/cubes-icon";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";
import { Form } from "@patternfly/react-core/dist/js/components/Form/Form";
import { TextInput } from "@patternfly/react-core/dist/js/components/TextInput/TextInput";
import { FormSection } from "@patternfly/react-core/dist/js/components/Form/FormSection";
import { SectionHeader } from "@kie-tools/xyflow-react-kie-diagram/dist/propertiesPanel/SectionHeader";
import { BellIcon } from "@patternfly/react-icons/dist/js/icons/bell-icon";
import { EyeIcon } from "@patternfly/react-icons/dist/js/icons/eye-icon";
import { EditIcon } from "@patternfly/react-icons/dist/js/icons/edit-icon";
import { Alert } from "@patternfly/react-core/dist/js/components/Alert/Alert";
import "./Notifications.css";

type Notification = {
  from: string;
  tousers: string;
  togroups: string;
  toemails: string;
  replyTo: string;
  subject: string;
  body: string;
  type: string;
  expiresAt: string;
};

const typeOptions = [
  { value: "NotStartedNotify", label: "Not Started" },
  { value: "NotCompletedNotify", label: "Not Completed" },
];

const entryStyle = {
  padding: "4px",
  margin: "8px",
  width: "calc(100% - 2 * 4px - 2 * 8px)",
};

export function NotificationsFormSection({
  element,
}: {
  element: Normalized<BPMN20__tUserTask> & { __$$element: "userTask" };
}) {
  const isReadOnly = useBpmnEditorStore((s) => s.settings.isReadOnly);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const count = useMemo(() => {
    return (
      element?.dataInputAssociation
        ?.filter(
          (dataInputAssociation) =>
            dataInputAssociation.targetRef?.__$$text.includes("NotStartedNotify") ||
            dataInputAssociation.targetRef?.__$$text.includes("NotCompletedNotify")
        )
        ?.reduce((acc, association) => {
          const assignment = association.assignment?.[0];
          if (!assignment) {
            return acc;
          }
          const notificationText = assignment.from.__$$text || "";
          const expiresAtMatches = [...notificationText.matchAll(/\]@\[([^\]]*)/g)];
          return acc + expiresAtMatches.length;
        }, 0) || 0
    );
  }, [element?.dataInputAssociation]);

  const sectionLabel = useMemo(() => {
    if (count > 0) {
      return ` (${count})`;
    } else {
      return "";
    }
  }, [count]);

  return (
    <>
      <FormSection
        title={
          <SectionHeader
            expands={"modal"}
            icon={<BellIcon width={16} height={36} style={{ marginLeft: "12px" }} />}
            title={"Notifications" + sectionLabel}
            toogleSectionExpanded={() => setShowNotificationsModal(true)}
            action={
              <Button
                title={"Manage"}
                variant={ButtonVariant.plain}
                isDisabled={isReadOnly}
                onClick={() => setShowNotificationsModal(true)}
                style={{ paddingBottom: 0, paddingTop: 0 }}
              >
                {isReadOnly ? <EyeIcon /> : <EditIcon />}
              </Button>
            }
          />
        }
      />
      <Modal
        title="Notifications"
        className={"kie-bpmn-editor--notifications--modal"}
        aria-labelledby={"Notifications"}
        variant={ModalVariant.large}
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
      >
        <div style={{ height: "100%" }}>
          <Notifications element={element} />
        </div>
      </Modal>
    </>
  );
}

export function Notifications({ element }: { element: Normalized<BPMN20__tUserTask> & { __$$element: "userTask" } }) {
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(undefined);
  const [onSaveMessage, setOnSaveMessage] = useState<string | null>(null);

  const addNotification = useCallback(() => {
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
  }, [notifications]);

  const removeNotification = useCallback(
    (index: number) => {
      setNotifications(notifications.filter((_, i) => i !== index));
    },
    [notifications]
  );

  const handleInputChange = useCallback((index: number, propertyName: keyof Notification, value: string | number) => {
    setNotifications((prevNotifications) => {
      const updatedNotifications = [...prevNotifications];
      updatedNotifications[index] = { ...updatedNotifications[index], [propertyName]: value };
      return updatedNotifications;
    });
  }, []);

  //populates intermediary `notifications` state from the model
  useEffect(() => {
    if (!element) {
      return;
    }

    const extractedNotifications = element?.dataInputAssociation
      ?.filter(
        (dataInputAssociation) =>
          dataInputAssociation.targetRef?.__$$text.includes("NotStartedNotify") ||
          dataInputAssociation.targetRef?.__$$text.includes("NotCompletedNotify")
      )
      ?.flatMap((association) => {
        const assignment = association.assignment?.[0];
        if (!assignment) {
          return [];
        }

        const notificationText = assignment.from.__$$text || "";
        const fromMatches = [...notificationText.matchAll(/from:([^|]*)/g)];
        const bodyMatches = [...notificationText.matchAll(/body:([^@\]]*)/g)];
        const subjectMatches = [...notificationText.matchAll(/subject:([^|]*)/g)];
        const toEmailsMatches = [...notificationText.matchAll(/toemails:([^|]*)/g)];
        const replyToMatches = [...notificationText.matchAll(/replyTo:([^|]*)/g)];
        const usersMatches = [...notificationText.matchAll(/tousers:([^|]*)/g)];
        const groupsMatches = [...notificationText.matchAll(/togroups:([^|]*)/g)];
        const expiresAtMatches = [...notificationText.matchAll(/\]@\[([^\]]*)/g)];

        const from = fromMatches.map((match) => match[1]);
        const tousers = usersMatches.map((match) => match[1]);
        const togroups = groupsMatches.map((match) => match[1]);
        const toemails = toEmailsMatches.map((match) => match[1]);
        const replyTo = replyToMatches.map((match) => match[1]);
        const subject = subjectMatches.map((match) => match[1]);
        const body = bodyMatches.map((match) => match[1]);
        const expiresAt = expiresAtMatches.map((match) => match[1]);

        const notifications = [];
        for (let i = 0; i < expiresAt.length; i++) {
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
      });

    setNotifications(extractedNotifications || []);
  }, [element]);

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (!event.target.checkValidity()) {
        event.target.reportValidity();
        return;
      }
      bpmnEditorStoreApi.setState((s) => {
        const { process } = addOrGetProcessAndDiagramElements({
          definitions: s.bpmn.model.definitions,
        });
        visitFlowElementsAndArtifacts(process, ({ element: e }) => {
          if (e["@_id"] === element?.["@_id"] && e.__$$element === element.__$$element) {
            setBpmn20Drools10MetaData(e, "elementname", e["@_name"] || "");

            e.ioSpecification ??= {
              "@_id": generateUuid(),
              inputSet: [{ "@_id": generateUuid(), dataInputRefs: [] }],
              outputSet: [],
              dataInput: [],
            };

            e.ioSpecification.dataInput ??= [];
            e.dataInputAssociation ??= [];

            e.ioSpecification.dataInput = e.ioSpecification.dataInput?.filter(
              (dataInput) =>
                !dataInput["@_name"]?.includes("NotStartedNotify") &&
                !dataInput["@_name"]?.includes("NotCompletedNotify")
            );
            if (e.ioSpecification?.inputSet?.[0]?.dataInputRefs) {
              e.ioSpecification.inputSet[0].dataInputRefs = e.ioSpecification.inputSet[0].dataInputRefs?.filter(
                (dataInputRefs) =>
                  !dataInputRefs.__$$text.includes("NotStartedNotify") &&
                  !dataInputRefs.__$$text?.includes("NotCompletedNotify")
              );
            }
            e.dataInputAssociation = e.dataInputAssociation?.filter(
              (dataInputAssociation) =>
                !dataInputAssociation.targetRef.__$$text.includes("NotStartedNotify") &&
                !dataInputAssociation.targetRef.__$$text.includes("NotCompletedNotify")
            );

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
              let inputSet = e.ioSpecification?.inputSet[0];
              if (!inputSet) {
                inputSet = {
                  "@_id": generateUuid(),
                  dataInputRefs: [
                    {
                      __$$text: `${e["@_id"]}_${notification.type}InputX`,
                    },
                  ],
                };
                e.ioSpecification?.inputSet.push(inputSet);
              } else {
                e.ioSpecification?.inputSet[0].dataInputRefs?.push({
                  __$$text: `${e["@_id"]}_${notification.type}InputX`,
                });
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
              const newEntry = `from:${notification.from}|tousers:${notification.tousers}|togroups:${notification.togroups}|toemails:${notification.toemails}|replyTo:${notification.replyTo}|subject:${notification.subject}|body:${notification.body}]@[${notification.expiresAt}]`;

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
              addOrGetItemDefinitions({
                definitions: s.bpmn.model.definitions,
                oldId: `${e["@_id"]}_dataInputAssociation_${notification.type}`,
                structureRef: "object",
              });
            });
          }
        });
      });
      setOnSaveMessage("Notifications saved successfully!");
      setTimeout(() => {
        setOnSaveMessage(null);
      }, 1500);
    },

    [element, bpmnEditorStoreApi, notifications]
  );

  return (
    <>
      {onSaveMessage && (
        <div>
          <Alert variant="success" title={onSaveMessage} isInline />
        </div>
      )}
      {(notifications.length > 0 && (
        <Form onSubmit={handleSubmit}>
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
            <GridItem span={1} style={{ textAlign: "right" }}>
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
                  >
                    {typeOptions.map((option) => (
                      <FormSelectOption key={option.label} label={option.label} value={option.value} />
                    ))}
                  </FormSelect>
                </GridItem>
                <GridItem span={1}>
                  <TextInput
                    aria-label={"expires at"}
                    style={entryStyle}
                    type="text"
                    placeholder="Expires at..."
                    isRequired={true}
                    value={entry.expiresAt}
                    onChange={(e) => handleInputChange(i, "expiresAt", e)}
                  />
                </GridItem>
                <GridItem span={1}>
                  <TextInput
                    aria-label={"from"}
                    style={entryStyle}
                    type="text"
                    placeholder="From..."
                    value={entry.from}
                    onChange={(e) => handleInputChange(i, "from", e)}
                  />
                </GridItem>
                <GridItem span={1}>
                  <TextInput
                    aria-label={"to users"}
                    style={entryStyle}
                    type="text"
                    placeholder="To Users..."
                    value={entry.tousers}
                    onChange={(e) => handleInputChange(i, "tousers", e)}
                  />
                </GridItem>
                <GridItem span={1}>
                  <TextInput
                    aria-label={"to groups"}
                    style={entryStyle}
                    type="text"
                    placeholder="To Groups..."
                    value={entry.togroups}
                    onChange={(e) => handleInputChange(i, "togroups", e)}
                  />
                </GridItem>
                <GridItem span={1}>
                  <TextInput
                    aria-label={"to emails"}
                    style={entryStyle}
                    type="email"
                    placeholder="To Emails..."
                    value={entry.toemails}
                    onChange={(e) => handleInputChange(i, "toemails", e)}
                  />
                </GridItem>
                <GridItem span={1}>
                  <TextInput
                    aria-label={"reply to"}
                    style={entryStyle}
                    type="text"
                    placeholder="Reply to..."
                    value={entry.replyTo}
                    onChange={(e) => handleInputChange(i, "replyTo", e)}
                  />
                </GridItem>
                <GridItem span={1}>
                  <TextInput
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
          <Button
            type="submit"
            className="kie-bpmn-editor--properties-panel--notification-submit-save-button"
            onMouseUp={(e) => e.currentTarget.blur()}
          >
            Save
          </Button>
        </Form>
      )) || (
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
          <Button
            variant="primary"
            onClick={handleSubmit}
            className="kie-bpmn-editor--properties-panel--notification-submit-save-button"
            onMouseUp={(e) => e.currentTarget.blur()}
          >
            Save
          </Button>
        </div>
      )}
    </>
  );
}
