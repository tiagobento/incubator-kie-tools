import { Divider } from "@patternfly/react-core/dist/js/components/Divider";
import { SearchInput } from "@patternfly/react-core/dist/js/components/SearchInput";
import { Text, TextContent } from "@patternfly/react-core/dist/js/components/Text";
import { Flex } from "@patternfly/react-core/dist/js/layouts/Flex";
import * as React from "react";
import { useCallback, useState } from "react";
import { useDmnEditorStore } from "../store/Store";
import { buildXmlHref } from "../xml/xmlHrefs";
import { DmnObjectListItem } from "../externalNodes/DmnObjectListItem";
import { useDmnEditorDerivedStore } from "../store/DerivedStore";
import { DMN15__tDefinitions } from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { Unpacked } from "../tsExt/tsExt";

export const MIME_TYPE_FOR_DMN_EDITOR_DRG_NODE = "kie-dmn-editor--drg-node";

export function DrgNodesPanel() {
  const thisDmn = useDmnEditorStore((s) => s.dmn);
  const { dmnShapesByHref } = useDmnEditorDerivedStore();

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
      <Flex justifyContent={{ default: "justifyContentSpaceBetween" }}>
        <TextContent>
          <Text component="h3">DRG Nodes</Text>
        </TextContent>
      </Flex>

      <Divider style={{ marginBottom: "12px" }} />

      <SearchInput
        style={{ marginBottom: "12px", height: "36px" }}
        onKeyDown={(e) => e.stopPropagation()}
        autoFocus={true}
        placeholder="Filter..."
        value={filter}
        onChange={(_event, value) => setFilter(value)}
        onClear={() => setFilter("")}
      />

      <Divider style={{ marginBottom: "24px" }} />

      {nodes}
    </>
  );
}
