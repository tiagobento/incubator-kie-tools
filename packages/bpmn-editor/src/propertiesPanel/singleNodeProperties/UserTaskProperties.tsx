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

import { BPMN20__tUserTask } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import * as React from "react";
import { Normalized } from "../../normalization/normalize";
import { NameDocumentationAndId } from "../nameDocumentationAndId/NameDocumentationAndId";
import { BidirectionalAssignmentsFormSection } from "../assignments/AssignmentsFormSection";
import { OnEntryAndExitScriptsFormSection } from "../onEntryAndExitScripts/OnEntryAndExitScriptsFormSection";
import { TaskIcon } from "../../diagram/nodes/NodeIcons";
import { PropertiesPanelHeaderFormSection } from "./_PropertiesPanelHeaderFormSection";
import { Divider } from "@patternfly/react-core/dist/js/components/Divider";
import { AsyncCheckbox } from "../asyncCheckbox/AsyncCheckbox";
import { SlaDueDateInput } from "../slaDueDate/SlaDueDateInput";
import { MultiInstanceCheckbox } from "../multiInstanceCheckbox/MultiInstanceCheckbox";
import { MultiInstanceProperties } from "../multiInstance/MultiInstanceProperties";
import { AdhocAutostartCheckbox } from "../adhocAutostartCheckbox/AdhocAutostartCheckbox";
import { FormGroup } from "@patternfly/react-core/dist/js/components/Form";

export function UserTaskProperties({
  userTask,
}: {
  userTask: Normalized<BPMN20__tUserTask> & { __$$element: "userTask" };
}) {
  return (
    <>
      <PropertiesPanelHeaderFormSection
        title={userTask["@_name"] || "User task"}
        icon={<TaskIcon variant={userTask.__$$element} isIcon={true} />}
      >
        <NameDocumentationAndId element={userTask} />

        <Divider inset={{ default: "insetXs" }} />

        <FormGroup label={"Task"}></FormGroup>
        <FormGroup label={"Subject"}></FormGroup>
        <FormGroup label={"Content"}></FormGroup>
        <FormGroup label={"Priority"}></FormGroup>
        <FormGroup label={"Skippable"}></FormGroup>

        <Divider inset={{ default: "insetXs" }} />

        <FormGroup label={"Actors"}></FormGroup>
        <FormGroup label={"Groups"}></FormGroup>
        <FormGroup label={"Created by"}></FormGroup>

        <Divider inset={{ default: "insetXs" }} />

        <FormGroup label={"Reassignments"}></FormGroup>
        <FormGroup label={"Notifications"}></FormGroup>

        <Divider inset={{ default: "insetXs" }} />

        <SlaDueDateInput element={userTask} />
        <AsyncCheckbox element={userTask} />
        <AdhocAutostartCheckbox element={userTask} />

        <Divider inset={{ default: "insetXs" }} />

        <MultiInstanceCheckbox element={userTask} />
        {userTask.loopCharacteristics?.__$$element === "multiInstanceLoopCharacteristics" && (
          <MultiInstanceProperties element={userTask} />
        )}
      </PropertiesPanelHeaderFormSection>

      <BidirectionalAssignmentsFormSection element={userTask} />

      <OnEntryAndExitScriptsFormSection element={userTask} />
    </>
  );
}
