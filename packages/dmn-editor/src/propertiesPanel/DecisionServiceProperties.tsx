import * as React from "react";
import { DMN14__tDecisionService } from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_4/ts-gen/types";
import { ClipboardCopy } from "@patternfly/react-core/dist/js/components/ClipboardCopy";
import { FormGroup } from "@patternfly/react-core/dist/js/components/Form";
import { TextArea } from "@patternfly/react-core/dist/js/components/TextArea";
import { TextInput } from "@patternfly/react-core/dist/js/components/TextInput";
import { useCallback } from "react";
import { DocumentationLinksInput } from "./DocumentationLinksInput";
import { DataTypeSelector } from "../dataTypes/DataTypeSelector";

export function DecisionServiceProperties({ decisionService }: { decisionService: DMN14__tDecisionService }) {
  const setName = useCallback((dataType: string) => {
    // TODO: Remember to set the variable name here as well.
    console.log(`TIAGO WRITE: Set data type --> ${dataType}`);
  }, []);

  return (
    <>
      <FormGroup label="Name">
        <TextInput
          aria-label={"Name"}
          type={"text"}
          isDisabled={false}
          onChange={setName}
          value={decisionService["@_name"]}
          placeholder={"Enter a name..."}
        />
      </FormGroup>

      <FormGroup label="Data type">
        <DataTypeSelector typeRef={decisionService.variable?.["@_typeRef"]} />
      </FormGroup>

      <FormGroup label="Description">
        <TextArea
          aria-label={"Description"}
          type={"text"}
          isDisabled={false}
          value={decisionService.description}
          placeholder={"Enter a description..."}
          style={{ resize: "vertical", minHeight: "40px" }}
          rows={6}
        />
      </FormGroup>

      <FormGroup label="ID">
        <ClipboardCopy isReadOnly={true} hoverTip="Copy" clickTip="Copied">
          {decisionService["@_id"]}
        </ClipboardCopy>
      </FormGroup>

      <FormGroup label="Output decisions"></FormGroup>
      <FormGroup label="Input decisions"></FormGroup>
      <FormGroup label="Input data"></FormGroup>

      <FormGroup label="Documentation links">
        <DocumentationLinksInput />
      </FormGroup>
    </>
  );
}
