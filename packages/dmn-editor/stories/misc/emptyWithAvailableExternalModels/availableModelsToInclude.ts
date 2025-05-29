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

import { normalize } from "@kie-tools/dmn-marshaller/dist/normalization/normalize";
import { XML2PMML } from "@kie-tools/pmml-editor-marshaller";
import * as DmnEditor from "@kie-tools/dmn-editor/dist/DmnEditor";
import { getPmmlNamespace } from "@kie-tools/dmn-editor/dist/pmml/pmml";
import { USE_CASE_MODELS } from "../../useCases/models/models";
import { REFERENCE_MODELS } from "../../reference/models/models";
import { testTreePmml } from "./testTreePmml";

export const testTreePmmlModel = XML2PMML(testTreePmml);

export const availableModels: DmnEditor.ExternalModel[] = [
  {
    type: "dmn",
    model: normalize(USE_CASE_MODELS.sumBkm.model),
    normalizedPosixPathRelativeToTheOpenFile: "storybook/useCases/sumBkm.dmn",
    svg: "",
  },
  {
    type: "dmn",
    model: normalize(USE_CASE_MODELS.sumDiffDs.model),
    normalizedPosixPathRelativeToTheOpenFile: "storybook/useCases/sumDiffDs.dmn",
    svg: "",
  },
  {
    type: "dmn",
    model: normalize(REFERENCE_MODELS.empty.model),
    normalizedPosixPathRelativeToTheOpenFile: "storybook/reference/empty.dmn",
    svg: "",
  },
  {
    type: "pmml",
    model: testTreePmmlModel,
    normalizedPosixPathRelativeToTheOpenFile: "storybook/useCases/testTree.pmml",
  },
];

export const availableModelsByPath: Record<string, DmnEditor.ExternalModel> = Object.values(availableModels).reduce(
  (acc, v) => {
    acc[v.normalizedPosixPathRelativeToTheOpenFile] = v;
    return acc;
  },
  {} as Record<string, DmnEditor.ExternalModel>
);

export const modelsByNamespace = Object.values(availableModels).reduce((acc, v) => {
  if (v.type === "dmn") {
    acc[v.model.definitions["@_namespace"]] = v;
  } else if (v.type === "pmml") {
    acc[getPmmlNamespace({ normalizedPosixPathRelativeToTheOpenFile: v.normalizedPosixPathRelativeToTheOpenFile })] = v;
  }
  return acc;
}, {} as DmnEditor.ExternalModelsIndex);
