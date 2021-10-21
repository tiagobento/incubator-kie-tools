/*
 * Copyright 2019 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHistory } from "react-router";
import { useGlobals } from "../common/GlobalContext";
import { EditorToolbar } from "./EditorToolbar";
import { useDmnTour } from "../tour";
import { useOnlineI18n } from "../common/i18n";
import { ChannelType } from "@kie-tooling-core/editor/dist/api";
import { EmbeddedEditor, EmbeddedEditorRef, useStateControlSubscription } from "@kie-tooling-core/editor/dist/embedded";
import { DmnRunnerContextProvider } from "./DmnRunner/DmnRunnerContextProvider";
import { NotificationsPanel, NotificationsPanelController } from "./NotificationsPanel/NotificationsPanel";
import { Alert, AlertActionLink } from "@patternfly/react-core/dist/js/components/Alert";
import { Page, PageSection } from "@patternfly/react-core/dist/js/components/Page";
import { DmnDevSandboxContextProvider } from "./DmnDevSandbox/DmnDevSandboxContextProvider";
import { EmbeddedEditorFile } from "@kie-tooling-core/editor/dist/channel";
import { DmnRunnerDrawer } from "./DmnRunner/DmnRunnerDrawer";
import { Alerts, AlertsController, useAlert } from "./Alerts/Alerts";
import { useCancelableEffect, useController, usePrevious } from "../common/Hooks";
import { TextEditorModal } from "./TextEditor/TextEditorModal";
import { useWorkspaces } from "../workspace/WorkspacesContext";
import { ResourceContentRequest, ResourceListRequest } from "@kie-tooling-core/workspace/dist/api";
import { useWorkspaceFilePromise } from "../workspace/hooks/WorkspaceFileHooks";
import { PromiseStateWrapper } from "../workspace/hooks/PromiseState";
import { EditorPageErrorPage } from "./EditorPageErrorPage";
import { BusinessAutomationStudioPage } from "../home/pageTemplate/BusinessAutomationStudioPage";
import { useQueryParams } from "../queryParams/QueryParamsContext";
import { Text, TextContent, TextVariants } from "@patternfly/react-core/dist/js/components/Text";
import { Bullseye } from "@patternfly/react-core/dist/js/layouts/Bullseye";
import { Spinner } from "@patternfly/react-core/dist/js/components/Spinner";
import { Divider } from "@patternfly/react-core/dist/js/components/Divider";

export interface Props {
  workspaceId: string;
  fileRelativePath: string;
}

export function EditorPage(props: Props) {
  const globals = useGlobals();
  const history = useHistory();
  const workspaces = useWorkspaces();
  const { locale, i18n } = useOnlineI18n();
  const [editor, editorRef] = useController<EmbeddedEditorRef>();
  const [alerts, alertsRef] = useController<AlertsController>();
  const [notificationsPanel, notificationsPanelRef] = useController<NotificationsPanelController>();
  const [isTextEditorModalOpen, setTextEditorModalOpen] = useState(false);

  const lastContent = useRef<string>();
  const workspaceFilePromise = useWorkspaceFilePromise(props.workspaceId, props.fileRelativePath);

  const [embeddedEditorFile, setEmbeddedEditorFile] = useState<EmbeddedEditorFile>();

  useEffect(() => {
    alerts?.closeAll();
  }, [alerts]);

  useDmnTour(!editor?.isReady && workspaceFilePromise.data?.extension === "dmn");

  const setContentErrorAlert = useAlert(
    alerts,
    useCallback(() => {
      return (
        <Alert
          ouiaId="set-content-error-alert"
          variant="danger"
          title={i18n.editorPage.alerts.setContentError.title}
          actionLinks={
            <AlertActionLink data-testid="set-content-error-alert-button" onClick={() => setTextEditorModalOpen(true)}>
              {i18n.editorPage.alerts.setContentError.action}
            </AlertActionLink>
          }
        />
      );
    }, [i18n])
  );

  const queryParams = useQueryParams();

  // keep the page in sync with the name of `workspaceFilePromise`, even if changes
  useEffect(() => {
    if (!workspaceFilePromise.data) {
      return;
    }

    history.replace({
      pathname: globals.routes.workspaceWithFilePath.path({
        workspaceId: workspaceFilePromise.data.workspaceId,
        fileRelativePath: workspaceFilePromise.data.relativePathWithoutExtension,
        extension: workspaceFilePromise.data.extension,
      }),
      search: queryParams.toString(),
    });
  }, [history, globals, workspaceFilePromise, queryParams]);

  // update EmbeddedEditorFile, but only if content is different than what was saved
  useCancelableEffect(
    useCallback(
      ({ canceled }) => {
        if (!workspaceFilePromise.data) {
          return;
        }

        workspaceFilePromise.data.getFileContentsAsString().then((content) => {
          if (canceled.get()) {
            return;
          }

          if (content === lastContent.current) {
            return;
          }

          setEmbeddedEditorFile({
            path: workspaceFilePromise.data.relativePath,
            getFileContents: workspaceFilePromise.data.getFileContentsAsString,
            kind: "local",
            isReadOnly: false,
            fileExtension: workspaceFilePromise.data.extension,
            fileName: workspaceFilePromise.data.nameWithoutExtension,
          });
        });
      },
      [workspaceFilePromise]
    )
  );

  // auto-save
  const uniqueIdentifierOfFile = workspaceFilePromise.data
    ? workspaces.getUniqueFileIdentifier(workspaceFilePromise.data)
    : undefined;

  const prev = usePrevious(uniqueIdentifierOfFile);
  if (prev !== uniqueIdentifierOfFile) {
    lastContent.current = undefined;
  }

  useStateControlSubscription(
    editor,
    useCallback(
      async (isDirty) => {
        if (!isDirty || !workspaceFilePromise.data) {
          return;
        }

        const content = await editor?.getContent();
        lastContent.current = content;

        await workspaces.updateFile({
          fs: workspaces.fsService.getWorkspaceFs(workspaceFilePromise.data.workspaceId),
          file: workspaceFilePromise.data,
          getNewContents: () => Promise.resolve(content),
        });
        editor?.getStateControl().setSavedCommand();
      },
      [workspaces, editor, workspaceFilePromise]
    ),
    { throttle: 200 }
  );

  const onResourceContentRequest = useCallback(
    async (request: ResourceContentRequest) => {
      return workspaces.resourceContentGet({
        fs: workspaces.fsService.getWorkspaceFs(props.workspaceId),
        workspaceId: props.workspaceId,
        relativePath: request.path,
        opts: request.opts,
      });
    },
    [props.workspaceId, workspaces]
  );

  const onResourceListRequest = useCallback(
    (request: ResourceListRequest) => {
      return workspaces.resourceContentList({
        fs: workspaces.fsService.getWorkspaceFs(props.workspaceId),
        workspaceId: props.workspaceId,
        globPattern: request.pattern,
        opts: request.opts,
      });
    },
    [workspaces, props.workspaceId]
  );

  const refreshEditor = useCallback(() => {
    alerts?.closeAll();
    setTextEditorModalOpen(false);
  }, [alerts]);

  // validate
  useEffect(() => {
    if (workspaceFilePromise.data?.extension === "dmn" || !workspaceFilePromise.data || !editor?.isReady) {
      return;
    }

    //FIXME: tiago What to do?
    setTimeout(() => {
      editor?.validate().then((notifications) => {
        notificationsPanel
          ?.getTab(i18n.terms.validation)
          ?.kogitoNotifications_setNotifications("", Array.isArray(notifications) ? notifications : []);
      });
    }, 200);
  }, [workspaceFilePromise, notificationsPanel, editor, i18n]);

  const notificationsPanelTabNames = useMemo(() => {
    return [i18n.terms.validation, i18n.terms.execution];
  }, [i18n]);

  return (
    <BusinessAutomationStudioPage>
      <PageSection
        variant={"light"}
        isFilled={true}
        padding={{ default: "noPadding" }}
        className={"kogito--editor__page-section"}
      >
        <PromiseStateWrapper
          promise={workspaceFilePromise}
          pending={
            <Bullseye>
              <TextContent>
                <Bullseye>
                  <Spinner />
                </Bullseye>
                <br />
                <Text component={TextVariants.p}>{`Loading...`}</Text>
              </TextContent>
            </Bullseye>
          }
          rejected={(errors) => <EditorPageErrorPage errors={errors} path={props.fileRelativePath} />}
          resolved={(file) => (
            <>
              <DmnRunnerContextProvider workspaceFile={file} notificationsPanel={notificationsPanel}>
                <DmnDevSandboxContextProvider workspaceFile={file} alerts={alerts}>
                  <Page>
                    <EditorToolbar workspaceFile={file} editor={editor} alerts={alerts} alertsRef={alertsRef} />
                    <Divider />
                    <PageSection isFilled={true} padding={{ default: "noPadding" }}>
                      <DmnRunnerDrawer workspaceFile={file} notificationsPanel={notificationsPanel}>
                        {embeddedEditorFile && (
                          <EmbeddedEditor
                            //FIXME: There's a bug on the PMML Editor that prevents is from working after a setContent call.
                            key={
                              embeddedEditorFile.fileExtension === "pmml"
                                ? embeddedEditorFile.path
                                : embeddedEditorFile.fileExtension
                            }
                            ref={editorRef}
                            file={embeddedEditorFile}
                            kogitoWorkspace_resourceContentRequest={onResourceContentRequest}
                            kogitoWorkspace_resourceListRequest={onResourceListRequest}
                            kogitoEditor_setContentError={setContentErrorAlert.show}
                            editorEnvelopeLocator={globals.editorEnvelopeLocator}
                            channelType={ChannelType.VSCODE} // TODO CAPONETTO: Changed the channel type to test the Included Models (undo/redo do not work)
                            locale={locale}
                          />
                        )}
                        <NotificationsPanel ref={notificationsPanelRef} tabNames={notificationsPanelTabNames} />
                      </DmnRunnerDrawer>
                    </PageSection>
                  </Page>
                </DmnDevSandboxContextProvider>
              </DmnRunnerContextProvider>
              <TextEditorModal
                editor={editor}
                workspaceFile={file}
                refreshEditor={refreshEditor}
                isOpen={isTextEditorModalOpen}
              />
            </>
          )}
        />
      </PageSection>
    </BusinessAutomationStudioPage>
  );
}
