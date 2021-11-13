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
import { useCallback, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router";
import { useGlobals } from "../common/GlobalContext";
import { EditorToolbar } from "./EditorToolbar";
import { useDmnTour } from "../tour";
import { useOnlineI18n } from "../common/i18n";
import { ChannelType } from "@kie-tooling-core/editor/dist/api";
import { EmbeddedEditor, EmbeddedEditorRef, useStateControlSubscription } from "@kie-tooling-core/editor/dist/embedded";
import { Alert, AlertActionLink } from "@patternfly/react-core/dist/js/components/Alert";
import { Page, PageSection } from "@patternfly/react-core/dist/js/components/Page";
import { DmnDevSandboxModalConfirmDeploy } from "./DmnDevSandbox/DmnDevSandboxModalConfirmDeploy";
import { EmbeddedEditorFile } from "@kie-tooling-core/editor/dist/channel";
import { DmnRunnerDrawer } from "./DmnRunner/DmnRunnerDrawer";
import { AlertsController, useAlert } from "./Alerts/Alerts";
import { useCancelableEffect, useController, usePrevious } from "../common/Hooks";
import { TextEditorModal } from "./TextEditor/TextEditorModal";
import { useWorkspaces } from "../workspace/WorkspacesContext";
import { ResourceContentRequest, ResourceListRequest } from "@kie-tooling-core/workspace/dist/api";
import { useWorkspaceFilePromise } from "../workspace/hooks/WorkspaceFileHooks";
import { PromiseStateWrapper } from "../workspace/hooks/PromiseState";
import { EditorPageErrorPage } from "./EditorPageErrorPage";
import { OnlineEditorPage } from "../home/pageTemplate/OnlineEditorPage";
import { useQueryParams } from "../queryParams/QueryParamsContext";
import { Text, TextContent, TextVariants } from "@patternfly/react-core/dist/js/components/Text";
import { Bullseye } from "@patternfly/react-core/dist/js/layouts/Bullseye";
import { Spinner } from "@patternfly/react-core/dist/js/components/Spinner";
import { Divider } from "@patternfly/react-core/dist/js/components/Divider";
import { EditorPageDockDrawer, EditorPageDockDrawerRef } from "./EditorPageDockDrawer";
import { DmnRunnerProvider } from "./DmnRunner/DmnRunnerProvider";

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
  const [editorPageDock, editorPageDockRef] = useController<EditorPageDockDrawerRef>();
  const [isTextEditorModalOpen, setTextEditorModalOpen] = useState(false);
  const [fileBroken, setFileBroken] = useState(false);

  const lastContent = useRef<string>();
  const workspaceFilePromise = useWorkspaceFilePromise(props.workspaceId, props.fileRelativePath);

  const [embeddedEditorFile, setEmbeddedEditorFile] = useState<EmbeddedEditorFile>();

  useDmnTour(!!editor?.isReady && workspaceFilePromise.data?.extension === "dmn" && !fileBroken);

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
  const uniqueFileId = workspaceFilePromise.data
    ? workspaces.getUniqueFileIdentifier(workspaceFilePromise.data)
    : undefined;

  const prevUniqueFileId = usePrevious(uniqueFileId);
  if (prevUniqueFileId !== uniqueFileId) {
    lastContent.current = undefined;
  }

  const saveContent = useCallback(async () => {
    if (!workspaceFilePromise.data || !editor) {
      return;
    }

    const content = await editor.getContent();
    const svgString = await editor.getPreview();

    lastContent.current = content;

    if (svgString) {
      await workspaces.svgService.createOrOverwriteSvg(workspaceFilePromise.data, svgString);
    }

    await workspaces.updateFile({
      fs: await workspaces.fsService.getWorkspaceFs(workspaceFilePromise.data.workspaceId),
      file: workspaceFilePromise.data,
      getNewContents: () => Promise.resolve(content),
    });
    editor?.getStateControl().setSavedCommand();
  }, [workspaces, editor, workspaceFilePromise]);

  useStateControlSubscription(
    editor,
    useCallback(
      (isDirty) => {
        if (!isDirty) {
          return;
        }

        saveContent();
      },
      [saveContent]
    ),
    { throttle: 200 }
  );

  useEffect(() => {
    alerts?.closeAll();
  }, [alerts]);

  useEffect(() => {
    setFileBroken(false);
    setContentErrorAlert.close();
  }, [uniqueFileId]);

  useEffect(() => {
    if (!editor?.isReady || !workspaceFilePromise.data) {
      return;
    }

    workspaceFilePromise.data.getFileContentsAsString().then((content) => {
      if (content !== "") {
        return;
      }
      saveContent();
    });
  }, [editor, saveContent, workspaceFilePromise]);

  const handleResourceContentRequest = useCallback(
    async (request: ResourceContentRequest) => {
      return workspaces.resourceContentGet({
        fs: await workspaces.fsService.getWorkspaceFs(props.workspaceId),
        workspaceId: props.workspaceId,
        relativePath: request.path,
        opts: request.opts,
      });
    },
    [props.workspaceId, workspaces]
  );

  const handleResourceListRequest = useCallback(
    async (request: ResourceListRequest) => {
      return workspaces.resourceContentList({
        fs: await workspaces.fsService.getWorkspaceFs(props.workspaceId),
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

    //FIXME: Removing this timeout makes the notifications not work some times. Need to investigate.
    setTimeout(() => {
      editor?.validate().then((notifications) => {
        editorPageDock
          ?.getNotificationsPanel()
          ?.getTab(i18n.terms.validation)
          ?.kogitoNotifications_setNotifications("", Array.isArray(notifications) ? notifications : []);
      });
    }, 200);
  }, [workspaceFilePromise, editor, i18n, editorPageDock]);

  const [inEditorNavigationStack, setInEditorNavigationStack] = useState<string[]>([]);

  const handleOpenFile = useCallback(
    async (relativePath: string) => {
      if (!workspaceFilePromise.data) {
        return;
      }

      const file = await workspaces.getFile({
        fs: await workspaces.fsService.getWorkspaceFs(workspaceFilePromise.data.workspaceId),
        workspaceId: workspaceFilePromise.data.workspaceId,
        relativePath,
      });

      if (!file) {
        throw new Error(`Can't find ${relativePath} on Workspace '${workspaceFilePromise.data.workspaceId}'`);
      }

      setInEditorNavigationStack((prev) => {
        // First navigation
        if (prev.length === 0) {
          return [workspaceFilePromise.data.relativePath, relativePath];
        }

        // This is for recursive paths. We should treat the recursive navigation as going back,
        // so we never have cycles.
        else if (prev.includes(relativePath)) {
          return [...prev.slice(0, prev.indexOf(workspaceFilePromise.data.relativePath) + 1), relativePath];
        }

        // Normally navigating to a different file.
        else {
          return [...prev, relativePath];
        }
      });

      history.push({
        pathname: globals.routes.workspaceWithFilePath.path({
          workspaceId: file.workspaceId,
          fileRelativePath: file.relativePathWithoutExtension,
          extension: file.extension,
        }),
      });
    },
    [workspaceFilePromise, workspaces, history, globals]
  );

  const handleSetContentError = useCallback(() => {
    setFileBroken(true);
    setContentErrorAlert.show();
  }, [setContentErrorAlert]);

  useEffect(() => {
    if (!workspaceFilePromise.data) {
      return;
    }

    setInEditorNavigationStack((prev) => {
      // When the open file is not a part of an in-editor navigation, we know the user has let go, so we reset.
      if (!prev.includes(workspaceFilePromise.data.relativePath)) {
        return [];
      }

      // Control of how to display the breadcrumb is done at EditorToolbar, so we don't ever need to shrink the array.
      // This also makes sure that the breadcrumb keeps working with back/forward buttons :)
      return prev;
    });
  }, [workspaceFilePromise]);

  return (
    <OnlineEditorPage>
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
            <DmnRunnerProvider workspaceFile={file} editorPageDock={editorPageDock}>
              <Page>
                <EditorToolbar
                  workspaceFile={file}
                  editor={editor}
                  alerts={alerts}
                  alertsRef={alertsRef}
                  editorPageDock={editorPageDock}
                  inEditorNavigationStack={inEditorNavigationStack}
                  setInEditorNavigationStack={setInEditorNavigationStack}
                />
                <Divider />
                <PageSection hasOverflowScroll={true} padding={{ default: "noPadding" }}>
                  <DmnRunnerDrawer workspaceFile={file} editorPageDock={editorPageDock}>
                    <EditorPageDockDrawer ref={editorPageDockRef} isEditorReady={editor?.isReady} workspaceFile={file}>
                      {embeddedEditorFile && (
                        <EmbeddedEditor
                          /* FIXME: By providing a different `key` everytime, we avoid calling `setContent` twice on the same Editor.
                           * This is by design, and after setContent supports multiple calls on the same instance, we can remove that.
                           */
                          key={workspaces.getUniqueFileIdentifier(file)}
                          ref={editorRef}
                          file={embeddedEditorFile}
                          kogitoWorkspace_openFile={handleOpenFile}
                          kogitoWorkspace_resourceContentRequest={handleResourceContentRequest}
                          kogitoWorkspace_resourceListRequest={handleResourceListRequest}
                          kogitoEditor_setContentError={handleSetContentError}
                          editorEnvelopeLocator={globals.editorEnvelopeLocator}
                          channelType={ChannelType.ONLINE_MULTI_FILE}
                          locale={locale}
                        />
                      )}
                    </EditorPageDockDrawer>
                  </DmnRunnerDrawer>
                </PageSection>
              </Page>
            </DmnRunnerProvider>
            <TextEditorModal
              editor={editor}
              workspaceFile={file}
              refreshEditor={refreshEditor}
              isOpen={isTextEditorModalOpen}
            />
            <DmnDevSandboxModalConfirmDeploy workspaceFile={file} alerts={alerts} />
          </>
        )}
      />
    </OnlineEditorPage>
  );
}
