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
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../../store/StoreContext";
import { FormGroup, FormSection } from "@patternfly/react-core/dist/js/components/Form";
import { TextArea } from "@patternfly/react-core/dist/js/components/TextArea";
import { useMemo, useState } from "react";
import { SectionHeader } from "@kie-tools/xyflow-react-kie-diagram/dist/propertiesPanel/SectionHeader";
import { CodeIcon } from "@patternfly/react-icons/dist/js/icons/code-icon";
import { Label } from "@patternfly/react-core/dist/js/components/Label";
import { CodeInput } from "../codeInput/CodeInput";
import "./OnEntryAndExitScriptsFormSection.css";
import { BPMN20__tProcess } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/types";
import { ElementFilter } from "@kie-tools/xml-parser-ts/dist/elementFilter";
import { Unpacked } from "@kie-tools/xyflow-react-kie-diagram/dist/tsExt/tsExt";
import { Normalized } from "../../normalization/normalize";

export type WithOnEntryAndExitScripts = Normalized<
  ElementFilter<
    Unpacked<NonNullable<BPMN20__tProcess["flowElement"]>>,
    | "callActivity"
    | "businessRuleTask"
    | "userTask"
    | "serviceTask"
    | "scriptTask"
    | "subProcess"
    | "transaction"
    | "adHocSubProcess"
  >
>;

export function OnEntryAndExitScriptsFormSection({ element }: { element: WithOnEntryAndExitScripts }) {
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

  const isReadOnly = useBpmnEditorStore((s) => s.settings.isReadOnly);

  const [isExpanded, setExpanded] = useState(false);

  return (
    <>
      <FormSection
        title={
          <SectionHeader
            expands={true}
            isSectionExpanded={isExpanded}
            toogleSectionExpanded={() => setExpanded((prev) => !prev)}
            icon={<CodeIcon width={16} height={36} style={{ marginLeft: "12px" }} />}
            title={"onEntry / onExit"}
          />
        }
      >
        {isExpanded && (
          <>
            <FormSection style={{ paddingLeft: "20px", marginTop: "20px", gap: 0 }}>
              <CodeInput
                label={"onEntry"}
                languages={["java"]}
                value={""}
                onChange={(newScript) => {
                  // TODO: Tiago
                }}
              />
              <br />
              <CodeInput
                label={"onExit"}
                languages={["java"]}
                value={""}
                onChange={(newScript) => {
                  // TODO: Tiago
                }}
              />
            </FormSection>
          </>
        )}
      </FormSection>
    </>
  );
}
