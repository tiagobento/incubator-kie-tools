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

import "@kie-tools/bpmn-marshaller/dist/drools-extension";
import {
  parseBpmn20Drools10MetaData,
  setBpmn20Drools10MetaData,
} from "@kie-tools/bpmn-marshaller/dist/drools-extension-metaData";
import { Button, ButtonVariant } from "@patternfly/react-core/dist/js/components/Button/Button";
import { Grid, GridItem } from "@patternfly/react-core/dist/js/layouts/Grid";
import { PlusCircleIcon } from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import { TimesIcon } from "@patternfly/react-icons/dist/js/icons/times-icon";
import * as React from "react";
import { useMemo, useState } from "react";
import { addOrGetProcessAndDiagramElements } from "../../mutations/addOrGetProcessAndDiagramElements";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../../store/StoreContext";
import { PropertiesPanelListEmptyState } from "../emptyState/PropertiesPanelListEmptyState";
import { Normalized } from "../../normalization/normalize";
import { BPMN20__tProcess } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";
import "./Variables.css";

export function Variables({ p }: { p: undefined | Normalized<BPMN20__tProcess> }) {
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

  const isReadOnly = useBpmnEditorStore((s) => s.settings.isReadOnly);

  const addButton = useMemo(
    () => (
      <Button
        variant={ButtonVariant.plain}
        style={{ paddingLeft: 0 }}
        onClick={() => {
          bpmnEditorStoreApi.setState((s) => {
            const { process } = addOrGetProcessAndDiagramElements({ definitions: s.bpmn.model.definitions });
            process.property ??= [];
            process.property?.push({
              "@_id": generateUuid(),
              "@_name": "",
              "@_itemSubjectRef": "",
            });
          });
        }}
      >
        <PlusCircleIcon />
      </Button>
    ),
    [bpmnEditorStoreApi]
  );

  const entryColumnStyle = {
    padding: "4px",
    margin: "8px",
    width: "calc(100% - 2 * 4px - 2 * 8px)",
  };

  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(undefined);

  return (
    <>
      {((p?.property?.length ?? 0) > 0 && (
        <>
          <div style={{ padding: "0 8px" }}>
            <Grid md={6} style={{ alignItems: "center" }}>
              <GridItem span={4}>
                <div style={entryColumnStyle}>
                  <b>Name</b>
                </div>
              </GridItem>
              <GridItem span={4}>
                <div style={entryColumnStyle}>
                  <b>Data type</b>
                </div>
              </GridItem>
              <GridItem span={3}>
                <div style={entryColumnStyle}>
                  <b>Tags</b>
                </div>
              </GridItem>
              <GridItem span={1}>
                <div style={{ textAlign: "right" }}>{!isReadOnly && addButton}</div>
              </GridItem>
            </Grid>
          </div>
          {p?.property?.map((entry, i) => (
            <div key={i} style={{ padding: "0 8px" }}>
              <Grid
                md={6}
                className={"kie-bpmn-editor--properties-panel--variables-entry"}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(undefined)}
              >
                <GridItem span={4}>
                  <input
                    autoFocus={true}
                    style={entryColumnStyle}
                    type="text"
                    placeholder="Name..."
                    value={entry["@_name"]}
                    onChange={(e) =>
                      bpmnEditorStoreApi.setState((s) => {
                        const { process } = addOrGetProcessAndDiagramElements({
                          definitions: s.bpmn.model.definitions,
                        });

                        if (process.property?.[i]) {
                          process.property[i]["@_name"] = e.target.value;
                        }
                      })
                    }
                  />
                </GridItem>
                <GridItem span={4}>
                  <input
                    style={entryColumnStyle}
                    type="text"
                    placeholder="Data type..."
                    value={entry["@_itemSubjectRef"]}
                    onChange={(e) =>
                      bpmnEditorStoreApi.setState((s) => {
                        const { process } = addOrGetProcessAndDiagramElements({
                          definitions: s.bpmn.model.definitions,
                        });

                        if (process.property?.[i]) {
                          process.property[i]["@_itemSubjectRef"] = e.target.value;
                        }
                      })
                    }
                  />
                </GridItem>
                <GridItem span={3}>
                  <input
                    style={entryColumnStyle}
                    type="text"
                    placeholder="Tags..."
                    value={parseBpmn20Drools10MetaData(p.property?.[i]).get("customTags")}
                    onChange={(e) =>
                      bpmnEditorStoreApi.setState((s) => {
                        const { process } = addOrGetProcessAndDiagramElements({
                          definitions: s.bpmn.model.definitions,
                        });

                        if (process.property?.[i]) {
                          process.property[i].extensionElements ??= {};
                          process.property[i].extensionElements["drools:metaData"] ??= [];
                          setBpmn20Drools10MetaData(process.property[i], "customTags", e.target.value);
                        }
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
                          process.property?.splice(i, 1);
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
        </>
      )) || (
        <div style={{ position: "relative" }}>
          <PropertiesPanelListEmptyState />
          {!isReadOnly && (
            <>
              <div style={{ position: "absolute", top: "calc(50% - 16px)", right: "0" }}>{addButton}</div>
            </>
          )}
        </div>
      )}
    </>
  );
}
