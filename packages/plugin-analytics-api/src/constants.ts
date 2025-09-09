import { SettingModel } from "@kitejs-cms/core";
import { randomUUID } from "crypto";

export const ANALYTICS_PLUGIN_NAMESPACE = "analytics";

export const ANALYTICS_SETTINGS_KEY = `${ANALYTICS_PLUGIN_NAMESPACE}:config`;

export type AnalyticsPluginSettingsModel = {
  apiKey: string;
};

export const AnalyticsPermissions = [];

export const AnalyticsSetting: SettingModel<AnalyticsPluginSettingsModel>[] = [
  {
    key: ANALYTICS_SETTINGS_KEY,
    value: { apiKey: randomUUID() },
  },
];
