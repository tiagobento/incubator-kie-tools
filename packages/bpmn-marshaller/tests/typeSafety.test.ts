/*
 * Copyright 2023 Red Hat, Inc. and/or its affiliates.
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

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as child_process from "child_process";
import { getMarshaller } from "@kie-tools/bpmn-marshaller";

const files: string[] = [
  // FIXME: Tiago --> Skipping because there are some namespaced properties that are not yet mapped as extensions
  // 1. xsi:
  // 2. drools:
  // "../tests-data--manual/other/sample.bpmn",
  "../tests-data--manual/other/sample-sanitized.bpmn",
];

const tmpDir = path.join(os.tmpdir(), "bpmn-marshaller-type-safety-tests");

describe("type safety", () => {
  beforeAll(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true });
    }
    fs.mkdirSync(tmpDir, { recursive: true });
    console.log(`[bpmn-marshaller] Type safety tests running on '${tmpDir}'.`);
  });

  afterAll(() => {
    // fs.rmdirSync(tmpDir, { recursive: true });
  });

  for (const file of files) {
    test(path.basename(file), () => {
      const xml = fs.readFileSync(path.join(__dirname, file), "utf-8");

      const { parser, version } = getMarshaller(xml);
      const json = parser.parse();

      const thisPath = path.resolve(__dirname);

      const minorVersion = version.split(".")[1];
      const tmpFile = `
import { BPMN2${minorVersion}__tDefinitions } from "${thisPath}/../dist/schemas/bpmn-2_${minorVersion}/ts-gen/types";

const bpmn: BPMN2${minorVersion}__tDefinitions = ${JSON.stringify(json.definitions, undefined, 2)};`;

      const tmpFilePath = path.join(tmpDir, `${path.basename(file)}.ts`);
      fs.writeFileSync(tmpFilePath, tmpFile);

      const tsc = child_process.spawnSync("tsc", ["--noEmit", "--strict", tmpFilePath], {
        stdio: "pipe",
        shell: "true",
      });
      const tscOutput = tsc.output
        .map((line) => line?.toString())
        .join("\n")
        .trim();

      expect(tscOutput).toStrictEqual("");
    });
  }
});
