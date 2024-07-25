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
import * as RF from "reactflow";
import { useXyFlowKieDiagramStore, useXyFlowKieDiagramStoreApi } from "../store/Store";
import { Label } from "@patternfly/react-core/dist/js/components/Label";

export function SelectionStatusLabel() {
  const xyFlowStoreApi = RF.useStoreApi();

  const selectedNodesCount = useXyFlowKieDiagramStore((s) => s.computed(s).getDiagramData().selectedNodesById.size);
  const selectedEdgesCount = useXyFlowKieDiagramStore((s) => s.computed(s).getDiagramData().selectedEdgesById.size);
  const bpmnEditorStoreApi = useXyFlowKieDiagramStoreApi();

  React.useEffect(() => {
    if (selectedNodesCount >= 2) {
      xyFlowStoreApi.setState({ nodesSelectionActive: true });
    }
  }, [xyFlowStoreApi, selectedNodesCount]);

  const onClose = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      bpmnEditorStoreApi.setState((state) => {
        state.xyFlowKieDiagram._selectedNodes = [];
        state.xyFlowKieDiagram._selectedEdges = [];
      });
    },
    [bpmnEditorStoreApi]
  );

  return (
    <>
      {(selectedNodesCount + selectedEdgesCount >= 2 && (
        <RF.Panel position={"top-center"}>
          <Label style={{ paddingLeft: "24px" }} onClose={onClose}>
            {(selectedEdgesCount === 0 && `${selectedNodesCount} nodes selected`) ||
              (selectedNodesCount === 0 && `${selectedEdgesCount} edges selected`) ||
              `${selectedNodesCount} node${selectedNodesCount === 1 ? "" : "s"}, ${selectedEdgesCount} edge${
                selectedEdgesCount === 1 ? "" : "s"
              } selected`}
          </Label>
        </RF.Panel>
      )) || <></>}
    </>
  );
}
