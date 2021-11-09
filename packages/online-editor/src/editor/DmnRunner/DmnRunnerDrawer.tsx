import * as React from "react";
import { DmnRunnerDrawerPanelContent } from "./DmnRunnerDrawerPanelContent";
import { Drawer, DrawerContent, DrawerContentBody } from "@patternfly/react-core/dist/js/components/Drawer";
import { useDmnRunner } from "./DmnRunnerContext";
import { WorkspaceFile } from "../../workspace/WorkspacesContext";
import { EditorPageDockDrawerRef } from "../EditorPageDockDrawer";
import { DmnRunnerMode } from "./DmnRunnerStatus";

export function DmnRunnerDrawer(props: {
  workspaceFile: WorkspaceFile;
  editorPageDock: EditorPageDockDrawerRef | undefined;
  children: React.ReactNode;
}) {
  const dmnRunner = useDmnRunner();
  return (
    <Drawer isInline={true} isExpanded={dmnRunner.isExpanded && dmnRunner.mode === DmnRunnerMode.DRAWER}>
      <DrawerContent
        className={
          !dmnRunner.isExpanded ? "kogito--editor__drawer-content-onClose" : "kogito--editor__drawer-content-open"
        }
        panelContent={
          <DmnRunnerDrawerPanelContent workspaceFile={props.workspaceFile} editorPageDock={props.editorPageDock} />
        }
      >
        <DrawerContentBody className={"kogito--editor__drawer-content-body"}>{props.children}</DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
}
