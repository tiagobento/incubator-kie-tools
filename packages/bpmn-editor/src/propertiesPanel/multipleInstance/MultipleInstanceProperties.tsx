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

import { BPMN20__tProcess } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import * as React from "react";
import { Normalized } from "../../normalization/normalize";
import { ElementFilter } from "@kie-tools/xml-parser-ts/dist/elementFilter";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import { FormGroup } from "@patternfly/react-core/dist/js/components/Form";
import { CodeInput } from "../codeInput/CodeInput";
import "./MultipleInstanceProperties.css";

export type WithMultipleInstanceProperties = Normalized<
  ElementFilter<Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>, "callActivity" | "subProcess">
>;

export function MultipleInstanceProperties({ element }: { element: WithMultipleInstanceProperties }) {
  return (
    <>
      <FormGroup label={"Execution mode"}></FormGroup>

      <FormGroup label={"Collection input"}></FormGroup>

      <FormGroup label={"Data input"}></FormGroup>

      <FormGroup label={"Collection output"}></FormGroup>

      <FormGroup label={"Data output"}></FormGroup>

      <CodeInput
        label={"Completion condition"}
        languages={["MVEL"]}
        value={""}
        onChange={(newCode) => {
          // TODO: Tiago
        }}
      />
    </>
  );
}
