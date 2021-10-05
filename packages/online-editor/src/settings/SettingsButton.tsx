import * as React from "react";
import { Button } from "@patternfly/react-core/dist/js/components/Button";
import { CogIcon } from "@patternfly/react-icons/dist/js/icons/cog-icon";
import { useSettings } from "./SettingsContext";

export function SettingsButton() {
  const settings = useSettings();
  return (
    <Button
      variant="plain"
      onClick={() => settings.open()}
      aria-label="Settings"
      className={"kogito-tooling--masthead-hoverable"}
    >
      <CogIcon />
    </Button>
  );
}
