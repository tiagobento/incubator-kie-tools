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

const { varsWithName, composeEnv, getOrDefault } = require("@kie-tools-scripts/build-env");

const rootEnv = require("@kie-tools/root-env/env");

module.exports = composeEnv([rootEnv], {
  vars: varsWithName({
    KOGITO_TASK_CONSOLE__registry: {
      default: "docker.io",
      description: "The image registry.",
    },
    KOGITO_TASK_CONSOLE__account: {
      default: "apache",
      description: "The image registry account.",
    },
    KOGITO_TASK_CONSOLE__name: {
      default: "incubator-kie-kogito-task-console",
      description: "The image name.",
    },
    KOGITO_TASK_CONSOLE__buildTags: {
      default: rootEnv.env.root.streamName,
      description: "The image tag.",
    },
    KOGITO_TASK_CONSOLE__port: {
      default: 8080,
      description: "The default container port.",
    },
  }),
  get env() {
    return {
      kogitoTaskConsole: {
        registry: getOrDefault(this.vars.KOGITO_TASK_CONSOLE__registry),
        account: getOrDefault(this.vars.KOGITO_TASK_CONSOLE__account),
        name: getOrDefault(this.vars.KOGITO_TASK_CONSOLE__name),
        tags: getOrDefault(this.vars.KOGITO_TASK_CONSOLE__buildTags),
        port: getOrDefault(this.vars.KOGITO_TASK_CONSOLE__port),
        version: require("../package.json").version,
      },
    };
  },
});
