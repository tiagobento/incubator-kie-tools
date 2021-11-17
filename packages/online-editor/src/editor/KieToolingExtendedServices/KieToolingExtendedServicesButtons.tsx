/*
 * Copyright 2021 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Dropdown, DropdownPosition, DropdownToggle } from "@patternfly/react-core/dist/js/components/Dropdown";
import * as React from "react";
import { useCallback, useMemo } from "react";
import { useOnlineI18n } from "../../i18n";
import { useDmnDevSandbox } from "../DmnDevSandbox/DmnDevSandboxContext";
import { useDmnDevSandboxDropdownItems } from "../DmnDevSandbox/DmnDevSandboxDropdownItems";
import { OpenShiftInstanceStatus } from "../../openshift/OpenShiftInstanceStatus";
import { useDmnRunnerState, useDmnRunnerDispatch } from "../DmnRunner/DmnRunnerContext";
import { FeatureDependentOnKieToolingExtendedServices } from "../../kieToolingExtendedServices/FeatureDependentOnKieToolingExtendedServices";
import {
  DependentFeature,
  useKieToolingExtendedServices,
} from "../../kieToolingExtendedServices/KieToolingExtendedServicesContext";
import { KieToolingExtendedServicesStatus } from "../../kieToolingExtendedServices/KieToolingExtendedServicesStatus";
import { useSettings } from "../../settings/SettingsContext";
import { Button, ButtonVariant } from "@patternfly/react-core/dist/js/components/Button";
import { DmnRunnerMode } from "../DmnRunner/DmnRunnerStatus";
import { EditorPageDockDrawerRef, PanelId } from "../EditorPageDockDrawer";
import { ActiveWorkspace } from "../../workspace/model/ActiveWorkspace";

interface Props {
  editorPageDock: EditorPageDockDrawerRef | undefined;
  workspace: ActiveWorkspace | undefined;
}

export function KieToolingExtendedServicesButtons(props: Props) {
  const { i18n } = useOnlineI18n();
  const kieToolingExtendedServices = useKieToolingExtendedServices();
  const dmnDevSandbox = useDmnDevSandbox();
  const dmnRunnerState = useDmnRunnerState();
  const dmnRunnerDispatch = useDmnRunnerDispatch();
  const settings = useSettings();
  const dmnDevSandboxDropdownItems = useDmnDevSandboxDropdownItems(props.workspace);

  const toggleDmnRunnerDrawer = useCallback(() => {
    if (kieToolingExtendedServices.status === KieToolingExtendedServicesStatus.RUNNING) {
      if (dmnRunnerState.mode === DmnRunnerMode.TABLE) {
        props.editorPageDock?.open(PanelId.DMN_RUNNER_TABULAR);
      } else {
        dmnRunnerDispatch.setExpanded((prev) => !prev);
      }
      return;
    }
    kieToolingExtendedServices.setInstallTriggeredBy(DependentFeature.DMN_RUNNER);
    kieToolingExtendedServices.setModalOpen(true);
  }, [dmnRunnerState.mode, dmnRunnerDispatch, kieToolingExtendedServices, props.editorPageDock]);

  const toggleDmnDevSandboxDropdown = useCallback(
    (isOpen: boolean) => {
      if (kieToolingExtendedServices.status === KieToolingExtendedServicesStatus.RUNNING) {
        dmnDevSandbox.setDropdownOpen(isOpen);
        return;
      }
      kieToolingExtendedServices.setInstallTriggeredBy(DependentFeature.DMN_DEV_SANDBOX);
      kieToolingExtendedServices.setModalOpen(true);
    },
    [dmnDevSandbox, kieToolingExtendedServices]
  );

  const isDevSandboxEnabled = useMemo(() => {
    return (
      kieToolingExtendedServices.status === KieToolingExtendedServicesStatus.RUNNING &&
      settings.openshift.status === OpenShiftInstanceStatus.CONNECTED
    );
  }, [kieToolingExtendedServices.status, settings.openshift.status]);

  return (
    <>
      <FeatureDependentOnKieToolingExtendedServices isLight={true} position="bottom">
        <Dropdown
          className={isDevSandboxEnabled ? "pf-m-active" : ""}
          onSelect={() => dmnDevSandbox.setDropdownOpen(false)}
          toggle={
            <DropdownToggle
              id="dmn-dev-sandbox-dropdown-button"
              onToggle={toggleDmnDevSandboxDropdown}
              data-testid="dmn-dev-sandbox-button"
            >
              Try on OpenShift
            </DropdownToggle>
          }
          isOpen={dmnDevSandbox.isDropdownOpen}
          position={DropdownPosition.right}
          dropdownItems={dmnDevSandboxDropdownItems}
        />
      </FeatureDependentOnKieToolingExtendedServices>
      <FeatureDependentOnKieToolingExtendedServices isLight={true} position="bottom">
        <Button
          id="dmn-runner-button"
          variant={ButtonVariant.control}
          onClick={toggleDmnRunnerDrawer}
          className={dmnRunnerState.isExpanded ? "pf-m-active" : ""}
          data-testid={"dmn-runner-button"}
        >
          {i18n.terms.run}
        </Button>
      </FeatureDependentOnKieToolingExtendedServices>
    </>
  );
}
