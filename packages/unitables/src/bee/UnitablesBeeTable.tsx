/*
 * Copyright 2021 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  BeeTableCellProps,
  BeeTableHeaderVisibility,
  BeeTableOperation,
  BeeTableOperationConfig,
  BeeTableProps,
  generateUuid,
} from "@kie-tools/boxed-expression-component/dist/api";
import { BoxedExpressionEditorI18n } from "@kie-tools/boxed-expression-component/dist/i18n";
import { StandaloneBeeTable } from "@kie-tools/boxed-expression-component/dist/table/BeeTable/StandaloneBeeTable";
import {
  useBeeTableCoordinates,
  useBeeTableSelectableCellRef,
} from "@kie-tools/boxed-expression-component/dist/selection/BeeTableSelectionContext";
import * as React from "react";
import { useCallback, useMemo } from "react";
import * as ReactTable from "react-table";
import { UnitablesColumnType } from "../UnitablesTypes";

import "@kie-tools/boxed-expression-component/dist/@types/react-table";
import { ResizerStopBehavior } from "@kie-tools/boxed-expression-component/dist/resizing/ResizingWidthsContext";
import { AutoField } from "@kie-tools/uniforms-patternfly/dist/esm";
import { useField } from "uniforms";
import { AUTO_ROW_ID } from "../uniforms/UnitablesJsonSchemaBridge";
import { usePublishedBeeTableResizableColumns } from "@kie-tools/boxed-expression-component/dist/resizing/BeeTableResizableColumnsContext";

export const UNITABLES_COLUMN_MIN_WIDTH = 150;

export type ROWTYPE = Record<string, any>;

export interface UnitablesBeeTable {
  id: string;
  i18n: BoxedExpressionEditorI18n;
  rows: object[];
  columns: UnitablesColumnType[];
  scrollableParentRef: React.RefObject<HTMLElement>;
  rowWrapper?: React.FunctionComponent<React.PropsWithChildren<{ row: object; rowIndex: number }>>;
  onRowAdded: (args: { beforeIndex: number }) => void;
  onRowDuplicated: (args: { rowIndex: number }) => void;
  onRowReset: (args: { rowIndex: number }) => void;
  onRowDeleted: (args: { rowIndex: number }) => void;
}

export function UnitablesBeeTable({
  id,
  i18n,
  columns,
  rows,
  scrollableParentRef,
  rowWrapper,
  onRowAdded,
  onRowDuplicated,
  onRowReset,
  onRowDeleted,
}: UnitablesBeeTable) {
  const beeTableOperationConfig = useMemo<BeeTableOperationConfig>(
    () => [
      {
        group: i18n.rows,
        items: [
          { name: i18n.rowOperations.insertAbove, type: BeeTableOperation.RowInsertAbove },
          { name: i18n.rowOperations.insertBelow, type: BeeTableOperation.RowInsertBelow },
          { name: i18n.rowOperations.duplicate, type: BeeTableOperation.RowDuplicate },
          { name: i18n.rowOperations.reset, type: BeeTableOperation.RowReset },
          { name: i18n.rowOperations.delete, type: BeeTableOperation.RowDelete },
        ],
      },
    ],
    [i18n]
  );

  const uuid = useMemo(() => {
    return generateUuid();
  }, []);

  const cellComponentByColumnAccessor: BeeTableProps<ROWTYPE>["cellComponentByColumnAccessor"] = React.useMemo(() => {
    return columns.reduce((acc, column) => {
      if (column.insideProperties) {
        for (const insideProperty of column.insideProperties) {
          acc[getColumnAccessor(insideProperty)] = (props) => (
            <UnitablesBeeTableCell {...props} joinedName={insideProperty.joinedName} />
          );
        }
      } else {
        acc[getColumnAccessor(column)] = (props) => <UnitablesBeeTableCell {...props} joinedName={column.joinedName} />;
      }
      return acc;
    }, {} as NonNullable<BeeTableProps<ROWTYPE>["cellComponentByColumnAccessor"]>);
  }, [columns]);

  const setColumnWidth = useCallback(
    (inputIndex: number) => (newWidthAction: React.SetStateAction<number | undefined>) => {
      const newWidth = typeof newWidthAction === "function" ? newWidthAction(0) : newWidthAction;
      console.log(newWidth);
      return newWidth;
    },
    []
  );

  const beeTableColumns = useMemo<ReactTable.Column<ROWTYPE>[]>(() => {
    let columnIndex = 0;
    return columns.map((column) => {
      if (column.insideProperties) {
        return {
          originalId: uuid + `field-${column.name}`,
          label: column.name,
          accessor: getColumnAccessor(column),
          dataType: column.dataType,
          isRowIndexColumn: false,
          width: undefined,
          minWidth: UNITABLES_COLUMN_MIN_WIDTH,
          columns: column.insideProperties.map((insideProperty) => {
            return {
              originalId: uuid + `field-${insideProperty.joinedName}`,
              label: insideProperty.name,
              accessor: getColumnAccessor(insideProperty),
              dataType: insideProperty.dataType,
              isRowIndexColumn: false,
              width: insideProperty.width,
              setWidth: setColumnWidth(columnIndex++),
              minWidth: UNITABLES_COLUMN_MIN_WIDTH,
            };
          }),
        };
      } else {
        return {
          originalId: uuid + `field-${column.name}`,
          label: column.name,
          accessor: getColumnAccessor(column),
          dataType: column.dataType,
          isRowIndexColumn: false,
          width: column.width as number,
          setWidth: setColumnWidth(columnIndex++),
          minWidth: UNITABLES_COLUMN_MIN_WIDTH,
        };
      }
    });
  }, [setColumnWidth, columns, uuid]);

  const getColumnKey = useCallback((column: ReactTable.ColumnInstance<ROWTYPE>) => {
    return column.originalId ?? column.id;
  }, []);

  const getRowKey = useCallback((row: ReactTable.Row<ROWTYPE>) => {
    return row.original.id;
  }, []);

  return (
    <StandaloneBeeTable
      cellComponentByColumnAccessor={cellComponentByColumnAccessor}
      scrollableParentRef={scrollableParentRef}
      getColumnKey={getColumnKey}
      getRowKey={getRowKey}
      tableId={id}
      isEditableHeader={false}
      headerLevelCountForAppendingRowIndexColumn={1}
      headerVisibility={BeeTableHeaderVisibility.AllLevels}
      operationConfig={beeTableOperationConfig}
      columns={beeTableColumns}
      rows={rows}
      enableKeyboardNavigation={true}
      shouldRenderRowIndexColumn={true}
      shouldShowRowsInlineControls={true}
      shouldShowColumnsInlineControls={false}
      onRowAdded={onRowAdded}
      onRowDuplicated={onRowDuplicated}
      onRowReset={onRowReset}
      onRowDeleted={onRowDeleted}
      rowWrapper={rowWrapper}
      resizerStopBehavior={ResizerStopBehavior.SET_WIDTH_ALWAYS}
    />
  );
}

function getColumnAccessor(c: UnitablesColumnType) {
  return `field-${c.joinedName}`;
}

function UnitablesBeeTableCell({ joinedName }: BeeTableCellProps<ROWTYPE> & { joinedName: string }) {
  const { containerCellCoordinates } = useBeeTableCoordinates();

  const [{ value, onChange: setValue }] = useField(joinedName, {});

  useBeeTableSelectableCellRef(
    containerCellCoordinates?.rowIndex ?? 0,
    containerCellCoordinates?.columnIndex ?? 0,
    setValue,
    useCallback(() => JSON.stringify(value), [value])
  );

  const { onColumnResizingWidthChange, columnResizingWidths } = usePublishedBeeTableResizableColumns(
    "something",
    1,
    true
  );

  const some = useMemo(() => {
    return columnResizingWidths;
  }, [columnResizingWidths]);

  return (
    <>
      <AutoField
        key={joinedName}
        name={joinedName}
        form={`${AUTO_ROW_ID}-${containerCellCoordinates?.rowIndex ?? 0}`}
      />
    </>
  );
}
