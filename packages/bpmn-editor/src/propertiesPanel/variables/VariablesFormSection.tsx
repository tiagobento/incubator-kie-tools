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
import { Variables, WithVariables } from "./Variables";
import { SectionHeader } from "@kie-tools/xyflow-react-kie-diagram/dist/propertiesPanel/SectionHeader";
import { FormSection } from "@patternfly/react-core/dist/js/components/Form";
import { DomainIcon } from "@patternfly/react-icons/dist/js/icons/domain-icon";
import { useState } from "react";

export function VariablesFormSection({ p }: { p: undefined | WithVariables }) {
  const [isVariablesSectionExpanded, setVariablesSectionExpanded] = useState<boolean>(true);

  const variablesCount = p?.property?.length ?? 0;

  return (
    <>
      <FormSection
        title={
          <SectionHeader
            expands={true}
            isSectionExpanded={isVariablesSectionExpanded}
            toogleSectionExpanded={() => setVariablesSectionExpanded((prev) => !prev)}
            icon={<DomainIcon width={16} height={36} style={{ marginLeft: "12px" }} />}
            title={"Variables" + (variablesCount > 0 ? ` (${variablesCount})` : "")}
          />
        }
      >
        {isVariablesSectionExpanded && (
          <>
            <FormSection style={{ paddingLeft: "20px", marginTop: "20px", gap: 0 }}>
              <Variables p={p} />
            </FormSection>
          </>
        )}
      </FormSection>
    </>
  );
}
