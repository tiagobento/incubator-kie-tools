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

import { BPMN20__tDefinitions } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { ElementFilter } from "@kie-tools/xml-parser-ts/dist/elementFilter";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import { Normalized } from "../normalization/normalize";

export function addOrGetErrors({
  definitions,
  oldError: oldErrorMessage,
  newError: newErrorMessage,
}: {
  definitions: Normalized<BPMN20__tDefinitions>;
  oldError: string;
  newError: string;
}): {
  error: ElementFilter<Unpacked<Normalized<BPMN20__tDefinitions["rootElement"]>>, "error">;
} {
  definitions.rootElement ??= [];
  const itemDefinitions = definitions.rootElement.filter((s) => s.__$$element === "itemDefinition");
  const index = itemDefinitions.length;
  const errors = definitions.rootElement.filter((s) => s.__$$element === "error");
  const existingError = errors.find((s) => s["@_id"] === oldErrorMessage);
  if (existingError) {
    existingError["@_id"] = newErrorMessage ?? oldErrorMessage;
    existingError["@_errorCode"] = newErrorMessage ?? oldErrorMessage;
    return { error: existingError };
  }
  const newError = {
    __$$element: "error",
    "@_id": newErrorMessage ?? oldErrorMessage,
    "@_errorCode": newErrorMessage ?? oldErrorMessage,
  } as ElementFilter<Unpacked<Normalized<BPMN20__tDefinitions["rootElement"]>>, "error">;

  definitions.rootElement.splice(index, 0, newError);
  return { error: newError };
}
