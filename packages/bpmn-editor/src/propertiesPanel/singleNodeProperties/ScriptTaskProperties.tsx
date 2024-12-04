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

import { BPMN20__tScriptTask } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import * as React from "react";
import { Normalized } from "../../normalization/normalize";
import { NameDocumentationAndId } from "../nameDocumentationAndId/NameDocumentationAndId";
import { BidirectionalAssignmentsFormSection } from "../assignments/AssignmentsFormSection";
import { OnEntryAndExitScriptsFormSection } from "../onEntryAndExitScripts/OnEntryAndExitScriptsFormSection";
import { PropertiesPanelHeaderFormSection } from "./_PropertiesPanelHeaderFormSection";
import { TaskIcon } from "../../diagram/nodes/NodeIcons";
import { Divider } from "@patternfly/react-core/dist/js/components/Divider";
import { CodeInput } from "../codeInput/CodeInput";
import { AdhocAutostartCheckbox } from "../adhocAutostartCheckbox/AdhocAutostartCheckbox";
import { AsyncCheckbox } from "../asyncCheckbox/AsyncCheckbox";

export function ScriptTaskProperties({
  scriptTask,
}: {
  scriptTask: Normalized<BPMN20__tScriptTask> & { __$$element: "scriptTask" };
}) {
  return (
    <>
      <PropertiesPanelHeaderFormSection
        title={scriptTask["@_name"] || "Script task"}
        icon={<TaskIcon variant={scriptTask.__$$element} isIcon={true} />}
      >
        <NameDocumentationAndId element={scriptTask} />

        <Divider inset={{ default: "insetXs" }} />

        <CodeInput
          label={"Script"}
          languages={["Java"]}
          value={""} // FIXME: Tiago
          onChange={(newScript) => {
            // FIXME: Tiago
          }}
        />

        <AsyncCheckbox element={scriptTask} />

        <AdhocAutostartCheckbox element={scriptTask} />
      </PropertiesPanelHeaderFormSection>
    </>
  );
}
