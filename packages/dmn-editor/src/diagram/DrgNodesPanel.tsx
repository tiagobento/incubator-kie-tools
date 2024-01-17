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

import { DMN15__tDefinitions } from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { Button, ButtonVariant } from "@patternfly/react-core/dist/js/components/Button/Button";
import { SearchInput } from "@patternfly/react-core/dist/js/components/SearchInput";
import { Text, TextContent } from "@patternfly/react-core/dist/js/components/Text";
import { Flex } from "@patternfly/react-core/dist/js/layouts/Flex";
import { TimesIcon } from "@patternfly/react-icons/dist/js/icons/times-icon";
import * as React from "react";
import { useCallback, useState } from "react";
import { DmnObjectListItem } from "../externalNodes/DmnObjectListItem";
import { DiagramNodesPanel } from "../store/Store";
import { useDmnEditorStore, useDmnEditorStoreApi } from "../store/StoreContext";
import { Unpacked } from "../tsExt/tsExt";
import { buildXmlHref } from "../xml/xmlHrefs";

export const MIME_TYPE_FOR_DMN_EDITOR_DRG_NODE = "kie-dmn-editor--drg-node";

export function DrgNodesPanel() {
  const thisDmn = useDmnEditorStore((s) => s.dmn);
  const dmnShapesByHref = useDmnEditorStore((s) => s.computed(s).indexes().dmnShapesByHref);

  const dmnEditorStoreApi = useDmnEditorStoreApi();

  const [filter, setFilter] = useState("");

  const namespace = ""; // That's the default namespace.

  const onDragStart = useCallback((event: React.DragEvent, drgElement: Unpacked<DMN15__tDefinitions["drgElement"]>) => {
    event.dataTransfer.setData(MIME_TYPE_FOR_DMN_EDITOR_DRG_NODE, JSON.stringify(drgElement));
    event.dataTransfer.effectAllowed = "move";
  }, []);

  const nodes = thisDmn.model.definitions.drgElement
    ?.filter((drgElement) => drgElement["@_name"].toLowerCase().includes(filter.toLowerCase()))
    .map((drgElement) => {
      const dmnObjectHref = buildXmlHref({ namespace, id: drgElement["@_id"]! });
      const isAlreadyIncluded = dmnShapesByHref.has(dmnObjectHref);

      return (
        <div
          key={drgElement["@_id"]}
          className={"kie-dmn-editor--external-nodes-list-item"}
          draggable={!isAlreadyIncluded}
          style={{ opacity: isAlreadyIncluded ? "0.4" : undefined }}
          onDragStart={(event) => onDragStart(event, drgElement)}
        >
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentFlexStart" }}
            spaceItems={{ default: "spaceItemsNone" }}
          >
            <DmnObjectListItem
              dmnObjectHref={dmnObjectHref}
              dmnObject={drgElement}
              namespace={namespace}
              relativeToNamespace={namespace}
            />
          </Flex>
        </div>
      );
    });

  return (
    <>
      <div className="kie-dmn-editor--sticky-top-glass-header" style={{ padding: "12px" }}>
        <Flex justifyContent={{ default: "justifyContentSpaceBetween" }}>
          <TextContent>
            <Text component="h3">DRG Nodes</Text>
          </TextContent>
          <Button
            variant={ButtonVariant.plain}
            onClick={() =>
              dmnEditorStoreApi.setState((state) => {
                state.diagram.openNodesPanel = DiagramNodesPanel.NONE;
              })
            }
          >
            <TimesIcon />
          </Button>
        </Flex>

        <SearchInput
          style={{ marginBottom: "12px", height: "36px" }}
          onKeyDown={(e) => e.stopPropagation()}
          autoFocus={true}
          placeholder="Filter..."
          value={filter}
          onChange={(_event, value) => setFilter(value)}
          onClear={() => setFilter("")}
        />
      </div>
      <div style={{ padding: "12px" }}>{nodes}</div>
    </>
  );
}
