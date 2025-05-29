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

import "../../tsDmnModule";
import NodesDmnRaw from "!!raw-loader!./Nodes.dmn";
import RequirementsDmnRaw from "!!raw-loader!./Requirements.dmn";
import ExternalDmnRaw from "!!raw-loader!./External DMN.dmn";
import ExteranlDmnDefaultRaw from "!!raw-loader!./External DMN (default).dmn";

import { getMarshaller } from "@kie-tools/dmn-marshaller";

const EMPTY = `<definitions xmlns="https://www.omg.org/spec/DMN/20230324/MODEL/" />`;

export const REFERENCE_MODELS = {
  empty: {
    model: getMarshaller(EMPTY, { upgradeTo: "latest" }).parser.parse(),
    filename: "Empty.dmn",
    raw: EMPTY,
  },
  nodes: {
    model: getMarshaller(NodesDmnRaw, { upgradeTo: "latest" }).parser.parse(),
    raw: NodesDmnRaw,
    filename: "Nodes.dmn",
  },
  requirements: {
    model: getMarshaller(RequirementsDmnRaw, { upgradeTo: "latest" }).parser.parse(),
    raw: RequirementsDmnRaw,
    filename: "Requirements.dmn",
  },
  externalDmn: {
    model: getMarshaller(ExternalDmnRaw, { upgradeTo: "latest" }).parser.parse(),
    raw: ExternalDmnRaw,
    filename: "External DMN.dmn",
  },
  externalDmnDefault: {
    model: getMarshaller(ExteranlDmnDefaultRaw, { upgradeTo: "latest" }).parser.parse(),
    raw: ExteranlDmnDefaultRaw,
    filename: "External DMN (default).dmn",
  },
};
