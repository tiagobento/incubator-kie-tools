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
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStatePrimary,
} from "@patternfly/react-core/dist/js/components/EmptyState";
import { Title } from "@patternfly/react-core/dist/js/components/Title";
import { Bullseye } from "@patternfly/react-core/dist/js/layouts/Bullseye";
import { AngleDoubleRightIcon } from "@patternfly/react-icons/dist/js/icons/angle-double-right-icon";
import { MousePointerIcon } from "@patternfly/react-icons/dist/js/icons/mouse-pointer-icon";
import { TimesIcon } from "@patternfly/react-icons/dist/js/icons/times-icon";
import { UserIcon } from "@patternfly/react-icons/dist/js/icons/user-icon";
import * as React from "react";
import { useBpmnEditorStoreApi } from "../store/StoreContext";

export function BpmnDiagramEmptyState({
  setShowEmptyState,
}: {
  setShowEmptyState: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

  return (
    <Bullseye
      style={{
        position: "absolute",
        width: "100%",
        pointerEvents: "none",
        zIndex: 1,
        height: "auto",
        marginTop: "120px",
      }}
    >
      <div className={"kie-bpmn-editor--diagram-empty-state"}>
        <Button
          title={"Close"}
          style={{
            position: "absolute",
            top: "8px",
            right: 0,
          }}
          variant={ButtonVariant.plain}
          icon={<TimesIcon />}
          onClick={() => setShowEmptyState(false)}
        />

        <EmptyState>
          <EmptyStateIcon icon={MousePointerIcon} />
          <Title size={"md"} headingLevel={"h4"}>
            {`This BPMN is empty`}
          </Title>
          <EmptyStateBody>Start by dragging nodes from the Palette</EmptyStateBody>
          <br />
          <EmptyStateBody>or</EmptyStateBody>
          <EmptyStatePrimary>
            <Button
              variant={ButtonVariant.link}
              icon={<UserIcon />}
              onClick={() => {
                // FIXME: Tiago: Implement (new human task)
              }}
            >
              New Human Task...
            </Button>
            <br />
            <Button
              variant={ButtonVariant.link}
              icon={<AngleDoubleRightIcon />}
              onClick={() => {
                // FIXME: Tiago: Implement (new stp)
              }}
            >
              New Straight-Through Process (STP)...
            </Button>
          </EmptyStatePrimary>
        </EmptyState>
      </div>
    </Bullseye>
  );
}
