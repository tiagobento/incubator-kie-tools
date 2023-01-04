/*
 * Copyright 2021 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from "react";
import { useCallback, useMemo } from "react";
import * as PfReactTable from "@patternfly/react-table";
import { BeeTableHeaderVisibility } from "../../api";
import * as ReactTable from "react-table";
import { BeeTableTdForAdditionalRow } from "./BeeTableTdForAdditionalRow";
import { BeeTableTd } from "./BeeTableTd";

export interface BeeTableBodyProps<R extends object> {
  /** Table instance */
  reactTableInstance: ReactTable.TableInstance<R>;
  /** The way in which the header will be rendered */
  headerVisibility: BeeTableHeaderVisibility;
  /** Optional children element to be appended below the table content */
  additionalRow?: React.ReactElement[];
  /** Custom function for getting row key prop, and avoid using the row index */
  getRowKey: (row: ReactTable.Row<R>) => string;
  /** Custom function for getting column key prop, and avoid using the column index */
  getColumnKey: (column: ReactTable.ColumnInstance<R>) => string;
  /** */
  onRowAdded?: (args: { beforeIndex: number }) => void;
}

export function BeeTableBody<R extends object>({
  reactTableInstance,
  additionalRow,
  headerVisibility,
  getRowKey,
  getColumnKey,
  onRowAdded,
}: BeeTableBodyProps<R>) {
  const renderRow = useCallback(
    (row: ReactTable.Row<R>, rowIndex: number) => {
      reactTableInstance.prepareRow(row);
      const rowKey = getRowKey(row);

      const renderTr = (args: { shouldUseCellDelegate: boolean }) => (
        <PfReactTable.Tr
          className={rowKey}
          {...row.getRowProps()}
          ouiaId={"expression-row-" + rowIndex} // FIXME: Tiago -> Bad name.
          key={rowKey}
          style={{ display: "flex" }}
        >
          {row.cells.map((_, columnIndex) => (
            <BeeTableTd<R>
              key={getColumnKey(reactTableInstance.allColumns[columnIndex])}
              columnIndex={columnIndex}
              row={row}
              rowIndex={rowIndex}
              shouldUseCellDelegate={args.shouldUseCellDelegate}
              column={reactTableInstance.allColumns[columnIndex]}
              onRowAdded={onRowAdded}
              isActive={false}
            />
          ))}
        </PfReactTable.Tr>
      );

      const RowDelegate = (row.original as any).rowDelegate; // FIXME: Tiago -> Bad typing.
      return (
        <React.Fragment key={rowKey}>
          {RowDelegate ? (
            <RowDelegate>{renderTr({ shouldUseCellDelegate: true })}</RowDelegate>
          ) : (
            renderTr({ shouldUseCellDelegate: false })
          )}
        </React.Fragment>
      );
    },
    [reactTableInstance, getRowKey, getColumnKey, onRowAdded]
  );

  const additionalRowIndex = useMemo(() => {
    return reactTableInstance.rows.length;
  }, [reactTableInstance.rows.length]);

  return (
    <PfReactTable.Tbody
      className={`${headerVisibility === BeeTableHeaderVisibility.None ? "missing-header" : ""}`}
      {...reactTableInstance.getTableBodyProps()}
    >
      {reactTableInstance.rows.map((row, rowIndex) => {
        return renderRow(row, rowIndex);
      })}

      {additionalRow && (
        <PfReactTable.Tr className={"additional-row"}>
          <BeeTableTdForAdditionalRow
            row={undefined as any}
            rowIndex={additionalRowIndex}
            columnIndex={0}
            column={reactTableInstance.allColumns[0]}
            isLastColumn={false}
            isEmptyCell={true}
          />
          {additionalRow.map((elem, elemIndex) => {
            const columnIndex = elemIndex + 1;
            return (
              <BeeTableTdForAdditionalRow
                key={columnIndex}
                row={undefined as any}
                rowIndex={additionalRowIndex}
                column={reactTableInstance.allColumns[columnIndex]}
                columnIndex={columnIndex}
                isLastColumn={elemIndex === additionalRow.length - 1}
                isEmptyCell={false}
              >
                {elem}
              </BeeTableTdForAdditionalRow>
            );
          })}
        </PfReactTable.Tr>
      )}
    </PfReactTable.Tbody>
  );
}
