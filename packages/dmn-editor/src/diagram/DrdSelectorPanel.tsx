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
import { useDmnEditorStore, useDmnEditorStoreApi } from "../store/StoreContext";
import { addOrGetDrd, getDefaultDrdName } from "../mutations/addOrGetDrd";
import { Text, TextContent } from "@patternfly/react-core/dist/js/components/Text";
import { Flex, FlexItem } from "@patternfly/react-core/dist/js/layouts/Flex";
import { Button, ButtonVariant } from "@patternfly/react-core/dist/js/components/Button";
import { PlusCircleIcon } from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import { Divider } from "@patternfly/react-core/dist/js/components/Divider";
import { ArrowRightIcon } from "@patternfly/react-icons/dist/js/icons/arrow-right-icon";
import { DiagramNodesPanel } from "../store/Store";

export function DrdSelectorPanel() {
  const thisDmn = useDmnEditorStore((s) => s.dmn);
  const diagram = useDmnEditorStore((s) => s.diagram);

  const dmnEditorStoreApi = useDmnEditorStoreApi();

  return (
    <>
      <Button variant={ButtonVariant.tertiary} style={{ width: "100%" }}>
        <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} alignItems={{ default: "alignItemsCenter" }}>
          <FlexItem style={{ width: "20px" }} />
          <FlexItem>
            View DRG
            <br />
            <small style={{ fontSize: "0.8em" }}>With automatic layout</small>
          </FlexItem>
          <FlexItem style={{ width: "20px" }}>
            <ArrowRightIcon />
          </FlexItem>
        </Flex>
      </Button>
      <br />
      <br />
      <hr />
      <br />
      <Flex justifyContent={{ default: "justifyContentSpaceBetween" }}>
        <TextContent>
          <Text component="h3">DRDs</Text>
        </TextContent>
        <Button
          variant={ButtonVariant.link}
          onClick={() => {
            dmnEditorStoreApi.setState((state) => {
              const allDrds = state.dmn.model.definitions["dmndi:DMNDI"]?.["dmndi:DMNDiagram"] ?? [];
              const newIndex = allDrds.length;

              addOrGetDrd({
                definitions: state.dmn.model.definitions,
                drdIndex: newIndex,
              });

              state.diagram.drdIndex = newIndex;
              state.diagram.drdSelector.isOpen = false;
              state.diagram.openNodesPanel = DiagramNodesPanel.DRG_NODES;
            });
          }}
        >
          <PlusCircleIcon />
        </Button>
      </Flex>
      <Divider style={{ marginBottom: "8px" }} />
      <div className={"kie-dmn-editor--drd-list"}>
        {thisDmn.model.definitions["dmndi:DMNDI"]?.["dmndi:DMNDiagram"]?.map((drd, i) => (
          <React.Fragment key={drd["@_id"] ?? i}>
            <button
              className={i === diagram.drdIndex ? "active" : undefined}
              onClick={() => {
                dmnEditorStoreApi.setState((state) => {
                  state.diagram.drdIndex = i;
                  state.diagram.drdSelector.isOpen = false;
                });
              }}
            >
              {drd["@_name"] || getDefaultDrdName({ drdIndex: i })}
            </button>
            <br />
          </React.Fragment>
        ))}
      </div>
    </>
  );
}
