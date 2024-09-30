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

const buildEnv = require("./env");
const {
  setupMavenConfigFile,
  buildTailFromPackageJson,
  DEFAULT_LOCAL_REPO,
} = require("@kie-tools/maven-config-setup-helper");

setupMavenConfigFile(
  `
    --batch-mode
    -Dstyle.color=always
    -Drevision=${buildEnv.env.swfDiagramEditor.version}
    -Dmaven.repo.local.tail=${buildTailFromPackageJson()},${DEFAULT_LOCAL_REPO} 
    `, // For some reason, j2cl-maven-plugin needs the DEFAULT_LOCAL_REPO here as the last tail too.
  { ignoreDefault: true } // Default <repositories> configuration doesn't work for this module. Since this module is not going to last long, we rely on this workaround for a while.
);
