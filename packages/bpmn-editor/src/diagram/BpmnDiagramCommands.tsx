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

import * as React from "react";
import { useEffect } from "react";
import * as RF from "reactflow";
import {
  BPMN_EDITOR_DIAGRAM_CLIPBOARD_MIME_TYPE,
  BpmnEditorDiagramClipboard,
  buildClipboardFromDiagram,
  getClipboard,
} from "../clipboard/Clipboard";
import { useCommands } from "../commands/CommandsContextProvider";
import { useBpmnEditorStoreApi } from "../store/StoreContext";
import { DEFAULT_VIEWPORT } from "@kie-tools/xyflow-react-kie-diagram/dist/diagram/XyFlowReactKieDiagram";
import { BpmnDiagramEdgeData } from "./BpmnDiagramDomain";
import { getBounds } from "@kie-tools/xyflow-react-kie-diagram/dist/maths/DcMaths";
import { BpmnDiagramNodeData } from "./BpmnDiagramDomain";

export function BpmnDiagramCommands(props: {}) {
  const xyFlowStoreApi = RF.useStoreApi();
  const bpmnEditorStoreApi = useBpmnEditorStoreApi();
  const { commandsRef } = useCommands();
  const xyFlow = RF.useReactFlow<BpmnDiagramNodeData, BpmnDiagramEdgeData>();

  // Cancel action
  useEffect(() => {
    if (!commandsRef.current) {
      return;
    }
    commandsRef.current.cancelAction = async () => {
      console.debug("BPMN DIAGRAM: COMMANDS: Canceling action...");
      xyFlowStoreApi.setState((xyFlowState) => {
        if (xyFlowState.connectionNodeId) {
          xyFlowState.cancelConnection();
          bpmnEditorStoreApi.setState((state) => {
            state.xyFlowReactKieDiagram.ongoingConnection = undefined;
          });
        } else {
          (document.activeElement as any)?.blur?.();
        }

        return xyFlowState;
      });
    };
  }, [bpmnEditorStoreApi, commandsRef, xyFlowStoreApi]);

  // Reset position to origin
  useEffect(() => {
    if (!commandsRef.current) {
      return;
    }
    commandsRef.current.resetPosition = async () => {
      console.debug("BPMN DIAGRAM: COMMANDS: Reseting position...");
      xyFlow.setViewport(DEFAULT_VIEWPORT, { duration: 200 });
    };
  }, [commandsRef, xyFlow]);

  // Focus on selection
  useEffect(() => {
    if (!commandsRef.current) {
      return;
    }
    commandsRef.current.focusOnSelection = async () => {
      console.debug("BPMN DIAGRAM: COMMANDS: Focusing on selected bounds...");
      const selectedNodes = xyFlow.getNodes().filter((s) => s.selected);
      if (selectedNodes.length <= 0) {
        return;
      }

      const bounds = getBounds({
        nodes: selectedNodes,
        padding: 100,
      });

      xyFlow.fitBounds(
        {
          x: bounds["@_x"],
          y: bounds["@_y"],
          width: bounds["@_width"],
          height: bounds["@_height"],
        },
        { duration: 200 }
      );
    };
  }, [commandsRef, xyFlow]);

  // Cut nodes
  useEffect(() => {
    if (!commandsRef.current) {
      return;
    }
    commandsRef.current.cut = async () => {
      console.debug("BPMN DIAGRAM: COMMANDS: Cutting selected nodes...");
      const { clipboard, copiedEdgesById, danglingEdgesById, copiedNodesById } = buildClipboardFromDiagram(
        xyFlowStoreApi.getState(),
        bpmnEditorStoreApi.getState()
      );

      navigator.clipboard.writeText(JSON.stringify(clipboard)).then(() => {
        bpmnEditorStoreApi.setState((state) => {
          // FIXME: Tiago: Implement (cut)
        });
      });
    };
  }, [bpmnEditorStoreApi, commandsRef, xyFlowStoreApi]);

  // Copy nodes
  useEffect(() => {
    if (!commandsRef.current) {
      return;
    }
    commandsRef.current.copy = async () => {
      console.debug("BPMN DIAGRAM: COMMANDS: Copying selected nodes...");
      const { clipboard } = buildClipboardFromDiagram(xyFlowStoreApi.getState(), bpmnEditorStoreApi.getState());
      navigator.clipboard.writeText(JSON.stringify(clipboard));
    };
  }, [bpmnEditorStoreApi, commandsRef, xyFlowStoreApi]);

  // Paste nodes
  useEffect(() => {
    if (!commandsRef.current) {
      return;
    }
    commandsRef.current.paste = async () => {
      console.debug("BPMN DIAGRAM: COMMANDS: Pasting nodes...");
      navigator.clipboard.readText().then((text) => {
        const clipboard = getClipboard<BpmnEditorDiagramClipboard>(text, BPMN_EDITOR_DIAGRAM_CLIPBOARD_MIME_TYPE);
        if (!clipboard) {
          return;
        }

        // FIXME: Tiago: Implement (paste)
      });
    };
  }, [bpmnEditorStoreApi, commandsRef]);

  // Select/deselect all nodes
  useEffect(() => {
    if (!commandsRef.current) {
      return;
    }
    commandsRef.current.selectAll = async () => {
      console.debug("BPMN DIAGRAM: COMMANDS: Selecting/Deselecting nodes...");
      const allNodeIds = xyFlowStoreApi
        .getState()
        .getNodes()
        .map((s) => s.id);

      const allEdgeIds = xyFlowStoreApi.getState().edges.map((s) => s.id);

      bpmnEditorStoreApi.setState((state) => {
        const allSelectedNodesSet = new Set(state.xyFlowReactKieDiagram._selectedNodes);
        const allSelectedEdgesSet = new Set(state.xyFlowReactKieDiagram._selectedEdges);

        // If everything is selected, deselect everything.
        if (
          allNodeIds.every((id) => allSelectedNodesSet.has(id) && allEdgeIds.every((id) => allSelectedEdgesSet.has(id)))
        ) {
          state.xyFlowReactKieDiagram._selectedNodes = [];
          state.xyFlowReactKieDiagram._selectedEdges = [];
        } else {
          state.xyFlowReactKieDiagram._selectedNodes = allNodeIds;
          state.xyFlowReactKieDiagram._selectedEdges = allEdgeIds;
        }
      });
    };
  }, [bpmnEditorStoreApi, commandsRef, xyFlowStoreApi]);

  // Create group wrapping selection
  useEffect(() => {
    if (!commandsRef.current) {
      return;
    }
    commandsRef.current.createGroup = async () => {
      console.debug("BPMN DIAGRAM: COMMANDS: Grouping nodes...");
      const selectedNodes = xyFlow.getNodes().filter((s) => s.selected);
      if (selectedNodes.length <= 0) {
        return;
      }

      bpmnEditorStoreApi.setState((state) => {
        // FIXME: Tiago: Implement (group)
      });
    };
  }, [bpmnEditorStoreApi, commandsRef, xyFlow]);

  // Toggle hierarchy highlights
  useEffect(() => {
    if (!commandsRef.current) {
      return;
    }
    commandsRef.current.toggleHierarchyHighlight = async () => {
      console.debug("BPMN DIAGRAM: COMMANDS: Toggle hierarchy highlights...");
      bpmnEditorStoreApi.setState((state) => {
        state.diagram.overlays.enableNodeHierarchyHighlight = !state.diagram.overlays.enableNodeHierarchyHighlight;
      });
    };
  }, [bpmnEditorStoreApi, commandsRef]);

  // Show Properties panel
  useEffect(() => {
    if (!commandsRef.current) {
      return;
    }
    commandsRef.current.togglePropertiesPanel = async () => {
      console.debug("BPMN DIAGRAM: COMMANDS: Toggle properties panel...");
      bpmnEditorStoreApi.setState((state) => {
        state.propertiesPanel.isOpen = !state.propertiesPanel.isOpen;
      });
    };
  }, [bpmnEditorStoreApi, commandsRef]);

  return <></>;
}
