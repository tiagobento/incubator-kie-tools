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
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../../store/StoreContext";
import { FormGroup } from "@patternfly/react-core/dist/js/components/Form";
import { Select, SelectOption, SelectVariant } from "@patternfly/react-core/dist/js/components/Select";
import { useCallback, useMemo, useState } from "react";
import { addOrGetItemDefinitions, DEFAULT_DATA_TYPES } from "../../mutations/addOrGetItemDefinitions";
import "./ItemDefinitionRefSelector.css";

const DEFAULT_OPTIONS = [
  { itemDefinitionRef: undefined, dataType: "<Undefined>" },
  { itemDefinitionRef: "String", dataType: DEFAULT_DATA_TYPES.STRING },
  { itemDefinitionRef: "Boolean", dataType: DEFAULT_DATA_TYPES.BOOLEAN },
  { itemDefinitionRef: "Float", dataType: DEFAULT_DATA_TYPES.FLOAT },
  { itemDefinitionRef: "Integer", dataType: DEFAULT_DATA_TYPES.INTEGER },
  { itemDefinitionRef: "Object", dataType: DEFAULT_DATA_TYPES.OBJECT },
];

export function ItemDefinitionRefSelector({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (newItemDefinitionRef: string | undefined, dataType: string | undefined) => void;
}) {
  const isReadOnly = useBpmnEditorStore((s) => s.settings.isReadOnly);

  const selections = useMemo(() => {
    return {
      compareTo: (a: any) => (value ?? "").toLowerCase().trim() == (a?.toString?.() ?? "").toLowerCase().trim(),
      toString: () => value ?? "",
    };
  }, [value]);

  const itemDefinitions = useBpmnEditorStore(
    (s) =>
      s.bpmn.model.definitions.rootElement
        ?.filter((s) => s.__$$element === "itemDefinition")
        .map((s) => ({ itemDefinitionRef: s["@_id"], dataType: s["@_structureRef"] })) ?? []
  );

  const allOptions = useMemo(() => {
    const itemDefinitionsByDataType = new Map(itemDefinitions.map((i) => [i.dataType, i]));
    const defaultDataTypes = DEFAULT_OPTIONS.map((defaultDataType) => {
      if (!itemDefinitionsByDataType.has(defaultDataType.itemDefinitionRef)) {
        return defaultDataType;
      }

      const customDataType = itemDefinitionsByDataType.get(defaultDataType.itemDefinitionRef)!;
      itemDefinitionsByDataType.delete(defaultDataType.itemDefinitionRef);
      return customDataType;
    });

    return [...defaultDataTypes, ...itemDefinitionsByDataType.values()];
  }, [itemDefinitions]);

  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

  const addOrGetItemDefinitionId = useCallback(
    ({ newDataType }: { newDataType: string }) => {
      let ref: string;
      bpmnEditorStoreApi.setState((s) => {
        const { itemDefinition } = addOrGetItemDefinitions({
          definitions: s.bpmn.model.definitions,
          dataType: newDataType,
        });
        ref = itemDefinition["@_id"];
      });

      return ref!;
    },
    [bpmnEditorStoreApi]
  );

  const [isOpen, setOpen] = useState(false);

  return (
    <Select
      isDisabled={isReadOnly}
      variant={SelectVariant.typeahead}
      typeAheadAriaLabel="Select a Data Type"
      onSelect={(e, newItemDefinitionRef) => {
        setOpen(false);

        if (typeof newItemDefinitionRef === "string") {
          // Ignore. Coming from `onCreateOption`.
          return;
        }

        // -- None --
        if ((newItemDefinitionRef.toString() ?? "") === "") {
          onChange(undefined, undefined);
        }
        // -- Default Data Type
        else if (
          DEFAULT_OPTIONS.filter((ddt) => ddt.itemDefinitionRef === newItemDefinitionRef.toString()).length > 0
        ) {
          const ref = addOrGetItemDefinitionId({ newDataType: newItemDefinitionRef.toString() });
          onChange(ref, newItemDefinitionRef.toString());
        }
        // -- Custom Data Type
        else {
          onChange(
            newItemDefinitionRef.toString(),
            itemDefinitions.filter((s) => s.itemDefinitionRef === newItemDefinitionRef.toString())?.[0].dataType
          );
        }
      }}
      onToggle={setOpen}
      isOpen={isOpen}
      selections={selections}
      placeholderText="Select a Data Type"
      isCreateOptionOnTop={true}
      isGrouped={false}
      menuAppendTo={document.body}
      isCreatable={true}
      shouldResetOnSelect={true}
      isCreateSelectOptionObject={false}
      onCreateOption={(newDataType) => {
        const ref = addOrGetItemDefinitionId({ newDataType });
        onChange(ref!, newDataType);
      }}
    >
      {allOptions.map(({ dataType, itemDefinitionRef }) => (
        <SelectOption
          isSelected={value === itemDefinitionRef}
          key={itemDefinitionRef}
          value={{
            compareTo: (a) =>
              (itemDefinitionRef ?? "").toLowerCase().trim() == (a?.toString?.() ?? "").toLowerCase().trim(),
            toString: () => itemDefinitionRef ?? "",
          }}
        >
          {dataType}
        </SelectOption>
      ))}
    </Select>
  );
}
