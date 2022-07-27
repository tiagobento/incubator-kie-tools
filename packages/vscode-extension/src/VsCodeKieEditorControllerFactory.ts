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

import * as vscode from "vscode";
import { Uri, Webview } from "vscode";
import * as __path from "path";
import { NotificationsChannelApi } from "@kie-tools-core/notifications/dist/api";
import { BackendProxy } from "@kie-tools-core/backend/dist/api";
import { WorkspaceChannelApi } from "@kie-tools-core/workspace/dist/api";
import { EditorEnvelopeLocator, EnvelopeMapping, KogitoEditorChannelApi } from "@kie-tools-core/editor/dist/api";
import { EnvelopeBusMessageBroadcaster } from "./EnvelopeBusMessageBroadcaster";
import { KogitoEditorDocument, VsCodeKieEditorController } from "./VsCodeKieEditorController";
import { VsCodeKieEditorStore } from "./VsCodeKieEditorStore";
import { I18n } from "@kie-tools-core/i18n/dist/core";
import { VsCodeI18n } from "./i18n";
import { JavaCodeCompletionApi } from "@kie-tools-core/vscode-java-code-completion/dist/api";
import {
  DefaultVsCodeEditorChannelApiProducer,
  VsCodeKieEditorChannelApiProducer,
} from "./VsCodeKieEditorChannelApiProducer";
import { VsCodeWorkspaceChannelApiImpl } from "@kie-tools-core/workspace/dist/vscode";

export class VsCodeKieEditorControllerFactory {
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly editorStore: VsCodeKieEditorStore,
    private readonly editorEnvelopeLocator: EditorEnvelopeLocator,
    private readonly messageBroadcaster: EnvelopeBusMessageBroadcaster,
    private readonly backendProxy: BackendProxy,
    private readonly notificationsChannelApi: NotificationsChannelApi,
    private readonly javaCodeCompletionApi: JavaCodeCompletionApi,
    private readonly viewType: string,
    private readonly i18n: I18n<VsCodeI18n>,
    private readonly channelApiProducer: VsCodeKieEditorChannelApiProducer = new DefaultVsCodeEditorChannelApiProducer()
  ) {}

  public configureNew(webviewPanel: vscode.WebviewPanel, document: KogitoEditorDocument) {
    webviewPanel.webview.options = {
      enableCommandUris: true,
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    const editorEnvelopeLocator = this.getEditorEnvelopeLocatorForWebview(webviewPanel.webview);
    const vscodeWorkspaceChannelApi = new VsCodeWorkspaceChannelApiImpl({
      path: document.document.uri.fsPath,
      workspacePath: vscode.workspace.asRelativePath(document.document.uri).replace(/\//g, __path.sep),
    });

    const envelopeMapping = editorEnvelopeLocator.getEnvelopeMapping(document.document.uri.fsPath);
    if (!envelopeMapping) {
      throw new Error(`No envelope mapping found for '${document.document.uri}'`);
    }

    const editor = new VsCodeKieEditorController(
      document,
      webviewPanel,
      this.context,
      this.editorStore,
      envelopeMapping,
      editorEnvelopeLocator,
      this.messageBroadcaster
    );

    const editorChannelApi = this.getChannelApi(editor, vscodeWorkspaceChannelApi);

    this.editorStore.addAsActive(editor);
    editor.startListening(editorChannelApi);
    editor.startInitPolling(editorChannelApi);
    editor.setupPanelActiveStatusChange();
    editor.setupPanelOnDidDispose();
    editor.setupWebviewContent();
    editor.startListeningToThemeChanges();
    editor.startListeningToDocumentChanges();
  }

  private getChannelApi(
    editor: VsCodeKieEditorController,
    workspaceChannelApi: WorkspaceChannelApi
  ): KogitoEditorChannelApi {
    return this.channelApiProducer.get(
      editor,
      workspaceChannelApi,
      this.backendProxy,
      this.notificationsChannelApi,
      this.javaCodeCompletionApi,
      this.viewType,
      this.i18n
    );
  }

  private getEditorEnvelopeLocatorForWebview(webview: vscode.Webview): EditorEnvelopeLocator {
    return new EditorEnvelopeLocator(
      this.editorEnvelopeLocator.targetOrigin,
      [...this.editorEnvelopeLocator.envelopeMappings].reduce((envelopeMappings, mapping) => {
        envelopeMappings.push(
          new EnvelopeMapping(
            mapping.type,
            mapping.filePathGlob,
            this.getWebviewPath(webview, mapping.envelopePath),
            this.getWebviewPath(webview, mapping.resourcesPathPrefix)
          )
        );
        return envelopeMappings;
      }, [] as EnvelopeMapping[])
    );
  }

  private getWebviewPath(webview: Webview, relativePath: string) {
    return webview.asWebviewUri(Uri.joinPath(this.context.extensionUri, relativePath)).toString();
  }
}
