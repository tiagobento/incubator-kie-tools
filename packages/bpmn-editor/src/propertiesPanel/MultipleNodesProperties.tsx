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

import { Button, ButtonVariant } from "@patternfly/react-core/dist/js/components/Button";
import { Form, FormGroup, FormSection } from "@patternfly/react-core/dist/js/components/Form";
import { Text, TextContent, TextVariants } from "@patternfly/react-core/dist/js/components/Text";
import { Truncate } from "@patternfly/react-core/dist/js/components/Truncate";
import { Flex } from "@patternfly/react-core/dist/js/layouts/Flex";
import { TimesIcon } from "@patternfly/react-icons/dist/js/icons/times-icon";
import * as React from "react";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../store/StoreContext";
import { SectionHeader } from "@kie-tools/xyflow-react-kie-diagram/dist/propertiesPanel/SectionHeader";

export function MultipleNodeProperties() {
  const [isSectionExpanded, setSectionExpanded] = React.useState<boolean>(true);

  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

  const size = useBpmnEditorStore((s) => s.computed(s).getDiagramData().selectedNodesById.size);

  return (
    <>
      <Form>
        <FormSection
          title={
            <SectionHeader
              fixed={true}
              isSectionExpanded={isSectionExpanded}
              toogleSectionExpanded={() => setSectionExpanded((prev) => !prev)}
              title={
                <Flex justifyContent={{ default: "justifyContentCenter" }}>
                  <TextContent>
                    <Text component={TextVariants.h4}>
                      <Truncate
                        content={`Multiple nodes selected (${size})`}
                        position={"middle"}
                        trailingNumChars={size.toString().length + 3}
                      />
                    </Text>
                  </TextContent>
                </Flex>
              }
              action={
                <Button
                  title={"Close"}
                  variant={ButtonVariant.plain}
                  onClick={() => {
                    bpmnEditorStoreApi.setState((state) => {
                      state.propertiesPanel.isOpen = false;
                    });
                  }}
                >
                  <TimesIcon />
                </Button>
              }
            />
          }
        >
          <FormSection>
            <FormGroup>... // TODO</FormGroup>
          </FormSection>
        </FormSection>
      </Form>
    </>
  );
}
