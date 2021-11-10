/*
 * Copyright 2019 Red Hat, Inc. and/or its affiliates.
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

import {
  Dropdown,
  DropdownGroup,
  DropdownItem,
  DropdownPosition,
  DropdownToggle,
} from "@patternfly/react-core/dist/js/components/Dropdown";
import { TextInput } from "@patternfly/react-core/dist/js/components/TextInput";
import { Title } from "@patternfly/react-core/dist/js/components/Title";
import { Tooltip } from "@patternfly/react-core/dist/js/components/Tooltip";
import {
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarItemProps,
} from "@patternfly/react-core/dist/js/components/Toolbar";
import { EllipsisVIcon } from "@patternfly/react-icons/dist/js/icons/ellipsis-v-icon";
import { SaveIcon } from "@patternfly/react-icons/dist/js/icons/save-icon";
import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOnlineI18n } from "../common/i18n";
import { KieToolingExtendedServicesButtons } from "./KieToolingExtendedServices/KieToolingExtendedServicesButtons";
import { useGlobals } from "../common/GlobalContext";
import { AuthStatus, useSettings } from "../settings/SettingsContext";
import { EmbeddedEditorRef, useDirtyState } from "@kie-tooling-core/editor/dist/embedded";
import { useHistory } from "react-router";
import { EmbedModal } from "./EmbedModal";
import { Alerts, AlertsController, useAlert } from "./Alerts/Alerts";
import { Alert, AlertActionCloseButton, AlertActionLink } from "@patternfly/react-core/dist/js/components/Alert";
import { useWorkspaces, WorkspaceFile } from "../workspace/WorkspacesContext";
import { SyncIcon } from "@patternfly/react-icons/dist/js/icons/sync-icon";
import { FolderIcon } from "@patternfly/react-icons/dist/js/icons/folder-icon";
import { ImageIcon } from "@patternfly/react-icons/dist/js/icons/image-icon";
import { DownloadIcon } from "@patternfly/react-icons/dist/js/icons/download-icon";
import { PlusIcon } from "@patternfly/react-icons/dist/js/icons/plus-icon";
import { GithubIcon } from "@patternfly/react-icons/dist/js/icons/github-icon";
import { ArrowCircleUpIcon } from "@patternfly/react-icons/dist/js/icons/arrow-circle-up-icon";
import { ColumnsIcon } from "@patternfly/react-icons/dist/js/icons/columns-icon";
import { Text, TextContent, TextVariants } from "@patternfly/react-core/dist/js/components/Text";
import { Flex, FlexItem } from "@patternfly/react-core/dist/js/layouts/Flex";
import { NewFileDropdownMenu } from "./NewFileDropdownMenu";
import { PageHeaderToolsItem, PageSection } from "@patternfly/react-core/dist/js/components/Page";
import { FileLabel } from "../workspace/components/FileLabel";
import { useWorkspacePromise } from "../workspace/hooks/WorkspaceHooks";
import { CheckCircleIcon } from "@patternfly/react-icons/dist/js/icons/check-circle-icon";
import { FileSwitcher } from "./FileSwitcher";
import { Divider } from "@patternfly/react-core/dist/js/components/Divider";
import { KieToolingExtendedServicesDropdownGroup } from "./KieToolingExtendedServices/KieToolingExtendedServicesDropdownGroup";
import { TrashIcon } from "@patternfly/react-icons/dist/js/icons/trash-icon";
import { CaretDownIcon } from "@patternfly/react-icons/dist/js/icons/caret-down-icon";
import { GIST_DEFAULT_BRANCH, GIST_ORIGIN_REMOTE_NAME, GIT_ORIGIN_REMOTE_NAME } from "../workspace/services/GitService";
import { WorkspaceKind } from "../workspace/model/WorkspaceOrigin";
import { PromiseStateWrapper } from "../workspace/hooks/PromiseState";
import { Spinner } from "@patternfly/react-core/dist/js/components/Spinner";
import { WorkspaceLabel } from "../workspace/components/WorkspaceLabel";
import { EditorPageDockDrawerRef } from "./EditorPageDockDrawer";
import { SyncAltIcon } from "@patternfly/react-icons/dist/js/icons/sync-alt-icon";
import { Button, ButtonVariant } from "@patternfly/react-core/dist/js/components/Button";
import { WorkspaceStatusIndicator } from "../workspace/components/WorkspaceStatusIndicator";
import { UrlType, useImportableUrl } from "../workspace/hooks/ImportableUrlHooks";
import { SettingsTabs } from "../settings/SettingsModalBody";
import { Location } from "history";
import { useNavigationBlockersBypass, useNavigationStatus, useNavigationStatusToggle } from "../navigation/Hooks";
import { ExternalLinkAltIcon } from "@patternfly/react-icons/dist/js/icons/external-link-alt-icon";

export interface Props {
  alerts: AlertsController | undefined;
  alertsRef: (controller: AlertsController) => void;
  editor: EmbeddedEditorRef | undefined;
  workspaceFile: WorkspaceFile;
  editorPageDock: EditorPageDockDrawerRef | undefined;
}

const showWhenSmall: ToolbarItemProps["visibility"] = {
  default: "visible",
  "2xl": "hidden",
  xl: "hidden",
  lg: "visible",
  md: "visible",
};

const hideWhenSmall: ToolbarItemProps["visibility"] = {
  default: "hidden",
  "2xl": "visible",
  xl: "visible",
  lg: "hidden",
  md: "hidden",
};

const hideWhenTiny: ToolbarItemProps["visibility"] = {
  default: "hidden",
  "2xl": "visible",
  xl: "visible",
  lg: "visible",
  md: "hidden",
};

export function EditorToolbar(props: Props) {
  const globals = useGlobals();
  const settings = useSettings();
  const history = useHistory();
  const workspaces = useWorkspaces();
  const [isShareDropdownOpen, setShareDropdownOpen] = useState(false);
  const [isSyncGitHubGistDropdownOpen, setSyncGitHubGistDropdownOpen] = useState(false);
  const [isSyncGitRepositoryDropdownOpen, setSyncGitRepositoryDropdownOpen] = useState(false);
  const [isLargeKebabOpen, setLargeKebabOpen] = useState(false);
  const [isSmallKebabOpen, setSmallKebabOpen] = useState(false);
  const [isEmbedModalOpen, setEmbedModalOpen] = useState(false);
  const { i18n } = useOnlineI18n();
  const isEdited = useDirtyState(props.editor);
  const downloadRef = useRef<HTMLAnchorElement>(null);
  const downloadAllRef = useRef<HTMLAnchorElement>(null);
  const downloadPreviewRef = useRef<HTMLAnchorElement>(null);
  const copyContentTextArea = useRef<HTMLTextAreaElement>(null);
  const [isNewFileDropdownMenuOpen, setNewFileDropdownMenuOpen] = useState(false);
  const workspacePromise = useWorkspacePromise(props.workspaceFile.workspaceId);
  const [isGitHubGistLoading, setGitHubGistLoading] = useState(false);

  const githubAuthInfo = useMemo(() => {
    if (settings.github.authStatus !== AuthStatus.SIGNED_IN) {
      return undefined;
    }

    return {
      username: settings.github.user!.login,
      password: settings.github.token!,
    };
  }, [settings.github]);

  const successfullyCreateGistAlert = useAlert(
    props.alerts,
    useCallback(
      ({ close }) => {
        if (workspacePromise.data?.descriptor.origin.kind !== WorkspaceKind.GITHUB_GIST) {
          return <></>;
        }

        const gistUrl = workspacePromise.data?.descriptor.origin.url.toString();
        return (
          <Alert
            variant="success"
            title={i18n.editorPage.alerts.createGist}
            actionClose={<AlertActionCloseButton onClose={close} />}
            actionLinks={<AlertActionLink onClick={() => window.open(gistUrl, "_blank")}>{gistUrl}</AlertActionLink>}
          />
        );
      },
      [i18n, workspacePromise]
    ),
    { durationInSeconds: 4 }
  );

  const loadingGistAlert = useAlert(
    props.alerts,
    useCallback(
      ({ close }) => {
        if (workspacePromise.data?.descriptor.origin.kind !== WorkspaceKind.GITHUB_GIST) {
          return <></>;
        }

        const gistUrl = workspacePromise.data?.descriptor.origin.url.toString();
        return (
          <Alert
            variant="info"
            title={
              <>
                <Spinner size={"sm"} />
                &nbsp;&nbsp; Updating gist...
              </>
            }
            actionClose={<AlertActionCloseButton onClose={close} />}
            actionLinks={<AlertActionLink onClick={() => window.open(gistUrl, "_blank")}>{gistUrl}</AlertActionLink>}
          />
        );
      },
      [i18n, workspacePromise]
    )
  );

  useEffect(() => {
    if (isGitHubGistLoading) {
      loadingGistAlert.show();
    } else {
      loadingGistAlert.close();
    }
  }, [isGitHubGistLoading, loadingGistAlert]);

  const successfullyUpdateGistAlert = useAlert(
    props.alerts,
    useCallback(
      ({ close }) => {
        if (workspacePromise.data?.descriptor.origin.kind !== WorkspaceKind.GITHUB_GIST) {
          return <></>;
        }

        const gistUrl = workspacePromise.data?.descriptor.origin.url.toString();
        return (
          <Alert
            variant="success"
            title={i18n.editorPage.alerts.updateGist}
            actionClose={<AlertActionCloseButton onClose={close} />}
            actionLinks={<AlertActionLink onClick={() => window.open(gistUrl, "_blank")}>{gistUrl}</AlertActionLink>}
          />
        );
      },
      [i18n, workspacePromise]
    ),
    { durationInSeconds: 4 }
  );

  const errorAlert = useAlert(
    props.alerts,
    useCallback(
      ({ close }) => (
        <Alert
          variant="danger"
          title={i18n.editorPage.alerts.error}
          actionClose={<AlertActionCloseButton onClose={close} />}
        />
      ),
      [i18n]
    )
  );

  const shouldIncludeDownloadSvgDropdownItem = useMemo(() => {
    return props.workspaceFile.extension.toLowerCase() !== "pmml";
  }, [props.workspaceFile]);

  const shouldIncludeEmbedDropdownItem = useMemo(() => {
    return props.workspaceFile.extension.toLowerCase() !== "pmml";
  }, [props.workspaceFile]);

  const onDownload = useCallback(() => {
    props.editor?.getStateControl().setSavedCommand();
    props.alerts?.closeAll();
    props.workspaceFile.getFileContents().then((content) => {
      if (downloadRef.current) {
        const fileBlob = new Blob([content], { type: "text/plain" });
        downloadRef.current.href = URL.createObjectURL(fileBlob);
        downloadRef.current.click();
      }
    });
  }, [props.editor, props.workspaceFile, props.alerts]);

  const downloadWorkspaceZip = useCallback(async () => {
    if (!props.editor) {
      return;
    }

    const fs = await workspaces.fsService.getWorkspaceFs(props.workspaceFile.workspaceId);
    const zipBlob = await workspaces.prepareZip({ fs, workspaceId: props.workspaceFile.workspaceId });
    if (downloadAllRef.current) {
      downloadAllRef.current.href = URL.createObjectURL(zipBlob);
      downloadAllRef.current.click();
    }
    if (workspacePromise.data?.descriptor.origin.kind === WorkspaceKind.LOCAL) {
      await workspaces.createSavePoint({ fs, workspaceId: props.workspaceFile.workspaceId });
    }
  }, [props.editor, props.workspaceFile, workspaces, workspacePromise.data]);

  const downloadSvg = useCallback(() => {
    props.editor?.getPreview().then((previewSvg) => {
      if (downloadPreviewRef.current && previewSvg) {
        const fileBlob = new Blob([previewSvg], { type: "image/svg+xml" });
        downloadPreviewRef.current.href = URL.createObjectURL(fileBlob);
        downloadPreviewRef.current.click();
      }
    });
  }, [props.editor]);

  const updateGitHubGist = useCallback(async () => {
    try {
      if (!githubAuthInfo) {
        return;
      }

      setGitHubGistLoading(true);
      const fs = await workspaces.fsService.getWorkspaceFs(props.workspaceFile.workspaceId);

      //TODO: Check if there are new changes in the Gist before force-pushing.

      await workspaces.gitService.push({
        fs,
        dir: await workspaces.getAbsolutePath({ workspaceId: props.workspaceFile.workspaceId }),
        remote: GIST_ORIGIN_REMOTE_NAME,
        remoteRef: `refs/heads/${GIST_DEFAULT_BRANCH}`,
        force: true,
        authInfo: githubAuthInfo,
      });

      await workspaces.createSavePoint({ fs, workspaceId: props.workspaceFile.workspaceId });
    } catch (e) {
      errorAlert.show();
      throw e;
    } finally {
      setGitHubGistLoading(false);
      setSyncGitHubGistDropdownOpen(false);
    }

    successfullyUpdateGistAlert.show();
  }, [successfullyUpdateGistAlert, workspaces, props.workspaceFile.workspaceId, githubAuthInfo, errorAlert]);

  const createGitHubGist = useCallback(async () => {
    try {
      if (!githubAuthInfo) {
        return;
      }
      setGitHubGistLoading(true);
      const gist = await settings.github.octokit.gists.create({
        description: workspacePromise.data?.descriptor.name ?? "",
        public: true,

        // This file is used just for creating the Gist. The `push -f` overwrites it.
        files: {
          "README.md": {
            content: `
This Gist was created from Kogito Tooling .NEW. 

This file is temporary and you should not be seeing it. 
If you are, it means that creating this Gist failed and it can safely be deleted.
`,
          },
        },
      });

      if (!gist.data.git_push_url) {
        throw new Error("Gist creation failed.");
      }

      await workspaces.descriptorService.turnIntoGist(props.workspaceFile.workspaceId, new URL(gist.data.git_push_url));

      const fs = await workspaces.fsService.getWorkspaceFs(props.workspaceFile.workspaceId);
      const workspaceRootDirPath = await workspaces.getAbsolutePath({ workspaceId: props.workspaceFile.workspaceId });

      await workspaces.gitService.addRemote({
        fs,
        dir: workspaceRootDirPath,
        url: gist.data.git_push_url,
        name: GIST_ORIGIN_REMOTE_NAME,
        force: true,
      });

      await workspaces.gitService.branch({
        fs,
        dir: workspaceRootDirPath,
        checkout: true,
        name: GIST_DEFAULT_BRANCH,
      });

      await workspaces.createSavePoint({
        fs: fs,
        workspaceId: props.workspaceFile.workspaceId,
      });

      await workspaces.gitService.push({
        fs: fs,
        dir: workspaceRootDirPath,
        remote: GIST_ORIGIN_REMOTE_NAME,
        remoteRef: `refs/heads/${GIST_DEFAULT_BRANCH}`,
        force: true,
        authInfo: githubAuthInfo,
      });

      successfullyCreateGistAlert.show();

      return;
    } catch (err) {
      errorAlert.show();
      throw err;
    } finally {
      setGitHubGistLoading(false);
    }
  }, [
    settings.github.octokit,
    workspacePromise,
    workspaces,
    props.workspaceFile.workspaceId,
    githubAuthInfo,
    successfullyCreateGistAlert,
    errorAlert,
  ]);

  const openEmbedModal = useCallback(() => {
    setEmbedModalOpen(true);
  }, []);

  const workspaceHasNestedDirectories = useMemo(
    () => workspacePromise.data?.files.filter((f) => f.relativePath !== f.name).length !== 0,
    [workspacePromise]
  );

  const canCreateGitRepository = useMemo(
    () =>
      settings.github.authStatus === AuthStatus.SIGNED_IN &&
      (workspacePromise.data?.descriptor.origin.kind === WorkspaceKind.LOCAL ||
        workspacePromise.data?.descriptor.origin.kind === WorkspaceKind.GITHUB_GIST),
    [workspacePromise, settings.github.authStatus]
  );

  const canCreateGitHubGist = useMemo(
    () =>
      settings.github.authStatus === AuthStatus.SIGNED_IN &&
      workspacePromise.data?.descriptor.origin.kind === WorkspaceKind.LOCAL &&
      !workspaceHasNestedDirectories,
    [workspacePromise, settings.github.authStatus, workspaceHasNestedDirectories]
  );

  const canUpdateGitHubGist = useMemo(
    () =>
      settings.github.authStatus === AuthStatus.SIGNED_IN &&
      workspacePromise.data?.descriptor.origin.kind === WorkspaceKind.GITHUB_GIST &&
      !workspaceHasNestedDirectories,
    [workspacePromise, settings.github.authStatus, workspaceHasNestedDirectories]
  );

  const shareDropdownItems = useMemo(
    () => [
      <DropdownGroup key={"download-group"} label="Download">
        <DropdownItem
          onClick={onDownload}
          key={"download-file-item"}
          description={`${props.workspaceFile.name} will be downloaded`}
          icon={<DownloadIcon />}
        >
          Current file
        </DropdownItem>
        {shouldIncludeDownloadSvgDropdownItem && (
          <DropdownItem
            key={`dropdown-download-svg`}
            data-testid="dropdown-download-svg"
            component="button"
            onClick={downloadSvg}
            description={`Image of ${props.workspaceFile.name} will be downloaded in SVG format`}
            icon={<ImageIcon />}
          >
            {"Current file's SVG"}
          </DropdownItem>
        )}
        <DropdownItem
          onClick={downloadWorkspaceZip}
          key={"download-zip-item"}
          description={`A zip file including all files will be downloaded`}
          icon={<FolderIcon />}
        >
          All files
        </DropdownItem>
      </DropdownGroup>,
      ...(shouldIncludeEmbedDropdownItem
        ? [
            <Divider key={"divider-other-group"} />,
            <DropdownGroup key={"other-group"} label="Other">
              <DropdownItem
                key={`dropdown-embed`}
                data-testid="dropdown-embed"
                component="button"
                onClick={openEmbedModal}
                icon={<ColumnsIcon />}
              >
                {i18n.editorToolbar.embed}...
              </DropdownItem>
            </DropdownGroup>,
          ]
        : []),
      ...(workspacePromise.data?.descriptor.origin.kind === WorkspaceKind.LOCAL ||
      workspacePromise.data?.descriptor.origin.kind === WorkspaceKind.GITHUB_GIST
        ? [
            <DropdownGroup key={"github-group"} label={i18n.names.github}>
              <Tooltip
                data-testid={"create-github-repository-tooltip"}
                key={`dropdown-create-github-repository`}
                content={<div>{`You can't create a repository because you're not authenticated with GitHub.`}</div>}
                trigger={!canCreateGitRepository ? "mouseenter click" : ""}
                position="left"
              >
                <DropdownItem
                  icon={<GithubIcon />}
                  data-testid={"create-github-repository-button"}
                  component="button"
                  onClick={() => {
                    console.info("Creating GitHub repo...");
                  }}
                  isDisabled={!canCreateGitRepository}
                >
                  Create Repository...
                </DropdownItem>
              </Tooltip>
              <Tooltip
                data-testid={"create-github-gist-tooltip"}
                key={`dropdown-create-github-gist`}
                content={<div>{i18n.editorToolbar.cantCreateGistTooltip}</div>}
                trigger={!canCreateGitHubGist ? "mouseenter click" : ""}
                position="left"
              >
                <DropdownItem
                  icon={<GithubIcon />}
                  data-testid={"create-github-gist-button"}
                  component="button"
                  onClick={createGitHubGist}
                  isDisabled={!canCreateGitHubGist}
                >
                  {i18n.editorToolbar.createGist}
                </DropdownItem>
              </Tooltip>
            </DropdownGroup>,
          ]
        : []),
    ],
    [
      onDownload,
      workspacePromise,
      props.workspaceFile,
      shouldIncludeDownloadSvgDropdownItem,
      downloadSvg,
      downloadWorkspaceZip,
      shouldIncludeEmbedDropdownItem,
      openEmbedModal,
      i18n,
      canCreateGitHubGist,
      canCreateGitRepository,
      createGitHubGist,
    ]
  );

  useEffect(() => {
    if (!workspacePromise.data) {
      return;
    }
    if (downloadRef.current) {
      downloadRef.current.download = `${props.workspaceFile.name}`;
    }
    if (downloadAllRef.current) {
      downloadAllRef.current.download = `${workspacePromise.data.descriptor.name}.zip`;
    }
    if (downloadPreviewRef.current) {
      downloadPreviewRef.current.download = `${props.workspaceFile.name}.svg`;
    }
  }, [props.workspaceFile, workspacePromise.data]);

  const deleteWorkspaceFile = useCallback(async () => {
    if (!workspacePromise.data) {
      return;
    }

    if (workspacePromise.data.files.length === 1) {
      await workspaces.deleteWorkspace({ workspaceId: props.workspaceFile.workspaceId });
      history.push({ pathname: globals.routes.home.path({}) });
      return;
    }

    const nextFile = workspacePromise.data.files
      .filter((f) => {
        return (
          f.relativePath !== props.workspaceFile.relativePath &&
          Array.from(globals.editorEnvelopeLocator.mapping.keys()).includes(f.extension)
        );
      })
      .pop();

    await workspaces.deleteFile({
      fs: await workspaces.fsService.getWorkspaceFs(props.workspaceFile.workspaceId),
      file: props.workspaceFile,
    });

    if (!nextFile) {
      history.push({ pathname: globals.routes.home.path({}) });
      return;
    }

    history.push({
      pathname: globals.routes.workspaceWithFilePath.path({
        workspaceId: nextFile.workspaceId,
        fileRelativePath: nextFile.relativePathWithoutExtension,
        extension: nextFile.extension,
      }),
    });
  }, [globals, history, workspacePromise.data, props.workspaceFile, workspaces]);

  const workspaceNameRef = useRef<HTMLInputElement>(null);

  const resetWorkspaceName = useCallback(() => {
    if (workspaceNameRef.current && workspacePromise.data) {
      workspaceNameRef.current.value = workspacePromise.data.descriptor.name;
    }
  }, [workspacePromise.data]);

  useEffect(resetWorkspaceName, [resetWorkspaceName]);

  const onRenameWorkspace = useCallback(
    async (newName: string | undefined) => {
      if (!newName) {
        resetWorkspaceName();
        return;
      }

      if (!workspacePromise.data || newName === workspacePromise.data.descriptor.name) {
        return;
      }

      await workspaces.renameWorkspace({
        workspaceId: workspacePromise.data.descriptor.workspaceId,
        newName: newName.trim(),
      });
    },
    [workspacePromise.data, workspaces, resetWorkspaceName]
  );

  const onWorkspaceNameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();
      if (e.keyCode === 13 /* Enter */) {
        e.currentTarget.blur();
      } else if (e.keyCode === 27 /* ESC */) {
        resetWorkspaceName();
        e.currentTarget.blur();
      }
    },
    [resetWorkspaceName]
  );

  const deleteFileDropdownItem = useMemo(() => {
    return (
      <DropdownItem key={"delete-dropdown-item"} onClick={deleteWorkspaceFile}>
        <Flex flexWrap={{ default: "nowrap" }}>
          <FlexItem>
            <TrashIcon />
            &nbsp;&nbsp;Delete <b>{`"${props.workspaceFile.nameWithoutExtension}"`}</b>
          </FlexItem>
          <FlexItem>
            <b>
              <FileLabel extension={props.workspaceFile.extension} />
            </b>
          </FlexItem>
        </Flex>
      </DropdownItem>
    );
  }, [deleteWorkspaceFile, props.workspaceFile]);

  const createSavePointDropdownItem = useMemo(() => {
    return (
      <DropdownItem
        key={"commit-dropdown-item"}
        icon={<SaveIcon />}
        onClick={async () =>
          workspaces.createSavePoint({
            fs: await workspaces.fsService.getWorkspaceFs(props.workspaceFile.workspaceId),
            workspaceId: props.workspaceFile.workspaceId,
          })
        }
        description={"Create a save point"}
      >
        Commit
      </DropdownItem>
    );
  }, [workspaces, props.workspaceFile]);

  const canPushToGitRepository = useMemo(() => githubAuthInfo, [githubAuthInfo]);

  const pushingAlert = useAlert(
    props.alerts,
    useCallback(
      ({ close }) => {
        if (workspacePromise.data?.descriptor.origin.kind !== WorkspaceKind.GIT) {
          return <></>;
        }

        return (
          <Alert
            variant="info"
            title={
              <>
                <Spinner size={"sm"} />
                &nbsp;&nbsp; {`Pushing to '${workspacePromise.data?.descriptor.origin.url}'...`}
              </>
            }
          />
        );
      },
      [workspacePromise]
    )
  );

  const pushSuccessAlert = useAlert(
    props.alerts,
    useCallback(
      ({ close }) => {
        if (workspacePromise.data?.descriptor.origin.kind !== WorkspaceKind.GIT) {
          return <></>;
        }

        return <Alert variant="success" title={`Pushed to '${workspacePromise.data?.descriptor.origin.url}'`} />;
      },
      [workspacePromise]
    ),
    { durationInSeconds: 4 }
  );

  const pushErrorAlert = useAlert(
    props.alerts,
    useCallback(
      ({ close }) => {
        if (workspacePromise.data?.descriptor.origin.kind !== WorkspaceKind.GIT) {
          return <></>;
        }

        return (
          <Alert
            variant="danger"
            title={`Error pushing to '${workspacePromise.data?.descriptor.origin.url}'`}
            actionClose={<AlertActionCloseButton onClose={close} />}
          />
        );
      },
      [workspacePromise]
    )
  );

  const pullingAlert = useAlert(
    props.alerts,
    useCallback(
      ({ close }) => {
        if (workspacePromise.data?.descriptor.origin.kind !== WorkspaceKind.GIT) {
          return <></>;
        }

        return (
          <Alert
            variant="info"
            title={
              <>
                <Spinner size={"sm"} />
                &nbsp;&nbsp; {`Pulling from '${workspacePromise.data?.descriptor.origin.url}'...`}
              </>
            }
          />
        );
      },
      [workspacePromise]
    )
  );

  const pullSuccessAlert = useAlert(
    props.alerts,
    useCallback(
      ({ close }) => {
        if (workspacePromise.data?.descriptor.origin.kind !== WorkspaceKind.GIT) {
          return <></>;
        }

        return <Alert variant="success" title={`Pulled from '${workspacePromise.data?.descriptor.origin.url}'`} />;
      },
      [workspacePromise]
    ),
    { durationInSeconds: 4 }
  );

  const pushNewBranch = useCallback(
    async (newBranchName: string) => {
      if (!githubAuthInfo || !workspacePromise.data) {
        return;
      }

      try {
        pushingAlert.show();
        const fs = await workspaces.fsService.getWorkspaceFs(props.workspaceFile.workspaceId);
        const workspaceRootDirPath = await workspaces.getAbsolutePath({ workspaceId: props.workspaceFile.workspaceId });

        await workspaces.createSavePoint({
          fs: fs,
          workspaceId: props.workspaceFile.workspaceId,
        });

        await workspaces.gitService.branch({
          fs,
          dir: workspaceRootDirPath,
          checkout: false,
          name: newBranchName,
        });

        await workspaces.gitService.push({
          fs: fs,
          dir: workspaceRootDirPath,
          remote: GIT_ORIGIN_REMOTE_NAME,
          remoteRef: `refs/heads/${newBranchName}`,
          ref: newBranchName,
          force: false,
          authInfo: githubAuthInfo,
        });

        history.push({
          pathname: globals.routes.importModel.path({}),
          search: globals.routes.importModel.queryString({
            url: `${workspacePromise.data.descriptor.origin.url}`,
            branch: newBranchName,
          }),
        });
      } finally {
        pushingAlert.close();
      }
    },
    [githubAuthInfo, globals, history, props.workspaceFile.workspaceId, workspacePromise, workspaces, pushingAlert]
  );

  const pullErrorAlert = useAlert<{ newBranchName: string }>(
    props.alerts,
    useCallback(
      ({ close }, { newBranchName }) => {
        if (workspacePromise.data?.descriptor.origin.kind !== WorkspaceKind.GIT) {
          return <></>;
        }

        return (
          <Alert
            variant="danger"
            title={`Error pulling from '${workspacePromise.data?.descriptor.origin.url}'`}
            actionClose={<AlertActionCloseButton onClose={close} />}
            actionLinks={
              <>
                {canPushToGitRepository && (
                  <AlertActionLink onClick={() => pushNewBranch(newBranchName)}>
                    {`Switch to '${newBranchName}'`}
                  </AlertActionLink>
                )}

                {!canPushToGitRepository && (
                  <AlertActionLink onClick={() => settings.open(SettingsTabs.GITHUB)}>
                    {`Configure GitHub token...`}
                  </AlertActionLink>
                )}
              </>
            }
          >
            This usually happens when your branch has conflicts with the upstream branch.
            <br />
            <br />
            {canPushToGitRepository && `You can still save your work to a new branch.`}
            {!canPushToGitRepository &&
              `To be able to save your work on a new branch, please authenticate with GitHub.`}
          </Alert>
        );
      },
      [canPushToGitRepository, pushNewBranch, settings, workspacePromise]
    )
  );

  const pullFromGitRepository = useCallback(
    async (args: { showAlerts: boolean }) => {
      pullingAlert.close();
      pullErrorAlert.close();
      pullSuccessAlert.close();

      if (args.showAlerts) {
        pullingAlert.show();
      }
      await workspaces.createSavePoint({
        fs: await workspaces.fsService.getWorkspaceFs(props.workspaceFile.workspaceId),
        workspaceId: props.workspaceFile.workspaceId,
      });

      try {
        await workspaces.pull({
          fs: await workspaces.fsService.getWorkspaceFs(props.workspaceFile.workspaceId),
          workspaceId: props.workspaceFile.workspaceId,
          authInfo: githubAuthInfo,
        });

        if (args.showAlerts) {
          pullSuccessAlert.show();
        }
      } catch (e) {
        console.error(e);
        if (args.showAlerts) {
          const randomString = (Math.random() + 1).toString(36).substring(7);
          const newBranchName = `${workspacePromise.data?.descriptor.origin.branch}-${randomString}`;
          pullErrorAlert.show({ newBranchName });
        }
        // TODO: Lock workspace and give the user an option to start from another fresh one with a new branch.
      } finally {
        if (args.showAlerts) {
          pullingAlert.close();
        }
      }
    },
    [
      pullingAlert,
      pullErrorAlert,
      pullSuccessAlert,
      workspaces,
      props.workspaceFile.workspaceId,
      githubAuthInfo,
      workspacePromise,
    ]
  );

  const pushToGitRepository = useCallback(async () => {
    pushingAlert.close();
    pushErrorAlert.close();
    pushSuccessAlert.close();

    if (!githubAuthInfo) {
      return;
    }

    pushingAlert.show();
    try {
      const workspaceId = props.workspaceFile.workspaceId;
      await workspaces.createSavePoint({
        fs: await workspaces.fsService.getWorkspaceFs(workspaceId),
        workspaceId: workspaceId,
      });

      const workspace = await workspaces.descriptorService.get(workspaceId);
      await workspaces.gitService.push({
        fs: await workspaces.fsService.getWorkspaceFs(workspaceId),
        dir: await workspaces.service.getAbsolutePath({ workspaceId }),
        ref: workspace.origin.branch,
        remote: GIST_ORIGIN_REMOTE_NAME,
        remoteRef: `refs/heads/${workspace.origin.branch}`,
        force: false,
        authInfo: githubAuthInfo,
      });
      await pullFromGitRepository({ showAlerts: false });
      pushSuccessAlert.show();
    } catch (e) {
      console.error(e);
      pushErrorAlert.show();
    } finally {
      pushingAlert.close();
    }
  }, [
    pullFromGitRepository,
    githubAuthInfo,
    props.workspaceFile,
    pushErrorAlert,
    pushSuccessAlert,
    pushingAlert,
    workspaces,
  ]);

  const navigationStatus = useNavigationStatus();
  const navigationBlockersBypass = useNavigationBlockersBypass();
  const navigationStatusToggle = useNavigationStatusToggle();
  const confirmNavigationAlert = useAlert<{ lastBlockedLocation: Location }>(
    props.alerts,
    useCallback(
      (_, { lastBlockedLocation }) => (
        <Alert
          data-testid="unsaved-alert"
          variant="warning"
          title={
            workspacePromise.data?.descriptor.origin.kind === WorkspaceKind.LOCAL
              ? i18n.editorPage.alerts.unsaved.titleLocal
              : i18n.editorPage.alerts.unsaved.titleGit
          }
          actionClose={
            <AlertActionCloseButton data-testid="unsaved-alert-close-button" onClose={navigationStatusToggle.unblock} />
          }
          actionLinks={
            <>
              <Divider inset={{ default: "insetMd" }} />
              <br />
              {(workspacePromise.data?.descriptor.origin.kind === WorkspaceKind.LOCAL && (
                <AlertActionLink
                  data-testid="unsaved-alert-save-button"
                  onClick={() => {
                    navigationStatusToggle.unblock();
                    return downloadWorkspaceZip();
                  }}
                  style={{ fontWeight: "bold" }}
                >
                  {`${i18n.terms.download} '${workspacePromise.data?.descriptor.name}'`}
                </AlertActionLink>
              )) || (
                <>
                  {!canPushToGitRepository && (
                    <AlertActionLink onClick={() => settings.open(SettingsTabs.GITHUB)}>
                      {`Configure GitHub token...`}
                    </AlertActionLink>
                  )}
                  {canPushToGitRepository && (
                    <AlertActionLink
                      onClick={() => {
                        navigationStatusToggle.unblock();
                        return pushToGitRepository();
                      }}
                      style={{ fontWeight: "bold" }}
                    >
                      {`Push to '${GIT_ORIGIN_REMOTE_NAME}/${workspacePromise.data?.descriptor.origin.branch}'`}
                    </AlertActionLink>
                  )}
                </>
              )}
              <br />
              <br />
              <AlertActionLink
                data-testid="unsaved-alert-close-without-save-button"
                onClick={() =>
                  navigationBlockersBypass.execute(() => {
                    history.push(lastBlockedLocation);
                  })
                }
              >
                {i18n.editorPage.alerts.unsaved.proceedAnyway}
              </AlertActionLink>
              <br />
              <br />
            </>
          }
        >
          <br />
          <p>{i18n.editorPage.alerts.unsaved.message}</p>
        </Alert>
      ),
      [
        canPushToGitRepository,
        downloadWorkspaceZip,
        history,
        i18n,
        navigationStatusToggle,
        navigationBlockersBypass,
        pushToGitRepository,
        settings,
        workspacePromise,
      ]
    )
  );

  useEffect(() => {
    if (navigationStatus.lastBlockedLocation) {
      confirmNavigationAlert.show({ lastBlockedLocation: navigationStatus.lastBlockedLocation });
    } else {
      confirmNavigationAlert.close();
    }
  }, [confirmNavigationAlert, navigationStatus]);

  const workspaceImportableUrl = useImportableUrl(workspacePromise.data?.descriptor.origin.url?.toString());

  const [isVsCodeDropdownOpen, setVsCodeDropdownOpen] = useState(false);

  return (
    <PromiseStateWrapper
      promise={workspacePromise}
      resolved={(workspace) => (
        <>
          <Alerts ref={props.alertsRef} width={"500px"} />
          <PageSection type={"nav"} variant={"light"} padding={{ default: "noPadding" }}>
            {workspace && workspace.files.length > 1 && (
              <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} style={{ marginLeft: "16px" }}>
                <FlexItem>
                  <WorkspaceLabel descriptor={workspace.descriptor} />
                  <div data-testid={"toolbar-title-workspace"} className={"kogito--editor__toolbar-name-container"}>
                    <Title
                      aria-label={"EmbeddedEditorFile name"}
                      headingLevel={"h3"}
                      size={"md"}
                      style={{ fontStyle: "italic" }}
                    >
                      {workspace.descriptor.name}
                    </Title>
                    <TextInput
                      ref={workspaceNameRef}
                      type={"text"}
                      aria-label={"Edit workspace name"}
                      onKeyDown={onWorkspaceNameKeyDown}
                      className={"kogito--editor__toolbar-subtitle"}
                      onBlur={(e) => onRenameWorkspace(e.target.value)}
                      style={{ fontStyle: "italic" }}
                    />
                  </div>
                  <WorkspaceStatusIndicator workspace={workspace} />
                </FlexItem>
                {/*<Divider inset={{ default: "insetMd" }} isVertical={true} />*/}
                {workspace.descriptor.origin.kind === WorkspaceKind.GIT &&
                  workspaceImportableUrl.type === UrlType.GITHUB && (
                    <FlexItem>
                      <Toolbar style={{ padding: 0 }}>
                        <ToolbarItem>
                          <Dropdown
                            onSelect={() => setVsCodeDropdownOpen(false)}
                            toggle={
                              <DropdownToggle toggleIndicator={null} onToggle={setVsCodeDropdownOpen}>
                                <Button
                                  variant={ButtonVariant.link}
                                  icon={
                                    <img
                                      style={{ width: "14px" }}
                                      alt="vscode-logo-blue"
                                      src={globals.routes.static.images.vscodeLogoBlue.path({})}
                                    />
                                  }
                                >
                                  {`Open "${workspace.descriptor.name}"`}
                                  &nbsp; &nbsp;
                                  <CaretDownIcon />
                                </Button>
                              </DropdownToggle>
                            }
                            isOpen={isVsCodeDropdownOpen}
                            isPlain
                            dropdownItems={[
                              <DropdownGroup key={"open-in-vscode"}>
                                <a
                                  href={`https://vscode.dev/github${workspace.descriptor.origin.url.pathname}/tree/${workspace.descriptor.origin.branch}`}
                                  target={"_blank"}
                                >
                                  <DropdownItem icon={<ExternalLinkAltIcon />}>vscode.dev</DropdownItem>
                                </a>
                                {/*<a*/}
                                {/*  href={`vscode://vscode.git/clone?url=${workspace.descriptor.origin.url.toString()}&branch=${workspace.descriptor.origin.branch}`}*/}
                                {/*  target={"_blank"}*/}
                                {/*>*/}
                                {/*  <DropdownItem icon={<ExternalLinkAltIcon />}>VS Code Desktop</DropdownItem>*/}
                                {/*</a>*/}
                              </DropdownGroup>,
                            ]}
                          />
                        </ToolbarItem>
                      </Toolbar>
                    </FlexItem>
                  )}
              </Flex>
            )}
          </PageSection>
          <PageSection type={"nav"} variant={"light"} style={{ paddingTop: 0, paddingBottom: "16px" }}>
            <Flex
              justifyContent={{ default: "justifyContentSpaceBetween" }}
              alignItems={{ default: "alignItemsCenter" }}
              flexWrap={{ default: "nowrap" }}
            >
              <FlexItem>
                <PageHeaderToolsItem visibility={{ default: "visible" }}>
                  <Flex flexWrap={{ default: "nowrap" }} alignItems={{ default: "alignItemsCenter" }}>
                    <FlexItem>
                      <FileSwitcher workspace={workspace} workspaceFile={props.workspaceFile} />
                    </FlexItem>
                    <FlexItem>
                      {(isEdited && (
                        <Tooltip content={"Saving file..."} position={"bottom"}>
                          <TextContent
                            style={{ color: "gray", ...(!props.workspaceFile ? { visibility: "hidden" } : {}) }}
                          >
                            <Text
                              aria-label={"Saving file..."}
                              data-testid="is-saving-indicator"
                              component={TextVariants.small}
                            >
                              <span>
                                <SyncIcon size={"sm"} />
                              </span>
                              &nbsp;
                              <span>Saving...</span>
                            </Text>
                          </TextContent>
                        </Tooltip>
                      )) || (
                        <Tooltip content={"File is saved"} position={"bottom"}>
                          <TextContent
                            style={{ color: "gray", ...(!props.workspaceFile ? { visibility: "hidden" } : {}) }}
                          >
                            <Text
                              aria-label={"File is saved"}
                              data-testid="is-saved-indicator"
                              component={TextVariants.small}
                            >
                              <span>
                                <CheckCircleIcon size={"sm"} />
                              </span>
                              <ToolbarItem visibility={hideWhenTiny}>
                                &nbsp;
                                <span>Saved</span>
                              </ToolbarItem>
                            </Text>
                          </TextContent>
                        </Tooltip>
                      )}
                    </FlexItem>
                  </Flex>
                </PageHeaderToolsItem>
              </FlexItem>
              <FlexItem>
                <Toolbar>
                  <ToolbarContent style={{ paddingRight: 0 }}>
                    <ToolbarItem>
                      <Dropdown
                        position={"right"}
                        isOpen={isNewFileDropdownMenuOpen}
                        toggle={
                          <DropdownToggle
                            onToggle={setNewFileDropdownMenuOpen}
                            isPrimary={true}
                            toggleIndicator={CaretDownIcon}
                          >
                            <PlusIcon />
                            &nbsp;&nbsp;New file
                          </DropdownToggle>
                        }
                      >
                        <NewFileDropdownMenu
                          alerts={props.alerts}
                          workspaceId={props.workspaceFile.workspaceId}
                          destinationDirPath={props.workspaceFile.relativeDirPath}
                          onAddFile={async (file) => {
                            setNewFileDropdownMenuOpen(false);
                            if (!file) {
                              return;
                            }

                            history.push({
                              pathname: globals.routes.workspaceWithFilePath.path({
                                workspaceId: file.workspaceId,
                                fileRelativePath: file.relativePathWithoutExtension,
                                extension: file.extension,
                              }),
                            });
                          }}
                        />
                      </Dropdown>
                    </ToolbarItem>
                    <ToolbarItem visibility={hideWhenSmall}>
                      {props.workspaceFile.extension === "dmn" && (
                        <KieToolingExtendedServicesButtons
                          workspace={workspace}
                          editorPageDock={props.editorPageDock}
                        />
                      )}
                    </ToolbarItem>
                    {workspace.descriptor.origin.kind === WorkspaceKind.GITHUB_GIST && (
                      <ToolbarItem>
                        <Dropdown
                          onSelect={() => setSyncGitHubGistDropdownOpen(false)}
                          isOpen={isSyncGitHubGistDropdownOpen}
                          position={DropdownPosition.right}
                          toggle={
                            <DropdownToggle
                              id={"sync-dropdown"}
                              data-testid={"sync-dropdown"}
                              onToggle={(isOpen) => setSyncGitHubGistDropdownOpen(isOpen)}
                            >
                              Sync
                            </DropdownToggle>
                          }
                          dropdownItems={[
                            <DropdownGroup key={"sync-gist-dropdown-group"}>
                              <Tooltip
                                data-testid={"gist-it-tooltip"}
                                content={<div>{i18n.editorToolbar.cantUpdateGistTooltip}</div>}
                                trigger={!canUpdateGitHubGist ? "mouseenter click" : ""}
                                position="left"
                              >
                                <DropdownItem
                                  icon={<GithubIcon />}
                                  onClick={updateGitHubGist}
                                  isDisabled={!canUpdateGitHubGist}
                                >
                                  Update Gist
                                </DropdownItem>
                              </Tooltip>
                            </DropdownGroup>,
                          ]}
                        />
                      </ToolbarItem>
                    )}
                    {workspace.descriptor.origin.kind === WorkspaceKind.GIT && (
                      <ToolbarItem>
                        <Dropdown
                          onSelect={() => setSyncGitRepositoryDropdownOpen(false)}
                          isOpen={isSyncGitRepositoryDropdownOpen}
                          position={DropdownPosition.right}
                          toggle={
                            <DropdownToggle
                              id={"sync-dropdown"}
                              data-testid={"sync-dropdown"}
                              onToggle={(isOpen) => setSyncGitRepositoryDropdownOpen(isOpen)}
                            >
                              Sync
                            </DropdownToggle>
                          }
                          dropdownItems={[
                            <DropdownGroup key={"sync-gist-dropdown-group"}>
                              <DropdownItem
                                icon={<SyncAltIcon />}
                                onClick={() => pullFromGitRepository({ showAlerts: true })}
                                description={`Get new changes made upstream at '${GIT_ORIGIN_REMOTE_NAME}/${workspace.descriptor.origin.branch}'.`}
                              >
                                Pull
                              </DropdownItem>
                              <Tooltip
                                data-testid={"gist-it-tooltip"}
                                content={
                                  <div>{`You need to be signed in with GitHub to push to this repository.`}</div>
                                }
                                trigger={!canPushToGitRepository ? "mouseenter click" : ""}
                                position="left"
                              >
                                <DropdownItem
                                  icon={<ArrowCircleUpIcon />}
                                  onClick={pushToGitRepository}
                                  isDisabled={!canPushToGitRepository}
                                  description={`Send your changes upstream to '${GIT_ORIGIN_REMOTE_NAME}/${workspace.descriptor.origin.branch}'.`}
                                >
                                  Push
                                </DropdownItem>
                              </Tooltip>
                            </DropdownGroup>,
                          ]}
                        />
                      </ToolbarItem>
                    )}
                    <ToolbarItem visibility={hideWhenSmall}>
                      <Dropdown
                        onSelect={() => setShareDropdownOpen(false)}
                        isOpen={isShareDropdownOpen}
                        dropdownItems={shareDropdownItems}
                        position={DropdownPosition.right}
                        toggle={
                          <DropdownToggle
                            id={"share-dropdown"}
                            data-testid={"share-dropdown"}
                            onToggle={(isOpen) => setShareDropdownOpen(isOpen)}
                          >
                            {i18n.editorToolbar.share}
                          </DropdownToggle>
                        }
                      />
                    </ToolbarItem>
                    <ToolbarItem visibility={hideWhenSmall} style={{ marginRight: 0 }}>
                      <KebabDropdown
                        id={"kebab-lg"}
                        state={[isLargeKebabOpen, setLargeKebabOpen]}
                        items={[deleteFileDropdownItem, <Divider key={"divider-0"} />, createSavePointDropdownItem]}
                      />
                    </ToolbarItem>
                    <ToolbarItem visibility={showWhenSmall} style={{ marginRight: 0 }}>
                      <KebabDropdown
                        id={"kebab-sm"}
                        state={[isSmallKebabOpen, setSmallKebabOpen]}
                        items={[
                          deleteFileDropdownItem,
                          <Divider key={"divider-0"} />,
                          createSavePointDropdownItem,
                          <Divider key={"divider-1"} />,
                          ...shareDropdownItems,
                          ...(props.workspaceFile.extension !== "dmn"
                            ? []
                            : [
                                <Divider key={"divider-2"} />,
                                <KieToolingExtendedServicesDropdownGroup
                                  workspace={workspace}
                                  key="kie-tooling-extended-services-group"
                                />,
                              ]),
                        ]}
                      />
                    </ToolbarItem>
                  </ToolbarContent>
                </Toolbar>
              </FlexItem>
            </Flex>
          </PageSection>
          <EmbedModal
            workspace={workspace.descriptor}
            workspaceFile={props.workspaceFile}
            isOpen={isEmbedModalOpen}
            onClose={() => setEmbedModalOpen(false)}
          />
          <textarea ref={copyContentTextArea} style={{ height: 0, position: "absolute", zIndex: -1 }} />
          <a ref={downloadRef} />
          <a ref={downloadAllRef} />
          <a ref={downloadPreviewRef} />
        </>
      )}
    />
  );
}

export function KebabDropdown(props: {
  id: string;
  items: React.ReactNode[];
  state: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
}) {
  return (
    <Dropdown
      className={"kogito-tooling--masthead-hoverable"}
      isOpen={props.state[0]}
      isPlain={true}
      position={DropdownPosition.right}
      onSelect={() => props.state[1](false)}
      toggle={
        <DropdownToggle
          id={props.id}
          toggleIndicator={null}
          onToggle={(isOpen) => props.state[1](isOpen)}
          ouiaId={props.id}
        >
          <EllipsisVIcon />
        </DropdownToggle>
      }
      dropdownItems={props.items}
    />
  );
}
