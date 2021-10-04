import * as React from "react";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCookie, setCookie } from "../common/utils";
import { Octokit } from "@octokit/rest";
import { GithubService } from "./GithubService";
import { useQueryParams } from "../queryParams/QueryParamsContext";
import { SettingsModalBody, SettingsTabs } from "./SettingsModalBody";
import { OpenShiftSettingsConfig, readConfigCookie } from "./OpenShiftSettingsConfig";
import { OpenShiftInstanceStatus } from "./OpenShiftInstanceStatus";
import { OpenShiftService } from "./OpenShiftService";
import { useKieToolingExtendedServices } from "../editor/KieToolingExtendedServices/KieToolingExtendedServicesContext";
import { useHistory } from "react-router";
import { Modal, ModalVariant } from "@patternfly/react-core/dist/js/components/Modal";
import { QueryParams } from "../common/Routes";

export const KIE_TOOLING_EXTENDED_SERVICES_PORT_COOKIE_NAME =
  "KOGITO-TOOLING-COOKIE__kie-tooling-extended-services--port";
const GITHUB_AUTH_TOKEN_COOKIE_NAME = "KOGITO-TOOLING-COOKIE__github-oauth--token";
const GUIDED_TOUR_ENABLED_COOKIE_NAME = "KOGITO-TOOLING-COOKIE__guided-tour--is-enabled";
export const OPENSHIFT_NAMESPACE_COOKIE_NAME = "KOGITO-TOOLING-COOKIE__dmn-dev-sandbox--connection-namespace";
export const OPENSHIFT_HOST_COOKIE_NAME = "KOGITO-TOOLING-COOKIE__dmn-dev-sandbox--connection-host";
export const OPENSHIFT_TOKEN_COOKIE_NAME = "KOGITO-TOOLING-COOKIE__dmn-dev-sandbox--connection-token";

export enum AuthStatus {
  SIGNED_OUT,
  TOKEN_EXPIRED,
  LOADING,
  SIGNED_IN,
}

interface GithubUser {
  login: string;
  name: string;
  email: string;
}

export interface SettingsContextType {
  open: (activeTab?: SettingsTabs) => void;
  close: () => void;
  isOpen: boolean;
  activeTab: SettingsTabs;
  openshift: {
    service: OpenShiftService;
    status: {
      get: OpenShiftInstanceStatus;
      set: React.Dispatch<React.SetStateAction<OpenShiftInstanceStatus>>;
    };
    config: {
      get: OpenShiftSettingsConfig;
      set: React.Dispatch<React.SetStateAction<OpenShiftSettingsConfig>>;
    };
  };
  kieToolingExtendedServices: {
    port: {
      get: string;
      set: React.Dispatch<React.SetStateAction<string>>;
    };
  };
  github: {
    authService: { reset: () => void; authenticate: (token: string) => Promise<void> };
    authStatus: AuthStatus;
    octokit: Octokit;
    token?: string;
    user?: GithubUser;
    scopes?: string[];
    service: GithubService;
  };
  general: {
    guidedTourEnabled: {
      get: boolean;
      set: React.Dispatch<React.SetStateAction<boolean>>;
    };
  };
}

export const SettingsContext = React.createContext<SettingsContextType>({} as any);

export function SettingsContextProvider(props: any) {
  const queryParams = useQueryParams();
  const history = useHistory();
  const [isOpen, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(SettingsTabs.GITHUB);

  useEffect(() => {
    setOpen(!!queryParams.get(QueryParams.SETTINGS));
    setActiveTab((queryParams.get(QueryParams.SETTINGS) as SettingsTabs) ?? SettingsTabs.GITHUB);
  }, [queryParams]);

  const open = useCallback(
    (activeTab = SettingsTabs.GITHUB) => {
      history.push({
        search: queryParams.with(QueryParams.SETTINGS, activeTab).toString(),
      });
    },
    [history, queryParams]
  );

  const close = useCallback(() => {
    history.push({
      search: queryParams.without(QueryParams.SETTINGS).toString(),
    });
  }, [history, queryParams]);

  //github
  const [githubAuthStatus, setGitHubAuthStatus] = useState(AuthStatus.LOADING);
  const [githubOctokit, setGitHubOctokit] = useState<Octokit>(new Octokit());
  const [githubToken, setGitHubToken] = useState<string | undefined>(undefined);
  const [githubUser, setGitHubUser] = useState<GithubUser | undefined>(undefined);
  const [githubScopes, setGitHubScopes] = useState<string[] | undefined>(undefined);

  const githubAuthService = useMemo(() => {
    return {
      reset: () => {
        setGitHubOctokit(new Octokit());
        setGitHubAuthStatus(AuthStatus.SIGNED_OUT);
        setGitHubToken(undefined);
        setGitHubUser(undefined);
        setGitHubScopes(undefined);
        setCookie(GITHUB_AUTH_TOKEN_COOKIE_NAME, "");
      },
      authenticate: async (token: string) => {
        try {
          setGitHubAuthStatus(AuthStatus.LOADING);
          const octokit = new Octokit({ auth: token });
          const response = await octokit.users.getAuthenticated();
          await delay(1000);
          setGitHubOctokit(octokit);
          setGitHubAuthStatus(AuthStatus.SIGNED_IN);
          setGitHubToken(token);
          setGitHubUser({
            login: response.data.login,
            name: response.data.name ?? "",
            email: response.data.email ?? "",
          });
          setGitHubScopes(response.headers["x-oauth-scopes"]?.split(", ") ?? []);
          setCookie(GITHUB_AUTH_TOKEN_COOKIE_NAME, token);
        } catch (e) {
          await delay(1000);
          setGitHubAuthStatus(AuthStatus.SIGNED_OUT);
          throw e;
        }
      },
    };
  }, []);

  useEffect(() => {
    const tokenCookie = getCookie(GITHUB_AUTH_TOKEN_COOKIE_NAME);
    if (!tokenCookie) {
      setGitHubAuthStatus(AuthStatus.SIGNED_OUT);
      return;
    }

    githubAuthService.authenticate(tokenCookie).catch(() => {
      setGitHubAuthStatus(AuthStatus.TOKEN_EXPIRED);
    });
  }, [githubAuthService]);

  const githubService = useMemo(() => new GithubService(), []);

  //guided tour
  const [isGuidedTourEnabled, setGuidedTourEnabled] = useState(
    getBooleanCookieInitialValue(GUIDED_TOUR_ENABLED_COOKIE_NAME, true)
  );

  useEffect(() => {
    setCookie(GUIDED_TOUR_ENABLED_COOKIE_NAME, `${isGuidedTourEnabled}`);
  }, [isGuidedTourEnabled]);

  //openshift
  const kieToolingExtendedServices = useKieToolingExtendedServices();
  const [openshiftConfig, setOpenShiftConfig] = useState(readConfigCookie());
  const [openshiftStatus, setOpenshiftStatus] = useState(OpenShiftInstanceStatus.UNAVAILABLE);
  const openshiftService = useMemo(
    () => new OpenShiftService(`${kieToolingExtendedServices.baseUrl}/devsandbox`),
    [kieToolingExtendedServices.baseUrl]
  );

  const value = useMemo(() => {
    return {
      open,
      close,
      isOpen,
      activeTab,
      openshift: {
        service: openshiftService,
        status: {
          get: openshiftStatus,
          set: setOpenshiftStatus,
        },
        config: {
          get: openshiftConfig,
          set: setOpenShiftConfig,
        },
      },
      github: {
        octokit: githubOctokit,
        authStatus: githubAuthStatus,
        token: githubToken,
        user: githubUser,
        scopes: githubScopes,
        authService: githubAuthService,
        service: githubService,
      },
      kieToolingExtendedServices: {
        port: {
          get: kieToolingExtendedServices.port,
          set: kieToolingExtendedServices.saveNewPort,
        },
      },
      general: {
        guidedTourEnabled: {
          get: isGuidedTourEnabled,
          set: setGuidedTourEnabled,
        },
      },
    };
  }, [
    activeTab,
    close,
    githubAuthService,
    githubAuthStatus,
    githubOctokit,
    githubScopes,
    githubService,
    githubToken,
    githubUser,
    isGuidedTourEnabled,
    isOpen,
    kieToolingExtendedServices.port,
    kieToolingExtendedServices.saveNewPort,
    open,
    openshiftConfig,
    openshiftService,
    openshiftStatus,
  ]);

  return (
    <SettingsContext.Provider value={value}>
      {props.children}
      <Modal title="Settings" isOpen={isOpen} onClose={close} variant={ModalVariant.large}>
        <div style={{ height: "calc(100vh * 0.5)" }} className={"kogito-tooling--setings-modal-content"}>
          <SettingsModalBody />
        </div>
      </Modal>
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

function getBooleanCookieInitialValue<T>(name: string, defaultValue: boolean) {
  return !getCookie(name) ? defaultValue : getCookie(name) === "true";
}

function delay(ms: number) {
  return new Promise<void>((res) => {
    setTimeout(() => {
      res();
    }, ms);
  });
}
