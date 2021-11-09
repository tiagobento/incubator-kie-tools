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

import * as React from "react";
import { useCallback, useImperativeHandle, useState } from "react";
import { ExclamationCircleIcon } from "@patternfly/react-icons/dist/js/icons/exclamation-circle-icon";
import { ToggleGroupItem } from "@patternfly/react-core/dist/js/components/ToggleGroup";
import { PanelId } from "../EditorPageDockDrawer";

interface Props {
  isSelected: boolean;
  onChange: (id: PanelId) => void;
}

export interface NotificationsPanelDockToggleRef {
  setNotificationsCount: React.Dispatch<React.SetStateAction<number>>;
}

export const NotificationsPanelDockToggle = React.forwardRef<NotificationsPanelDockToggleRef, Props>(
  (props, forwardRef) => {
    const [notificationsCount, setNotificationsCount] = useState<number>(0);
    const onAnimationEnd = useCallback((e: React.AnimationEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const updatedResult = document.getElementById(`total-notifications`);
      updatedResult?.classList.remove("kogito--editor__notifications-panel-error-count-updated");
    }, []);

    useImperativeHandle(
      forwardRef,
      () => ({
        setNotificationsCount,
      }),
      [setNotificationsCount]
    );

    return (
      <ToggleGroupItem
        style={{
          borderLeft: "solid 1px",
          borderRadius: 0,
          borderColor: "rgb(211, 211, 211)",
          padding: "1px",
        }}
        buttonId={PanelId.NOTIFICATIONS_PANEL}
        isSelected={props.isSelected}
        onChange={() => props.onChange(PanelId.NOTIFICATIONS_PANEL)}
        text={
          <div style={{ display: "flex" }}>
            <div style={{ paddingRight: "5px", width: "30px" }}>
              <ExclamationCircleIcon />
            </div>
            Problems
            <div style={{ paddingLeft: "5px", width: "30px" }}>
              <span id={"total-notifications"} onAnimationEnd={onAnimationEnd}>
                {notificationsCount}
              </span>
            </div>
          </div>
        }
      />
    );
  }
);
