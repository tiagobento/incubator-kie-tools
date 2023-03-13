/*
 * Copyright 2022 Red Hat, Inc. and/or its affiliates.
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

import { InputRow } from "@kie-tools/form-dmn";
import { CompanionFsService } from "../companionFs/CompanionFsService";
import { v4 as uuid } from "uuid";

export const generateUuid = () => {
  return `_${uuid()}`.toLocaleUpperCase();
};

const DMN_RUNNER_PERSISTENCE_JSON_VERSION = "v1";

interface DmnRunnerPersistenceJsonConfig {
  width?: number;
}

// Can't use Record<string, DmnRunnerConfig | ConfigInputRow>;
export type ConfigInputRow = { [x: string]: DmnRunnerPersistenceJsonConfig | ConfigInputRow };

// TODO: use it!
export enum DmnRunnerMode {
  FORM = "form",
  TABLE = "table",
}

interface DmnRunnerPersistenceJsonConfigs {
  version: string;
  mode: DmnRunnerMode;
  inputs: Array<ConfigInputRow>;
}

export interface DmnRunnerPersistenceJson {
  configs: DmnRunnerPersistenceJsonConfigs;
  inputs: Array<InputRow>;
}

// EMPTY VALUES
// different reference for each one
export const EMPTY_DMN_RUNNER_CONFIG_INPUTS = [{}];
export const EMPTY_DMN_RUNNER_INPUTS = [{}];

export const EMPTY_DMN_RUNNER_PERSISTANCE_JSON = {} as DmnRunnerPersistenceJson;

// DEFAULT VALUES
// TODO: defualt width?
export const DEFAULT_DMN_RUNNER_CONFIG_INPUT_WIDTH = 150;

export const DEFAULT_DMN_RUNNER_CONFIG_INPUT: DmnRunnerPersistenceJsonConfig = {
  width: DEFAULT_DMN_RUNNER_CONFIG_INPUT_WIDTH,
};

export const DEFAULT_DMN_RUNNER_PERSISTENCE_JSON: DmnRunnerPersistenceJson = {
  configs: {
    version: DMN_RUNNER_PERSISTENCE_JSON_VERSION,
    mode: DmnRunnerMode.FORM,
    inputs: EMPTY_DMN_RUNNER_CONFIG_INPUTS,
  },
  inputs: EMPTY_DMN_RUNNER_INPUTS,
};

export function deepCopyPersistenceJson(persistenceJson: DmnRunnerPersistenceJson): DmnRunnerPersistenceJson {
  const configCopy = { ...persistenceJson.configs };
  const configInputsCopy = [...persistenceJson.configs.inputs];
  const inputsCopy = [...persistenceJson.inputs];
  return { configs: { ...configCopy, inputs: configInputsCopy }, inputs: inputsCopy };
}

export class DmnRunnerPersistenceService {
  public readonly companionFsService = new CompanionFsService({
    storeNameSuffix: "dmn_runner_persistence",
    emptyFileContent: JSON.stringify(EMPTY_DMN_RUNNER_PERSISTANCE_JSON),
  });

  public parseDmnRunnerInputs(inputs: string): DmnRunnerPersistenceJson {
    const parsedDmnRunnerPersistenceJson = JSON.parse(inputs) as DmnRunnerPersistenceJson;

    // v0 to v1;
    if (Array.isArray(parsedDmnRunnerPersistenceJson)) {
      // backwards compatibility
      return { ...DEFAULT_DMN_RUNNER_PERSISTENCE_JSON, inputs: parsedDmnRunnerPersistenceJson };
    }

    if (Object.prototype.toString.call(parsedDmnRunnerPersistenceJson) === "[object Object]") {
      return parsedDmnRunnerPersistenceJson;
    }
    return EMPTY_DMN_RUNNER_PERSISTANCE_JSON;
  }

  public parseDmnRunnerPersistenceJson(inputs: string): DmnRunnerPersistenceJson {
    const parsedDmnRunnerPersistenceJson = JSON.parse(inputs) as DmnRunnerPersistenceJson;

    // v0 to v1;
    if (Array.isArray(parsedDmnRunnerPersistenceJson)) {
      // backwards compatibility
      return { ...DEFAULT_DMN_RUNNER_PERSISTENCE_JSON, inputs: parsedDmnRunnerPersistenceJson };
    }

    if (Object.prototype.toString.call(parsedDmnRunnerPersistenceJson) === "[object Object]") {
      return parsedDmnRunnerPersistenceJson;
    }
    return EMPTY_DMN_RUNNER_PERSISTANCE_JSON;
  }
}
