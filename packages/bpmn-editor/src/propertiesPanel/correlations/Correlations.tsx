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
import "@kie-tools/bpmn-marshaller/dist/drools-extension";
import { BPMN20__tCorrelationProperty } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import {
  EditableNodeLabel,
  OnEditableNodeLabelChange,
  useEditableNodeLabel,
} from "@kie-tools/xyflow-react-kie-diagram/dist/nodes/EditableNodeLabel";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";
import { Button, ButtonVariant } from "@patternfly/react-core/dist/js/components/Button/Button";
import { Card } from "@patternfly/react-core/dist/js/components/Card";
import { Divider } from "@patternfly/react-core/dist/js/components/Divider";
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateIcon,
} from "@patternfly/react-core/dist/js/components/EmptyState";
import { FormGroup, FormSection } from "@patternfly/react-core/dist/js/components/Form";
import { Form } from "@patternfly/react-core/dist/js/components/Form/Form";
import { FormSelect } from "@patternfly/react-core/dist/js/components/FormSelect/FormSelect";
import { FormSelectOption } from "@patternfly/react-core/dist/js/components/FormSelect/FormSelectOption";
import { InputGroupText } from "@patternfly/react-core/dist/js/components/InputGroup";
import { InputGroup } from "@patternfly/react-core/dist/js/components/InputGroup/InputGroup";
import { TextInput } from "@patternfly/react-core/dist/js/components/TextInput";
import { Title } from "@patternfly/react-core/dist/js/components/Title";
import { Flex } from "@patternfly/react-core/dist/js/layouts/Flex/Flex";
import { FlexItem } from "@patternfly/react-core/dist/js/layouts/Flex/FlexItem";
import { Stack } from "@patternfly/react-core/dist/js/layouts/Stack";
import { ObjectGroupIcon } from "@patternfly/react-icons/dist/js/icons/object-group-icon";
import { PeopleCarryIcon } from "@patternfly/react-icons/dist/js/icons/people-carry-icon";
import { PlusCircleIcon } from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageEventSymbolSvg } from "../../diagram/nodes/NodeSvgs";
import { addOrGetProcessAndDiagramElements } from "../../mutations/addOrGetProcessAndDiagramElements";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../../store/StoreContext";
import {
  ItemDefinitionRefSelector,
  OnChangeItemDefinitionRefSelector,
} from "../itemDefinitionRefSelector/ItemDefinitionRefSelector";
import { MessageSelector } from "../messageSelector/MessageSelector";
import "./Correlations.css";

export function Correlations() {
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

  const isReadOnly = useBpmnEditorStore((s) => s.settings.isReadOnly);

  const addProperty = useCallback(() => {
    const newPropertyId = generateUuid();

    bpmnEditorStoreApi.setState((s) => {
      s.focus.consumableId = newPropertyId;
      s.bpmn.model.definitions.rootElement ??= [];
      s.bpmn.model.definitions.rootElement.push({
        __$$element: "correlationProperty",
        "@_id": newPropertyId,
        "@_name": "New Property",
        "@_type": undefined,
        correlationPropertyRetrievalExpression: [],
      });
    });

    setSelectedPropertyId(newPropertyId);
  }, [bpmnEditorStoreApi]);

  const addKey = useCallback(() => {
    const newKeyId = generateUuid();
    bpmnEditorStoreApi.setState((s) => {
      s.focus.consumableId = newKeyId;

      const { process } = addOrGetProcessAndDiagramElements({ definitions: s.bpmn.model.definitions });

      s.bpmn.model.definitions.rootElement ??= [];
      let collaboration = s.bpmn.model.definitions.rootElement.find((e) => e.__$$element === "collaboration");
      if (!collaboration) {
        collaboration = {
          "@_id": generateUuid(),
          __$$element: "collaboration",
          participant: [
            {
              "@_id": generateUuid(),
              "@_name": "Pool Participant",
              "@_processRef": process["@_id"],
            },
          ],
        };
        s.bpmn.model.definitions.rootElement.push(collaboration);
      }

      collaboration.correlationKey ??= [];
      collaboration.correlationKey.push({
        "@_id": newKeyId,
        "@_name": "New Key",
      });
    });

    setSelectedKeyId(newKeyId);
  }, [bpmnEditorStoreApi]);

  const properties = useBpmnEditorStore(
    (s) => s.bpmn.model.definitions.rootElement?.filter((e) => e.__$$element === "correlationProperty") ?? []
  );

  const propertiesById = useBpmnEditorStore((s) =>
    (s.bpmn.model.definitions.rootElement ?? []).reduce((acc, e) => {
      if (e.__$$element === "correlationProperty") {
        acc.set(e["@_id"], e);
      }
      return acc;
    }, new Map<string, BPMN20__tCorrelationProperty>())
  );

  const keys = useBpmnEditorStore(
    (s) =>
      s.bpmn.model.definitions.rootElement
        ?.filter((e) => e.__$$element === "collaboration")
        .flatMap((k) => k.correlationKey ?? []) ?? []
  );

  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.["@_id"]);
  const [selectedKeyId, setSelectedKeyId] = useState(keys[0]?.["@_id"]);

  const selectedProperty = useBpmnEditorStore((s) =>
    s.bpmn.model.definitions.rootElement
      ?.filter((e) => e.__$$element === "correlationProperty")
      .find((p) => p["@_id"] === selectedPropertyId)
  );

  const selectedKey = useBpmnEditorStore((s) =>
    s.bpmn.model.definitions.rootElement
      ?.find((e) => e.__$$element === "collaboration")
      ?.correlationKey?.find((k) => k["@_id"] === selectedKeyId)
  );

  useEffect(() => {
    if (!selectedProperty && properties.length > 0) {
      setSelectedPropertyId(properties[0]["@_id"]);
    }
  }, [properties, selectedProperty]);

  useEffect(() => {
    if (!selectedKey && keys.length > 0) {
      setSelectedKeyId(keys[0]["@_id"]);
    }
  }, [keys, selectedKey]);

  const availablePropertiesToAddToKey = useMemo(() => {
    return properties.filter(
      (p) => !selectedKey?.correlationPropertyRef?.map((propertyRef) => propertyRef.__$$text).includes(p["@_id"])
    );
  }, [properties, selectedKey?.correlationPropertyRef]);

  const changeSelectedPropertyType = useCallback<OnChangeItemDefinitionRefSelector>(
    (newItemDefinitionRef) => {
      bpmnEditorStoreApi.setState((s) => {
        const property = s.bpmn.model.definitions.rootElement
          ?.filter((e) => e.__$$element === "correlationProperty")
          .find((p) => p["@_id"] === selectedPropertyId);

        if (property) {
          property["@_type"] = newItemDefinitionRef;
        }
      });
    },
    [bpmnEditorStoreApi, selectedPropertyId]
  );
  const changePropertyName = useCallback(
    (propetyId: string) => (newName: string) => {
      bpmnEditorStoreApi.setState((s) => {
        const property = s.bpmn.model.definitions.rootElement
          ?.filter((e) => e.__$$element === "correlationProperty")
          .find((p) => p["@_id"] === propetyId);

        if (property) {
          property["@_name"] = newName;
        }
      });
    },
    [bpmnEditorStoreApi]
  );

  const addMessageBindingToProperty = useCallback(() => {
    bpmnEditorStoreApi.setState((s) => {
      const property = s.bpmn.model.definitions.rootElement
        ?.filter((e) => e.__$$element === "correlationProperty")
        .find((p) => p["@_id"] === selectedPropertyId);

      if (property) {
        property.correlationPropertyRetrievalExpression.push({
          "@_id": generateUuid(),
          "@_messageRef": undefined as any, // SPEC DISCREPANCY!,
          messagePath: {
            "@_id": generateUuid(),
            "@_evaluatesToTypeRef": property["@_type"],
            __$$text: "",
          },
        });
      }
    });
  }, [bpmnEditorStoreApi, selectedPropertyId]);

  const onChangeMessageBindingExpression = useCallback(
    (i: number) => (e: React.FormEvent, newExpression: string) => {
      bpmnEditorStoreApi.setState((s) => {
        const property = s.bpmn.model.definitions.rootElement
          ?.filter((p) => p.__$$element === "correlationProperty")
          .find((p) => p["@_id"] === selectedPropertyId);

        if (property) {
          property.correlationPropertyRetrievalExpression[i].messagePath.__$$text = newExpression;
        }
      });
    },
    [bpmnEditorStoreApi, selectedPropertyId]
  );

  const onChangeMessageBindingMessage = useCallback(
    (i: number) => (e: React.FormEvent, newMessaage: string) => {
      bpmnEditorStoreApi.setState((s) => {
        const property = s.bpmn.model.definitions.rootElement
          ?.filter((p) => p.__$$element === "correlationProperty")
          .find((p) => p["@_id"] === selectedPropertyId);

        if (property) {
          property.correlationPropertyRetrievalExpression[i]["@_messageRef"] = newMessaage;
        }
      });
    },
    [bpmnEditorStoreApi, selectedPropertyId]
  );

  const changeKeyName = useCallback(
    (keyId: string) => (newName: string) => {
      bpmnEditorStoreApi.setState((s) => {
        const key = s.bpmn.model.definitions.rootElement
          ?.find((e) => e.__$$element === "collaboration")
          ?.correlationKey?.find((k) => k["@_id"] === keyId);

        if (key) {
          key["@_name"] = newName;
        }
      });
    },
    [bpmnEditorStoreApi]
  );

  const addPropertyToCorrelationKey = useCallback(
    (e: React.FormEvent, propertyId: string) => {
      bpmnEditorStoreApi.setState((s) => {
        const key = s.bpmn.model.definitions.rootElement
          ?.find((e) => e.__$$element === "collaboration")
          ?.correlationKey?.find((k) => k["@_id"] === selectedKeyId);

        if (key) {
          key.correlationPropertyRef ??= [];
          key.correlationPropertyRef.push({ __$$text: propertyId });

          const { process } = addOrGetProcessAndDiagramElements({ definitions: s.bpmn.model.definitions });
          for (const subs of process.correlationSubscription ?? []) {
            if (subs["@_correlationKeyRef"] === selectedKeyId) {
              subs.correlationPropertyBinding ??= [];
              subs.correlationPropertyBinding?.push({
                "@_id": generateUuid(),
                "@_correlationPropertyRef": propertyId,
                dataPath: {
                  "@_id": generateUuid(),
                  __$$text: "",
                },
              });
            }
          }
        }
      });
    },
    [bpmnEditorStoreApi, selectedKeyId]
  );

  const subscriptions = useBpmnEditorStore(
    (s) =>
      s.bpmn.model.definitions.rootElement
        ?.find((s) => s.__$$element === "process")
        ?.correlationSubscription?.filter((s) => s["@_correlationKeyRef"] === selectedKeyId) ?? []
  );

  const addSubscription = useCallback(() => {
    bpmnEditorStoreApi.setState((s) => {
      const { process } = addOrGetProcessAndDiagramElements({ definitions: s.bpmn.model.definitions });
      process.correlationSubscription ??= [];
      process.correlationSubscription?.push({
        "@_id": generateUuid(),
        "@_correlationKeyRef": selectedKeyId,
        correlationPropertyBinding: (selectedKey!.correlationPropertyRef ?? []).map((propRef) => ({
          "@_id": generateUuid(),
          "@_correlationPropertyRef": propRef.__$$text,
          dataPath: {
            "@_id": generateUuid(),
            __$$text: "",
          },
        })),
      });
    });
  }, [bpmnEditorStoreApi, selectedKey, selectedKeyId]);

  const changeValueOfSubscription = useCallback(
    (subscriptionIndex: number, propertyBindingIndex: number) => (e: React.FormEvent, newValue: string) => {
      bpmnEditorStoreApi.setState((s) => {
        const { process } = addOrGetProcessAndDiagramElements({ definitions: s.bpmn.model.definitions });
        process.correlationSubscription ??= [];
        process.correlationSubscription[subscriptionIndex]!.correlationPropertyBinding![
          propertyBindingIndex
        ].dataPath.__$$text = newValue;
      });
    },
    [bpmnEditorStoreApi]
  );

  const hasAtLeastOnePropertyWithMessageBinding = useMemo(() => {
    return properties.some((p) => p.correlationPropertyRetrievalExpression.length > 0);
  }, [properties]);

  const hasAtLeastOneKeyWithSubscriptions = useBpmnEditorStore(
    (s) =>
      (s.bpmn.model.definitions.rootElement?.find((s) => s.__$$element === "process")?.correlationSubscription ?? [])
        .length > 0
  );
  const hasAtLeastOneKeyWithProperties = useMemo(
    () => keys.some((k) => (k.correlationPropertyRef ?? []).length > 0),
    [keys]
  );

  return (
    <div className={"kie-bpmn-editor--correlations"}>
      <>
        <Form>
          {(selectedProperty && (
            <>
              <Flex alignItems={{ default: "alignItemsFlexStart" }}>
                <FlexItem>
                  <Flex style={{ height: "100%" }}>
                    <FormSection>
                      <FormGroup
                        label={
                          <Flex
                            justifyContent={{ default: "justifyContentSpaceBetween" }}
                            alignItems={{ default: "alignItemsCenter" }}
                          >
                            <span>Properties</span>
                            {!isReadOnly && (
                              <div>
                                <Button variant={ButtonVariant.link} onClick={addProperty}>
                                  <PlusCircleIcon />
                                </Button>
                              </div>
                            )}
                          </Flex>
                        }
                        className={"kie-bpmn-editor--correlations--properties"}
                      >
                        <ul>
                          {properties.map((p) => (
                            <EditableNameListItem
                              key={p["@_id"]}
                              id={p["@_id"]}
                              value={p["@_name"]}
                              isSelected={p["@_id"] === selectedPropertyId}
                              onChange={changePropertyName(p["@_id"])}
                              onClick={() => setSelectedPropertyId(p["@_id"])}
                            />
                          ))}
                        </ul>
                      </FormGroup>
                    </FormSection>
                    <FormSection>
                      <FormGroup label="Data Type" className={"kie-bpmn-editor--correlations--properties--data-type"}>
                        <ItemDefinitionRefSelector
                          value={selectedProperty?.["@_type"]}
                          onChange={changeSelectedPropertyType}
                        />
                      </FormGroup>
                      <FormGroup
                        label="Message bindings"
                        className={"kie-bpmn-editor--correlations--properties--bindings"}
                      >
                        <Stack hasGutter={true} style={{ gap: "12px" }}>
                          {selectedProperty.correlationPropertyRetrievalExpression.map((cpre, i) => (
                            <Card
                              key={cpre["@_id"]}
                              isCompact={true}
                              className={"kie-bpmn-editor--correlations--properties--bindings--binding"}
                            >
                              <MessageSelector
                                value={cpre["@_messageRef"]}
                                onChange={onChangeMessageBindingMessage(i)}
                              />
                              <InputGroup>
                                <InputGroupText className={"expression-label"}>{`↳`}</InputGroupText>
                                <TextInput
                                  style={{ fontFamily: "monospace" }}
                                  value={cpre.messagePath.__$$text}
                                  onChange={onChangeMessageBindingExpression(i)}
                                  placeholder={"Enter an expression (MVEL)..."}
                                />
                              </InputGroup>
                            </Card>
                          ))}
                          <Button
                            variant={
                              !hasAtLeastOnePropertyWithMessageBinding ? ButtonVariant.primary : ButtonVariant.tertiary
                            }
                            size={"lg"}
                            style={{ width: "100%", lineHeight: "1" }}
                            onClick={addMessageBindingToProperty}
                          >
                            <svg width={30} height={30}>
                              <MessageEventSymbolSvg
                                stroke={!hasAtLeastOnePropertyWithMessageBinding ? "white" : "black"}
                                cx={15}
                                cy={15}
                                innerCircleRadius={15}
                                fill={"transparent"}
                                filled={false}
                              />
                            </svg>
                            <br />
                            Add Message binding
                          </Button>
                        </Stack>
                      </FormGroup>
                    </FormSection>
                  </Flex>
                </FlexItem>
                <Divider
                  inset={{ default: "insetMd" }}
                  orientation={{ default: "vertical" }}
                  style={{ margin: "20px" }}
                />
                <FlexItem grow={{ default: "grow" }} style={{ height: "100%" }}>
                  {(selectedKey && (
                    <>
                      <Flex alignItems={{ default: "alignItemsFlexStart" }} style={{ gap: "18px" }}>
                        <FlexItem>
                          <FormSection>
                            <FormGroup
                              label={
                                <Flex
                                  justifyContent={{ default: "justifyContentSpaceBetween" }}
                                  alignItems={{ default: "alignItemsCenter" }}
                                >
                                  <span>Keys</span>
                                  {!isReadOnly && (
                                    <div>
                                      <Button variant={ButtonVariant.link} onClick={addKey}>
                                        <PlusCircleIcon />
                                      </Button>
                                    </div>
                                  )}
                                </Flex>
                              }
                              className={"kie-bpmn-editor--correlations--keys"}
                            >
                              <ul>
                                {keys.map((k) => (
                                  <EditableNameListItem
                                    key={k["@_id"]}
                                    id={k["@_id"]}
                                    value={k["@_name"]}
                                    isSelected={k["@_id"] === selectedKeyId}
                                    onChange={changeKeyName(k["@_id"])}
                                    onClick={() => setSelectedKeyId(k["@_id"])}
                                  />
                                ))}
                              </ul>
                            </FormGroup>
                          </FormSection>
                        </FlexItem>
                        <FlexItem>
                          <FormSection>
                            <FormGroup label="Properties" className={"kie-bpmn-editor--correlations--keys--properties"}>
                              {selectedKey.correlationPropertyRef?.map((propertyRef) => (
                                <li key={propertyRef.__$$text}>
                                  {propertiesById.get(propertyRef.__$$text)?.["@_name"]}
                                </li>
                              ))}
                              <ul>
                                <li>
                                  <FormSelect
                                    className={!hasAtLeastOneKeyWithProperties ? "primary" : ""}
                                    onChange={addPropertyToCorrelationKey}
                                    isDisabled={availablePropertiesToAddToKey.length <= 0}
                                  >
                                    <FormSelectOption
                                      key={"select"}
                                      isDisabled={true}
                                      isPlaceholder={true}
                                      style={{
                                        textAlign: availablePropertiesToAddToKey.length > 0 ? undefined : "center",
                                      }}
                                      label={
                                        availablePropertiesToAddToKey.length > 0
                                          ? "+ Add Property..."
                                          : "All Properties included"
                                      }
                                    />
                                    {availablePropertiesToAddToKey.map((p) => (
                                      <FormSelectOption key={p["@_id"]} label={p["@_name"] ?? "-"} value={p["@_id"]} />
                                    ))}
                                  </FormSelect>
                                </li>
                              </ul>
                            </FormGroup>
                          </FormSection>
                        </FlexItem>
                        <FlexItem grow={{ default: "grow" }}>
                          <FormSection>
                            {((selectedKey.correlationPropertyRef ?? []).length > 0 && (
                              <FormGroup
                                label="Subscriptions"
                                className={"kie-bpmn-editor--correlations--keys--subscriptions"}
                              >
                                <Stack hasGutter={true}>
                                  {subscriptions.map((subs, i) => (
                                    <Card key={subs["@_id"]} isCompact={true}>
                                      {subs.correlationPropertyBinding?.map((cpb, j) => (
                                        <InputGroup key={cpb["@_id"]}>
                                          <InputGroupText>
                                            {propertiesById.get(cpb["@_correlationPropertyRef"])?.["@_name"] ?? "-"}
                                          </InputGroupText>
                                          <InputGroupText>=</InputGroupText>
                                          <TextInput
                                            style={{ fontFamily: "monospace" }}
                                            value={cpb.dataPath.__$$text}
                                            onChange={changeValueOfSubscription(i, j)}
                                            placeholder="Enter a value or expression..."
                                          />
                                        </InputGroup>
                                      ))}
                                    </Card>
                                  ))}

                                  <Button
                                    variant={
                                      !hasAtLeastOneKeyWithSubscriptions
                                        ? ButtonVariant.primary
                                        : ButtonVariant.tertiary
                                    }
                                    icon={<PlusCircleIcon />}
                                    size={"lg"}
                                    style={{ width: "100%" }}
                                    onClick={addSubscription}
                                  >
                                    <br />
                                    Add Subscription
                                  </Button>
                                </Stack>
                              </FormGroup>
                            )) || (
                              <>
                                <div className={"kie-bpmn-editor--correlations--empty-state"}>
                                  <EmptyState>
                                    <EmptyStateIcon icon={ObjectGroupIcon} />
                                    <Title headingLevel="h4">
                                      {`Can't add Subscriptions without any Property on '${selectedKey["@_name"]}'.`}
                                    </Title>
                                    <EmptyStateBody style={{ padding: "0 25%" }}>
                                      {`Start by adding Properties to '${selectedKey["@_name"]}'.`}
                                    </EmptyStateBody>
                                  </EmptyState>
                                </div>
                              </>
                            )}
                          </FormSection>
                        </FlexItem>
                      </Flex>
                    </>
                  )) || (
                    <>
                      <div className={"kie-bpmn-editor--correlations--empty-state"}>
                        <EmptyState>
                          <EmptyStateIcon icon={ObjectGroupIcon} />
                          <Title headingLevel="h4">
                            {isReadOnly ? "No Correlation Keys" : "No Correlation Keys yet"}
                          </Title>
                          <EmptyStateBody style={{ padding: "0 25%" }}>
                            {
                              "Correlations Keys lets you group Correlation Properties into subscriptions that bind Process Instances to certain values on observed Message."
                            }
                          </EmptyStateBody>
                          <br />
                          <EmptyStateActions>
                            <Button
                              style={{
                                marginTop: hasAtLeastOnePropertyWithMessageBinding ? undefined : "2rem",
                              }}
                              variant={
                                hasAtLeastOnePropertyWithMessageBinding ? ButtonVariant.primary : ButtonVariant.tertiary
                              }
                              onClick={addKey}
                            >
                              {"Add Correlation Key"}
                            </Button>
                          </EmptyStateActions>
                        </EmptyState>
                      </div>
                    </>
                  )}
                </FlexItem>
              </Flex>
            </>
          )) || (
            <>
              <div className={"kie-bpmn-editor--correlations--empty-state"}>
                <EmptyState>
                  <EmptyStateIcon icon={PeopleCarryIcon} />
                  <Title headingLevel="h4">{isReadOnly ? "No correlations" : "No correlations yet"}</Title>
                  <EmptyStateBody style={{ padding: "0 25%" }}>
                    {
                      "Correlations let you bind Process Instances to Messages containing specific property values. Start by creating a Correlation Property."
                    }
                  </EmptyStateBody>
                  <br />
                  <EmptyStateActions>
                    <Button variant={ButtonVariant.primary} onClick={addProperty}>
                      {"Add Correlation Property"}
                    </Button>
                  </EmptyStateActions>
                </EmptyState>
              </div>
            </>
          )}
        </Form>
      </>
    </div>
  );
}

function EditableNameListItem({
  id,
  value,
  isSelected,
  onChange,
  onClick,
}: {
  id: string;
  value: string | undefined;
  isSelected: boolean;
  onChange: OnEditableNodeLabelChange;
  onClick: React.MouseEventHandler<HTMLLIElement>;
}) {
  const { isEditingLabel, setEditingLabel, triggerEditing, triggerEditingIfEnter } = useEditableNodeLabel(id);

  return (
    <li key={id} className={isSelected ? "selected" : ""} onClick={onClick} onDoubleClick={triggerEditing}>
      <EditableNodeLabel
        id={id}
        value={value}
        name={value}
        position={"center-left"}
        isEditing={isEditingLabel}
        setEditing={setEditingLabel}
        onChange={onChange}
        shouldCommitOnBlur={true}
        validate={() => true}
      />
    </li>
  );
}
