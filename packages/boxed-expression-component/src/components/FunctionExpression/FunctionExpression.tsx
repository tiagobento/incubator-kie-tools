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

import "./FunctionExpression.css";
import * as React from "react";
import { PropsWithChildren, useCallback, useMemo } from "react";
import {
  BeeTableColumnsUpdateArgs,
  ContextExpressionDefinitionEntry,
  DmnBuiltInDataType,
  DEFAULT_ENTRY_EXPRESSION_MIN_WIDTH,
  FunctionExpressionDefinitionKind,
  FunctionExpressionDefinition,
  ExpressionDefinitionLogicType,
  BeeTableHeaderVisibility,
  BeeTableOperation,
  ExpressionDefinition,
  ContextExpressionDefinition,
  LiteralExpressionDefinition,
  BeeTableProps,
} from "../../api";
import { BeeTable } from "../BeeTable";
import * as ReactTable from "react-table";
import { ContextEntryExpressionCell, NestedExpressionDispatchContextProvider } from "../ContextExpression";
import { useBoxedExpressionEditorI18n } from "../../i18n";
import { PopoverMenu } from "../PopoverMenu";
import * as _ from "lodash";
import {
  useBoxedExpressionEditor,
  useBoxedExpressionEditorDispatch,
} from "../BoxedExpressionEditor/BoxedExpressionEditorContext";
import { FunctionKindSelector } from "./FunctionKindSelector";
import { EditParameters } from "./EditParameters";

export const DEFAULT_FIRST_PARAM_NAME = "p-1";

const FIRST_ENTRY_ID = "0";
const SECOND_ENTRY_ID = "1";

type ROWTYPE = ContextExpressionDefinitionEntry;

export const FunctionExpression: React.FunctionComponent<FunctionExpressionDefinition> = (
  functionExpression: PropsWithChildren<FunctionExpressionDefinition>
) => {
  const { i18n } = useBoxedExpressionEditorI18n();
  const { setExpression } = useBoxedExpressionEditorDispatch();

  const { editorRef, pmmlParams, decisionNodeId } = useBoxedExpressionEditor();

  const editParametersPopoverAppendTo = useCallback(() => {
    return () => editorRef.current!;
  }, [editorRef]);

  const setParameters = useCallback(
    (newParameters) => {
      setExpression((prev) => ({ ...prev, formalParameters: newParameters }));
    },
    [setExpression]
  );

  const parametersColumnHeader = useMemo(
    () => (
      <PopoverMenu
        title={i18n.editParameters}
        appendTo={editParametersPopoverAppendTo()}
        className="parameters-editor-popover"
        minWidth="400px"
        body={<EditParameters parameters={functionExpression.formalParameters} setParameters={setParameters} />}
      >
        <div className={`parameters-list ${_.isEmpty(functionExpression.formalParameters) ? "empty-parameters" : ""}`}>
          <p className="pf-u-text-truncate">
            {_.isEmpty(functionExpression.formalParameters)
              ? i18n.editParameters
              : `(${functionExpression.formalParameters.map((parameter) => parameter.name).join(", ")})`}
          </p>
        </div>
      </PopoverMenu>
    ),
    [editParametersPopoverAppendTo, i18n, functionExpression.formalParameters, setParameters]
  );

  const beeTableColumns = useMemo<ReactTable.Column<ROWTYPE>[]>(() => {
    return [
      {
        label: functionExpression.name ?? DEFAULT_FIRST_PARAM_NAME,
        accessor: decisionNodeId as any, // FIXME: Tiago -> No bueno.
        dataType: functionExpression.dataType ?? DmnBuiltInDataType.Undefined,
        disableOperationHandlerOnHeader: true,
        isRowIndexColumn: false,
        width: functionExpression.parametersWidth ?? DEFAULT_ENTRY_EXPRESSION_MIN_WIDTH,
        columns: [
          {
            headerCellElement: parametersColumnHeader,
            accessor: "parameters" as any, // FIXME: Tiago -> No bueno.
            disableOperationHandlerOnHeader: true,
            width: functionExpression.parametersWidth ?? DEFAULT_ENTRY_EXPRESSION_MIN_WIDTH,
            minWidth: DEFAULT_ENTRY_EXPRESSION_MIN_WIDTH,
            label: "",
            isRowIndexColumn: false,
            dataType: undefined as any, // FIXME: Tiago -> No bueno.
          },
        ],
      },
    ];
  }, [decisionNodeId, functionExpression, parametersColumnHeader]);

  const headerVisibility = useMemo(() => {
    return functionExpression.isHeadless ? BeeTableHeaderVisibility.LastLevel : BeeTableHeaderVisibility.Full;
  }, [functionExpression.isHeadless]);

  const onFunctionKindSelect = useCallback(
    (kind: string) => {
      setExpression((prev) => {
        if (kind === FunctionExpressionDefinitionKind.Feel) {
          return {
            logicType: ExpressionDefinitionLogicType.Function,
            functionKind: FunctionExpressionDefinitionKind.Feel,
            formalParameters: [],
            expression: {
              logicType: ExpressionDefinitionLogicType.LiteralExpression,
              isHeadless: true,
            },
          };
        } else if (kind === FunctionExpressionDefinitionKind.Java) {
          return {
            logicType: ExpressionDefinitionLogicType.Function,
            functionKind: FunctionExpressionDefinitionKind.Java,
            formalParameters: [],
          };
        } else if (kind === FunctionExpressionDefinitionKind.Pmml) {
          return {
            logicType: ExpressionDefinitionLogicType.Function,
            functionKind: FunctionExpressionDefinitionKind.Pmml,
            formalParameters: [],
          };
        } else {
          throw new Error("Shouldn't ever reach this point.");
        }
      });
    },
    [setExpression]
  );

  const onColumnsUpdate = useCallback(
    ({ columns: [column] }: BeeTableColumnsUpdateArgs<ROWTYPE>) => {
      // FIXME: Tiago -> This is not good. We shouldn't need to rely on the table to update those values.
      setExpression((prev) => ({
        ...prev,
        name: column.label,
        dataType: column.dataType,
        parametersWidth: column.width,
      }));
    },
    [setExpression]
  );

  const resetRowCustomFunction = useCallback(
    (row: ROWTYPE) => {
      // FIXME: Tiago -> STATE GAP
      setExpression((prev) => ({ ...prev }));
      return row;
    },
    [setExpression]
  );

  const operationHandlerConfig = useMemo(() => {
    return [
      {
        group: _.upperCase(i18n.function),
        items: [
          {
            name: i18n.rowOperations.clear,
            type: BeeTableOperation.RowClear,
          },
        ],
      },
    ];
  }, [i18n]);

  const javaContextExpression: ExpressionDefinition = useMemo(() => {
    if (
      !(
        functionExpression.logicType === ExpressionDefinitionLogicType.Function &&
        functionExpression.functionKind === FunctionExpressionDefinitionKind.Java
      )
    ) {
      return { logicType: ExpressionDefinitionLogicType.Undefined };
    }

    return {
      logicType: ExpressionDefinitionLogicType.Context,
      noClearAction: true,
      renderResult: false,
      noHandlerMenu: true,
      contextEntries: [
        {
          entryInfo: {
            id: FIRST_ENTRY_ID,
            name: i18n.class,
            dataType: DmnBuiltInDataType.String,
          },
          entryExpression: {
            id: functionExpression.classFieldId,
            noClearAction: true,
            logicType: ExpressionDefinitionLogicType.LiteralExpression,
            content: functionExpression.className ?? "",
            isHeadless: true,
          },
        },
        {
          entryInfo: {
            id: SECOND_ENTRY_ID,
            name: i18n.methodSignature,
            dataType: DmnBuiltInDataType.String,
          },
          entryExpression: {
            id: functionExpression.methodFieldId,
            noClearAction: true,
            logicType: ExpressionDefinitionLogicType.LiteralExpression,
            content: functionExpression.methodName ?? "",
            isHeadless: true,
          },
        },
      ],
      isHeadless: true,
    };
  }, [functionExpression, i18n]);

  const pmmlContextExpression: ExpressionDefinition = useMemo(() => {
    if (
      !(
        functionExpression.logicType === ExpressionDefinitionLogicType.Function &&
        functionExpression.functionKind === FunctionExpressionDefinitionKind.Pmml
      )
    ) {
      return { logicType: ExpressionDefinitionLogicType.Undefined };
    }

    return {
      logicType: ExpressionDefinitionLogicType.Context,
      noClearAction: true,
      renderResult: false,
      noHandlerMenu: true,
      contextEntries: [
        {
          entryInfo: { id: FIRST_ENTRY_ID, name: i18n.document, dataType: DmnBuiltInDataType.String },
          entryExpression: {
            id: functionExpression.documentFieldId,
            noClearAction: true,
            logicType: ExpressionDefinitionLogicType.PmmlLiteralExpression,
            testId: "pmml-selector-document",
            noOptionsLabel: i18n.pmml.firstSelection,
            getOptions: () => _.map(pmmlParams, "document"),
            selected: functionExpression.document ?? "",
            isHeadless: true,
          },
        },
        {
          entryInfo: { id: SECOND_ENTRY_ID, name: i18n.model, dataType: DmnBuiltInDataType.String },
          entryExpression: {
            id: functionExpression.modelFieldId,
            noClearAction: true,
            logicType: ExpressionDefinitionLogicType.PmmlLiteralExpression,
            noOptionsLabel: i18n.pmml.secondSelection,
            testId: "pmml-selector-model",
            getOptions: () =>
              _.map(
                _.find(pmmlParams, (param) => param.document === functionExpression.document)?.modelsFromDocument,
                "model"
              ),
            selected: functionExpression.model ?? "",
            isHeadless: true,
          },
        },
      ],
      isHeadless: true,
    };
  }, [functionExpression, i18n, pmmlParams]);

  const beeTableRows = useMemo(() => {
    function rows(): ContextExpressionDefinitionEntry {
      switch (functionExpression.functionKind) {
        case FunctionExpressionDefinitionKind.Java: {
          return {
            entryInfo: {
              id: FIRST_ENTRY_ID,
              name: FIRST_ENTRY_ID,
              dataType: undefined as any, // FIXME: Tiago -> Not good.
            },
            entryExpression: javaContextExpression,
          };
        }
        case FunctionExpressionDefinitionKind.Pmml: {
          return {
            entryInfo: {
              id: FIRST_ENTRY_ID,
              name: FIRST_ENTRY_ID,
              dataType: undefined as any, // FIXME: Tiago -> Not good.
            },
            entryExpression: pmmlContextExpression,
          };
        }
        case FunctionExpressionDefinitionKind.Feel:
        default: {
          return {
            entryInfo: {
              id: FIRST_ENTRY_ID,
              name: FIRST_ENTRY_ID,
              dataType: undefined as any, // FIXME: Tiago -> Not good.
            },
            entryExpression: functionExpression.expression,
          };
        }
      }
    }
    return [rows()];
  }, [functionExpression, javaContextExpression, pmmlContextExpression]);

  const controllerCell = useMemo(
    () => (
      <FunctionKindSelector
        selectedFunctionKind={functionExpression.functionKind ?? FunctionExpressionDefinitionKind.Feel}
        onFunctionKindSelect={onFunctionKindSelect}
      />
    ),
    [functionExpression.functionKind, onFunctionKindSelect]
  );

  const defaultCellByColumnId: BeeTableProps<ROWTYPE>["defaultCellByColumnId"] = useMemo(
    () => ({
      parameters: (props) => (
        <NestedExpressionDispatchContextProvider
          onSetExpression={({ getNewExpression }) => {
            setExpression((prev) => {
              if (prev.logicType !== ExpressionDefinitionLogicType.Function) {
                return prev;
              }

              // FEEL
              if (prev.functionKind === FunctionExpressionDefinitionKind.Feel) {
                return { ...prev, expression: getNewExpression(prev.expression) };
              }

              // Java
              else if (prev.functionKind === FunctionExpressionDefinitionKind.Java) {
                const newExpression = getNewExpression(javaContextExpression) as ContextExpressionDefinition;
                return {
                  ...prev,
                  className: (newExpression.contextEntries![0].entryExpression as LiteralExpressionDefinition).content,
                  classFieldId: (newExpression.contextEntries![0].entryExpression as LiteralExpressionDefinition)
                    .content,
                  methodName: (newExpression.contextEntries![1].entryExpression as LiteralExpressionDefinition).content,
                  methodFieldId: (newExpression.contextEntries![1].entryExpression as LiteralExpressionDefinition)
                    .content,
                };
              }

              // PMML
              else if (prev.functionKind === FunctionExpressionDefinitionKind.Pmml) {
                const newExpression = getNewExpression(pmmlContextExpression) as ContextExpressionDefinition;
                // FIXME: Tiago -> STATE GAP
                return { ...prev };
              }

              // default
              else {
                throw new Error("Shouldn't ever reach this point.");
              }
            });
          }}
        >
          <ContextEntryExpressionCell {...props} />
        </NestedExpressionDispatchContextProvider>
      ),
    }),
    [javaContextExpression, pmmlContextExpression, setExpression]
  );

  return (
    <div className={`function-expression ${functionExpression.id}`}>
      <BeeTable<ROWTYPE>
        operationHandlerConfig={operationHandlerConfig}
        onColumnsUpdate={onColumnsUpdate}
        columns={beeTableColumns}
        rows={beeTableRows}
        headerLevelCount={1}
        headerVisibility={headerVisibility}
        controllerCell={controllerCell}
        defaultCellByColumnId={defaultCellByColumnId}
        resetRowCustomFunction={resetRowCustomFunction} // "Clear" option on context menu
      />
    </div>
  );
};