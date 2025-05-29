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
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";
import { useCallback, useMemo } from "react";
import { addOrGetItemDefinitions, DEFAULT_DATA_TYPES } from "../../mutations/addOrGetItemDefinitions";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../../store/StoreContext";
import { TypeaheadSelect } from "../../typeaheadSelect/TypeaheadSelect";
import "./ItemDefinitionRefSelector.css";

const DEFAULT_OPTIONS = [
  { itemDefinitionRef: "String", dataType: DEFAULT_DATA_TYPES.STRING },
  { itemDefinitionRef: "Boolean", dataType: DEFAULT_DATA_TYPES.BOOLEAN },
  { itemDefinitionRef: "Float", dataType: DEFAULT_DATA_TYPES.FLOAT },
  { itemDefinitionRef: "Integer", dataType: DEFAULT_DATA_TYPES.INTEGER },
  { itemDefinitionRef: "Object", dataType: DEFAULT_DATA_TYPES.OBJECT },
];

export type OnChangeItemDefinitionRefSelector = (
  newItemDefinitionRef: string | undefined,
  dataType: string | undefined
) => void;

export function ItemDefinitionRefSelector({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: OnChangeItemDefinitionRefSelector;
}) {
  const isReadOnly = useBpmnEditorStore((s) => s.settings.isReadOnly);

  const itemDefinitions = useBpmnEditorStore(
    (s) =>
      s.bpmn.model.definitions.rootElement
        ?.filter((s) => s.__$$element === "itemDefinition")
        .map((s) => ({ itemDefinitionRef: s["@_id"], dataType: s["@_structureRef"] })) ?? []
  );

  const itemDefinitionsByDataType = useMemo(
    () => new Map(itemDefinitions.map((i) => [i.dataType, i])),
    [itemDefinitions]
  );

  const allOptions = useMemo(() => {
    const defaultDataTypes = DEFAULT_OPTIONS.map((defaultDataType) => {
      if (!itemDefinitionsByDataType.has(defaultDataType.itemDefinitionRef)) {
        return defaultDataType;
      }

      const customDataType = itemDefinitionsByDataType.get(defaultDataType.itemDefinitionRef)!;
      itemDefinitionsByDataType.delete(defaultDataType.itemDefinitionRef);
      return customDataType;
    });

    return [...defaultDataTypes, ...itemDefinitionsByDataType.values()];
  }, [itemDefinitionsByDataType]);

  const allOptionsById = useMemo(() => new Map(allOptions.map((i) => [i.itemDefinitionRef, i])), [allOptions]);

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

  const _onChange = useCallback(
    (newItemDefinitionRef: string | undefined) => {
      if (
        newItemDefinitionRef &&
        DEFAULT_OPTIONS.filter((ddt) => ddt.itemDefinitionRef === newItemDefinitionRef).length > 0
      ) {
        const r = addOrGetItemDefinitionId({ newDataType: newItemDefinitionRef });
        onChange(r, newItemDefinitionRef);
      } else {
        onChange(newItemDefinitionRef, allOptionsById.get(newItemDefinitionRef!)?.dataType);
      }
    },
    [addOrGetItemDefinitionId, allOptionsById, onChange]
  );

  const options = useMemo(() => {
    return allOptions.map((d) => ({ value: d.itemDefinitionRef, children: d.dataType }));
  }, [allOptions]);

  const id = useMemo(() => generateUuid(), []);

  return (
    <TypeaheadSelect
      isDisabled={isReadOnly}
      id={`kie-bpmn-editor--item-definition-ref-selector--${id}`}
      selected={value}
      setSelected={_onChange}
      options={options}
      onCreateNewOption={(newOptionLabel) => addOrGetItemDefinitionId({ newDataType: newOptionLabel })}
      createNewOptionLabel={"Create Data Type"}
    />
  );
}
