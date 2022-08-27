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

const { getOrDefault, varsWithName, composeEnv } = require("@kie-tools-build/build-env");

module.exports = composeEnv([require("@kie-tools-build/root/env")], {
  vars: varsWithName({
    FEEL_INPUT_COMPONENT_DEV_WEBAPP__feelServerUrl: {
      default: "",
      description: "",
    },
  }),
  get env() {
    return {
      feelInputComponent: {
        dev: {
          port: 3016,
          feelServerUrl: getOrDefault(this.vars.FEEL_INPUT_COMPONENT_DEV_WEBAPP__feelServerUrl),
        },
      },
    };
  },
});
