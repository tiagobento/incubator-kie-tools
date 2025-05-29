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
} from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { Normalized } from "../normalization/normalize";
import { addOrGetProcessAndDiagramElements } from "./addOrGetProcessAndDiagramElements";
import { visitFlowElementsAndArtifacts } from "./_elementVisitor";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";
import { addOrGetItemDefinitions, DEFAULT_DATA_TYPES } from "./addOrGetItemDefinitions";
import {
  BUSINESS_RULE_TASK_IMPLEMENTATIONS,
  BUSINESS_RULE_TASK_IO_SPECIFICATION_DATA_INPUTS_CONSTANTS_FOR_DMN_BINDING,
} from "@kie-tools/bpmn-marshaller/dist/drools-extension";

/* 
E.g.,
    <bpmn2:ioSpecification>
        <bpmn2:dataInput id="_E1ECA7DC-C0D8-41FD-9E6B-C5E3213D7EEE_fileNameInputX" drools:dtype="java.lang.String" itemSubjectRef="__E1ECA7DC-C0D8-41FD-9E6B-C5E3213D7EEE_fileNameInputXItem" name="fileName"/>
        <bpmn2:dataInput id="_E1ECA7DC-C0D8-41FD-9E6B-C5E3213D7EEE_namespaceInputX" drools:dtype="java.lang.String" itemSubjectRef="__E1ECA7DC-C0D8-41FD-9E6B-C5E3213D7EEE_namespaceInputXItem" name="namespace"/>
        <bpmn2:dataInput id="_E1ECA7DC-C0D8-41FD-9E6B-C5E3213D7EEE_modelInputX" drools:dtype="java.lang.String" itemSubjectRef="__E1ECA7DC-C0D8-41FD-9E6B-C5E3213D7EEE_modelInputXItem" name="model"/>
        <bpmn2:inputSet>
            <bpmn2:dataInputRefs>_E1ECA7DC-C0D8-41FD-9E6B-C5E3213D7EEE_fileNameInputX</bpmn2:dataInputRefs>
            <bpmn2:dataInputRefs>_E1ECA7DC-C0D8-41FD-9E6B-C5E3213D7EEE_namespaceInputX</bpmn2:dataInputRefs>
            <bpmn2:dataInputRefs>_E1ECA7DC-C0D8-41FD-9E6B-C5E3213D7EEE_modelInputX</bpmn2:dataInputRefs>
        </bpmn2:inputSet>
    </bpmn2:ioSpecification>

    <bpmn2:dataInputAssociation>
        <bpmn2:targetRef>_E1ECA7DC-C0D8-41FD-9E6B-C5E3213D7EEE_fileNameInputX</bpmn2:targetRef>
        <bpmn2:assignment>
            <bpmn2:from xsi:type="bpmn2:tFormalExpression"><![CDATA[Sample.dmn]]></bpmn2:from>
            <bpmn2:to xsi:type="bpmn2:tFormalExpression"><![CDATA[_E1ECA7DC-C0D8-41FD-9E6B-C5E3213D7EEE_fileNameInputX]]></bpmn2:to>
        </bpmn2:assignment>
    </bpmn2:dataInputAssociation>

    <bpmn2:dataInputAssociation>
        <bpmn2:targetRef>_E1ECA7DC-C0D8-41FD-9E6B-C5E3213D7EEE_namespaceInputX</bpmn2:targetRef>
        <bpmn2:assignment>
            <bpmn2:from xsi:type="bpmn2:tFormalExpression"><![CDATA[https://kie.apache.org/dmn/_857FE424-BEDA-4772-AB8E-2F4CDDB864AB]]></bpmn2:from>
            <bpmn2:to xsi:type="bpmn2:tFormalExpression"><![CDATA[_E1ECA7DC-C0D8-41FD-9E6B-C5E3213D7EEE_namespaceInputX]]></bpmn2:to>
        </bpmn2:assignment>
    </bpmn2:dataInputAssociation>

    <bpmn2:dataInputAssociation>
        <bpmn2:targetRef>_E1ECA7DC-C0D8-41FD-9E6B-C5E3213D7EEE_modelInputX</bpmn2:targetRef>
        <bpmn2:assignment>
            <bpmn2:from xsi:type="bpmn2:tFormalExpression"><![CDATA[loan_pre_qualification]]></bpmn2:from>
            <bpmn2:to xsi:type="bpmn2:tFormalExpression"><![CDATA[_E1ECA7DC-C0D8-41FD-9E6B-C5E3213D7EEE_modelInputX]]></bpmn2:to>
        </bpmn2:assignment>
    </bpmn2:dataInputAssociation>
*/

export function associateBusinessRuleTaskWithDmnModel({
  definitions,
  __readonly_businessRuleTaskId,
  __readonly_dmnModel,
}: {
  definitions: Normalized<BPMN20__tDefinitions>;
  __readonly_businessRuleTaskId: string;
  __readonly_dmnModel: {
    normalizedPosixPathRelativeToTheOpenFile: string;
    namespace: string;
    name: string;
  };
}): void {
  const { process } = addOrGetProcessAndDiagramElements({ definitions });

  const { itemDefinition: stringItemDefinition } = addOrGetItemDefinitions({
    definitions,
    dataType: DEFAULT_DATA_TYPES.STRING,
  });

  visitFlowElementsAndArtifacts(process, ({ element }) => {
    if (element["@_id"] === __readonly_businessRuleTaskId && element.__$$element === "businessRuleTask") {
      const fileNameId = element.ioSpecification?.dataInput?.[0]?.["@_id"] ?? generateUuid();
      const namespaceId = element.ioSpecification?.dataInput?.[1]?.["@_id"] ?? generateUuid();
      const modelNameId = element.ioSpecification?.dataInput?.[2]?.["@_id"] ?? generateUuid();

      element.ioSpecification = {
        "@_id": element.ioSpecification?.["@_id"] ?? generateUuid(),
        dataInput: [
          {
            "@_id": fileNameId,
            "@_drools:dtype": "java.lang.String",
            "@_itemSubjectRef": stringItemDefinition["@_id"],
            "@_name": BUSINESS_RULE_TASK_IO_SPECIFICATION_DATA_INPUTS_CONSTANTS_FOR_DMN_BINDING.FILE_PATH,
          },
          {
            "@_id": namespaceId,
            "@_drools:dtype": "java.lang.String",
            "@_itemSubjectRef": stringItemDefinition["@_id"],
            "@_name": BUSINESS_RULE_TASK_IO_SPECIFICATION_DATA_INPUTS_CONSTANTS_FOR_DMN_BINDING.NAMESPACE,
          },
          {
            "@_id": modelNameId,
            "@_drools:dtype": "java.lang.String",
            "@_itemSubjectRef": stringItemDefinition["@_id"],
            "@_name": BUSINESS_RULE_TASK_IO_SPECIFICATION_DATA_INPUTS_CONSTANTS_FOR_DMN_BINDING.MODEL_NAME,
          },
        ],
        inputSet: [
          {
            "@_id": element.ioSpecification?.inputSet?.[0]?.["@_id"] ?? generateUuid(),
            dataInputRefs: [
              { __$$text: fileNameId }, // force line-break
              { __$$text: namespaceId },
              { __$$text: modelNameId },
            ],
          },
        ],
        outputSet: [], // empty on purpose.
      };

      element.dataInputAssociation = [
        {
          "@_id": element.dataInputAssociation?.[0]?.["@_id"] ?? generateUuid(),
          targetRef: { __$$text: fileNameId },
          assignment: [
            {
              "@_id": element.dataInputAssociation?.[0]?.assignment?.[0]?.["@_id"] ?? generateUuid(),
              from: {
                "@_id": element.dataInputAssociation?.[0]?.assignment?.[0]?.from?.["@_id"] ?? generateUuid(),
                __$$text: __readonly_dmnModel.normalizedPosixPathRelativeToTheOpenFile,
              },
              to: {
                "@_id": element.dataInputAssociation?.[0]?.assignment?.[0]?.to?.["@_id"] ?? generateUuid(),
                __$$text: fileNameId,
              },
            },
          ],
        },
        {
          "@_id": element.dataInputAssociation?.[1]?.["@_id"] ?? generateUuid(),
          targetRef: { __$$text: namespaceId },
          assignment: [
            {
              "@_id": element.dataInputAssociation?.[1]?.assignment?.[0]?.["@_id"] ?? generateUuid(),
              from: {
                "@_id": element.dataInputAssociation?.[1]?.assignment?.[0]?.from?.["@_id"] ?? generateUuid(),
                __$$text: __readonly_dmnModel.namespace,
              },
              to: {
                "@_id": element.dataInputAssociation?.[1]?.assignment?.[0]?.to?.["@_id"] ?? generateUuid(),
                __$$text: namespaceId,
              },
            },
          ],
        },
        {
          "@_id": element.dataInputAssociation?.[2]?.["@_id"] ?? generateUuid(),
          targetRef: { __$$text: modelNameId },
          assignment: [
            {
              "@_id": element.dataInputAssociation?.[2]?.assignment?.[0]?.["@_id"] ?? generateUuid(),
              from: {
                "@_id": element.dataInputAssociation?.[2]?.assignment?.[0]?.from?.["@_id"] ?? generateUuid(),
                __$$text: __readonly_dmnModel.name,
              },
              to: {
                "@_id": element.dataInputAssociation?.[2]?.assignment?.[0]?.to?.["@_id"] ?? generateUuid(),
                __$$text: modelNameId,
              },
            },
          ],
        },
      ];

      return false; // Will stop visiting.
    }
  });
}

export type BusinessRuleTaskDmnBinding = {
  dataInputId: undefined | string;
  dataInputIndex: undefined | number;
  inputSetIndex: undefined | number;
  dataInputRefsIndex: undefined | number;
  dataInputAssociationIndex: undefined | number;
  value: undefined | string;
};

export function getDmnModelBinding(businessRuleTask: Normalized<BPMN20__tBusinessRuleTask>) {
  if (businessRuleTask["@_implementation"] !== BUSINESS_RULE_TASK_IMPLEMENTATIONS.dmn) {
    return undefined;
  }

  const filePath: BusinessRuleTaskDmnBinding = {
    dataInputId: undefined,
    dataInputIndex: undefined,
    inputSetIndex: undefined,
    dataInputRefsIndex: undefined,
    dataInputAssociationIndex: undefined,
    value: undefined,
  };
  const namespace: BusinessRuleTaskDmnBinding = {
    dataInputId: undefined,
    dataInputIndex: undefined,
    inputSetIndex: undefined,
    dataInputRefsIndex: undefined,
    dataInputAssociationIndex: undefined,
    value: undefined,
  };
  const modelName: BusinessRuleTaskDmnBinding = {
    dataInputId: undefined,
    dataInputIndex: undefined,
    inputSetIndex: undefined,
    dataInputRefsIndex: undefined,
    dataInputAssociationIndex: undefined,
    value: undefined,
  };

  for (let i = 0; i < (businessRuleTask.ioSpecification?.dataInput ?? []).length; i++) {
    const dataInput = businessRuleTask.ioSpecification!.dataInput![i];
    if (dataInput["@_name"] === BUSINESS_RULE_TASK_IO_SPECIFICATION_DATA_INPUTS_CONSTANTS_FOR_DMN_BINDING.FILE_PATH) {
      filePath.dataInputId = dataInput["@_id"];
      filePath.dataInputIndex = i;
    } else if (
      dataInput["@_name"] === BUSINESS_RULE_TASK_IO_SPECIFICATION_DATA_INPUTS_CONSTANTS_FOR_DMN_BINDING.NAMESPACE
    ) {
      namespace.dataInputId = dataInput["@_id"];
      namespace.dataInputIndex = i;
    } else if (
      dataInput["@_name"] === BUSINESS_RULE_TASK_IO_SPECIFICATION_DATA_INPUTS_CONSTANTS_FOR_DMN_BINDING.MODEL_NAME
    ) {
      modelName.dataInputId = dataInput["@_id"];
      modelName.dataInputIndex = i;
    } else {
      // ignore
    }
  }

  for (let i = 0; i < (businessRuleTask.ioSpecification?.inputSet ?? []).length; i++) {
    const inputSet = businessRuleTask.ioSpecification!.inputSet![i];
    for (let ii = 0; ii < (businessRuleTask.ioSpecification?.inputSet[i].dataInputRefs ?? []).length; ii++) {
      const dataInputRef = inputSet!.dataInputRefs![ii];

      if (dataInputRef.__$$text === filePath.dataInputId) {
        filePath.inputSetIndex = i;
        filePath.dataInputRefsIndex = ii;
      } else if (dataInputRef.__$$text === namespace.dataInputId) {
        namespace.inputSetIndex = i;
        namespace.dataInputRefsIndex = ii;
      } else if (dataInputRef.__$$text === modelName.dataInputId) {
        modelName.inputSetIndex = i;
        modelName.dataInputRefsIndex = ii;
      } else {
        // ignore
      }
    }
  }

  for (let i = 0; i < (businessRuleTask.dataInputAssociation ?? []).length; i++) {
    const association = businessRuleTask.dataInputAssociation![i];
    if (association.targetRef.__$$text === filePath.dataInputId) {
      filePath.value = association.assignment?.[0].from.__$$text;
      filePath.dataInputAssociationIndex = i;
    } else if (association.targetRef.__$$text === namespace.dataInputId) {
      namespace.value = association.assignment?.[0].from.__$$text;
      namespace.dataInputAssociationIndex = i;
    } else if (association.targetRef.__$$text === modelName.dataInputId) {
      modelName.value = association.assignment?.[0].from.__$$text;
      modelName.dataInputAssociationIndex = i;
    } else {
      //ignore
    }
  }

  return {
    normalizedPosixPathRelativeToTheOpenFile: filePath,
    modelNamespace: namespace,
    modelName,
  };
}
