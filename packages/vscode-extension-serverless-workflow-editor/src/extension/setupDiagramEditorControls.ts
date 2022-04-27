import * as vscode from "vscode";
import {
  ShouldOpenDiagramEditorAutomaticallyConfiguration,
  SwfVsCodeExtensionConfiguration,
  WEBVIEW_EDITOR_VIEW_TYPE,
} from "./configuration";
import { COMMAND_IDS } from "./commandIds";
import { KogitoEditorStore } from "@kie-tools-core/vscode-extension";

async function openAsDiagramIfSwf(args: { textEditor: vscode.TextEditor; active: boolean }) {
  const isSwf = /^.*\.sw\.(json|yml|yaml)$/.test(args.textEditor.document.fileName);
  if (!isSwf) {
    return;
  }

  await vscode.commands.executeCommand("vscode.openWith", args.textEditor.document.uri, WEBVIEW_EDITOR_VIEW_TYPE, {
    viewColumn: vscode.ViewColumn.Beside,
    // the combination of these two properties below is IMPERATIVE for the good functioning of the preview mechanism.
    preserveFocus: !args.active,
    background: !args.active,
  });
}

async function maybeOpenAsDiagramIfSwf(args: {
  configuration: SwfVsCodeExtensionConfiguration;
  textEditor: vscode.TextEditor;
  active: boolean;
}) {
  if (
    args.configuration.shouldAutomaticallyOpenDiagramEditorAlongsideTextEditor() ===
    ShouldOpenDiagramEditorAutomaticallyConfiguration.ASK
  ) {
    await args.configuration.configureAutomaticallyOpenDiagramEditorAlongsideTextEditor();
  }

  if (
    args.configuration.shouldAutomaticallyOpenDiagramEditorAlongsideTextEditor() ===
    ShouldOpenDiagramEditorAutomaticallyConfiguration.DO_NOT_OPEN
  ) {
    return;
  }

  await openAsDiagramIfSwf(args);
}

export async function setupDiagramEditorControls(args: {
  context: vscode.ExtensionContext;
  configuration: SwfVsCodeExtensionConfiguration;
  kieToolsEditorStore: KogitoEditorStore;
}) {
  args.context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(async (textEditor) => {
      if (args.kieToolsEditorStore.activeEditor) {
        return;
      }

      if (
        args.configuration.shouldAutomaticallyOpenDiagramEditorAlongsideTextEditor() ===
        ShouldOpenDiagramEditorAutomaticallyConfiguration.OPEN_AUTOMATICALLY
      ) {
        args.kieToolsEditorStore.openEditors.forEach((kieToolsEditor) => {
          if (textEditor?.document.uri.toString() !== kieToolsEditor.document.document.uri.toString()) {
            kieToolsEditor.close();
          }
        });
      }

      if (!textEditor) {
        return;
      }

      await maybeOpenAsDiagramIfSwf({ configuration: args.configuration, textEditor, active: false });
    })
  );

  args.context.subscriptions.push(
    vscode.commands.registerCommand(COMMAND_IDS.openAsDiagram, async () => {
      if (vscode.window.activeTextEditor) {
        await openAsDiagramIfSwf({ textEditor: vscode.window.activeTextEditor, active: true });
      }
    })
  );

  args.context.subscriptions.push(
    vscode.commands.registerCommand(COMMAND_IDS.setupAutomaticallyOpenDiagramEditorAlongsideTextEditor, async () => {
      await args.configuration.configureAutomaticallyOpenDiagramEditorAlongsideTextEditor();
    })
  );

  args.context.subscriptions.push(
    vscode.commands.registerCommand(COMMAND_IDS.openAsSource, async (resourceUri) => {
      await vscode.commands.executeCommand("vscode.open", resourceUri, {
        viewColumn: vscode.ViewColumn.One, // Not ideal, but works well enough.
        preserveFocus: false,
        background: false,
      });
    })
  );

  if (vscode.window.activeTextEditor) {
    await maybeOpenAsDiagramIfSwf({
      configuration: args.configuration,
      textEditor: vscode.window.activeTextEditor,
      active: false,
    });
  }
}
