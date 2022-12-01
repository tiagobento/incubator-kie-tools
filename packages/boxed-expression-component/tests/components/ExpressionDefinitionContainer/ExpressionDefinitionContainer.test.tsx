/*
 * Copyright 2020 Red Hat, Inc. and/or its affiliates.
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

import { ExpressionDefinitionContainer } from "@kie-tools/boxed-expression-component/dist/components";
import { render } from "@testing-library/react";
import * as React from "react";
import { usingTestingBoxedExpressionI18nContext, usingTestingBoxedExpressionProviderContext } from "../test-utils";
import {
  DmnBuiltInDataType,
  ExpressionDefinition,
  ExpressionDefinitionLogicType,
} from "@kie-tools/boxed-expression-component/dist/api";

describe("ExpressionContainer tests", () => {
  test("should render ExpressionContainer component", () => {
    const expression: ExpressionDefinition = {
      name: "Test",
      dataType: DmnBuiltInDataType.Undefined,
      logicType: ExpressionDefinitionLogicType.Undefined,
    };

    const { container } = render(
      usingTestingBoxedExpressionI18nContext(
        usingTestingBoxedExpressionProviderContext(<ExpressionDefinitionContainer selectedExpression={expression} />, {
          expressionDefinition: expression,
        }).wrapper
      ).wrapper
    );

    expect(container).toMatchSnapshot();
  });

  test("should render expression title, when name prop is passed", () => {
    const expressionTitle = "Test";
    const expression: ExpressionDefinition = {
      name: expressionTitle,
      dataType: DmnBuiltInDataType.Undefined,
      logicType: ExpressionDefinitionLogicType.Undefined,
    };

    const { container } = render(
      usingTestingBoxedExpressionI18nContext(
        usingTestingBoxedExpressionProviderContext(<ExpressionDefinitionContainer selectedExpression={expression} />, {
          expressionDefinition: expression,
        }).wrapper
      ).wrapper
    );
    expect(container.querySelector(".expression-title")).toBeTruthy();
    expect(container.querySelector(".expression-title")!.innerHTML).toBe(expressionTitle);
  });

  test("should render expression type, when type prop is passed", () => {
    const expression: ExpressionDefinition = {
      name: "Test",
      logicType: ExpressionDefinitionLogicType.LiteralExpression,
      dataType: DmnBuiltInDataType.Undefined,
    };
    const { container } = render(
      usingTestingBoxedExpressionI18nContext(
        usingTestingBoxedExpressionProviderContext(<ExpressionDefinitionContainer selectedExpression={expression} />, {
          expressionDefinition: expression,
        }).wrapper
      ).wrapper
    );

    expect(container.querySelector(".expression-type")).toBeTruthy();
    expect(container.querySelector(".expression-type")!.innerHTML).toBe(
      "(" + ExpressionDefinitionLogicType.LiteralExpression + ")"
    );
  });

  test("should render expression type as undefined, when type prop is not passed", () => {
    const expression: ExpressionDefinition = {
      name: "Test",
      dataType: DmnBuiltInDataType.Undefined,
      logicType: ExpressionDefinitionLogicType.Undefined,
    };

    const { container } = render(
      usingTestingBoxedExpressionI18nContext(
        usingTestingBoxedExpressionProviderContext(<ExpressionDefinitionContainer selectedExpression={expression} />, {
          expressionDefinition: expression,
        }).wrapper
      ).wrapper
    );
    expect(container.querySelector(".expression-type")).toBeTruthy();
    expect(container.querySelector(".expression-type")!.innerHTML).toBe("(&lt;Undefined&gt;)");
  });
});
