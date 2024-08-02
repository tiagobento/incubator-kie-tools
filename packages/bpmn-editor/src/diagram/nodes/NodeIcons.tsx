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

import * as React from "react";
import {
  DataObjectNodeSvg,
  EndEventNodeSvg,
  GatewayNodeSvg,
  GroupNodeSvg,
  IntermediateCatchEventNodeSvg,
  IntermediateThrowEventNodeSvg,
  LaneNodeSvg,
  StartEventNodeSvg,
  SubProcessNodeSvg,
  TaskNodeSvg,
  TextAnnotationNodeSvg,
  TransactionNodeSvg,
} from "./NodeSvgs";
import { switchExpression } from "@kie-tools-core/switch-expression-ts";
import { BpmnNodeType } from "../BpmnDiagramDomain";
import { NODE_TYPES } from "../BpmnDiagramDomain";
import { QuestionCircleIcon } from "@patternfly/react-icons/dist/js/icons/question-circle-icon";
import { nodeSvgProps, RoundSvg } from "@kie-tools/xyflow-react-kie-diagram/dist/nodes/NodeIcons";

export function NodeIcon({ nodeType }: { nodeType: BpmnNodeType }) {
  return switchExpression(nodeType, {
    [NODE_TYPES.startEvent]: StartEventIcon,
    [NODE_TYPES.task]: TaskIcon,
    [NODE_TYPES.dataObject]: DataObjectIcon,
    [NODE_TYPES.textAnnotation]: TextAnnotationIcon,
    [NODE_TYPES.unknown]: UnknownIcon,
    default: () => <div>?</div>,
  });
}

export function StartEventIcon() {
  return (
    <RoundSvg>
      <StartEventNodeSvg {...nodeSvgProps} variant={"none"} />
    </RoundSvg>
  );
}

export function IntermediateCatchEventIcon() {
  return (
    <RoundSvg>
      <IntermediateCatchEventNodeSvg {...nodeSvgProps} rimWidth={40} variant={"none"} />
    </RoundSvg>
  );
}

export function IntermediateThrowEventIcon() {
  return (
    <RoundSvg>
      <IntermediateThrowEventNodeSvg {...nodeSvgProps} rimWidth={40} variant={"none"} />
    </RoundSvg>
  );
}

export function EndEventIcon() {
  return (
    <RoundSvg>
      <EndEventNodeSvg {...nodeSvgProps} variant={"none"} />
    </RoundSvg>
  );
}

export function TaskIcon() {
  return (
    <RoundSvg>
      <TaskNodeSvg {...nodeSvgProps} />
    </RoundSvg>
  );
}

export function SubProcessIcon() {
  return (
    <RoundSvg>
      <SubProcessNodeSvg {...nodeSvgProps} />
    </RoundSvg>
  );
}

export function GatewayIcon() {
  return (
    <RoundSvg>
      <GatewayNodeSvg {...nodeSvgProps} width={200} height={200} variant={"none"} />
    </RoundSvg>
  );
}

export function LaneIcon() {
  return (
    <RoundSvg>
      <LaneNodeSvg {...nodeSvgProps} />
    </RoundSvg>
  );
}

export function TransactionIcon() {
  return (
    <RoundSvg>
      <TransactionNodeSvg {...nodeSvgProps} strokeWidth={10} rimWidth={20} borderRadius={20} />
    </RoundSvg>
  );
}

export function DataObjectIcon(props: { padding?: string; height?: number; viewBox?: number; transform?: string }) {
  return (
    <RoundSvg padding={props.padding ?? "0px"} height={props.height} viewBox={props.viewBox}>
      <DataObjectNodeSvg
        {...nodeSvgProps}
        isIcon={true}
        width={80}
        height={100}
        strokeWidth={10}
        transform={props.transform ?? "translate(80, 60)"}
      />
    </RoundSvg>
  );
}

export function GroupIcon() {
  return (
    <RoundSvg>
      <GroupNodeSvg {...nodeSvgProps} y={12} height={nodeSvgProps.width} strokeDasharray={"28,28"} />
    </RoundSvg>
  );
}

export function TextAnnotationIcon() {
  return (
    <RoundSvg>
      <TextAnnotationNodeSvg {...nodeSvgProps} showPlaceholder={true} />
    </RoundSvg>
  );
}
export function UnknownIcon() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
      <QuestionCircleIcon />
    </div>
  );
}
