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

import {
  BPMN20__tDataInput,
  BPMN20__tDataInputAssociation,
  BPMN20__tDataOutput,
  BPMN20__tDataOutputAssociation,
  BPMN20__tInputSet,
  BPMN20__tOutputSet,
  BPMN20__tProcess,
} from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { Normalized } from "../normalization/normalize";
import { ElementFilter } from "@kie-tools/xml-parser-ts/dist/elementFilter";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";

export type DataIoBinding = {
  dataIoId: undefined | string;
  dataIoIndex: undefined | number;
  ioSetIndex: undefined | number;
  dataIoRefsIndex: undefined | number;
  dataIoAssociationIndex: undefined | number;
  value: undefined | string;
  type: "input" | "output";
};

export function getDataIoBinding(
  activity: Normalized<
    ElementFilter<
      Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>,
      | "task"
      | "businessRuleTask"
      | "callActivity"
      | "scriptTask"
      | "serviceTask"
      | "userTask"
      | "adHocSubProcess"
      | "subProcess"
      | "boundaryEvent"
      | "startEvent"
      | "intermediateCatchEvent"
      | "intermediateThrowEvent"
    >
  >,
  name: string,
  type: "input" | "output"
) {
  const ret: DataIoBinding = {
    dataIoId: undefined,
    dataIoIndex: undefined,
    ioSetIndex: undefined,
    dataIoRefsIndex: undefined,
    dataIoAssociationIndex: undefined,
    value: undefined,
    type,
  };

  const ioSetProp = type === "input" ? ("inputSet" as const) : ("outputSet" as const);
  const dataIoProp = type === "input" ? ("dataInput" as const) : ("dataOutput" as const);
  const ioSetRefsProp = type === "input" ? ("inputSetRefs" as const) : ("outputSetRefs" as const);
  const dataIoRefsProp = type === "input" ? ("dataInputRefs" as const) : ("dataOutputRefs" as const);
  const dataIoAssociationProp =
    type === "input" ? ("dataInputAssociation" as const) : ("dataOutputAssociation" as const);

  let dataIoArray: undefined | (BPMN20__tDataInput & BPMN20__tDataOutput)[];
  let ioSetArray: undefined | (BPMN20__tInputSet & BPMN20__tOutputSet) | (BPMN20__tInputSet & BPMN20__tOutputSet)[];
  let dataIoAssociationArray: undefined | (BPMN20__tDataInputAssociation & BPMN20__tDataOutputAssociation)[];

  if (activity.__$$element === "businessRuleTask" /* TODO: Tiago --> other tasks types */) {
    dataIoArray = activity.ioSpecification?.[ioSetProp];
    ioSetArray = activity.ioSpecification?.[dataIoProp];
    dataIoAssociationArray = activity[dataIoAssociationProp];
  } else if (activity.__$$element === "intermediateThrowEvent" /* TODO: Tiago --> other tasks types */) {
    dataIoArray = activity.dataInput;
    ioSetArray = activity.inputSet;
    dataIoAssociationArray = activity.dataInputAssociation;
  } else if (activity.__$$element === "intermediateCatchEvent" /* TODO: Tiago --> other tasks types */) {
    dataIoArray = activity.dataOutput;
    ioSetArray = activity.outputSet;
    dataIoAssociationArray = activity.dataOutputAssociation;
  }

  for (let i = 0; i < (dataIoArray ?? []).length; i++) {
    const dataIo = dataIoArray![i];
    if (dataIo["@_name"] === name) {
      ret.dataIoId = dataIo["@_id"];
      ret.dataIoIndex = i;
    } else {
      // ignore
    }
  }

  const definitelyIoSetArray = Array.isArray(ioSetArray) ? ioSetArray ?? [] : [ioSetArray];

  for (let i = 0; i < definitelyIoSetArray.length; i++) {
    const ioSet = definitelyIoSetArray![i];
    for (let ii = 0; ii < (definitelyIoSetArray[i]?.[dataIoRefsProp] ?? []).length; ii++) {
      const dataIoRef = ioSet![ioSetRefsProp]![ii];
      if (dataIoRef.__$$text === ret.dataIoId) {
        ret.ioSetIndex = i;
        ret.dataIoRefsIndex = ii;
      } else {
        // ignore
      }
    }
  }

  for (let i = 0; i < (dataIoAssociationArray ?? []).length; i++) {
    const association = dataIoAssociationArray![i];
    if (association.targetRef.__$$text === ret.dataIoId) {
      ret.dataIoAssociationIndex = i;
      ret.value = association.assignment?.[0].from.__$$text;
    } else {
      //ignore
    }
  }

  return ret;
}
