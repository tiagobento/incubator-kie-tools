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

import "../ContextExpression/ContextEntryExpressionCell.css";
import * as React from "react";
import { DmnBuiltInDataType, ExpressionDefinition, InvocationExpressionDefinition } from "../../api";
import {
  NestedExpressionDispatchContextProvider,
  useBoxedExpressionEditorDispatch,
} from "../BoxedExpressionEditor/BoxedExpressionEditorContext";
import { useCallback } from "react";
import { ExpressionContainer } from "../ExpressionDefinitionRoot/ExpressionContainer";
import { DMN15__tBinding } from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";

export type Entry = {
  expression: ExpressionDefinition | undefined;
};

export interface ArgumentEntryExpressionCellProps {
  // This name ('data') can't change, as this is used on "cellComponentByColumnAccessor".
  data?: readonly DMN15__tBinding[];
  rowIndex: number;
  columnIndex: number;
  parentElementId: string;
}

export const ArgumentEntryExpressionCell: React.FunctionComponent<ArgumentEntryExpressionCellProps> = ({
  data: argumentEntries,
  rowIndex,
  columnIndex,
  parentElementId,
}) => {
  const { setExpression } = useBoxedExpressionEditorDispatch();

  const onSetExpression = useCallback(
    ({ getNewExpression }) => {
      setExpression((prev: InvocationExpressionDefinition) => {
        const argumentEntries = [...(prev.binding ?? [])];
        argumentEntries[rowIndex] = {
          ...argumentEntries[rowIndex],
          expression: getNewExpression(
            argumentEntries[rowIndex]?.expression ?? { "@_typeRef": DmnBuiltInDataType.Undefined }
          ),
        };

        return { ...prev, binding: argumentEntries };
      });
    },
    [rowIndex, setExpression]
  );

  return (
    <NestedExpressionDispatchContextProvider onSetExpression={onSetExpression}>
      <ExpressionContainer
        expression={argumentEntries?.[rowIndex]?.expression ?? undefined!}
        isResetSupported={true}
        isNested={true}
        rowIndex={rowIndex}
        columnIndex={columnIndex}
        parentElementId={parentElementId}
      />
    </NestedExpressionDispatchContextProvider>
  );
};
