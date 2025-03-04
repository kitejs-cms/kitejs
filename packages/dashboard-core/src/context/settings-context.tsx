import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../hooks/use-api";
import { CmsSettingsModel } from "@kitejs/core/index";

interface SettingsContextType {
  cmsSettings: CmsSettingsModel | null;
  getSetting: <T = unknown>(
    namespace: string,
    key: string
  ) => Promise<T | null>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [cmsSettings, setCmsSettings] = useState<CmsSettingsModel | null>(null);
  const { fetchData } = useApi();

  const navigate = useNavigate();

  const getSetting = useCallback(
    async <T = unknown,>(namespace: string, key: string): Promise<T | null> => {
      const { data } = await fetchData(`settings/${namespace}/${key}`, "GET");
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
    <SettingsContext.Provider value={{ getSetting, cmsSettings }}>
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
