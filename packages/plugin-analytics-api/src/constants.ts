import { PermissionModel, SettingModel } from "@kitejs-cms/core";
import { AnalyticsPluginSettingsModel } from "./analytics/models/analytics-plugin-settings.model";
import { randomUUID } from "crypto";

export const ANALYTICS_PLUGIN_NAMESPACE = "analytics";

export const ANALYTICS_SETTINGS_KEY = `${ANALYTICS_PLUGIN_NAMESPACE}:config`;

export const DEFAULT_RETENTION_DAYS = 90;

export const AnalyticsPermissions: PermissionModel[] = [
  {
    name: `${ANALYTICS_PLUGIN_NAMESPACE}:events.read`,
    description: "Permission to view analytics events",
    role: ["admin"],
  },
];

export const AnalyticsSetting: SettingModel<AnalyticsPluginSettingsModel>[] = [
  {
    key: ANALYTICS_SETTINGS_KEY,
    value: { apiKey: randomUUID(), retentionDays: DEFAULT_RETENTION_DAYS },
  },
];
