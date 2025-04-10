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
import { BPMN20__tProcess } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { Button, ButtonVariant } from "@patternfly/react-core/dist/js/components/Button/Button";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../../store/StoreContext";
import { addOrGetProcessAndDiagramElements } from "../../mutations/addOrGetProcessAndDiagramElements";
import { visitFlowElementsAndArtifacts } from "../../mutations/_elementVisitor";
import { setBpmn20Drools10MetaData } from "@kie-tools/bpmn-marshaller/dist/drools-extension-metaData";
import { Grid, GridItem } from "@patternfly/react-core/dist/js/layouts/Grid";
import { PlusCircleIcon } from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import { useCallback, useMemo, useState } from "react";
import { CubesIcon } from "@patternfly/react-icons/dist/js/icons/cubes-icon";
import { TimesIcon } from "@patternfly/react-icons/dist/js/icons/times-icon";
import { Normalized } from "../../normalization/normalize";
import { Title } from "@patternfly/react-core/dist/js/components/Title";
import { EmptyState, EmptyStateBody, EmptyStateIcon } from "@patternfly/react-core/dist/js/components/EmptyState";
import { Modal, ModalVariant } from "@patternfly/react-core/dist/js/components/Modal";
import "./Correlations.css";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";
import { Bullseye } from "@patternfly/react-core/dist/js/layouts/Bullseye";
import { Form } from "@patternfly/react-core/dist/js/components/Form/Form";
import { Alert } from "@patternfly/react-core/dist/js/components/Alert/Alert";
import { FormSelect } from "@patternfly/react-core/dist/js/components/FormSelect/FormSelect";
import { FormSelectOption } from "@patternfly/react-core/dist/js/components/FormSelect/FormSelectOption";

type Correlation = {
  id: string;
  name: string;
  propertyId: string;
  propertyName: string;
  propertyType: string;
};

const dataType = [
  { value: "Custom", label: "Custom..." },
  { value: "Boolean", label: "Boolean" },
  { value: "Float", label: "Float" },
  { value: "Integer", label: "Integer" },
  { value: "Object", label: "Object" },
  { value: "String", label: "String" },
];

const entryStyle = {
  padding: "4px",
  margin: "8px",
  width: "calc(100% - 2 * 4px - 2 * 8px)",
};

export function Correlations({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();
  const [correlations, setCorrelations] = useState<Correlation[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(undefined);
  const [onSaveMessage, setOnSaveMessage] = useState<string | null>(null);

  const isReadOnly = useBpmnEditorStore((s) => s.settings.isReadOnly);

  const addCorrelation = useCallback(() => {
    setCorrelations([...correlations, { id: "", name: "", propertyId: "", propertyName: "", propertyType: "Custom" }]);
  }, [correlations]);

  const removeCorrelation = useCallback(
    (index: number) => {
      setCorrelations(correlations.filter((_, i) => i !== index));
    },
    [correlations]
  );

  const addAtEnd = React.useCallback(() => {
    bpmnEditorStoreApi.setState((s) => {
      const { process } = addOrGetProcessAndDiagramElements({ definitions: s.bpmn.model.definitions });
      const correlationPropertyId = generateUuid();

      s.bpmn.model.definitions.rootElement ??= [];
      s.bpmn.model.definitions.rootElement.push({
        __$$element: "correlationProperty",
        "@_id": correlationPropertyId,
        "@_name": "",
        "@_type": "",
        correlationPropertyRetrievalExpression: [],
      });

      process.correlationSubscription ??= [];
      process.correlationSubscription.push({
        "@_id": generateUuid(),
        "@_correlationKeyRef": correlationPropertyId,
        correlationPropertyBinding: [
          {
            "@_id": generateUuid(),
            "@_correlationPropertyRef": correlationPropertyId,
            dataPath: undefined as any, // FIXME: Tiago
          },
        ],
      });
    });
  }, [bpmnEditorStoreApi]);

  const addButton = useMemo(
    () => (
      <Button variant={ButtonVariant.plain} style={{ paddingLeft: 0 }} onClick={addCorrelation}>
        <PlusCircleIcon color="var(--pf-c-button--m-primary--BackgroundColor)" />
      </Button>
    ),
    [addAtEnd]
  );

  const process: undefined | Normalized<BPMN20__tProcess> = useBpmnEditorStore((s) =>
    s.bpmn.model.definitions.rootElement?.find((s) => s.__$$element === "process")
  );

  const correlationCount = process?.correlationSubscription?.length ?? 0;

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
          console.log("hey");
        });
      });

      setOnSaveMessage("Correlations saved successfully!");
      setTimeout(() => {
        setOnSaveMessage(null);
      }, 1500);
    },
    [bpmnEditorStoreApi]
  );

  return (
    <Modal
      className={"kie-bpmn-editor--correlations--modal"}
      aria-labelledby={"Correlations"}
      title={"Correlations"}
      variant={ModalVariant.large}
      isOpen={isOpen}
      onClose={onClose}
    >
      {onSaveMessage && (
        <div>
          <Alert variant="success" title={onSaveMessage} isInline />
        </div>
      )}
      {(correlations.length > 0 && (
        <Form onSubmit={handleSubmit}>
          <div style={{ padding: "0 8px", position: "sticky", top: "-16px", backdropFilter: "blur(8px)" }}>
            <Grid md={6} style={{ alignItems: "center" }}>
              <GridItem span={2}>
                <div style={entryStyle}>
                  <b>ID</b>
                </div>
              </GridItem>
              <GridItem span={3}>
                <div style={entryStyle}>
                  <b>Name</b>
                </div>
              </GridItem>
              <GridItem span={2}>
                <div style={entryStyle}>
                  <b>Property ID</b>
                </div>
              </GridItem>
              <GridItem span={2}>
                <div style={entryStyle}>
                  <b>Property name</b>
                </div>
              </GridItem>
              <GridItem span={2}>
                <div style={entryStyle}>
                  <b>Property type</b>
                </div>
              </GridItem>
              <GridItem span={1}>
                <div style={{ textAlign: "right" }}>{!isReadOnly && addButton}</div>
              </GridItem>
            </Grid>
          </div>
          {correlations.map((entry, i) => (
            <div key={i} style={{ padding: "0 8px" }}>
              <Grid
                md={6}
                className={"kie-bpmn-editor--properties-panel--correlation-entry"}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(undefined)}
              >
                <GridItem span={2}>
                  <input
                    autoFocus={true}
                    style={entryStyle}
                    type="text"
                    required
                    placeholder="ID..."
                    value={entry.id}
                    onChange={(e) =>
                      bpmnEditorStoreApi.setState((s) => {
                        const { process } = addOrGetProcessAndDiagramElements({
                          definitions: s.bpmn.model.definitions,
                        });
                      })
                    }
                  />
                </GridItem>
                <GridItem span={3}>
                  <input
                    style={entryStyle}
                    type="text"
                    required
                    placeholder="Name..."
                    value={entry.name}
                    onChange={(e) =>
                      bpmnEditorStoreApi.setState((s) => {
                        const { process } = addOrGetProcessAndDiagramElements({
                          definitions: s.bpmn.model.definitions,
                        });
                      })
                    }
                  />
                </GridItem>
                <GridItem span={2}>
                  <input
                    style={entryStyle}
                    type="text"
                    required
                    placeholder="Property ID..."
                    value={entry.propertyId}
                    onChange={(e) =>
                      bpmnEditorStoreApi.setState((s) => {
                        const { process } = addOrGetProcessAndDiagramElements({
                          definitions: s.bpmn.model.definitions,
                        });
                      })
                    }
                  />
                </GridItem>
                <GridItem span={2}>
                  <input
                    style={entryStyle}
                    type="text"
                    required
                    placeholder="Property name..."
                    value={entry.propertyName}
                    onChange={(e) =>
                      bpmnEditorStoreApi.setState((s) => {
                        const { process } = addOrGetProcessAndDiagramElements({
                          definitions: s.bpmn.model.definitions,
                        });
                      })
                    }
                  />
                </GridItem>
                <GridItem span={2}>
                  <FormSelect
                    aria-label={"property type"}
                    type={"text"}
                    value={entry.propertyType}
                    style={entryStyle}
                    rows={1}
                    onChange={(e) =>
                      bpmnEditorStoreApi.setState((s) => {
                        const { process } = addOrGetProcessAndDiagramElements({
                          definitions: s.bpmn.model.definitions,
                        });
                      })
                    }
                  >
                    {dataType.map((option) => (
                      <FormSelectOption key={option.label} label={option.label} value={option.value} />
                    ))}
                  </FormSelect>
                </GridItem>
                <GridItem span={1} style={{ textAlign: "right" }}>
                  {hoveredIndex === i && (
                    <Button
                      tabIndex={9999} // Prevent tab from going to this button
                      variant={ButtonVariant.plain}
                      style={{ paddingLeft: 0 }}
                      onClick={() => removeCorrelation(i)}
                    >
                      <TimesIcon />
                    </Button>
                  )}
                </GridItem>
              </Grid>
            </div>
          ))}
          <br />
          <br />
          <br />
          <Button
            type="submit"
            className="kie-bpmn-editor--properties-panel--reassignment-submit-save-button"
            onMouseUp={(e) => e.currentTarget.blur()}
          >
            Save
          </Button>
        </Form>
      )) || (
        <div className={"kie-bpmn-editor--correlations--empty-state"}>
          <Bullseye>
            <EmptyState>
              <EmptyStateIcon icon={CubesIcon} />
              <Title headingLevel="h4">{isReadOnly ? "No correlations" : "No correlations yet"}</Title>
              <EmptyStateBody style={{ padding: "0 25%" }}>
                {"This represents the empty state for correlations. You can add correlations to get started."}
              </EmptyStateBody>
              <Button variant="primary" onClick={addCorrelation}>
                {"Add correlation"}
              </Button>
            </EmptyState>
          </Bullseye>
        </div>
      )}
    </Modal>
  );
}
