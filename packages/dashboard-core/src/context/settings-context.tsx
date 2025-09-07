import { useNavigate } from "react-router-dom";
import { useApi } from "../hooks/use-api";
import { CmsSettingsModel } from "@kitejs-cms/core/index";
import type { PluginResponseModel } from "@kitejs-cms/core/modules/plugins/models/plugin-response.model";
import { CORE_NAMESPACE } from "@kitejs-cms/core/constants";
import { SettingsModel } from "../models/settings.model";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface SettingsContextType {
  cmsSettings: CmsSettingsModel | null;
  settingsSection: SettingsModel[];
  getSetting: <T = unknown>(
    namespace: string,
    key: string,
  ) => Promise<T | null>;
  updateSetting: <T = unknown>(
    namespace: string,
    key: string,
    value: T,
  ) => Promise<T | null>;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  plugins: PluginResponseModel[];
  pluginsLoading: boolean;
  fetchPlugins: () => Promise<void>;
  disablePlugin: (namespace: string) => Promise<boolean>;
  enablePlugin: (namespace: string) => Promise<boolean>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export function SettingsProvider({
  children,
  settingsSection,
}: {
  children: React.ReactNode;
  settingsSection: SettingsModel[];
}) {
  const [cmsSettings, setCmsSettings] = useState<CmsSettingsModel | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [plugins, setPlugins] = useState<PluginResponseModel[]>([]);
  const [pluginsLoading, setPluginsLoading] = useState(false);
  const { fetchData } = useApi();
  const navigate = useNavigate();

  const getSetting = useCallback(
    async <T = unknown,>(namespace: string, key: string): Promise<T | null> => {
      const { data } = await fetchData(`settings/${namespace}/${key}`, "GET");
      return data as T | null;
    },
    [fetchData],
  );

  const updateSetting = useCallback(
    async <T = unknown,>(
      namespace: string,
      key: string,
      value: T,
    ): Promise<T | null> => {
      const { data } = await fetchData(`settings/${namespace}/${key}`, "PUT", {
        value,
      });

      if (
        namespace === "core" &&
        key === "core:cms" &&
        (data as { value: unknown })?.value
      ) {
        setCmsSettings((data as { value: unknown }).value as CmsSettingsModel);
      }
      return data as T | null;
    },
    [fetchData],
  );

  const fetchPlugins = useCallback(async () => {
    setPluginsLoading(true);
    const { data } = await fetchData("plugins", "GET");
    setPlugins((data as PluginResponseModel[]) ?? []);
    setPluginsLoading(false);
  }, [fetchData]);

  const disablePlugin = useCallback(
    async (namespace: string) => {
      if (namespace === CORE_NAMESPACE) return false;
      const { error } = await fetchData(`plugins/${namespace}/disable`, "POST");
      if (!error) {
        await fetchPlugins();
        return true;
      }
      return false;
    },
    [fetchData, fetchPlugins],
  );

  const enablePlugin = useCallback(
    async (namespace: string) => {
      const { error } = await fetchData(`plugins/${namespace}/enable`, "POST");
      if (!error) {
        await fetchPlugins();
        return true;
      }
      return false;
    },
    [fetchData, fetchPlugins],
  );

  useEffect(() => {
    (async () => {
      const data = await getSetting<{ value: CmsSettingsModel }>(
        "core",
        "core:cms",
      );

      if (!data) navigate("/init-cms");
      setCmsSettings(data.value);
    })();
  }, [getSetting, navigate]);

  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  const visibleSettingsSections = useMemo(() => {
    if (!plugins.length) return settingsSection;
    const disabled = new Set(
      plugins.filter((p) => !p.enabled).map((p) => p.namespace),
    );
    return settingsSection.filter((section) => !disabled.has(section.key));
  }, [plugins, settingsSection]);

  return (
    <SettingsContext.Provider
      value={{
        getSetting,
        updateSetting,
        cmsSettings,
        settingsSection: visibleSettingsSections,
        hasUnsavedChanges,
        setHasUnsavedChanges,
        plugins,
        pluginsLoading,
        fetchPlugins,
        disablePlugin,
        enablePlugin,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error(
      "useSettingsContext must be used within a SettingsProvider",
    );
  }
  return context;
}
