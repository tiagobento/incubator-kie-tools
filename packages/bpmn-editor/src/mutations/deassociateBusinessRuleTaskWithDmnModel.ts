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
import { Normalized } from "../normalization/normalize";
import { visitFlowElementsAndArtifacts } from "./_elementVisitor";
import { addOrGetProcessAndDiagramElements } from "./addOrGetProcessAndDiagramElements";
import { getDmnModelBinding } from "./associateBusinessRuleTaskWithDmnModel";
import { BUSINESS_RULE_TASK_IMPLEMENTATIONS } from "@kie-tools/bpmn-marshaller/dist/drools-extension";

export function deassociateBusinessRuleTaskWithDmnModel({
  definitions,
  __readonly_businessRuleTaskId,
}: {
  definitions: Normalized<BPMN20__tDefinitions>;
  __readonly_businessRuleTaskId: string;
}): void {
  const { process } = addOrGetProcessAndDiagramElements({ definitions });

  visitFlowElementsAndArtifacts(process, ({ element }) => {
    if (element["@_id"] === __readonly_businessRuleTaskId && element.__$$element === "businessRuleTask") {
      if (element["@_implementation"] !== BUSINESS_RULE_TASK_IMPLEMENTATIONS.dmn) {
        // Doesn't have a DMN association.
        return false; // Will stop visiting;
      }

      const b = getDmnModelBinding(element);
      if (!b) {
        throw new Error("BPMN MUTATION: Can't remove a DMN binding that doesn't exist");
      }

      if (
        !(
          b.normalizedPosixPathRelativeToTheOpenFile.inputSetIndex === b.modelNamespace.inputSetIndex &&
          b.modelNamespace.inputSetIndex === b.modelName.inputSetIndex
        )
      ) {
        throw new Error("BPMN MUTATION: Can't remove a DMN binding that is mapped in different inputSets");
      }

      const inputSetIndex = b.normalizedPosixPathRelativeToTheOpenFile.inputSetIndex!; // Any of them would do, since the guard clause above guarantees all are equal.

      // Indexes need to be deleted in reverse order.
      [
        b.normalizedPosixPathRelativeToTheOpenFile.dataInputIndex,
        b.modelNamespace.dataInputIndex,
        b.modelName.dataInputIndex,
      ]
        .toSorted()
        .toReversed()
        .forEach((i) => {
          element.ioSpecification?.dataInput?.splice(i!, 1);
        });

      // Indexes need to be deleted in reverse order.
      [
        b.normalizedPosixPathRelativeToTheOpenFile.dataInputRefsIndex,
        b.modelNamespace.dataInputRefsIndex,
        b.modelName.dataInputRefsIndex,
      ]
        .toSorted()
        .toReversed()
        .forEach((i) => {
          element.ioSpecification?.inputSet?.[inputSetIndex]?.dataInputRefs?.splice(i!, 1);
        });

      // Indexes need to be deleted in reverse order.
      [
        b.normalizedPosixPathRelativeToTheOpenFile.dataInputAssociationIndex,
        b.modelNamespace.dataInputAssociationIndex,
        b.modelName.dataInputAssociationIndex,
      ]
        .toSorted()
        .toReversed()
        .forEach((i) => {
          element.dataInputAssociation?.splice(i!, 1);
        });

      return false; // Will stop visiting.
    }
  });
}
