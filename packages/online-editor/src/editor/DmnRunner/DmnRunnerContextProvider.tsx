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

import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useKieToolingExtendedServices } from "../KieToolingExtendedServices/KieToolingExtendedServicesContext";
import { DmnFormSchema } from "@kogito-tooling/form/dist/dmn";
import { DmnRunnerContext } from "./DmnRunnerContext";
import { DmnRunnerService } from "./DmnRunnerService";
import { EmbeddedEditorRef, useStateControlSubscription } from "@kie-tooling-core/editor/dist/embedded";
import { DmnRunnerStatus } from "./DmnRunnerStatus";
import { useOnlineI18n } from "../../common/i18n";
import { Notification } from "@kie-tooling-core/notifications/dist/api";
import { useQueryParams } from "../../queryParams/QueryParamsContext";
import { useHistory } from "react-router";
import { useGlobals } from "../../common/GlobalContext";
import { QueryParams } from "../../common/Routes";
import { EmbeddedEditorFile } from "@kie-tooling-core/editor/dist/channel";
import { usePrevious } from "../../common/Hooks";
import { KieToolingExtendedServicesStatus } from "../KieToolingExtendedServices/KieToolingExtendedServicesStatus";
import { jsonParseWithDate } from "../../common/utils";
import { NotificationsPanelController } from "../NotificationsPanel/NotificationsPanel";

interface Props {
  children: React.ReactNode;
  editor: EmbeddedEditorRef | undefined;
  notificationsPanel: NotificationsPanelController | undefined;
  currentFile: EmbeddedEditorFile;
}

const THROTTLING_TIME = 200;

export function DmnRunnerContextProvider(props: Props) {
  const { i18n } = useOnlineI18n();
  const queryParams = useQueryParams();
  const history = useHistory();
  const globals = useGlobals();
  const kieToolingExtendedServices = useKieToolingExtendedServices();
  const [isDrawerExpanded, setDrawerExpanded] = useState(false);
  const [formData, setFormData] = useState<object>({});
  const [formSchema, setFormSchema] = useState<DmnFormSchema | undefined>(undefined);
  const [formError, setFormError] = useState(false);

  const status = useMemo(() => {
    return isDrawerExpanded ? DmnRunnerStatus.AVAILABLE : DmnRunnerStatus.UNAVAILABLE;
  }, [isDrawerExpanded]);

  const service = useMemo(
    () => new DmnRunnerService(kieToolingExtendedServices.baseUrl),
    [kieToolingExtendedServices.baseUrl]
  );

  const updateFormSchema = useCallback(() => {
    if (props.currentFile.fileExtension !== "dmn") {
      return;
    }

    if (!props.editor?.isReady) {
      return;
    }

    props.editor
      ?.getContent()
      .then((content) => service.formSchema(content))
      .then((newSchema) => setFormSchema(newSchema))
      .catch((err) => {
        console.error(err);
        setFormError(true);
      });
  }, [props.editor, service]);

  useEffect(() => {
    if (props.currentFile.fileExtension !== "dmn") {
      setDrawerExpanded(false);
      return;
    }

    updateFormSchema();
  }, [props.currentFile, updateFormSchema]);

  const validate = useCallback(() => {
    if (props.currentFile.fileExtension !== "dmn") {
      return;
    }

    props.editor
      ?.getContent()
      .then((content) => service.validate(content ?? ""))
      .then((validationResults) => {
        const notifications: Notification[] = validationResults.map((validationResult: any) => ({
          type: "PROBLEM",
          path: "",
          severity: validationResult.severity,
          message: `${validationResult.messageType}: ${validationResult.message}`,
        }));
        props.notificationsPanel
          ?.getTab(i18n.terms.validation)
          ?.kogitoNotifications_setNotifications("", notifications);
      });
  }, [props.editor, props.currentFile, props.notificationsPanel, service, i18n]);

  useStateControlSubscription(props.editor, validate, { throttle: THROTTLING_TIME });
  useStateControlSubscription(props.editor, updateFormSchema, { throttle: THROTTLING_TIME });

  useEffect(() => {
    if (props.currentFile.fileExtension !== "dmn") {
      return;
    }

    if (!props.editor?.isReady || kieToolingExtendedServices.status !== KieToolingExtendedServicesStatus.RUNNING) {
      props.notificationsPanel?.getTab(i18n.terms.validation)?.kogitoNotifications_setNotifications("", []);
      return;
    }
  }, [props.currentFile, props.editor, i18n, kieToolingExtendedServices, props.notificationsPanel]);

  useEffect(() => {
    if (!props.editor?.isReady || !formSchema || !queryParams.has(QueryParams.DMN_RUNNER_FORM_INPUTS)) {
      return;
    }

    try {
      setFormData(jsonParseWithDate(queryParams.get(QueryParams.DMN_RUNNER_FORM_INPUTS)!));
      setDrawerExpanded(true);
    } catch (e) {
      console.error(`Cannot parse "${QueryParams.DMN_RUNNER_FORM_INPUTS}"`, e);
    } finally {
      history.replace({
        pathname: globals.routes.editor.path({ extension: "dmn" }),
        search: globals.routes.editor.queryArgs(queryParams).without(QueryParams.DMN_RUNNER_FORM_INPUTS).toString(),
      });
    }
  }, [formSchema, props.editor, history, globals.routes, queryParams]);

  const prevKieToolingExtendedServicesStatus = usePrevious(kieToolingExtendedServices.status);
  useEffect(() => {
    if (
      prevKieToolingExtendedServicesStatus &&
      prevKieToolingExtendedServicesStatus !== KieToolingExtendedServicesStatus.AVAILABLE &&
      prevKieToolingExtendedServicesStatus !== KieToolingExtendedServicesStatus.RUNNING &&
      kieToolingExtendedServices.status === KieToolingExtendedServicesStatus.RUNNING
    ) {
      setDrawerExpanded(true);
    }

    if (
      kieToolingExtendedServices.status === KieToolingExtendedServicesStatus.STOPPED ||
      kieToolingExtendedServices.status === KieToolingExtendedServicesStatus.NOT_RUNNING
    ) {
      setDrawerExpanded(false);
    }
  }, [prevKieToolingExtendedServicesStatus, kieToolingExtendedServices.status]);

  return (
    <DmnRunnerContext.Provider
      value={{
        status,
        formSchema,
        isDrawerExpanded,
        setDrawerExpanded,
        formData,
        setFormData,
        service,
        formError,
        setFormError,
      }}
    >
      {props.children}
    </DmnRunnerContext.Provider>
  );
}
