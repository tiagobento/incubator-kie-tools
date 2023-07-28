import * as React from "react";
import { ClipboardCopy } from "@patternfly/react-core/dist/js/components/ClipboardCopy";
import {
  Form,
  FormFieldGroupExpandable,
  FormFieldGroupHeader,
  FormGroup,
} from "@patternfly/react-core/dist/js/components/Form";
import { Text, TextContent, TextVariants } from "@patternfly/react-core/dist/js/components/Text";
import { TextArea } from "@patternfly/react-core/dist/js/components/TextArea";
import { TextInput } from "@patternfly/react-core/dist/js/components/TextInput";
import { DataSourceIcon } from "@patternfly/react-icons/dist/js/icons/data-source-icon";
import { useDmnEditor } from "../store/Store";

export function GlobalProperties() {
  const { dmn, dispatch } = useDmnEditor();

  return (
    <Form>
      <FormFieldGroupExpandable
        isExpanded={true}
        header={
          <FormFieldGroupHeader
            titleText={{
              id: "properties-panel-global-options",
              text: (
                <TextContent>
                  <Text component={TextVariants.h4}>
                    <DataSourceIcon />
                    &nbsp;&nbsp;Global properties
                  </Text>
                </TextContent>
              ),
            }}
          />
        }
      >
        <FormGroup label="Name">
          <TextInput
            aria-label={"Name"}
            type={"text"}
            isDisabled={false}
            placeholder={"Enter a name..."}
            value={dmn.model.definitions["@_name"]}
            onChange={(newName) => dispatch.dmn.set((model) => (model.definitions["@_name"] = newName))}
          />
        </FormGroup>
        <FormGroup label="Description">
          <TextArea
            aria-label={"Description"}
            type={"text"}
            isDisabled={false}
            style={{ resize: "vertical", minHeight: "40px" }}
            rows={6}
            placeholder={"Enter a description..."}
            value={dmn.model.definitions["description"]}
            onChange={(newDescription) => dispatch.dmn.set((model) => (model.definitions.description = newDescription))}
          />
        </FormGroup>

        <br />
        <br />

        <FormGroup label="Namespace">
          <TextInput
            aria-label={"Namespace"}
            type={"text"}
            isDisabled={false}
            placeholder={"Enter a namespace..."}
            value={dmn.model.definitions["@_namespace"]}
            onChange={(newNamespace) => dispatch.dmn.set((model) => (model.definitions["@_namespace"] = newNamespace))}
          />
        </FormGroup>
        <FormGroup label="Expression language">
          <TextInput
            aria-label={"Expression language"}
            type={"text"}
            isDisabled={false}
            placeholder={"Enter an expression language..."}
            value={dmn.model.definitions["@_expressionLanguage"]}
            onChange={(newExprLang) =>
              dispatch.dmn.set((model) => (model.definitions["@_expressionLanguage"] = newExprLang))
            }
          />
        </FormGroup>
        <FormGroup label="ID">
          <ClipboardCopy isReadOnly={true} hoverTip="Copy" clickTip="Copied">
            {dmn.model.definitions["@_id"]}
          </ClipboardCopy>
        </FormGroup>
      </FormFieldGroupExpandable>
    </Form>
  );
}