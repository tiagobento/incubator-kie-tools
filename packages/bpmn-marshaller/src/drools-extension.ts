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

import { Namespaced, mergeMetas } from "@kie-tools/xml-parser-ts";

import { meta as bpmn20meta, ns as bpmn20ns } from "./schemas/bpmn-2_0/ts-gen/meta";
import "./schemas/bpmn-2_0/ts-gen/types";

import { meta as drools10meta, ns as drools10ns } from "./schemas/drools-1_0/ts-gen/meta";
import {
  drools__GLOBAL__global,
  drools__GLOBAL__import,
  drools__GLOBAL__metaData,
  drools__GLOBAL__onEntry_script,
  drools__GLOBAL__onExit_script,
} from "./schemas/drools-1_0/ts-gen/types";

export const DROOLS_NS__PRE_GWT_REMOVAL = "http://www.jboss.org/drools";
export const DROOLS_NS = "drools:";
export type DROOLS = "drools";

export { Namespaced };

///////////////////////////
///       BPMN 2.0      ///
///////////////////////////

declare module "./schemas/bpmn-2_0/ts-gen/types" {
  type WithMetaData = {
    "drools:metaData"?: Namespaced<DROOLS, drools__GLOBAL__metaData>[];
  };

  export interface BPMN20__tProcess {
    "@_drools:packageName"?: Namespaced<DROOLS, string>;
    "@_drools:version"?: Namespaced<DROOLS, string>;
    "@_drools:adHoc"?: Namespaced<DROOLS, string>;
  }

  export interface BPMN20__tProcess__extensionElements extends WithMetaData {
    "drools:import"?: Namespaced<DROOLS, drools__GLOBAL__import>[];
    "drools:global"?: Namespaced<DROOLS, drools__GLOBAL__global>[];
  }

  export interface BPMN20__tBusinessRuleTask {
    "@_drools:ruleFlowGroup"?: Namespaced<DROOLS, string>;
  }

  type WithEntryAndExitScripts = {
    "drools:onEntry-script"?: Namespaced<DROOLS, drools__GLOBAL__onEntry_script>;
    "drools:onExit-script"?: Namespaced<DROOLS, drools__GLOBAL__onExit_script>;
  };

  // *************************************************** NOTE ******************************************************
  //
  //  Some sequenceFlow elements are commented on purpose. They're here for completeness, but they're not currently
  //                   relevant by this BPMN marshaller, since none of those are executable.
  //
  // ***************************************************************************************************************

  export interface BPMN20__tAdHocSubProcess__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  export interface BPMN20__tBoundaryEvent__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  export interface BPMN20__tBusinessRuleTask__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  export interface BPMN20__tCallActivity__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  // export interface BPMN20__tCallChoreography__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  // export interface BPMN20__tChoreographyTask__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  export interface BPMN20__tComplexGateway__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  export interface BPMN20__tDataObject__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  // export interface BPMN20__tDataObjectReference__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  // export interface BPMN20__tDataStoreReference__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  export interface BPMN20__tEndEvent__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  export interface BPMN20__tEvent__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  export interface BPMN20__tEventBasedGateway__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  export interface BPMN20__tExclusiveGateway__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  // export interface BPMN20__tImplicitThrowEvent__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  export interface BPMN20__tInclusiveGateway__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  export interface BPMN20__tIntermediateCatchEvent__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  export interface BPMN20__tIntermediateThrowEvent__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  // export interface BPMN20__tManualTask__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  export interface BPMN20__tParallelGateway__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  // export interface BPMN20__tReceiveTask__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  export interface BPMN20__tScriptTask__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  // export interface BPMN20__tSendTask__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  export interface BPMN20__tSequenceFlow__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  export interface BPMN20__tServiceTask__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  export interface BPMN20__tStartEvent__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  // export interface BPMN20__tSubChoreography__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  export interface BPMN20__tSubProcess__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  export interface BPMN20__tTask__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  export interface BPMN20__tTransaction__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  export interface BPMN20__tUserTask__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  export interface BPMN20__tAssociation__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  export interface BPMN20__tGroup__extensionElements extends WithEntryAndExitScripts, WithMetaData {}
  export interface BPMN20__tTextAnnotation__extensionElements extends WithEntryAndExitScripts, WithMetaData {}

  // Other
  export interface BPMN20__tProperty__extensionElements extends WithMetaData {}
  export interface BPMN20__tLane__extensionElements extends WithMetaData {}
}

bpmn20ns.set(DROOLS_NS, drools10ns.get("")!);
bpmn20ns.set(drools10ns.get("")!, DROOLS_NS);

mergeMetas(bpmn20meta, [[DROOLS_NS, drools10meta]]);

// Process attrs
(bpmn20meta["BPMN20__tProcess"] as any)["@_drools:packageName"] = {
  type: "string",
  isArray: false,
  xsdType: "xsd:string",
  fromType: "BPMN20__tProcess",
};
(bpmn20meta["BPMN20__tProcess"] as any)["@_drools:version"] = {
  type: "string",
  isArray: false,
  xsdType: "xsd:string",
  fromType: "BPMN20__tProcess",
};
(bpmn20meta["BPMN20__tProcess"] as any)["@_drools:adHoc"] = {
  type: "string",
  isArray: false,
  xsdType: "xsd:string",
  fromType: "BPMN20__tProcess",
};

// Process elements
(bpmn20meta["BPMN20__tProcess__extensionElements"] as any)["drools:import"] = {
  type: "drools__GLOBAL__import",
  isArray: true,
  xsdType: "// local type",
  fromType: "BPMN20__tProcess__extensionElements",
};
(bpmn20meta["BPMN20__tProcess__extensionElements"] as any)["drools:global"] = {
  type: "drools__GLOBAL__global",
  isArray: true,
  xsdType: "// local type",
  fromType: "BPMN20__tProcess__extensionElements",
};

// Business Rule Task attrs
(bpmn20meta["BPMN20__tBusinessRuleTask"] as any)["@_drools:ruleFlowGroup"] = {
  type: "string",
  isArray: false,
  xsdType: "xsd:string",
  fromType: "BPMN20__tBusinessRuleTask",
};

class MetaType {
  public static of(typeName: keyof typeof bpmn20meta) {
    return new MetaType(typeName);
  }

  private constructor(private readonly typeName: keyof typeof bpmn20meta) {}

  public hasMetadata() {
    (bpmn20meta[this.typeName] as any)["drools:metaData"] = {
      type: "drools__GLOBAL__metaData",
      isArray: true,
      xsdType: "// local type",
      fromType: this.typeName,
    };
    return this;
  }

  public hasEntryAndExitScripts() {
    (bpmn20meta[this.typeName] as any)["drools:onEntry-script"] = {
      type: "drools__GLOBAL__onEntry_script",
      isArray: false,
      xsdType: "// local type",
      fromType: this.typeName,
    };
    (bpmn20meta[this.typeName] as any)["drools:onExit-script"] = {
      type: "drools__GLOBAL__onExit_script",
      isArray: false,
      xsdType: "// local type",
      fromType: this.typeName,
    };
    return this;
  }
}

//
// See some of those are commented above too.
//
MetaType.of("BPMN20__tAdHocSubProcess__extensionElements").hasEntryAndExitScripts().hasMetadata();
MetaType.of("BPMN20__tBoundaryEvent__extensionElements").hasEntryAndExitScripts().hasMetadata();
MetaType.of("BPMN20__tBusinessRuleTask__extensionElements").hasEntryAndExitScripts().hasMetadata();
MetaType.of("BPMN20__tCallActivity__extensionElements").hasEntryAndExitScripts().hasMetadata();
// MetaType.of("BPMN20__tCallChoreography__extensionElements").hasEntryAndExitScripts().hasMetadata();
// MetaType.of("BPMN20__tChoreographyTask__extensionElements").hasEntryAndExitScripts().hasMetadata();
MetaType.of("BPMN20__tComplexGateway__extensionElements").hasEntryAndExitScripts().hasMetadata();
MetaType.of("BPMN20__tDataObject__extensionElements").hasEntryAndExitScripts().hasMetadata();
// MetaType.of("BPMN20__tDataObjectReference__extensionElements").hasEntryAndExitScripts().hasMetadata();
// MetaType.of("BPMN20__tDataStoreReference__extensionElements").hasEntryAndExitScripts().hasMetadata();
MetaType.of("BPMN20__tEndEvent__extensionElements").hasEntryAndExitScripts().hasMetadata();
MetaType.of("BPMN20__tEvent__extensionElements").hasEntryAndExitScripts().hasMetadata();
MetaType.of("BPMN20__tEventBasedGateway__extensionElements").hasEntryAndExitScripts().hasMetadata();
MetaType.of("BPMN20__tExclusiveGateway__extensionElements").hasEntryAndExitScripts().hasMetadata();
// MetaType.of("BPMN20__tImplicitThrowEvent__extensionElements").hasEntryAndExitScripts().hasMetadata();
MetaType.of("BPMN20__tInclusiveGateway__extensionElements").hasEntryAndExitScripts().hasMetadata();
MetaType.of("BPMN20__tIntermediateCatchEvent__extensionElements").hasEntryAndExitScripts().hasMetadata();
MetaType.of("BPMN20__tIntermediateThrowEvent__extensionElements").hasEntryAndExitScripts().hasMetadata();
// MetaType.of("BPMN20__tManualTask__extensionElements").hasEntryAndExitScripts().hasMetadata();
MetaType.of("BPMN20__tParallelGateway__extensionElements").hasEntryAndExitScripts().hasMetadata();
// MetaType.of("BPMN20__tReceiveTask__extensionElements").hasEntryAndExitScripts().hasMetadata();
MetaType.of("BPMN20__tScriptTask__extensionElements").hasEntryAndExitScripts().hasMetadata();
// MetaType.of("BPMN20__tSendTask__extensionElements").hasEntryAndExitScripts().hasMetadata();
MetaType.of("BPMN20__tSequenceFlow__extensionElements").hasEntryAndExitScripts().hasMetadata();
MetaType.of("BPMN20__tServiceTask__extensionElements").hasEntryAndExitScripts().hasMetadata();
MetaType.of("BPMN20__tStartEvent__extensionElements").hasEntryAndExitScripts().hasMetadata();
// MetaType.of("BPMN20__tSubChoreography__extensionElements").hasEntryAndExitScripts().hasMetadata();
MetaType.of("BPMN20__tSubProcess__extensionElements").hasEntryAndExitScripts().hasMetadata();
MetaType.of("BPMN20__tTask__extensionElements").hasEntryAndExitScripts().hasMetadata();
MetaType.of("BPMN20__tTransaction__extensionElements").hasEntryAndExitScripts().hasMetadata();
MetaType.of("BPMN20__tUserTask__extensionElements").hasEntryAndExitScripts().hasMetadata();
MetaType.of("BPMN20__tAssociation__extensionElements").hasEntryAndExitScripts().hasMetadata();
MetaType.of("BPMN20__tGroup__extensionElements").hasEntryAndExitScripts().hasMetadata();
MetaType.of("BPMN20__tTextAnnotation__extensionElements").hasEntryAndExitScripts().hasMetadata();

// Process
MetaType.of("BPMN20__tProcess__extensionElements").hasMetadata();

// Property
MetaType.of("BPMN20__tProperty__extensionElements").hasMetadata();

// Lane
MetaType.of("BPMN20__tLane__extensionElements").hasMetadata();
