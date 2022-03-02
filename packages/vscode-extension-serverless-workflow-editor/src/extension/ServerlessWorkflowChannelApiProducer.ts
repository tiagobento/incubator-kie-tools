/*
 * Copyright 2022 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as vscode from "vscode";
import { KogitoEditorChannelApiProducer } from "@kie-tools-core/vscode-extension/dist/KogitoEditorChannelApiProducer";
import { ServerlessWorkflowChannelApiImpl } from "./ServerlessWorkflowChannelApiImpl";
import { KogitoEditor } from "@kie-tools-core/vscode-extension/dist/KogitoEditor";
import { ResourceContentService, WorkspaceApi } from "@kie-tools-core/workspace/dist/api";
import { BackendProxy } from "@kie-tools-core/backend/dist/api";
import { NotificationsApi } from "@kie-tools-core/notifications/dist/api";
import { JavaCodeCompletionApi } from "@kie-tools-core/vscode-java-code-completion/dist/api";
import { I18n } from "@kie-tools-core/i18n/dist/core";
import { VsCodeI18n } from "@kie-tools-core/vscode-extension/dist/i18n";
import { Uri } from "vscode";
import { KogitoEditorChannelApi, KogitoEditorEnvelopeApi } from "@kie-tools-core/editor/dist/api";
import { lookupCatalogRegistry } from "./catalog";
import { ServiceCatalogChannelApiImpl } from "@kie-tools/service-catalog/src/channel";
import { EnvelopeServer } from "@kie-tools-core/envelope-bus/dist/channel";
import { ServiceCatalogChannelApi } from "@kie-tools/service-catalog/dist/api";

export class ServerlessWorkflowChannelApiProducer implements KogitoEditorChannelApiProducer {
  get(
    editor: KogitoEditor,
    resourceContentService: ResourceContentService,
    workspaceApi: WorkspaceApi,
    backendProxy: BackendProxy,
    notificationsApi: NotificationsApi,
    javaCodeCompletionApi: JavaCodeCompletionApi,
    viewType: string,
    i18n: I18n<VsCodeI18n>,
    initialBackup?: Uri
  ): KogitoEditorChannelApi {
    const registry = lookupCatalogRegistry({
      filePath: editor.document.uri.fsPath,
      specsStoragePath: vscode.workspace.getConfiguration().get("kogito.sw.specsStoragePath", "${fileDirname}/specs"),
    });

    const catalogEnvelopServer: EnvelopeServer<ServiceCatalogChannelApi, KogitoEditorEnvelopeApi> =
      editor.envelopeServer as unknown as EnvelopeServer<ServiceCatalogChannelApi, KogitoEditorEnvelopeApi>;

    return new ServerlessWorkflowChannelApiImpl(
      editor,
      resourceContentService,
      workspaceApi,
      backendProxy,
      notificationsApi,
      javaCodeCompletionApi,
      viewType,
      i18n,
      initialBackup,
      new ServiceCatalogChannelApiImpl(catalogEnvelopServer, registry)
    );
  }
}
