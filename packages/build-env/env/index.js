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

const { envVars, getOrDefault, str2bool } = require("@kie-tools/build-env");
const packageJson = require("@kie-tools/build-env/package.json");

module.exports = {
  vars: envVars({
    KIE_TOOLS_BUILD_lint: {
      default: `${true}`,
      description: "",
    },
    KIE_TOOLS_BUILD_test: {
      default: `${true}`,
      description: "",
    },
    KIE_TOOLS_BUILD_testIT: {
      default: `${false}`,
      description: "",
    },
    KIE_TOOLS_BUILD_docker: {
      default: `${false}`,
      description: "",
    },
    KIE_TOOLS_BUILD_examples: {
      default: `${false}`,
      description: "",
    },
    QUARKUS_PLATFORM_version: {
      default: "2.4.0.Final",
      description: "",
    },
    KOGITO_RUNTIME_version: {
      default: "1.12.0.Final",
      description: "",
    },
  }),
  get env() {
    return {
      global: {
        version: packageJson.version,
        build: {
          lint: str2bool(getOrDefault(this.vars.KIE_TOOLS_BUILD_lint)),
          test: str2bool(getOrDefault(this.vars.KIE_TOOLS_BUILD_test)),
          testIT: str2bool(getOrDefault(this.vars.KIE_TOOLS_BUILD_testIT)),
          docker: str2bool(getOrDefault(this.vars.KIE_TOOLS_BUILD_docker)),
          examples: str2bool(getOrDefault(this.vars.KIE_TOOLS_BUILD_examples)),
        },
      },
      kogitoRuntime: {
        version: getOrDefault(this.vars.KOGITO_RUNTIME_version),
      },
      quarkusPlatform: {
        version: getOrDefault(this.vars.QUARKUS_PLATFORM_version),
      },

      //

      boxedExpressionComponent: {
        dev: {
          port: 3015,
        },
      },
      feelInputComponent: {
        dev: {
          port: 3016,
          REACT_APP_FEEL_SERVER: "",
        },
      },
      importJavaClassesComponent: {
        dev: {
          port: 3017,
        },
      },
      dmnDevSandboxFormWebapp: {
        dev: {
          port: 9008,
        },
      },
      standaloneEditors: {
        dev: {
          port: 9006,
        },
      },
      pmmlEditor: {
        dev: {
          port: 9005,
        },
      },
      serverlessWorkflowCombinedEditor: {
        dev: {
          port: 9002,
        },
      },
      serverlessWorkflowTextEditor: {
        dev: {
          port: 9003,
        },
      },
      serverlessWorkflowMermaidViewer: {
        dev: {
          port: 9004,
        },
      },
      yardEditor: {
        dev: {
          port: 9009,
        },
      },
      examples: {
        chromeExtensionEnvelope: {
          port: 9101,
        },
        webapp: {
          port: 9100,
        },
      },
    };
  },
};
