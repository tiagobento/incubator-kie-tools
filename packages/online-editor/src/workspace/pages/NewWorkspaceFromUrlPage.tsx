import { LocalFile, useWorkspaces } from "../WorkspacesContext";
import { useGlobals } from "../../common/GlobalContext";
import { useHistory } from "react-router";
import * as React from "react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Bullseye } from "@patternfly/react-core/dist/js/layouts/Bullseye";
import { Spinner } from "@patternfly/react-core/dist/js/components/Spinner";
import { Text, TextContent, TextVariants } from "@patternfly/react-core/dist/js/components/Text";
import { QueryParams } from "../../common/Routes";
import { useQueryParams } from "../../queryParams/QueryParamsContext";
import { useSettings } from "../../settings/SettingsContext";
import {
  EditorFetchFileErrorEmptyState,
  FetchFileError,
  FetchFileErrorReason,
} from "../../editor/EditorFetchFileErrorEmptyState";
import { extractFileExtension, removeDirectories, removeFileExtension } from "../../common/utils";

export function NewWorkspaceFromUrlPage() {
  const workspaces = useWorkspaces();
  const globals = useGlobals();
  const history = useHistory();
  const settings = useSettings();
  const queryParams = useQueryParams();
  const [fetchFileError, setFetchFileError] = useState<FetchFileError | undefined>(undefined);

  const queryParamUrl = useMemo(() => {
    return queryParams.get(QueryParams.URL);
  }, [queryParams]);

  const isSample = useMemo(() => {
    if (!queryParamUrl) {
      return false;
    }

    const fileExtension = extractFileExtension(queryParamUrl);
    if (!fileExtension || !Array.from(globals.editorEnvelopeLocator.mapping.keys()).includes(fileExtension)) {
      return false;
    }

    return queryParamUrl === globals.routes.static.sample.path({ type: fileExtension });
  }, [globals.editorEnvelopeLocator.mapping, globals.routes.static.sample, queryParamUrl]);

  const createWorkspaceForFile = useCallback(
    (file: LocalFile) => {
      workspaces.createWorkspaceFromLocal([file]).then(({ descriptor, suggestedFirstFile }) => {
        if (suggestedFirstFile) {
          history.replace({
            pathname: globals.routes.workspaceWithFilePath.path({
              workspaceId: descriptor.workspaceId,
              filePath: suggestedFirstFile.pathRelativeToWorkspaceRootWithoutExtension,
              extension: suggestedFirstFile.extension,
            }),
          });
          return;
        }

        history.replace({
          pathname: globals.routes.workspaceOverview.path({ workspaceId: descriptor.workspaceId }),
        });
      });
    },
    [globals.routes.workspaceOverview, globals.routes.workspaceWithFilePath, history, workspaces]
  );

  useEffect(() => {
    let canceled = false;
    setFetchFileError(undefined);

    if (globals.externalFile) {
      createWorkspaceForFile({
        path: `${globals.externalFile.fileName}.${globals.externalFile.fileExtension}`,
        getFileContents: async () => (await globals.externalFile!.getFileContents()) ?? "",
      });
      return;
    }

    if (queryParamUrl) {
      let filePath: string;

      if (isSample) {
        filePath = queryParamUrl;
      } else {
        try {
          const validUrl = new URL(queryParamUrl);
          filePath = validUrl.origin + validUrl.pathname;
        } catch (e) {
          setFetchFileError({
            reason: FetchFileErrorReason.CANT_FETCH,
            filePath: queryParamUrl,
          });
          return;
        }
      }

      const filePathExtension = extractFileExtension(filePath)!;
      const extractedFileName = decodeURIComponent(removeFileExtension(removeDirectories(filePath) ?? "unknown"));

      if (settings.github.service.isGist(queryParamUrl)) {
        settings.github.service
          .fetchGistFile(settings.github.octokit, queryParamUrl)
          .then((content) => {
            if (canceled) {
              return;
            }

            return createWorkspaceForFile({
              path: `${extractedFileName}.${filePathExtension}`,
              getFileContents: () => Promise.resolve(content),
            });
          })
          .catch((error) =>
            setFetchFileError({ details: error, reason: FetchFileErrorReason.CANT_FETCH, filePath: queryParamUrl })
          );
        return;
      }

      if (settings.github.service.isGithub(queryParamUrl) || settings.github.service.isGithubRaw(queryParamUrl)) {
        settings.github.service
          .fetchGithubFile(settings.github.octokit, queryParamUrl)
          .then((response) => {
            if (canceled) {
              return;
            }

            return createWorkspaceForFile({
              path: `${extractedFileName}.${filePathExtension}`,
              getFileContents: () => Promise.resolve(response),
            });
          })
          .catch((error) => {
            setFetchFileError({ details: error, reason: FetchFileErrorReason.CANT_FETCH, filePath: queryParamUrl });
          });
        return;
      }

      fetch(queryParamUrl)
        .then((response) => {
          if (canceled) {
            return;
          }

          if (!response.ok) {
            setFetchFileError({
              details: `${response.status} - ${response.statusText}`,
              reason: FetchFileErrorReason.CANT_FETCH,
              filePath: queryParamUrl,
            });
            return;
          }

          // do not inline this variable.
          const content = response.text();

          return createWorkspaceForFile({
            path: `${extractedFileName}.${filePathExtension}`,
            getFileContents: () => content,
          });
        })
        .catch((error) => {
          setFetchFileError({ details: error, reason: FetchFileErrorReason.CANT_FETCH, filePath: queryParamUrl });
        });
    }

    return () => {
      canceled = true;
    };
  }, [
    globals.externalFile,
    globals.routes.workspaceOverview,
    globals.routes.workspaceWithFilePath,
    history,
    queryParamUrl,
    settings.github.octokit,
    settings.github.service,
    workspaces,
    isSample,
    createWorkspaceForFile,
  ]);

  return (
    <>
      {fetchFileError && <EditorFetchFileErrorEmptyState fetchFileError={fetchFileError} />}
      {!fetchFileError && (
        <Bullseye>
          <TextContent>
            <Bullseye>
              <Spinner />
            </Bullseye>
            <br />
            <Text component={TextVariants.p}>{`Importing workspace from '${queryParamUrl}'`}</Text>
          </TextContent>
        </Bullseye>
      )}
    </>
  );
}
