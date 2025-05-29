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

import {
  parseBpmn20Drools10MetaData,
  setBpmn20Drools10MetaData,
} from "@kie-tools/bpmn-marshaller/dist/drools-extension-metaData";
import { SectionHeader } from "@kie-tools/xyflow-react-kie-diagram/dist/propertiesPanel/SectionHeader";
import { generateUuid } from "@kie-tools/xyflow-react-kie-diagram/dist/uuid/uuid";
import { Button, ButtonVariant } from "@patternfly/react-core/dist/js/components/Button";
import { Checkbox } from "@patternfly/react-core/dist/js/components/Checkbox";
import { ClipboardCopy } from "@patternfly/react-core/dist/js/components/ClipboardCopy";
import { Divider } from "@patternfly/react-core/dist/js/components/Divider";
import { Form, FormGroup, FormSection } from "@patternfly/react-core/dist/js/components/Form";
import { Modal, ModalVariant } from "@patternfly/react-core/dist/js/components/Modal";
import { TextArea } from "@patternfly/react-core/dist/js/components/TextArea";
import { TextInput } from "@patternfly/react-core/dist/js/components/TextInput";
import { ToggleGroup, ToggleGroupItem } from "@patternfly/react-core/dist/js/components/ToggleGroup";
import { ColumnsIcon } from "@patternfly/react-icons/dist/js/icons/columns-icon";
import { DataSourceIcon } from "@patternfly/react-icons/dist/js/icons/data-source-icon";
import { ImportIcon } from "@patternfly/react-icons/dist/js/icons/import-icon";
import { SyncAltIcon } from "@patternfly/react-icons/dist/js/icons/sync-alt-icon";
import { TagIcon } from "@patternfly/react-icons/dist/js/icons/tag-icon";
import { TimesIcon } from "@patternfly/react-icons/dist/js/icons/times-icon";
import * as React from "react";
import { useState } from "react";
import { addOrGetProcessAndDiagramElements } from "../mutations/addOrGetProcessAndDiagramElements";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../store/StoreContext";
import { Imports } from "./imports/Imports";
import { Metadata } from "./metadata/Metadata";
import { SlaDueDateInput } from "./slaDueDate/SlaDueDateInput";

export function GlobalProperties() {
  const thisBpmn = useBpmnEditorStore((s) => s.bpmn);
  const settings = useBpmnEditorStore((s) => s.settings);

  const process = useBpmnEditorStore((s) =>
    s.bpmn.model.definitions.rootElement?.find((s) => s.__$$element === "process")
  );

  const importsCount = process?.extensionElements?.["drools:import"]?.length ?? 0;
  const metadataEntriesCount = process?.extensionElements?.["drools:metaData"]?.length ?? 0;

  const [isGlobalSectionExpanded, setGlobalSectionExpanded] = useState<boolean>(true);
  const [isImportsSectionExpanded, setImportsSectionExpanded] = useState<boolean>(false);
  const [isMetadataSectionExpanded, setMetadataSectionExpanded] = useState<boolean>(false);
  const [isIdNamespaceSectionExpanded, setIdNamespaceSectionExpanded] = useState<boolean>(false);
  const [isMiscSectionExpanded, setMiscSectionExpanded] = useState<boolean>(false);

  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

  const [showRegenerateIdConfirmationModal, setShowRegenerateIdConfirmationModal] = useState(false);
  const [showCorrelationsModal, setShowCorrelationsModal] = useState(false);

  const closeCorrelationsModal = React.useCallback(() => {
    setShowCorrelationsModal(false);
  }, []);

  return (
    <>
      <Form>
        <FormSection
          title={
            <SectionHeader
              expands={true}
              isSectionExpanded={isGlobalSectionExpanded}
              toogleSectionExpanded={() => setGlobalSectionExpanded((prev) => !prev)}
              icon={<DataSourceIcon width={16} height={36} style={{ marginLeft: "12px" }} />}
              title={"Process"}
              action={
                <Button
                  title={"Close"}
                  variant={ButtonVariant.plain}
                  onClick={() => {
                    bpmnEditorStoreApi.setState((state) => {
                      state.propertiesPanel.isOpen = false;
                    });
                  }}
                >
                  <TimesIcon />
                </Button>
              }
            />
          }
        >
          {isGlobalSectionExpanded && (
            <>
              <FormSection style={{ paddingLeft: "20px", marginTop: "20px" }}>
                <FormGroup label="Name">
                  <TextInput
                    aria-label={"Name"}
                    type={"text"}
                    isDisabled={settings.isReadOnly}
                    placeholder={"Enter a name..."}
                    value={process?.["@_name"]}
                    onChange={(e, newName) =>
                      bpmnEditorStoreApi.setState((s) => {
                        const { process } = addOrGetProcessAndDiagramElements({
                          definitions: s.bpmn.model.definitions,
                        });
                        process["@_name"] = newName;
                      })
                    }
                  />
                </FormGroup>
                <FormGroup label="Documentation">
                  <TextArea
                    aria-label={"Documentation"}
                    type={"text"}
                    isDisabled={settings.isReadOnly}
                    style={{ resize: "vertical", minHeight: "40px" }}
                    rows={3}
                    placeholder={"Enter documentation..."}
                    value={process?.documentation?.[0].__$$text}
                    onChange={(e, newDocumentation) =>
                      bpmnEditorStoreApi.setState((s) => {
                        const { process } = addOrGetProcessAndDiagramElements({
                          definitions: s.bpmn.model.definitions,
                        });
                        process.documentation ??= [];
                        process.documentation[0] = {
                          "@_id": generateUuid(),
                          __$$text: newDocumentation,
                        };
                      })
                    }
                  />
                </FormGroup>

                <Divider inset={{ default: "insetXs" }} />

                <FormGroup
                  fieldId="kie-bpmn-editor--global-properties-panel--adhoc"
                  // helperText={"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod."} // FIXME: Tiago -> Description
                >
                  <Checkbox
                    label="Ad-hoc"
                    id="kie-bpmn-editor--global-properties-panel--adhoc"
                    name="is-adhoc"
                    aria-label="Adhoc"
                    isChecked={process?.["@_drools:adHoc"] ?? false}
                    onChange={(e, checked) => {
                      bpmnEditorStoreApi.setState((s) => {
                        const { process } = addOrGetProcessAndDiagramElements({
                          definitions: s.bpmn.model.definitions,
                        });
                        process["@_drools:adHoc"] = checked;
                      });
                    }}
                  />
                </FormGroup>

                <SlaDueDateInput element={process} />
              </FormSection>
            </>
          )}
        </FormSection>

        <FormSection
          title={
            <SectionHeader
              expands={true}
              isSectionExpanded={isImportsSectionExpanded}
              toogleSectionExpanded={() => setImportsSectionExpanded((prev) => !prev)}
              icon={<ImportIcon width={16} height={36} style={{ marginLeft: "12px" }} />}
              title={"Imports" + (importsCount > 0 ? ` (${importsCount})` : "")}
            />
          }
        >
          {isImportsSectionExpanded && (
            <>
              <FormSection style={{ paddingLeft: "20px", marginTop: "20px", gap: 0 }}>
                <Imports p={process} />
              </FormSection>
            </>
          )}
        </FormSection>

        <FormSection
          title={
            <SectionHeader
              expands={true}
              isSectionExpanded={isMetadataSectionExpanded}
              toogleSectionExpanded={() => setMetadataSectionExpanded((prev) => !prev)}
              icon={<ColumnsIcon width={16} height={36} style={{ marginLeft: "12px" }} />}
              title={"Metadata" + (metadataEntriesCount > 0 ? ` (${metadataEntriesCount})` : "")}
            />
          }
        >
          {isMetadataSectionExpanded && (
            <>
              <FormSection style={{ paddingLeft: "20px", marginTop: "20px", gap: 0 }}>
                <Metadata obj={process} />
              </FormSection>
            </>
          )}
        </FormSection>

        <FormSection
          title={
            <SectionHeader
              expands={true}
              isSectionExpanded={isIdNamespaceSectionExpanded}
              toogleSectionExpanded={() => setIdNamespaceSectionExpanded((prev) => !prev)}
              icon={<TagIcon width={16} height={36} style={{ marginLeft: "12px" }} />}
              title={"ID & Namespace"}
              action={
                <Button
                  title={"Re-generate ID & Namespace"}
                  variant={ButtonVariant.plain}
                  isDisabled={settings.isReadOnly}
                  onClick={() => setShowRegenerateIdConfirmationModal(true)}
                  style={{ paddingBottom: 0, paddingTop: 0 }}
                >
                  <SyncAltIcon />
                </Button>
              }
            />
          }
        >
          {isIdNamespaceSectionExpanded && (
            <>
              <FormSection style={{ paddingLeft: "20px", marginTop: "20px" }}>
                <FormGroup label="ID">
                  <ClipboardCopy
                    placeholder="Enter an ID..."
                    isReadOnly={settings.isReadOnly}
                    hoverTip="Copy"
                    clickTip="Copied"
                    onChange={(newId) => {
                      bpmnEditorStoreApi.setState((state) => {
                        state.bpmn.model.definitions["@_id"] = `${newId}`;
                      });
                    }}
                  >
                    {thisBpmn.model.definitions["@_id"]}
                  </ClipboardCopy>
                </FormGroup>

                <FormGroup label="Namespace">
                  <ClipboardCopy
                    placeholder="Enter a Namespace..."
                    isReadOnly={settings.isReadOnly}
                    hoverTip="Copy"
                    clickTip="Copied"
                    onChange={(newNamespace) => {
                      bpmnEditorStoreApi.setState((state) => {
                        state.bpmn.model.definitions["@_targetNamespace"] = `${newNamespace}`;
                      });
                    }}
                  >
                    {thisBpmn.model.definitions["@_targetNamespace"]}
                  </ClipboardCopy>
                </FormGroup>
              </FormSection>
            </>
          )}
        </FormSection>

        <FormSection
          title={
            <SectionHeader
              expands={true}
              isSectionExpanded={isMiscSectionExpanded}
              toogleSectionExpanded={() => setMiscSectionExpanded((prev) => !prev)}
              title={"Misc."}
            />
          }
        >
          {isMiscSectionExpanded && (
            <>
              <FormSection style={{ paddingLeft: "20px", marginTop: "20px" }}>
                <FormGroup
                  label="Expression language"
                  //   helperText={
                  //     "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                  //   } // FIXME: Tiago -> Description
                >
                  <TextInput
                    aria-label={"Expression language"}
                    type={"text"}
                    isDisabled={settings.isReadOnly}
                    placeholder={"Enter an expression language..."}
                    value={thisBpmn.model.definitions["@_expressionLanguage"]}
                    onChange={(e, newExprLang) =>
                      bpmnEditorStoreApi.setState((state) => {
                        state.bpmn.model.definitions["@_expressionLanguage"] = newExprLang;
                      })
                    }
                  />
                </FormGroup>

                <FormGroup
                  label="Type"
                  // helperText={
                  //   "Consectetur adipiscing elit. Lorem ipsum dolor sit amet, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                  // } // FIXME: Tiago -> Description
                >
                  <ToggleGroup isCompact aria-label="Process type">
                    <ToggleGroupItem
                      text="Private"
                      isDisabled={settings.isReadOnly}
                      isSelected={process?.["@_processType"] === "Private"}
                      onChange={() => {
                        bpmnEditorStoreApi.setState((s) => {
                          const { process } = addOrGetProcessAndDiagramElements({
                            definitions: s.bpmn.model.definitions,
                          });
                          process["@_processType"] = "Private";
                        });
                      }}
                    />
                    <ToggleGroupItem
                      text="Public"
                      isDisabled={settings.isReadOnly}
                      isSelected={process?.["@_processType"] === "Public"}
                      onChange={() => {
                        bpmnEditorStoreApi.setState((s) => {
                          const { process } = addOrGetProcessAndDiagramElements({
                            definitions: s.bpmn.model.definitions,
                          });
                          process["@_processType"] = "Public";
                        });
                      }}
                    />
                  </ToggleGroup>
                </FormGroup>

                <FormGroup
                  fieldId="kie-bpmn-editor--global-properties-panel--executable"
                  // helperText={"Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."} // FIXME: Tiago -> Description
                >
                  <Checkbox
                    label="Executable"
                    id="kie-bpmn-editor--global-properties-panel--executable"
                    name="is-executable"
                    aria-label="Executable"
                    isChecked={process?.["@_isExecutable"] ?? true}
                    onChange={(e, checked) => {
                      bpmnEditorStoreApi.setState((s) => {
                        const { process } = addOrGetProcessAndDiagramElements({
                          definitions: s.bpmn.model.definitions,
                        });
                        process["@_isExecutable"] = checked;
                      });
                    }}
                  />
                </FormGroup>

                <FormGroup
                  label="Package name"
                  // helperText={"Dot-separated, like Java packages."} // FIXME: Tiago -> Description
                >
                  <TextInput
                    aria-label={"Package name"}
                    type={"text"}
                    isDisabled={settings.isReadOnly}
                    placeholder={"Enter a package name..."}
                    value={process?.["@_drools:packageName"]}
                    onChange={(e, newPackageName) =>
                      bpmnEditorStoreApi.setState((s) => {
                        const { process } = addOrGetProcessAndDiagramElements({
                          definitions: s.bpmn.model.definitions,
                        });
                        process["@_drools:packageName"] = newPackageName;
                      })
                    }
                  />
                </FormGroup>

                <FormGroup
                  label="Version"
                  // helperText={"E.g., 0.0.1"} // FIXME: Tiago -> Description
                >
                  <TextInput
                    aria-label={"Version"}
                    type={"text"}
                    isDisabled={settings.isReadOnly}
                    placeholder={"Enter a version..."}
                    value={process?.["@_drools:version"]}
                    onChange={(e, newVersion) =>
                      bpmnEditorStoreApi.setState((s) => {
                        const { process } = addOrGetProcessAndDiagramElements({
                          definitions: s.bpmn.model.definitions,
                        });
                        process["@_drools:version"] = newVersion;
                      })
                    }
                  />
                </FormGroup>

                <FormGroup
                  label="Process Instance Description"
                  //   helperText={
                  //     "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut."
                  //   } // FIXME: Tiago -> Description
                >
                  <TextArea
                    aria-label={"Process Instance Description"}
                    type={"text"}
                    isDisabled={settings.isReadOnly}
                    style={{ resize: "vertical", minHeight: "40px" }}
                    rows={3}
                    placeholder={"Enter a description..."}
                    value={parseBpmn20Drools10MetaData(process).get("customDescription")} // FIXME: Tiago
                    onChange={(e, newDescription) =>
                      bpmnEditorStoreApi.setState((s) => {
                        const { process } = addOrGetProcessAndDiagramElements({
                          definitions: s.bpmn.model.definitions,
                        });
                        setBpmn20Drools10MetaData(process, "customDescription", newDescription);
                      })
                    }
                  />
                </FormGroup>
              </FormSection>
            </>
          )}
        </FormSection>

        <br />
        <br />
        <br />

        <Modal
          aria-labelledby={"Regenerate ID & Namespace"}
          variant={ModalVariant.small}
          isOpen={showRegenerateIdConfirmationModal}
          onClose={() => setShowRegenerateIdConfirmationModal(false)}
          actions={[
            <Button
              key="confirm"
              variant={ButtonVariant.primary}
              isDisabled={settings.isReadOnly}
              onClick={() => {
                setShowRegenerateIdConfirmationModal(false);
                bpmnEditorStoreApi.setState((state) => {
                  state.bpmn.model.definitions["@_id"] = generateUuid();
                  state.bpmn.model.definitions["@_targetNamespace"] = `https://kie.apache.org/bpmn/${generateUuid()}`;
                });
              }}
            >
              Yes, re-generate ID and Namespace
            </Button>,
            <Button key="cancel" variant="link" onClick={() => setShowRegenerateIdConfirmationModal(false)}>
              Cancel
            </Button>,
          ]}
        >
          Re-generating the ID and Namespace of a BPMN file will potentially break references to it.
          <br />
          <br />
          Are you sure you want to continue?
        </Modal>
      </Form>
    </>
  );
}
