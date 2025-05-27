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

import * as __path from "path";
import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as BpmnEditor from "@kie-tools/bpmn-editor/dist/BpmnEditor";
import { normalize, Normalized } from "@kie-tools/bpmn-editor/dist/normalization/normalize";
import {
  normalize as normalizeDmn,
  Normalized as NormalizedDmn,
} from "@kie-tools/dmn-marshaller/dist/normalization/normalize";
import {
  DMN_LATEST_VERSION,
  DmnLatestModel,
  DmnMarshaller,
  getMarshaller as getDmnMarshaller,
} from "@kie-tools/dmn-marshaller";
import {
  BPMN_LATEST_VERSION,
  BpmnLatestModel,
  BpmnMarshaller,
  getMarshaller as getBpmnMarshaller,
} from "@kie-tools/bpmn-marshaller";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";
import { ResourceContent, SearchType, WorkspaceChannelApi, WorkspaceEdit } from "@kie-tools-core/workspace/dist/api";
import { domParser } from "@kie-tools/xml-parser-ts";
import { ns as bpmn20ns } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/meta";
import {
  imperativePromiseHandle,
  PromiseImperativeHandle,
} from "@kie-tools-core/react-hooks/dist/useImperativePromiseHandler";
import { KeyboardShortcutsService } from "@kie-tools-core/keyboard-shortcuts/dist/envelope/KeyboardShortcutsService";
import { Flex } from "@patternfly/react-core/dist/js/layouts/Flex";
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateHeader,
} from "@patternfly/react-core/dist/js/components/EmptyState";

export const EXTERNAL_MODELS_SEARCH_GLOB_PATTERN = "**/*.{dmn}";
export const TARGET_DIRECTORY = "target/classes/";

export const EMPTY_BPMN = () => `<?xml version="1.0" encoding="UTF-8"?>
<definitions
  xmlns="${bpmn20ns.get("")}"
  namespace="https://kie.org/bpmn/${generateUuid()}"
  id="${generateUuid()}"
  name="BPMN${generateUuid()}">
</definitions>`;

export type BpmnEditorRootProps = {
  exposing: (s: BpmnEditorRoot) => void;
  onNewEdit: (edit: WorkspaceEdit) => void;
  onRequestWorkspaceFilesList: WorkspaceChannelApi["kogitoWorkspace_resourceListRequest"];
  onRequestWorkspaceFileContent: WorkspaceChannelApi["kogitoWorkspace_resourceContentRequest"];
  onOpenFileFromNormalizedPosixPathRelativeToTheWorkspaceRoot: WorkspaceChannelApi["kogitoWorkspace_openFile"];
  workspaceRootAbsolutePosixPath: string;
  keyboardShortcutsService: KeyboardShortcutsService | undefined;
  isReadOnly: boolean;
};

export type BpmnEditorRootState = {
  marshaller: BpmnMarshaller<typeof BPMN_LATEST_VERSION> | undefined;
  stack: Normalized<BpmnLatestModel>[];
  pointer: number;
  openFileNormalizedPosixPathRelativeToTheWorkspaceRoot: string | undefined;
  externalModelsByNamespace: BpmnEditor.ExternalModelsIndex;
  isReadOnly: boolean;
  externalModelsManagerDoneBootstraping: boolean;
  keyboardShortcutsRegisterIds: number[];
  keyboardShortcutsRegistered: boolean;
  error: Error | undefined;
};

export class BpmnEditorRoot extends React.Component<BpmnEditorRootProps, BpmnEditorRootState> {
  private readonly externalModelsManagerDoneBootstraping = imperativePromiseHandle<void>();

  private readonly bpmnEditorRef: React.RefObject<BpmnEditor.BpmnEditorRef>;

  constructor(props: BpmnEditorRootProps) {
    super(props);
    props.exposing(this);
    this.bpmnEditorRef = React.createRef();
    this.state = {
      externalModelsByNamespace: {},
      marshaller: undefined,
      stack: [],
      pointer: -1,
      openFileNormalizedPosixPathRelativeToTheWorkspaceRoot: undefined,
      isReadOnly: props.isReadOnly,
      externalModelsManagerDoneBootstraping: false,
      keyboardShortcutsRegisterIds: [],
      keyboardShortcutsRegistered: false,
      error: undefined,
    };
  }

  // Exposed API

  public async undo(): Promise<void> {
    this.setState((prev) => ({ ...prev, pointer: Math.max(0, prev.pointer - 1) }));
  }

  public async redo(): Promise<void> {
    this.setState((prev) => ({ ...prev, pointer: Math.min(prev.stack.length - 1, prev.pointer + 1) }));
  }

  public async getDiagramSvg(): Promise<string | undefined> {
    return this.bpmnEditorRef.current?.getDiagramSvg();
  }

  public async getContent(): Promise<string> {
    if (!this.state.marshaller || !this.model) {
      throw new Error(
        `BPMN EDITOR ROOT: Content has not been set yet. Throwing an error to prevent returning a "default" content.`
      );
    }

    return this.state.marshaller.builder.build(this.model);
  }

  public async setContent(
    openFileNormalizedPosixPathRelativeToTheWorkspaceRoot: string,
    content: string
  ): Promise<void> {
    const marshaller = this.getBpmnMarshaller(content);

    // Save stack
    let savedStackPointer: Normalized<BpmnLatestModel>[] = [];

    // Set the model and path for external models manager.
    this.setState((prev) => {
      savedStackPointer = [...prev.stack];
      return {
        stack: [normalize(marshaller.parser.parse())],
        openFileNormalizedPosixPathRelativeToTheWorkspaceRoot,
        pointer: 0,
      };
    });

    // Wait the external manager models to load.
    await this.externalModelsManagerDoneBootstraping.promise;

    // Set the values to render the DMN Editor.
    this.setState((prev) => {
      // External change to the same file.
      if (
        prev.openFileNormalizedPosixPathRelativeToTheWorkspaceRoot ===
        openFileNormalizedPosixPathRelativeToTheWorkspaceRoot
      ) {
        const newStack = savedStackPointer.slice(0, prev.pointer + 1);
        return {
          marshaller,
          openFileNormalizedPosixPathRelativeToTheWorkspaceRoot,
          stack: [...newStack, normalize(marshaller.parser.parse())],
          isReadOnly: prev.isReadOnly,
          pointer: newStack.length,
          externalModelsManagerDoneBootstraping: true,
        };
      }

      // Different file opened. Need to reset everything.
      else {
        return {
          marshaller,
          openFileNormalizedPosixPathRelativeToTheWorkspaceRoot,
          stack: [normalize(marshaller.parser.parse())],
          isReadOnly: prev.isReadOnly,
          pointer: 0,
          externalModelsManagerDoneBootstraping: true,
        };
      }
    });
  }

  public get model(): Normalized<BpmnLatestModel> | undefined {
    return this.state.stack[this.state.pointer];
  }

  // Internal methods

  private getDmnMarshaller(content: string) {
    try {
      return getDmnMarshaller(content || EMPTY_BPMN(), { upgradeTo: "latest" });
    } catch (e) {
      this.setState((s) => ({
        ...s,
        error: e,
      }));
      throw e;
    }
  }

  private getBpmnMarshaller(content: string) {
    try {
      return getBpmnMarshaller(content || EMPTY_BPMN(), { upgradeTo: "latest" });
    } catch (e) {
      this.setState((s) => ({
        ...s,
        error: e,
      }));
      throw e;
    }
  }

  private setExternalModelsByNamespace = (externalModelsByNamespace: BpmnEditor.ExternalModelsIndex) => {
    this.setState((prev) => ({ ...prev, externalModelsByNamespace }));
  };

  private onModelChange: BpmnEditor.OnBpmnModelChange = (model) => {
    this.setState(
      (prev) => {
        const newStack = prev.stack.slice(0, prev.pointer + 1);
        return {
          ...prev,
          stack: [...newStack, model],
          pointer: newStack.length,
        };
      },
      () =>
        this.props.onNewEdit({
          id: `${this.state.openFileNormalizedPosixPathRelativeToTheWorkspaceRoot}__${generateUuid()}`,
        })
    );
  };

  private onRequestExternalModelsAvailableToInclude: BpmnEditor.OnRequestExternalModelsAvailableToInclude =
    async () => {
      if (!this.state.openFileNormalizedPosixPathRelativeToTheWorkspaceRoot) {
        return [];
      }

      const list = await this.props.onRequestWorkspaceFilesList({
        pattern: EXTERNAL_MODELS_SEARCH_GLOB_PATTERN,
        opts: { type: SearchType.TRAVERSAL },
      });

      return list.normalizedPosixPathsRelativeToTheWorkspaceRoot.flatMap((p) =>
        // Do not show this DMN on the list and filter out assets into target/classes directory
        p === this.state.openFileNormalizedPosixPathRelativeToTheWorkspaceRoot || p.includes(TARGET_DIRECTORY)
          ? []
          : __path.relative(__path.dirname(this.state.openFileNormalizedPosixPathRelativeToTheWorkspaceRoot!), p)
      );
    };

  private onRequestToResolvePathRelativeToTheOpenFile: BpmnEditor.OnRequestToResolvePath = (
    normalizedPosixPathRelativeToTheOpenFile
  ) => {
    const normalizedPosixPathRelativeToTheWorkspaceRoot = __path
      .resolve(
        __path.dirname(this.state.openFileNormalizedPosixPathRelativeToTheWorkspaceRoot!),
        normalizedPosixPathRelativeToTheOpenFile
      )
      .substring(1); // Remove leading slash.

    return normalizedPosixPathRelativeToTheWorkspaceRoot;

    // Example:
    // this.state.openFileAbsolutePath = /Users/ljmotta/packages/dmns/Dmn.dmn
    // normalizedPosixPathRelativeToTheOpenFile = ../../tmp/Tmp.dmn
    // workspaceRootAbsolutePosixPath = /Users/ljmotta
    // resolvedAbsolutePath = /Users/ljmotta/tmp/Tmp.dmn
    // return (which is the normalizedPosixPathRelativeToTheWorkspaceRoot) = tmp/Tmp.dmn
  };

  private onRequestExternalModelByPathsRelativeToTheOpenFile: BpmnEditor.OnRequestExternalModelByPath = async (
    normalizedPosixPathRelativeToTheOpenFile
  ) => {
    const normalizedPosixPathRelativeToTheWorkspaceRoot = this.onRequestToResolvePathRelativeToTheOpenFile(
      normalizedPosixPathRelativeToTheOpenFile
    );
    const resource = await this.props.onRequestWorkspaceFileContent({
      normalizedPosixPathRelativeToTheWorkspaceRoot,
      opts: { type: "text" },
    });

    const ext = __path.extname(normalizedPosixPathRelativeToTheOpenFile);
    if (ext === ".dmn") {
      return {
        normalizedPosixPathRelativeToTheOpenFile,
        type: "dmn",
        model: normalizeDmn(getDmnMarshaller(resource?.content ?? "", { upgradeTo: "latest" }).parser.parse()),
        svg: "",
      };
    } else {
      throw new Error(`Unknown extension '${ext}'.`);
    }
  };

  private onOpenFileFromPathRelativeToTheOpenFile = (normalizedPosixPathRelativeToTheOpenFile: string) => {
    if (!this.state.openFileNormalizedPosixPathRelativeToTheWorkspaceRoot) {
      return;
    }

    this.props.onOpenFileFromNormalizedPosixPathRelativeToTheWorkspaceRoot(
      this.onRequestToResolvePathRelativeToTheOpenFile(normalizedPosixPathRelativeToTheOpenFile)
    );
  };

  public componentDidUpdate(
    prevProps: Readonly<BpmnEditorRootProps>,
    prevState: Readonly<BpmnEditorRootState>,
    snapshot?: any
  ): void {
    if (this.props.keyboardShortcutsService === undefined || this.state.keyboardShortcutsRegistered === true) {
      return;
    }

    const commands = this.bpmnEditorRef.current?.getCommands();
    if (commands === undefined) {
      return;
    }

    const cancelAction = this.props.keyboardShortcutsService.registerKeyPress("Escape", "Edit | Unselect", async () =>
      commands.cancelAction()
    );
    const deleteSelectionBackspace = this.props.keyboardShortcutsService.registerKeyPress(
      "Backspace",
      "Edit | Delete selection",
      async () => {}
    );
    const deleteSelectionDelete = this.props.keyboardShortcutsService.registerKeyPress(
      "Delete",
      "Edit | Delete selection",
      async () => {}
    );
    const selectAll = this.props.keyboardShortcutsService?.registerKeyPress(
      "A",
      "Edit | Select/Deselect all",
      async () => commands.selectAll()
    );
    const createGroup = this.props.keyboardShortcutsService?.registerKeyPress(
      "G",
      "Edit | Create group wrapping selection",
      async () => {
        console.log(" KEY GROUP PRESSED, ", commands);
        return commands.createGroup();
      }
    );
    const copy = this.props.keyboardShortcutsService?.registerKeyPress("Ctrl+C", "Edit | Copy nodes", async () =>
      commands.copy()
    );
    const cut = this.props.keyboardShortcutsService?.registerKeyPress("Ctrl+X", "Edit | Cut nodes", async () =>
      commands.cut()
    );
    const paste = this.props.keyboardShortcutsService?.registerKeyPress("Ctrl+V", "Edit | Paste nodes", async () =>
      commands.paste()
    );
    const togglePropertiesPanel = this.props.keyboardShortcutsService?.registerKeyPress(
      "I",
      "Misc | Open/Close properties panel",
      async () => commands.togglePropertiesPanel()
    );
    const toggleHierarchyHighlight = this.props.keyboardShortcutsService?.registerKeyPress(
      "H",
      "Misc | Toggle hierarchy highlights",
      async () => commands.toggleHierarchyHighlight()
    );
    const moveUp = this.props.keyboardShortcutsService.registerKeyPress(
      "Up",
      "Move | Move selection up",
      async () => {}
    );
    const moveDown = this.props.keyboardShortcutsService.registerKeyPress(
      "Down",
      "Move | Move selection down",
      async () => {}
    );
    const moveLeft = this.props.keyboardShortcutsService.registerKeyPress(
      "Left",
      "Move | Move selection left",
      async () => {}
    );
    const moveRight = this.props.keyboardShortcutsService.registerKeyPress(
      "Right",
      "Move | Move selection right",
      async () => {}
    );
    const bigMoveUp = this.props.keyboardShortcutsService.registerKeyPress(
      "Shift + Up",
      "Move | Move selection up a big distance",
      async () => {}
    );
    const bigMoveDown = this.props.keyboardShortcutsService.registerKeyPress(
      "Shift + Down",
      "Move | Move selection down a big distance",
      async () => {}
    );
    const bigMoveLeft = this.props.keyboardShortcutsService.registerKeyPress(
      "Shift + Left",
      "Move | Move selection left a big distance",
      async () => {}
    );
    const bigMoveRight = this.props.keyboardShortcutsService.registerKeyPress(
      "Shift + Right",
      "Move | Move selection right a big distance",
      async () => {}
    );
    const focusOnBounds = this.props.keyboardShortcutsService?.registerKeyPress(
      "B",
      "Navigate | Focus on selection",
      async () => commands.focusOnSelection()
    );
    const resetPosition = this.props.keyboardShortcutsService?.registerKeyPress(
      "Space",
      "Navigate | Reset position to origin",
      async () => commands.resetPosition()
    );
    const pan = this.props.keyboardShortcutsService?.registerKeyPress(
      "Right Mouse Button",
      "Navigate | Hold and drag to Pan",
      async () => {}
    );
    const zoom = this.props.keyboardShortcutsService?.registerKeyPress(
      "Ctrl",
      "Navigate | Hold and scroll to zoom in/out",
      async () => {}
    );
    const navigateHorizontally = this.props.keyboardShortcutsService?.registerKeyPress(
      "Shift",
      "Navigate | Hold and scroll to navigate horizontally",
      async () => {}
    );

    this.setState((prev) => ({
      ...prev,
      keyboardShortcutsRegistered: true,
      keyboardShortcutsRegisterIds: [
        bigMoveDown,
        bigMoveLeft,
        bigMoveRight,
        bigMoveUp,
        cancelAction,
        copy,
        createGroup,
        cut,
        deleteSelectionBackspace,
        deleteSelectionDelete,
        focusOnBounds,
        moveDown,
        moveLeft,
        moveRight,
        moveUp,
        navigateHorizontally,
        pan,
        paste,
        resetPosition,
        selectAll,
        toggleHierarchyHighlight,
        togglePropertiesPanel,
        zoom,
      ],
    }));
  }

  public componentWillUnmount() {
    const keyboardShortcuts = this.bpmnEditorRef.current?.getCommands();
    if (keyboardShortcuts === undefined) {
      return;
    }

    this.state.keyboardShortcutsRegisterIds.forEach((id) => {
      this.props.keyboardShortcutsService?.deregister(id);
    });
  }

  public render() {
    return (
      <>
        {this.state.error && <DmnMarshallerFallbackError error={this.state.error} />}
        {this.model && (
          <>
            <BpmnEditor.BpmnEditor
              ref={this.bpmnEditorRef}
              originalVersion={this.state.marshaller?.originalVersion}
              model={this.model}
              externalModelsByNamespace={this.state.externalModelsByNamespace}
              externalContextName={""}
              externalContextDescription={""}
              issueTrackerHref={""}
              // isReadOnly={this.state.isReadOnly}
              onModelChange={this.onModelChange}
              // (begin) All paths coming from inside the DmnEditor component are paths relative to the open file.
              onRequestExternalModelByPath={this.onRequestExternalModelByPathsRelativeToTheOpenFile}
              onRequestToJumpToPath={this.onOpenFileFromPathRelativeToTheOpenFile}
              onRequestToResolvePath={this.onRequestToResolvePathRelativeToTheOpenFile}
              // (end)
            />
            <ExternalModelsManager
              workspaceRootAbsolutePosixPath={this.props.workspaceRootAbsolutePosixPath}
              thisDmnsNormalizedPosixPathRelativeToTheWorkspaceRoot={
                this.state.openFileNormalizedPosixPathRelativeToTheWorkspaceRoot
              }
              model={this.model}
              onChange={this.setExternalModelsByNamespace}
              onRequestWorkspaceFilesList={this.props.onRequestWorkspaceFilesList}
              onRequestWorkspaceFileContent={this.props.onRequestWorkspaceFileContent}
              externalModelsManagerDoneBootstraping={this.externalModelsManagerDoneBootstraping}
            />
          </>
        )}
      </>
    );
  }
}

const NAMESPACES_EFFECT_SEPARATOR = " , ";

function ExternalModelsManager({
  workspaceRootAbsolutePosixPath,
  thisDmnsNormalizedPosixPathRelativeToTheWorkspaceRoot,
  model,
  onChange,
  onRequestWorkspaceFileContent,
  onRequestWorkspaceFilesList,
  externalModelsManagerDoneBootstraping,
}: {
  workspaceRootAbsolutePosixPath: string;
  thisDmnsNormalizedPosixPathRelativeToTheWorkspaceRoot: string | undefined;
  model: Normalized<BpmnLatestModel>;
  onChange: (externalModelsByNamespace: BpmnEditor.ExternalModelsIndex) => void;
  onRequestWorkspaceFileContent: WorkspaceChannelApi["kogitoWorkspace_resourceContentRequest"];
  onRequestWorkspaceFilesList: WorkspaceChannelApi["kogitoWorkspace_resourceListRequest"];
  externalModelsManagerDoneBootstraping: PromiseImperativeHandle<void>;
}) {
  const [externalUpdatesCount, setExternalUpdatesCount] = useState(0);

  // This is a hack. Every time a file is updates in KIE Sandbox, the Shared Worker emits an event to this BroadcastChannel.
  // By listening to it, we can reload the `externalModelsByNamespace` object. This makes the DMN Editor react to external changes,
  // Which is very important for multi-file editing.
  //
  // Now, this mechanism is not ideal. We would ideally only be notified on changes to relevant files, but this sub-system does not exist yet.
  // The consequence of this "hack" is some extra reloads.
  useEffect(() => {
    const bc = new BroadcastChannel("workspaces_files");
    bc.onmessage = ({ data }) => {
      // Changes to `thisDmn` shouldn't update its references to external models.
      // Here, `data?.relativePath` is relative to the workspace root.
      if (data?.relativePath === thisDmnsNormalizedPosixPathRelativeToTheWorkspaceRoot) {
        return;
      }

      setExternalUpdatesCount((prev) => prev + 1);
    };
    return () => {
      bc.close();
    };
  }, [thisDmnsNormalizedPosixPathRelativeToTheWorkspaceRoot]);

  const getDmnsByNamespace = useCallback((resources: (ResourceContent | undefined)[]) => {
    const ret = new Map<string, ResourceContent>();
    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      if (!resource) {
        continue;
      }

      const content = resource.content ?? "";
      const ext = __path.extname(resource.normalizedPosixPathRelativeToTheWorkspaceRoot);
      if (ext === ".dmn") {
        const namespace = domParser.getDomDocument(content).documentElement.getAttribute("namespace");
        if (namespace) {
          // Check for multiplicity of namespaces on DMN models
          if (ret.has(namespace)) {
            console.warn(
              `BPMN EDITOR ROOT: Multiple DMN models encountered with the same namespace '${namespace}': '${
                resource.normalizedPosixPathRelativeToTheWorkspaceRoot
              }' and '${
                ret.get(namespace)!.normalizedPosixPathRelativeToTheWorkspaceRoot
              }'. The latter will be considered.`
            );
          }

          ret.set(namespace, resource);
        }
      }
    }

    return ret;
  }, []);

  // This effect actually populates `externalModelsByNamespace` through the `onChange` call.
  useEffect(() => {
    let canceled = false;

    if (!thisDmnsNormalizedPosixPathRelativeToTheWorkspaceRoot) {
      return;
    }

    onRequestWorkspaceFilesList({ pattern: EXTERNAL_MODELS_SEARCH_GLOB_PATTERN, opts: { type: SearchType.TRAVERSAL } })
      .then((list) => {
        const resources: Array<Promise<ResourceContent | undefined>> = [];
        for (let i = 0; i < list.normalizedPosixPathsRelativeToTheWorkspaceRoot.length; i++) {
          const normalizedPosixPathRelativeToTheWorkspaceRoot = list.normalizedPosixPathsRelativeToTheWorkspaceRoot[i];

          // Do not show this DMN on the list and filter out assets into target/classes directory
          if (
            normalizedPosixPathRelativeToTheWorkspaceRoot === thisDmnsNormalizedPosixPathRelativeToTheWorkspaceRoot ||
            normalizedPosixPathRelativeToTheWorkspaceRoot.includes(TARGET_DIRECTORY)
          ) {
            continue;
          }

          resources.push(
            onRequestWorkspaceFileContent({
              normalizedPosixPathRelativeToTheWorkspaceRoot,
              opts: { type: "text" },
            })
          );
        }
        return Promise.all(resources);
      })
      .then((resources) => {
        const externalModelsIndex: BpmnEditor.ExternalModelsIndex = {};

        const loadedDmnsByPathRelativeToTheWorkspaceRoot = new Set<string>();
        const dmnsByNamespace = getDmnsByNamespace(resources);

        for (let i = 0; i < resources.length; i++) {
          const resource = resources[i];
          if (!resource) {
            continue;
          }

          const ext = __path.extname(resource.normalizedPosixPathRelativeToTheWorkspaceRoot);
          const normalizedPosixPathRelativeToTheOpenFile = __path.relative(
            __path.dirname(thisDmnsNormalizedPosixPathRelativeToTheWorkspaceRoot),
            resource.normalizedPosixPathRelativeToTheWorkspaceRoot
          );

          const resourceContent = resource.content ?? "";

          // DMN Files
          if (ext === ".dmn") {
            const namespaceOfTheResourceFile = domParser
              .getDomDocument(resourceContent)
              .documentElement.getAttribute("namespace");

            if (namespaceOfTheResourceFile) {
              checkIfNamespaceIsAlreadyLoaded({
                externalModelsIndex,
                namespaceOfTheResourceFile,
                normalizedPosixPathRelativeToTheWorkspaceRoot: resource.normalizedPosixPathRelativeToTheWorkspaceRoot,
              });

              loadModel({
                includedModelContent: resourceContent,
                includedModelNamespace: namespaceOfTheResourceFile,
                externalModelsIndex,
                thisDmnsNormalizedPosixPathRelativeToTheWorkspaceRoot,
                loadedDmnsByPathRelativeToTheWorkspaceRoot,
                normalizedPosixPathRelativeToTheWorkspaceRoot: resource.normalizedPosixPathRelativeToTheWorkspaceRoot,
                resourcesByNamespace: dmnsByNamespace,
              });
            }
          }

          // Unknown files
          else {
            throw new Error(`Unknown extension '${ext}'.`);
          }
        }

        if (!canceled) {
          onChange(externalModelsIndex);
        }
        externalModelsManagerDoneBootstraping.resolve();
      });

    return () => {
      canceled = true;
    };
  }, [
    onChange,
    onRequestWorkspaceFileContent,
    onRequestWorkspaceFilesList,
    thisDmnsNormalizedPosixPathRelativeToTheWorkspaceRoot,
    externalUpdatesCount,
    workspaceRootAbsolutePosixPath,
    externalModelsManagerDoneBootstraping,
    getDmnsByNamespace,
  ]);

  return <></>;
}

function DmnMarshallerFallbackError({ error }: { error: Error }) {
  return (
    <Flex justifyContent={{ default: "justifyContentCenter" }} style={{ marginTop: "100px" }}>
      <EmptyState style={{ maxWidth: "1280px" }}>
        <EmptyStateHeader
          titleText="Unable to open file."
          icon={<EmptyStateIcon icon={() => <div style={{ fontSize: "3em" }}>😕</div>} />}
          headingLevel={"h4"}
        />
        <br />
        <EmptyStateBody>Error details: {error.message}</EmptyStateBody>
      </EmptyState>
    </Flex>
  );
}

function loadModel(args: {
  thisDmnsNormalizedPosixPathRelativeToTheWorkspaceRoot: string;
  resourcesByNamespace: Map<string, ResourceContent>;
  normalizedPosixPathRelativeToTheWorkspaceRoot: string;
  includedModelNamespace: string;
  loadedDmnsByPathRelativeToTheWorkspaceRoot: Set<string>;
  includedModelContent: string;
  externalModelsIndex: BpmnEditor.ExternalModelsIndex;
}) {
  const normalizedPosixPathRelativeToTheOpenFile = __path.relative(
    __path.dirname(args.thisDmnsNormalizedPosixPathRelativeToTheWorkspaceRoot),
    args.normalizedPosixPathRelativeToTheWorkspaceRoot
  );

  const includedModel = normalizeDmn(
    getDmnMarshaller(args.includedModelContent, { upgradeTo: "latest" }).parser.parse()
  );
  args.externalModelsIndex[args.includedModelNamespace] = {
    normalizedPosixPathRelativeToTheOpenFile,
    model: includedModel,
    type: "dmn",
    svg: "",
  };

  args.loadedDmnsByPathRelativeToTheWorkspaceRoot.add(args.normalizedPosixPathRelativeToTheWorkspaceRoot);

  loadDependentModels({
    ...args,
    model: includedModel,
  });
}

// Load all included models from the model and the included models of those models, recursively.
function loadDependentModels(args: {
  model: Normalized<DmnLatestModel>;
  externalModelsIndex: BpmnEditor.ExternalModelsIndex;
  resourcesByNamespace: Map<string, ResourceContent>;
  loadedDmnsByPathRelativeToTheWorkspaceRoot: Set<string>;
  thisDmnsNormalizedPosixPathRelativeToTheWorkspaceRoot: string;
}) {
  const includedNamespaces = new Set<string>();

  for (const includedNamespace of includedNamespaces) {
    const resource = args.resourcesByNamespace.get(includedNamespace)!;
    if (args.loadedDmnsByPathRelativeToTheWorkspaceRoot.has(resource.normalizedPosixPathRelativeToTheWorkspaceRoot)) {
      continue;
    }

    checkIfNamespaceIsAlreadyLoaded({
      externalModelsIndex: args.externalModelsIndex,
      namespaceOfTheResourceFile: includedNamespace,
      normalizedPosixPathRelativeToTheWorkspaceRoot: resource.normalizedPosixPathRelativeToTheWorkspaceRoot,
    });

    loadModel({
      ...args,
      includedModelContent: resource.content ?? "",
      normalizedPosixPathRelativeToTheWorkspaceRoot: resource.normalizedPosixPathRelativeToTheWorkspaceRoot,
      includedModelNamespace: includedNamespace,
    });
  }
}

function checkIfNamespaceIsAlreadyLoaded(args: {
  externalModelsIndex: BpmnEditor.ExternalModelsIndex;
  namespaceOfTheResourceFile: string;
  normalizedPosixPathRelativeToTheWorkspaceRoot: string;
}) {
  if (args.externalModelsIndex[args.namespaceOfTheResourceFile]) {
    console.warn(
      `BPMN EDITOR ROOT: Multiple DMN models encountered with the same namespace '${args.namespaceOfTheResourceFile}': '${
        args.normalizedPosixPathRelativeToTheWorkspaceRoot
      }' and '${
        args.externalModelsIndex[args.namespaceOfTheResourceFile]!.normalizedPosixPathRelativeToTheOpenFile
      }'. The latter will be considered.`
    );
  }
}
