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

import {
  BPMN20__tBusinessRuleTask,
  BPMN20__tDefinitions,
  BPMN20__tProcess,
} from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import { Normalized } from "../normalization/normalize";
import { visitFlowElementsAndArtifacts } from "./_elementVisitor";
import { addOrGetProcessAndDiagramElements } from "./addOrGetProcessAndDiagramElements";
import { getDataIoBinding } from "./_dataIo";
import { ElementFilter } from "@kie-tools/xml-parser-ts/dist/elementFilter";

export function removeDataInputsFromActivity({
  definitions,
  names,
  elementId,
  element,
}: {
  definitions: Normalized<BPMN20__tDefinitions>;
  names: string[];
  elementId: string;
  element: Normalized<
    ElementFilter<
      Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>,
      | "businessRuleTask"
      | "callActivity"
      | "scriptTask"
      | "serviceTask"
      | "userTask"
      | "adHocSubProcess"
      | "subProcess"
      | "task"
    >
  >["__$$element"];
}) {
  const { process } = addOrGetProcessAndDiagramElements({ definitions });

  visitFlowElementsAndArtifacts(process, ({ element: e }) => {
    if (e["@_id"] === elementId && e.__$$element === element) {
      const bs = names.map((n) => getDataIoBinding(e, n, "input"));

      const ioSetIndexes = bs.reduce((acc, i) => (i === acc[0] ? [i] : [i, ...acc]), []);
      if (!(ioSetIndexes.length > 1)) {
        throw new Error("BPMN MUTATION: Can't remove a data bindings that are mapped in different inputSets");
      }

      // Indexes need to be deleted in reverse order.
      bs.map((b) => b.dataIoIndex)
        .toSorted()
        .toReversed()
        .forEach((i) => {
          e.ioSpecification?.dataInput?.splice(i!, 1);
        });

      // Indexes need to be deleted in reverse order.
      bs.map((b) => b.dataIoRefsIndex)
        .toSorted()
        .toReversed()
        .forEach((i) => {
          e.ioSpecification?.inputSet?.[bs[0].ioSetIndex!]?.dataInputRefs?.splice(i!, 1);
        });

      // Indexes need to be deleted in reverse order.
      bs.map((b) => b.dataIoAssociationIndex)
        .toSorted()
        .toReversed()
        .forEach((i) => {
          e.dataInputAssociation?.splice(i!, 1);
        });

      return false; // Will stop visiting.
    }
  });
}
