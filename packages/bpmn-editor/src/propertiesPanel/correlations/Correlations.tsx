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
import { BPMN20__tDefinitions, BPMN20__tProcess } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { Button, ButtonVariant } from "@patternfly/react-core/dist/js/components/Button/Button";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../../store/StoreContext";
import { addOrGetProcessAndDiagramElements } from "../../mutations/addOrGetProcessAndDiagramElements";
import { PropertiesPanelListEmptyState } from "../emptyState/PropertiesPanelListEmptyState";
import { Grid, GridItem } from "@patternfly/react-core/dist/js/layouts/Grid";
import { PlusCircleIcon } from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import { useMemo, useState } from "react";
import { CubesIcon } from "@patternfly/react-icons/dist/js/icons/cubes-icon";

import { TimesIcon } from "@patternfly/react-icons/dist/js/icons/times-icon";
import { Normalized } from "../../normalization/normalize";
import { Title } from "@patternfly/react-core/dist/js/components/Title";
import { EmptyState, EmptyStateBody, EmptyStateIcon } from "@patternfly/react-core/dist/js/components/EmptyState";
import { Modal, ModalVariant } from "@patternfly/react-core/dist/js/components/Modal";
import "./Correlations.css";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";
import { Bullseye } from "@patternfly/react-core/dist/js/layouts/Bullseye";

export function Correlations({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();
  const isReadOnly = useBpmnEditorStore((s) => s.settings.isReadOnly);

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
      <Button variant={ButtonVariant.plain} style={{ paddingLeft: 0 }} onClick={addAtEnd}>
        <PlusCircleIcon color="var(--pf-c-button--m-primary--BackgroundColor)" />
      </Button>
    ),
    [addAtEnd]
  );

  const entryStyle = {
    padding: "4px",
    margin: "8px",
    width: "calc(100% - 2 * 4px - 2 * 8px)",
  };

  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(undefined);

  const process: undefined | Normalized<BPMN20__tProcess> = useBpmnEditorStore((s) =>
    s.bpmn.model.definitions.rootElement?.find((s) => s.__$$element === "process")
  );

  const correlationCount = process?.correlationSubscription?.length ?? 0;

  return (
    <Modal
      className={"kie-bpmn-editor--correlations--modal"}
      aria-labelledby={"Correlations"}
      title={"Correlations"}
      variant={ModalVariant.large}
      isOpen={isOpen}
      onClose={onClose}
    >
      {(correlationCount > 0 && (
        <>
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
          {process?.correlationSubscription?.map((entry, i) => (
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
                    placeholder="ID..."
                    value={""}
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
                    placeholder="Name..."
                    value={""}
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
                    placeholder="Property ID..."
                    value={""}
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
                    placeholder="Property name..."
                    value={""}
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
                    placeholder="Property type..."
                    value={""}
                    onChange={(e) =>
                      bpmnEditorStoreApi.setState((s) => {
                        const { process } = addOrGetProcessAndDiagramElements({
                          definitions: s.bpmn.model.definitions,
                        });
                      })
                    }
                  />
                </GridItem>
                <GridItem span={1} style={{ textAlign: "right" }}>
                  {hoveredIndex === i && (
                    <Button
                      tabIndex={9999} // Prevent tab from going to this button
                      variant={ButtonVariant.plain}
                      style={{ paddingLeft: 0 }}
                      onClick={() => {
                        bpmnEditorStoreApi.setState((s) => {
                          const { process } = addOrGetProcessAndDiagramElements({
                            definitions: s.bpmn.model.definitions,
                          });
                          process.correlationSubscription?.splice(i, 1);
                        });
                      }}
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
        </>
      )) || (
        <div className={"kie-bpmn-editor--correlations--empty-state"}>
          <Bullseye>
            <EmptyState>
              <EmptyStateIcon icon={CubesIcon} />
              <Title headingLevel="h4">{isReadOnly ? "No correlations" : "No correlations yet"}</Title>
              <EmptyStateBody style={{ padding: "0 25%" }}>
                {`This represents an the empty state pattern in Patternfly 4. Hopefully it's simple enough to use but flexible enough to meet a variety of needs.`}
              </EmptyStateBody>
              <Button variant="primary" onClick={addAtEnd}>
                {"Add correlation"}
              </Button>
            </EmptyState>
          </Bullseye>
        </div>
      )}
    </Modal>
  );
}
