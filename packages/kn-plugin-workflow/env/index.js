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

const { envVars, getOrDefault, compositeEnv } = require("@kie-tools/build-env");

const buildEnv = require("@kie-tools/build-env/env");

module.exports = compositeEnv([buildEnv], {
  vars: envVars({
    KN_PLUGIN_WORKFLOW__quarkusVersion: {
      default: "2.10.0.Final",
      description: "version to be used when creating the Quarkus workflow project",
    },
  }),
  get env() {
    return {
      knPluginWorkflow: {
        quarkusVersion: getOrDefault(this.vars.KN_PLUGIN_WORKFLOW__quarkusVersion),
      },
    };
  },
});
