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

import type { Meta, StoryObj } from "@storybook/react";
import { BoxedExpressionEditor, BoxedExpressionEditorProps } from "../../../src/expressions";
import { BoxedExpressionEditorWrapper } from "../../boxedExpressionStoriesWrapper";
import { Base as EmptyExpression } from "../../misc/Empty/EmptyExpression.stories";
import { DmnBuiltInDataType, FunctionExpressionDefinitionKind, generateUuid } from "../../../src/api";

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<BoxedExpressionEditorProps> = {
  title: "Boxed Expressions/Function",
  component: BoxedExpressionEditor,
  includeStories: /^[A-Z]/,
};
export default meta;
type Story = StoryObj<BoxedExpressionEditorProps>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const Base: Story = {
  render: (args) => BoxedExpressionEditorWrapper(),
  parameters: { exclude: ["dataTypes", "beeGwtService", "pmmlDocuments"] },
  args: {
    ...EmptyExpression.args,
    expression: {
      __$$element: "functionDefinition",
      "@_id": generateUuid(),
      "@_label": "Expression Name",
      "@_kind": FunctionExpressionDefinitionKind.Feel,
    },
    isResetSupportedOnRootExpression: false,
  },
};

export const InstallmentCalculation: Story = {
  render: (args) => BoxedExpressionEditorWrapper(),
  parameters: { exclude: ["dataTypes", "beeGwtService", "pmmlDocuments"] },
  args: {
    ...EmptyExpression.args,
    expression: {
      __$$element: "functionDefinition",
      "@_id": generateUuid(),
      "@_label": "Installment calculation",
      "@_typeRef": DmnBuiltInDataType.Number,
      "@_kind": FunctionExpressionDefinitionKind.Feel,
      formalParameter: [
        {
          "@_id": generateUuid(),
          "@_name": "Amount",
          "@_typeRef": DmnBuiltInDataType.Number,
        },
        {
          "@_id": generateUuid(),
          "@_name": "Rate",
          "@_typeRef": DmnBuiltInDataType.Number,
        },
        {
          "@_id": generateUuid(),
          "@_name": "Term",
          "@_typeRef": DmnBuiltInDataType.Number,
        },
      ],
      expression: {
        __$$element: "literalExpression",
        "@_id": generateUuid(),
        text: { __$$text: `(Amount*Rate/12) /\n(1-(1+Rate/12)**-Term)` },
      },
    },
    isResetSupportedOnRootExpression: false,
  },
};

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const Nested: Story = {
  render: (args) => BoxedExpressionEditorWrapper(),
  parameters: { exclude: ["dataTypes", "beeGwtService", "pmmlDocuments"] },
  args: {
    ...EmptyExpression.args,
    expression: {
      __$$element: "context",
      "@_id": generateUuid(),
      "@_label": "Expression Name",
      contextEntry: [
        {
          variable: {
            "@_id": generateUuid(),
            "@_name": "ContextEntry-1",
          },
          expression: {
            __$$element: "functionDefinition",
            "@_id": generateUuid(),
            "@_label": "Expression Name",
            "@_kind": FunctionExpressionDefinitionKind.Feel,
            formalParameter: [],
          },
        },
        {
          "@_label": "Result Expression",
          expression: undefined as any, // SPEC DISCREPANCY: Undefined result expression.
        },
      ],
    },
    isResetSupportedOnRootExpression: false,
  },
};
