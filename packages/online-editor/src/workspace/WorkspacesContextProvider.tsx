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

import { ContentType, ResourceContent, ResourcesList } from "@kie-tooling-core/workspace/dist/api";
import * as React from "react";
import { useCallback, useEffect, useMemo } from "react";
import { FileHandler } from "./handler/FileHandler";
import { GitRepositoryFileHandler } from "./handler/GitRepositoryFileHandler";
import { LocalFileHandler } from "./handler/LocalFileHandler";
import { WorkspaceDescriptor } from "./model/WorkspaceDescriptor";
import { WorkspaceKind } from "./model/WorkspaceOrigin";
import { GitService } from "./services/GitService";
import { StorageService } from "./services/StorageService";
import { WorkspaceService } from "./services/WorkspaceService";
import { SUPPORTED_FILES } from "./SupportedFiles";
import { LocalFile, WorkspaceFile, WorkspacesContext } from "./WorkspacesContext";
import { useSettings } from "../settings/SettingsContext";
import { SupportedFileExtensions } from "../common/GlobalContext";
import { extractFileExtension } from "../common/utils";
import { emptyTemplates } from "./FileTemplates";

const INDEXED_DB_NAME = "kogito-online";
const GIT_CORS_PROXY = "https://cors.isomorphic-git.org"; // TODO CAPONETTO: Deploy our own proxy (https://github.com/isomorphic-git/cors-proxy)

const MAX_NEW_FILE_INDEX_ATTEMPTS = 10;
const NEW_WORKSPACE_DEFAULT_NAME = `Untitled Folder`;

interface Props {
  children: React.ReactNode;
}

export function WorkspacesContextProvider(props: Props) {
  const settings = useSettings();

  const storageService = useMemo(() => new StorageService(INDEXED_DB_NAME), []);
  const workspaceService = useMemo(() => new WorkspaceService(storageService), [storageService]);
  const gitService = useMemo(() => new GitService(GIT_CORS_PROXY, storageService), [storageService]);

  const createWorkspace = useCallback(
    async (descriptor: WorkspaceDescriptor, fileHandler: FileHandler) => {
      const files = await workspaceService.create(descriptor, fileHandler, { broadcast: true });
      if (files.length > 0) {
        return files.sort((a, b) => a.path.localeCompare(b.path))[0];
      } else {
        return undefined;
      }
    },
    [workspaceService]
  );

  const createWorkspaceFromLocal = useCallback(
    async (files: LocalFile[]) => {
      const descriptor: WorkspaceDescriptor = {
        workspaceId: workspaceService.newContext(),
        name: NEW_WORKSPACE_DEFAULT_NAME,
        origin: { kind: WorkspaceKind.LOCAL },
        createdDateISO: new Date().toISOString(),
        lastUpdatedDateISO: new Date().toISOString(),
      };

      const supportedFiles = files.filter((file) => SUPPORTED_FILES.includes(extractFileExtension(file.path)!));
      const fileHandler = new LocalFileHandler({
        files: supportedFiles,
        workspaceService: workspaceService,
      });
      const suggestedFirstFile = await createWorkspace(descriptor, fileHandler);
      return { descriptor, suggestedFirstFile };
    },
    [createWorkspace, workspaceService]
  );

  const createWorkspaceFromGitHubRepository = useCallback(
    async (repositoryUrl: URL, sourceBranch: string) => {
      if (!settings.github.user) {
        throw new Error("User not authenticated on GitHub");
      }

      const descriptor: WorkspaceDescriptor = {
        workspaceId: workspaceService.newContext(),
        name: NEW_WORKSPACE_DEFAULT_NAME,
        origin: { url: repositoryUrl, branch: sourceBranch, kind: WorkspaceKind.GITHUB_REPOSITORY },
        createdDateISO: new Date().toISOString(),
        lastUpdatedDateISO: new Date().toISOString(),
      };

      const authInfo = {
        name: settings.github.user.name,
        email: settings.github.user.email,
        onAuth: () => ({
          username: settings.github.user!.login,
          password: settings.github.token!,
        }),
      };

      const fileHandler = new GitRepositoryFileHandler({
        authInfo: authInfo,
        repositoryUrl: repositoryUrl,
        sourceBranch: sourceBranch,
        gitService: gitService,
        workspaceService: workspaceService,
      });
      await createWorkspace(descriptor, fileHandler);
      return descriptor;
    },
    [workspaceService, settings.github.user, settings.github.token, gitService, createWorkspace]
  );

  const renameFile = useCallback(
    async (file: WorkspaceFile, newFileName: string) => {
      return await workspaceService.renameFile(file, newFileName, { broadcast: true });
    },
    [workspaceService]
  );

  const updateFile = useCallback(
    async (file: WorkspaceFile, getNewContents: () => Promise<string>) => {
      const updatedFile = new WorkspaceFile({ path: file.path, getFileContents: getNewContents });
      await workspaceService.updateFile(updatedFile, { broadcast: true });
    },
    [workspaceService]
  );

  const addEmptyFile = useCallback(
    async (workspaceId: string, fileExtension: SupportedFileExtensions) => {
      const descriptor = (await workspaceService.get(workspaceId))!;
      const contextPath = await workspaceService.resolveContextPath(descriptor);

      for (let i = 0; i < MAX_NEW_FILE_INDEX_ATTEMPTS; i++) {
        const index = i === 0 ? "" : `-${i}`;
        const path = `${contextPath}/Untitled${index}.${fileExtension}`;
        if (await workspaceService.exists(path)) {
          continue;
        }
        const contents =
          fileExtension in emptyTemplates
            ? emptyTemplates[fileExtension as keyof typeof emptyTemplates]
            : emptyTemplates.default;

        const newEmptyFile = new WorkspaceFile({ path, getFileContents: () => Promise.resolve(contents) });
        await workspaceService.createFile(newEmptyFile, { broadcast: true });
        return newEmptyFile;
      }

      throw new Error("Max attempts of new empty file exceeded.");
    },
    [workspaceService]
  );

  const prepareZip = useCallback(
    async (workspaceId: string) => {
      const descriptor = (await workspaceService.get(workspaceId))!;
      return await workspaceService.prepareZip(descriptor);
    },
    [workspaceService]
  );

  // const syncWorkspace = useCallback(async () => {
  //   if (!active) {
  //     throw new Error("No active workspace");
  //   }
  //
  //   if (active.descriptor.origin.kind === WorkspaceKind.GITHUB_REPOSITORY) {
  //     const origin = active.descriptor.origin as GitHubRepositoryOrigin;
  //     const fileHandler = new GitRepositoryFileHandler({
  //       authInfo: authInfo,
  //       repositoryUrl: origin.url,
  //       sourceBranch: origin.branch,
  //       gitService: gitService,
  //       workspaceService: workspaceService,
  //       storageService: storageService,
  //     });
  //     await fileHandler.sync(active.descriptor);
  //   }
  // }, [active, authInfo, gitService, storageService, workspaceService]);

  const resourceContentGet = useCallback(
    async (path: string) => {
      const file = await workspaceService.getFile(path);

      if (!file) {
        throw new Error(`File ${path} not found`);
      }

      const content = await file.getFileContents();
      return new ResourceContent(path, content, ContentType.TEXT);
    },
    [workspaceService]
  );

  const resourceContentList = useCallback(
    async (workspaceId: string, globPattern: string) => {
      const descriptor = (await workspaceService.get(workspaceId))!;
      const files = await workspaceService.listFiles(descriptor, globPattern);
      const matchingPaths = files.map((file: WorkspaceFile) => file.path);
      return new ResourcesList(globPattern, matchingPaths);
    },
    [workspaceService]
  );

  useEffect(() => {
    workspaceService.init();
  }, [workspaceService]);

  const value = useMemo(() => {
    return {
      workspaceService,
      resourceContentGet,
      resourceContentList,
      renameFile,
      createWorkspaceFromLocal,
      createWorkspaceFromGitHubRepository,
      addEmptyFile,
      updateFile,
      prepareZip,
    };
  }, [
    addEmptyFile,
    createWorkspaceFromGitHubRepository,
    createWorkspaceFromLocal,
    prepareZip,
    renameFile,
    resourceContentGet,
    resourceContentList,
    updateFile,
    workspaceService,
  ]);

  return <WorkspacesContext.Provider value={value}>{props.children}</WorkspacesContext.Provider>;
}
