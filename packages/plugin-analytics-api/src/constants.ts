import { SettingModel } from "@kitejs-cms/core";
import { randomUUID } from "crypto";

export const ANALYTICS_PLUGIN_NAMESPACE = "analytics";

export const ANALYTICS_SETTINGS_KEY = `${ANALYTICS_PLUGIN_NAMESPACE}:config`;

export const DEFAULT_RETENTION_DAYS = 90;

export type AnalyticsPluginSettingsModel = {
  apiKey: string;
  /** Number of days to retain analytics data before pruning */
  retentionDays: number;
};

export const AnalyticsPermissions = [];

export const AnalyticsSetting: SettingModel<AnalyticsPluginSettingsModel>[] = [
  {
    key: ANALYTICS_SETTINGS_KEY,
    value: { apiKey: randomUUID(), retentionDays: DEFAULT_RETENTION_DAYS },
  },
];
