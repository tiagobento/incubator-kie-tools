/*
 * Copyright 2020 Red Hat, Inc. and/or its affiliates.
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

import {
  EMPTY_FILE_BPMN,
  EMPTY_FILE_DMN,
  EMPTY_FILE_PMML,
  File as UploadFile,
} from "@kie-tooling-core/editor/dist/channel";
import { Brand } from "@patternfly/react-core/dist/js/components/Brand";
import { Button } from "@patternfly/react-core/dist/js/components/Button";
import { Card, CardBody, CardFooter, CardHeader } from "@patternfly/react-core/dist/js/components/Card";
import { Dropdown, DropdownItem, DropdownToggle } from "@patternfly/react-core/dist/js/components/Dropdown";
import { FileUpload } from "@patternfly/react-core/dist/js/components/FileUpload";
import { Form, FormGroup } from "@patternfly/react-core/dist/js/components/Form";
import { Gallery } from "@patternfly/react-core/dist/js/layouts/Gallery";
import {
  Page,
  PageHeader,
  PageHeaderTools,
  PageHeaderToolsGroup,
  PageHeaderToolsItem,
  PageSection,
} from "@patternfly/react-core/dist/js/components/Page";
import { Text, TextContent, TextVariants } from "@patternfly/react-core/dist/js/components/Text";
import { TextInput } from "@patternfly/react-core/dist/js/components/TextInput";
import { Title } from "@patternfly/react-core/dist/js/components/Title";
import { ExternalLinkAltIcon } from "@patternfly/react-icons/dist/js/icons/external-link-alt-icon";
import { OutlinedQuestionCircleIcon } from "@patternfly/react-icons/dist/js/icons/outlined-question-circle-icon";
import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router";
import { Link } from "react-router-dom";
import { AnimatedTripleDotLabel } from "../common/AnimatedTripleDotLabel";
import { useGlobals } from "../common/GlobalContext";
import { extractFileExtension, removeFileExtension } from "../common/utils";
import { useOnlineI18n } from "../common/i18n";
import { useQueryParams } from "../queryParams/QueryParamsContext";
import { useSettings } from "../settings/SettingsContext";
import { QueryParams } from "../common/Routes";
import { useWorkspaces } from "../workspace/WorkspaceContext";

enum InputFileUrlState {
  INITIAL,
  INVALID_URL,
  INVALID_EXTENSION,
  NOT_FOUND_URL,
  CORS_NOT_AVAILABLE,
  INVALID_GIST,
  INVALID_GIST_EXTENSION,
  VALIDATING,
  VALID,
}

interface InputFileUrlStateType {
  urlValidation: InputFileUrlState;
  urlToOpen: string | undefined;
}

export function HomePage() {
  const queryParams = useQueryParams();
  const globals = useGlobals();
  const settings = useSettings();
  const history = useHistory();
  const { i18n } = useOnlineI18n();
  const [githubRepositoryUrl, setGithubRepositoryUrl] = useState("");
  const [isOpenProjectLoading, setOpenProjectLoading] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<UploadFile[]>([]);
  const workspaces = useWorkspaces();

  useEffect(() => {
    globals.setUploadedFile(undefined);
  }, []);

  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isUploadRejected, setIsUploadRejected] = useState(false);

  const [inputFileUrl, setInputFileUrl] = useState("");
  const [inputFileUrlState, setInputFileUrlState] = useState<InputFileUrlStateType>({
    urlValidation: InputFileUrlState.INITIAL,
    urlToOpen: undefined,
  });

  const onFileUpload = useCallback(
    (
      file: File,
      fileName: string,
      e:
        | React.DragEvent<HTMLElement>
        | React.ChangeEvent<HTMLTextAreaElement>
        | React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
      e.stopPropagation();
      e.preventDefault();

      setUploadedFileName(fileName);
      setIsUploadRejected(false);

      const fileExtension = extractFileExtension(fileName);
      if (!fileExtension || !globals.editorEnvelopeLocator.mapping.has(fileExtension)) {
        return;
      }

      workspaces.createWorkspaceFromLocal(
        [
          {
            path: fileName,
            isReadOnly: false,
            fileExtension,
            fileName: removeFileExtension(fileName),
            getFileContents: () =>
              new Promise<string | undefined>((resolve) => {
                const reader = new FileReader();
                reader.onload = (event: any) => resolve(event.target.result as string);
                reader.readAsText(file);
              }),
          },
        ],
        false
      );
    },
    [globals, workspaces]
  );

  const onDropRejected = useCallback(() => setIsUploadRejected(true), []);

  const createEmptyBpmnFile = useCallback(() => {
    workspaces.createWorkspaceFromLocal([{ ...EMPTY_FILE_BPMN, kind: "local" }], false);
  }, [workspaces]);

  const createEmptyDmnFile = useCallback(() => {
    workspaces.createWorkspaceFromLocal([{ ...EMPTY_FILE_DMN, kind: "local" }], false);
  }, [workspaces]);

  const createEmptyPmmlFile = useCallback(() => {
    workspaces.createWorkspaceFromLocal([{ ...EMPTY_FILE_PMML, kind: "local" }], false);
  }, [workspaces]);

  const trySample = useCallback(
    (fileExtension: string) => {
      const filePath = globals.routes.static.sample.path({ type: fileExtension });
      history.push({
        pathname: globals.routes.editor.path({ extension: fileExtension }),
        search: globals.routes.editor.queryArgs(queryParams).with(QueryParams.URL, filePath).toString(),
      });
    },
    [globals, history, queryParams]
  );

  const tryBpmnSample = useCallback(() => {
    trySample("bpmn");
  }, [trySample]);

  const tryDmnSample = useCallback(() => {
    trySample("dmn");
  }, [trySample]);

  const tryPmmlSample = useCallback(() => {
    trySample("pmml");
  }, [trySample]);

  const validateUrl = useCallback(
    async (fileUrl: string) => {
      if (fileUrl.trim() === "") {
        setInputFileUrlState({
          urlValidation: InputFileUrlState.INITIAL,
          urlToOpen: undefined,
        });
        return;
      }

      let url: URL;
      try {
        url = new URL(fileUrl);
      } catch (e) {
        setInputFileUrlState({
          urlValidation: InputFileUrlState.INVALID_URL,
          urlToOpen: undefined,
        });
        return;
      }

      if (settings.github.service.isGist(fileUrl)) {
        setInputFileUrlState({
          urlValidation: InputFileUrlState.VALIDATING,
          urlToOpen: undefined,
        });

        const gistId = settings.github.service.isGistDefault(fileUrl)
          ? settings.github.service.extractGistId(fileUrl)
          : settings.github.service.extractGistIdFromRawUrl(fileUrl);

        const gistFileName = settings.github.service.isGistDefault(fileUrl)
          ? settings.github.service.extractGistFilename(fileUrl)
          : settings.github.service.extractGistFilenameFromRawUrl(fileUrl);

        let rawUrl: string;
        try {
          rawUrl = await settings.github.service.getGistRawUrlFromId(settings.github.octokit, gistId, gistFileName);
        } catch (e) {
          setInputFileUrlState({
            urlValidation: InputFileUrlState.INVALID_GIST,
            urlToOpen: undefined,
          });
          return;
        }

        const gistExtension = extractFileExtension(new URL(rawUrl).pathname);
        if (gistExtension && globals.editorEnvelopeLocator.mapping.has(gistExtension)) {
          setInputFileUrlState({
            urlValidation: InputFileUrlState.VALID,
            urlToOpen: rawUrl,
          });
          return;
        }

        setInputFileUrlState({
          urlValidation: InputFileUrlState.INVALID_GIST_EXTENSION,
          urlToOpen: undefined,
        });
        return;
      }

      const fileExtension = extractFileExtension(url.pathname);
      if (!fileExtension || !globals.editorEnvelopeLocator.mapping.has(fileExtension)) {
        setInputFileUrlState({
          urlValidation: InputFileUrlState.INVALID_EXTENSION,
          urlToOpen: undefined,
        });
        return;
      }

      setInputFileUrlState({
        urlValidation: InputFileUrlState.VALIDATING,
        urlToOpen: undefined,
      });
      if (settings.github.service.isGithub(fileUrl)) {
        try {
          const rawUrl = await settings.github.service.getGithubRawUrl(settings.github.octokit, fileUrl);
          setInputFileUrlState({
            urlValidation: InputFileUrlState.VALID,
            urlToOpen: rawUrl,
          });
          return;
        } catch (err) {
          setInputFileUrlState({
            urlValidation: InputFileUrlState.NOT_FOUND_URL,
            urlToOpen: undefined,
          });
          return;
        }
      }

      try {
        if ((await fetch(fileUrl)).ok) {
          setInputFileUrlState({
            urlValidation: InputFileUrlState.VALID,
            urlToOpen: fileUrl,
          });
          return;
        }

        setInputFileUrlState({
          urlValidation: InputFileUrlState.NOT_FOUND_URL,
          urlToOpen: undefined,
        });
      } catch (e) {
        setInputFileUrlState({
          urlValidation: InputFileUrlState.CORS_NOT_AVAILABLE,
          urlToOpen: undefined,
        });
      }
    },
    [settings.github.octokit, globals.editorEnvelopeLocator.mapping, settings.github.service]
  );

  useEffect(() => {
    validateUrl(inputFileUrl);
  }, [validateUrl, inputFileUrl]);

  const inputFileFromUrlChanged = useCallback((fileUrl: string) => {
    setInputFileUrl(fileUrl);
  }, []);

  const isUrlInputTextValid = useMemo(
    () =>
      inputFileUrlState.urlValidation === InputFileUrlState.VALID ||
      inputFileUrlState.urlValidation === InputFileUrlState.INITIAL ||
      inputFileUrlState.urlValidation === InputFileUrlState.VALIDATING,
    [inputFileUrlState]
  );

  const urlCanBeOpen = useMemo(() => inputFileUrlState.urlValidation === InputFileUrlState.VALID, [inputFileUrlState]);

  const onInputFileFromUrlBlur = useCallback(() => {
    if (inputFileUrl.trim() === "") {
      setInputFileUrlState({
        urlValidation: InputFileUrlState.INITIAL,
        urlToOpen: undefined,
      });
    }
  }, [inputFileUrl]);

  const openFileFromUrl = useCallback(() => {
    const filePath = inputFileUrlState.urlToOpen;
    if (urlCanBeOpen && filePath) {
      const fileExtension = extractFileExtension(new URL(filePath).pathname);
      history.push({
        pathname: globals.routes.editor.path({ extension: fileExtension! }),
        search: globals.routes.editor.queryArgs(queryParams).with(QueryParams.URL, filePath).toString(),
      });
    }
  }, [queryParams, globals.routes, history, inputFileUrlState, urlCanBeOpen]);

  const helperMessageForInputFileFromUrlState = useMemo(() => {
    switch (inputFileUrlState.urlValidation) {
      case InputFileUrlState.VALIDATING:
        return <AnimatedTripleDotLabel label={i18n.homePage.openUrl.validating} />;
      default:
        return "";
    }
  }, [inputFileUrlState, i18n]);

  const helperInvalidMessageForInputFileFromUrlState = useMemo(() => {
    switch (inputFileUrlState.urlValidation) {
      case InputFileUrlState.INVALID_GIST_EXTENSION:
        return i18n.homePage.openUrl.invalidGistExtension;
      case InputFileUrlState.INVALID_EXTENSION:
        return i18n.homePage.openUrl.invalidExtension;
      case InputFileUrlState.INVALID_GIST:
        return i18n.homePage.openUrl.invalidGist;
      case InputFileUrlState.INVALID_URL:
        return i18n.homePage.openUrl.invalidUrl;
      case InputFileUrlState.NOT_FOUND_URL:
        return i18n.homePage.openUrl.notFoundUrl;
      case InputFileUrlState.CORS_NOT_AVAILABLE:
        return i18n.homePage.openUrl.corsNotAvailable;
      default:
        return "";
    }
  }, [inputFileUrlState, i18n]);

  const externalFileFormSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      e.stopPropagation();
      openFileFromUrl();
    },
    [inputFileUrl]
  );

  const linkDropdownItems = [
    <DropdownItem key="github-chrome-extension-dropdown-link">
      <Link to={globals.routes.download.path({})}>{i18n.homePage.dropdown.getHub}</Link>
    </DropdownItem>,
  ];

  const userDropdownItems = [
    <DropdownItem key="">
      <a href={"https://groups.google.com/forum/#!forum/kogito-development"} target={"_blank"}>
        {i18n.homePage.dropdown.onlineForum}
        <ExternalLinkAltIcon className="pf-u-mx-sm" />
      </a>
    </DropdownItem>,
  ];

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isLinkDropdownOpen, setIsLinkDropdownOpen] = useState(false);

  const headerToolbar = (
    <PageHeaderTools>
      <PageHeaderToolsGroup>
        <PageHeaderToolsItem className="pf-u-display-none pf-u-display-flex-on-lg">
          <Link to={globals.routes.download.path({})} className="kogito--editor-hub-download_link">
            {i18n.homePage.dropdown.getHub}
          </Link>
        </PageHeaderToolsItem>
        <PageHeaderToolsItem className="pf-u-display-none-on-lg">
          <Dropdown
            isPlain={true}
            position="right"
            isOpen={isLinkDropdownOpen}
            toggle={
              <DropdownToggle
                toggleIndicator={null}
                onToggle={setIsLinkDropdownOpen}
                aria-label="External links to hub"
              >
                <ExternalLinkAltIcon />
              </DropdownToggle>
            }
            dropdownItems={linkDropdownItems}
          />
        </PageHeaderToolsItem>
        <PageHeaderToolsItem>
          <Dropdown
            isPlain={true}
            position="right"
            isOpen={isUserDropdownOpen}
            toggle={
              <DropdownToggle toggleIndicator={null} onToggle={setIsUserDropdownOpen} aria-label="Links">
                <OutlinedQuestionCircleIcon />
              </DropdownToggle>
            }
            dropdownItems={userDropdownItems}
          />
        </PageHeaderToolsItem>
      </PageHeaderToolsGroup>
    </PageHeaderTools>
  );

  const Header = (
    <PageHeader
      logo={<Brand src={globals.routes.static.images.homeLogo.path({})} alt="Logo" />}
      logoProps={{ onClick: () => history.push({ pathname: globals.routes.home.path({}) }) }}
      headerTools={headerToolbar}
    />
  );

  //

  const githubRepositoryUrlChanged = useCallback((repositoryUrl: string) => {
    setGithubRepositoryUrl(repositoryUrl);
  }, []);

  const onFolderUpload = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();

    const filesToUpload: UploadFile[] = Array.from(e.target.files).map((file: File) => {
      return {
        isReadOnly: false,
        fileExtension: extractFileExtension(file.name),
        fileName: removeFileExtension(file.name),
        getFileContents: () =>
          new Promise<string | undefined>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event: any) => resolve(event.target.result as string);
            reader.readAsText(file);
          }),
        path: (file as any).webkitRelativePath,
      } as UploadFile;
    });

    setFilesToUpload(filesToUpload);
  }, []);
  const createWorkspace = useCallback(async () => {
    if ((filesToUpload.length === 0 && githubRepositoryUrl.trim() === "") || isOpenProjectLoading) {
      return;
    }
    setOpenProjectLoading(true);
    if (githubRepositoryUrl.trim() !== "") {
      // TODO CAPONETTO: URL might be invalid; fix UX stuff when it is better defined
      await workspaces.createWorkspaceFromGitHubRepository(new URL(githubRepositoryUrl), "main");
    } else if (filesToUpload.length > 0) {
      await workspaces.createWorkspaceFromLocal(filesToUpload, false);
    } else {
      throw new Error("No project to open here");
    }
    setOpenProjectLoading(false);
  }, [filesToUpload, githubRepositoryUrl, isOpenProjectLoading, workspaces]);

  const githubRepositoryFormSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      e.stopPropagation();
      await createWorkspace();
    },
    [createWorkspace]
  );

  return (
    <Page header={Header} className="kogito--editor-landing">
      <PageSection variant="dark" className="kogito--editor-landing__title-section pf-u-p-2xl-on-lg">
        <TextContent>
          <Title size="3xl" headingLevel="h1">
            {i18n.homePage.header.title}
          </Title>
          <Text>{i18n.homePage.header.welcomeText}</Text>
          <Text component={TextVariants.small} className="pf-u-text-align-right">
            {`${i18n.terms.poweredBy} `}
            <Brand
              src={globals.routes.static.images.kogitoLogoWhite.path({})}
              alt="Kogito Logo"
              style={{ height: "1em", verticalAlign: "text-bottom" }}
            />
          </Text>
        </TextContent>
      </PageSection>
      <PageSection className="pf-u-px-2xl-on-lg">
        <Gallery hasGutter={true} className="kogito--editor-landing__gallery">
          <Card>
            <CardHeader>
              <Title headingLevel="h2" size="2xl">
                {i18n.homePage.bpmnCard.title}
              </Title>
            </CardHeader>
            <CardBody isFilled={false}>{i18n.homePage.bpmnCard.explanation}</CardBody>
            <CardBody isFilled={true}>
              <Button variant="link" isInline={true} onClick={tryBpmnSample} ouiaId="try-bpmn-sample-button">
                {i18n.homePage.trySample}
              </Button>
            </CardBody>
            <CardFooter>
              <Button variant="secondary" onClick={createEmptyBpmnFile} ouiaId="new-bpmn-button">
                {i18n.homePage.bpmnCard.createNew}
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <Title headingLevel="h2" size="2xl">
                {i18n.homePage.dmnCard.title}
              </Title>
            </CardHeader>
            <CardBody isFilled={false}>{i18n.homePage.dmnCard.explanation}</CardBody>
            <CardBody isFilled={true}>
              <Button variant="link" isInline={true} onClick={tryDmnSample} ouiaId="try-dmn-sample-button">
                {i18n.homePage.trySample}
              </Button>
            </CardBody>
            <CardFooter>
              <Button variant="secondary" onClick={createEmptyDmnFile} ouiaId="new-dmn-button">
                {i18n.homePage.dmnCard.createNew}
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <Title headingLevel="h2" size="2xl">
                {i18n.homePage.pmmlCard.title}
              </Title>
            </CardHeader>
            <CardBody isFilled={false}>{i18n.homePage.pmmlCard.explanation}</CardBody>
            <CardBody isFilled={true}>
              <Button variant="link" isInline={true} onClick={tryPmmlSample} ouiaId="try-pmml-sample-button">
                {i18n.homePage.trySample}
              </Button>
            </CardBody>
            <CardFooter>
              <Button variant="secondary" onClick={createEmptyPmmlFile} ouiaId="new-pmml-button">
                {i18n.homePage.pmmlCard.createNew}
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <Title headingLevel="h2" size="2xl">
                {i18n.homePage.uploadFile.header}
              </Title>
            </CardHeader>
            <CardBody>{i18n.homePage.uploadFile.body}</CardBody>
            <CardFooter>
              <Form>
                <FormGroup
                  fieldId={"file-upload-field"}
                  helperText={i18n.homePage.uploadFile.helperText}
                  helperTextInvalid={i18n.homePage.uploadFile.helperInvalidText}
                  validated={isUploadRejected ? "error" : "default"}
                >
                  <FileUpload
                    id={"file-upload-field"}
                    filenamePlaceholder={i18n.homePage.uploadFile.placeholder}
                    filename={uploadedFileName}
                    onChange={onFileUpload}
                    dropzoneProps={{
                      accept: [...globals.editorEnvelopeLocator.mapping.keys()].map((ext) => "." + ext).join(", "),
                      onDropRejected,
                    }}
                    validated={isUploadRejected ? "error" : "default"}
                  />
                </FormGroup>
              </Form>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <Title headingLevel="h2" size="2xl">
                {i18n.homePage.openUrl.openFromSource}
              </Title>
            </CardHeader>
            <CardBody isFilled={false}>{i18n.homePage.openUrl.description}</CardBody>
            <CardBody isFilled={true}>
              <Form onSubmit={externalFileFormSubmit} disabled={!isUrlInputTextValid} spellCheck={false}>
                <FormGroup
                  label="URL"
                  fieldId="url-text-input"
                  data-testid="url-form-input"
                  validated={isUrlInputTextValid ? "default" : "error"}
                  helperText={helperMessageForInputFileFromUrlState}
                  helperTextInvalid={helperInvalidMessageForInputFileFromUrlState}
                >
                  <TextInput
                    isRequired={true}
                    onBlur={onInputFileFromUrlBlur}
                    validated={isUrlInputTextValid ? "default" : "error"}
                    autoComplete={"off"}
                    value={inputFileUrl}
                    onChange={inputFileFromUrlChanged}
                    type="url"
                    data-testid="url-text-input"
                    id="url-text-input"
                    name="urlText"
                    aria-describedby="url-text-input-helper"
                    data-ouia-component-id="url-input"
                  />
                </FormGroup>
              </Form>
            </CardBody>
            <CardFooter>
              <Button
                variant="secondary"
                onClick={openFileFromUrl}
                isDisabled={!urlCanBeOpen}
                data-testid="open-url-button"
                ouiaId="open-from-source-button"
              >
                {i18n.homePage.openUrl.openFromSource}
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <Title headingLevel="h2" size="2xl">
                Open workspace
              </Title>
            </CardHeader>
            <CardBody isFilled={true}>
              <Form onSubmit={githubRepositoryFormSubmit} spellCheck={false}>
                <FormGroup label="GitHub URL" fieldId="github-url-text-input" data-testid="github-url-form-input">
                  <TextInput
                    isRequired={true}
                    autoComplete={"off"}
                    value={githubRepositoryUrl}
                    onChange={githubRepositoryUrlChanged}
                    type="url"
                    data-testid="github-url-text-input"
                    id="github-url-text-input"
                    name="githubUrlText"
                    aria-describedby="github-url-text-input-helper"
                    data-ouia-component-id="github-url-input"
                  />
                </FormGroup>
                <span>or</span>
                <FormGroup label="Upload Folder" fieldId="upload-folder-input" data-testid="upload-folder-input">
                  <input
                    type="file"
                    /* @ts-expect-error directory and webkitdirectory are not available but works*/
                    webkitdirectory=""
                    onChange={onFolderUpload}
                  />
                </FormGroup>
                <span>
                  <b>Note</b>: only supported files will be uploaded.
                </span>
              </Form>
            </CardBody>
            <CardFooter>
              <Button
                variant="secondary"
                onClick={createWorkspace}
                data-testid="open-project-button"
                ouiaId="open-project-button"
                isLoading={isOpenProjectLoading}
                spinnerAriaValueText={isOpenProjectLoading ? "Loading" : undefined}
              >
                {isOpenProjectLoading ? "Opening ..." : "Open workspace"}
              </Button>
            </CardFooter>
          </Card>
        </Gallery>
        <div className={"kogito-tooling--build-info"}>{process.env["WEBPACK_REPLACE__buildInfo"]}</div>
      </PageSection>
    </Page>
  );
}
