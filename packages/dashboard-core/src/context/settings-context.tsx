import { useNavigate } from "react-router-dom";
import { useApi } from "../hooks/use-api";
import { CmsSettingsModel } from "@kitejs/core/index";
import { SettingsModel } from "../models/settings.model";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface SettingsContextType {
  cmsSettings: CmsSettingsModel | null;
  settingsSection: SettingsModel[];
  getSetting: <T = unknown>(
    namespace: string,
    key: string
  ) => Promise<T | null>;
  updateSetting: <T = unknown>(
    namespace: string,
    key: string,
    value: T
  ) => Promise<T | null>;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
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
  const { fetchData } = useApi();
  const navigate = useNavigate();

  const getSetting = useCallback(
    async <T = unknown,>(namespace: string, key: string): Promise<T | null> => {
      const { data } = await fetchData(`settings/${namespace}/${key}`, "GET");
      return data as T | null;
    },
    [fetchData]
  );

  const updateSetting = useCallback(
    async <T = unknown,>(
      namespace: string,
      key: string,
      value: T
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
    [fetchData]
  );

  useEffect(() => {
    (async () => {
      const data = await getSetting<{ value: CmsSettingsModel }>(
        "core",
        "core:cms"
      );

      if (!data) navigate("/init-cms");
      setCmsSettings(data.value);
    })();
  }, [getSetting, navigate]);

  return (
    <SettingsContext.Provider
      value={{
        getSetting,
        updateSetting,
        cmsSettings,
        settingsSection,
        hasUnsavedChanges,
        setHasUnsavedChanges,
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
      "useSettingsContext must be used within a SettingsProvider"
    );
  }
  return context;
}
