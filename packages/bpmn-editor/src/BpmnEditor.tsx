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

import "@patternfly/react-core/dist/styles/base.css";
import "reactflow/dist/style.css";

import { AllBpmnMarshallers, BpmnLatestModel } from "@kie-tools/bpmn-marshaller";
import {
  Drawer,
  DrawerPanelContent,
  DrawerHead,
  DrawerContent,
  DrawerContentBody,
} from "@patternfly/react-core/dist/js/components/Drawer";
import { original } from "immer";
import * as React from "react";
import { useCallback, useImperativeHandle, useMemo, useRef } from "react";
import * as ReactDOM from "react-dom";
import { ErrorBoundary, ErrorBoundaryPropsWithFallback } from "react-error-boundary";
import * as RF from "reactflow";
import { BpmnEditorContextProvider, useBpmnEditor } from "./BpmnEditorContext";
import { BpmnEditorErrorFallback } from "./BpmnEditorErrorFallback";
import { BpmnDiagram } from "./diagram/BpmnDiagram";
import { BpmnVersionLabel } from "./diagram/BpmnVersionLabel";
import { BpmnEditorExternalModelsContextProvider } from "./externalModels/BpmnEditorExternalModelsContext";
import { Normalized, normalize } from "./normalization/normalize";
import { INITIAL_COMPUTED_CACHE } from "./store/initialComputedCache";
import { ComputedStateCache } from "@kie-tools/xyflow-react-kie-diagram/dist/store/ComputedStateCache";
import { XyFlowReactKieDiagramStoreApiContext } from "@kie-tools/xyflow-react-kie-diagram/dist/store/Store";
import { State, createBpmnEditorStore, getDefaultStaticState } from "./store/Store";
import {
  BpmnEditorStoreApiContext,
  StoreApiType,
  useBpmnEditorStore,
  useBpmnEditorStoreApi,
} from "./store/StoreContext";
import { BpmnDiagramSvg } from "./svg/BpmnDiagramSvg";
import { useStateAsItWasBeforeConditionBecameTrue } from "@kie-tools/xyflow-react-kie-diagram/dist/reactExt/useStateAsItWasBeforeConditionBecameTrue";
import { useEffectAfterFirstRender } from "@kie-tools/xyflow-react-kie-diagram/dist/reactExt/useEffectAfterFirstRender";
import { Commands, CommandsContextProvider, useCommands } from "./commands/CommandsContextProvider";
import { DiagramRef } from "@kie-tools/xyflow-react-kie-diagram/dist/diagram/XyFlowReactKieDiagram";
import { Button, ButtonVariant } from "@patternfly/react-core/dist/js/components/Button";
import { Form, FormSection } from "@patternfly/react-core/dist/js/components/Form";
import { TimesIcon } from "@patternfly/react-icons/dist/js/icons/times-icon";
import { BpmnDiagramEdgeData, BpmnDiagramNodeData, BpmnNodeElement, BpmnNodeType } from "./diagram/BpmnDiagramDomain";

// Leave custom CSS always for last.
import "@kie-tools/xyflow-react-kie-diagram/dist/patternfly-customizations.css";
import "@kie-tools/xyflow-react-kie-diagram/dist/xyflow-customizations.css";
import "./BpmnEditor.css";

const ON_MODEL_CHANGE_DEBOUNCE_TIME_IN_MS = 500;

const SVG_PADDING = 20;

export type BpmnEditorRef = {
  reset: (mode: BpmnLatestModel) => void;
  getDiagramSvg: () => Promise<string | undefined>;
  getCommands: () => Commands;
};

export type OnBpmnModelChange = (model: Normalized<BpmnLatestModel>) => void;

export type OnRequestToJumpToPath = (normalizedPosixPathRelativeToTheOpenFile: string) => void;
export type OnRequestToResolvePath = (normalizedPosixPathRelativeToTheOpenFile: string) => string;

/** @returns a list of paths relative to the open file. */
export type OnRequestExternalModelsAvailableToInclude = () => Promise<string[]>;

export type OnRequestExternalModelByPath = (
  normalizedPosixPathRelativeToTheOpenFile: string
) => Promise<ExternalModel | null>;

export type ExternalModelsIndex = Record<
  string /** normalizedPosixPathRelativeToTheOpenFile */,
  ExternalModel | undefined
>;
export type ExternalModel = { type: "dmn" } & ExternalDmn;

export type ExternalDmnsIndex = Map<string /** normalizedPosixPathRelativeToTheOpenFile */, ExternalDmn>;
export type ExternalDmn = {
  model: Normalized<BpmnLatestModel>;
  normalizedPosixPathRelativeToTheOpenFile: string;
  svg: string;
};

export type BpmnEditorProps = {
  /**
   * The BPMN itself.
   */
  model: BpmnLatestModel;
  /**
   * The original version of `model` before upgrading to `latest`.
   */
  originalVersion?: AllBpmnMarshallers["version"];
  /**
   * Called when a change occurs on `model`, so the controlled flow of the component can be done.
   */
  onModelChange?: OnBpmnModelChange;
  /**
   * The name of context in which this instance of BPMN Editor is running. For example, if this BPMN Editor instance
   * is displaying a model from a project called "My project", you could use `externalContextName={"My project"}`
   */
  externalContextName?: string;
  /**
   * Describe the context in which this instance of BPMN Editor is running. For example, if this BPMN Editor instance
   * is displaying a model from a project called "My project", you could use
   * `externalContextDescription={'All models (DMN, etc) of "My project" are available.'}`
   */
  externalContextDescription?: string;
  /**
   * A link that will take users to an issue tracker so they can report problems they find on the BPMN Editor.
   * This is shown on the ErrorBoundary fallback component, when an uncaught error happens.
   */
  issueTrackerHref?: string;
  /**
   * When users want to jump to another file, this method is called, allowing the controller of this component decide what to do.
   * Links are only rendered if this is provided. Otherwise, paths will be rendered as text.
   */
  onRequestToJumpToPath?: OnRequestToJumpToPath;
  /**
   * All paths inside the BPMN Editor are relative. To be able to resolve them and display them as absolute paths, this function is called.
   * If undefined, the relative paths will be displayed.
   */
  onRequestToResolvePath?: OnRequestToResolvePath;
  /**
   * Notifies the caller when the BPMN Editor performs a new edit after the debounce time.
   */
  onModelDebounceStateChanged?: (changed: boolean) => void;
};

export const BpmnEditorInternal = ({
  model,
  originalVersion,
  onModelChange,
  onModelDebounceStateChanged,
  forwardRef,
}: BpmnEditorProps & { forwardRef?: React.Ref<BpmnEditorRef> }) => {
  const isDiagramPropertiesPanelOpen = useBpmnEditorStore((s) => s.diagram.propertiesPanel.isOpen);
  const bpmn = useBpmnEditorStore((s) => s.bpmn);
  const isDiagramEditingInProgress = useBpmnEditorStore((s) => s.computed(s).isDiagramEditingInProgress());
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();
  const { commandsRef } = useCommands();

  const { bpmnModelBeforeEditingRef, bpmnEditorRootElementRef } = useBpmnEditor();

  // Refs
  const diagramRef = useRef<DiagramRef<BpmnNodeType, BpmnDiagramNodeData, BpmnDiagramEdgeData>>(null);
  const diagramContainerRef = useRef<HTMLDivElement>(null);

  // Allow imperativelly controlling the Editor.
  useImperativeHandle(
    forwardRef,
    () => ({
      reset: (model) => {
        const state = bpmnEditorStoreApi.getState();
        return state.dispatch(state).reset(normalize(model));
      },
      getDiagramSvg: async () => {
        const nodes = diagramRef.current?.getReactFlowInstance()?.getNodes() as  // This casting is required because XYFlow doesn't correctly type the "getNodes()" function with the node types.
          | undefined
          | RF.Node<BpmnDiagramNodeData<BpmnNodeElement>, BpmnNodeType>[];

        const edges = diagramRef.current?.getReactFlowInstance()?.getEdges();
        if (!nodes || !edges) {
          return undefined;
        }

        const bounds = RF.getNodesBounds(nodes);
        const state = bpmnEditorStoreApi.getState();

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", bounds.width + SVG_PADDING * 2 + "");
        svg.setAttribute(
          "height",
          // It's not possible to calculate the text height which is outside of the node for the dataObject node shape
          bounds.height + SVG_PADDING * 5 + ""
        );

        // We're still on React 17.
        // eslint-disable-next-line react/no-deprecated
        ReactDOM.render(
          // Indepdent of where the nodes are located, they'll always be rendered at the top-left corner of the SVG
          <g transform={`translate(${-bounds.x + SVG_PADDING} ${-bounds.y + SVG_PADDING})`}>
            <BpmnDiagramSvg nodes={nodes} edges={edges} snapGrid={state.xyFlowReactKieDiagram.snapGrid} />
          </g>,
          svg
        );

        return new XMLSerializer().serializeToString(svg);
      },
      getCommands: () => commandsRef.current,
    }),
    [bpmnEditorStoreApi, commandsRef]
  );

  // Make sure the BPMN Editor reacts to props changing.
  useEffectAfterFirstRender(() => {
    bpmnEditorStoreApi.setState((state) => {
      // Avoid unecessary state updates
      if (model === original(state.bpmn.model)) {
        return;
      }

      state.bpmn.model = normalize(model);

      bpmnModelBeforeEditingRef.current = state.bpmn.model;
    });
  }, [bpmnEditorStoreApi, model]);

  useStateAsItWasBeforeConditionBecameTrue(
    bpmn.model,
    isDiagramEditingInProgress,
    useCallback((prev) => (bpmnModelBeforeEditingRef.current = prev), [bpmnModelBeforeEditingRef])
  );

  // Only notify changes when dragging/resizing operations are not happening.
  useEffectAfterFirstRender(() => {
    if (isDiagramEditingInProgress) {
      return;
    }
    onModelDebounceStateChanged?.(false);

    const timeout = setTimeout(() => {
      // Ignore changes made outside... If the controller of the component
      // changed its props, it knows it already, we don't need to call "onModelChange" again.
      if (model === bpmn.model) {
        return;
      }

      onModelDebounceStateChanged?.(true);
      console.debug("BPMN EDITOR: Model changed!");
      onModelChange?.(bpmn.model);
    }, ON_MODEL_CHANGE_DEBOUNCE_TIME_IN_MS);

    return () => {
      clearTimeout(timeout);
    };
  }, [isDiagramEditingInProgress, onModelChange, bpmn.model]);

  const diagramPropertiesPanel = useMemo(
    () => (
      <DrawerPanelContent
        data-testid={"kie-tools--bpmn-editor--properties-panel-container"}
        isResizable={true}
        minSize={"300px"}
        defaultSize={"500px"}
        onKeyDown={(e) => e.stopPropagation()} // Prevent ReactFlow KeyboardShortcuts from triggering when editing stuff on Properties Panel
      >
        <DrawerHead>
          <Form>
            <FormSection
              title={
                <Button
                  title={"Close"}
                  variant={ButtonVariant.plain}
                  onClick={() => {
                    bpmnEditorStoreApi.setState((state) => {
                      state.diagram.propertiesPanel.isOpen = false;
                    });
                  }}
                >
                  <TimesIcon />
                </Button>
              }
            />
          </Form>
        </DrawerHead>
      </DrawerPanelContent>
    ),
    [bpmnEditorStoreApi]
  );

  return (
    <div ref={bpmnEditorRootElementRef} className={"kie-bpmn-editor--root"}>
      <Drawer isExpanded={isDiagramPropertiesPanelOpen} isInline={true} position={"right"}>
        <DrawerContent panelContent={diagramPropertiesPanel}>
          <DrawerContentBody>
            <div
              className={"kie-bpmn-editor--diagram-container"}
              ref={diagramContainerRef}
              data-testid={"kie-bpmn-editor--diagram-container"}
            >
              {originalVersion && <BpmnVersionLabel version={originalVersion} />}
              <BpmnDiagram diagramRef={diagramRef} container={diagramContainerRef} />
            </div>
          </DrawerContentBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export const BpmnEditor = React.forwardRef((props: BpmnEditorProps, ref: React.Ref<BpmnEditorRef>) => {
  const store = useMemo(
    () =>
      createBpmnEditorStore(props.model, new ComputedStateCache<ReturnType<State["computed"]>>(INITIAL_COMPUTED_CACHE)),
    // Purposefully empty. This memoizes the initial value of the store
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const storeRef = React.useRef<StoreApiType>(store);

  const resetState: ErrorBoundaryPropsWithFallback["onReset"] = useCallback(({ args }) => {
    storeRef.current?.setState((state) => {
      state.diagram = getDefaultStaticState().diagram;
      state.bpmn.model = args[0];
    });
  }, []);

  return (
    <BpmnEditorContextProvider {...props}>
      <ErrorBoundary FallbackComponent={BpmnEditorErrorFallback} onReset={resetState}>
        <BpmnEditorExternalModelsContextProvider {...props}>
          <BpmnEditorStoreApiContext.Provider value={storeRef.current}>
            <XyFlowReactKieDiagramStoreApiContext.Provider value={storeRef.current}>
              <CommandsContextProvider>
                <BpmnEditorInternal forwardRef={ref} {...props} />
              </CommandsContextProvider>
            </XyFlowReactKieDiagramStoreApiContext.Provider>
          </BpmnEditorStoreApiContext.Provider>
        </BpmnEditorExternalModelsContextProvider>
      </ErrorBoundary>
    </BpmnEditorContextProvider>
  );
});
