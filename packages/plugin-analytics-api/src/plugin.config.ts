import { Logger } from "@nestjs/common";
import {
  ANALYTICS_PLUGIN_NAMESPACE,
  AnalyticsPermissions,
  AnalyticsSetting,
} from "./constants";
import { AnalyticsPluginModule } from "./analytics-plugin.module";
import { IPlugin } from "@kitejs-cms/core";
import { version } from "../package.json";

const logger = new Logger("AnalyticsPluginConfig");

export const AnalyticsPlugin: IPlugin = {
  namespace: ANALYTICS_PLUGIN_NAMESPACE,
  name: "Analytics Plugin",
  version,
  description: "Plugin providing basic analytics tracking",
  settings: AnalyticsSetting,
  permissions: AnalyticsPermissions,
  initialize: async () => {
    logger.log("Initializing analytics plugin");
  },
  getModule: () => {
    return AnalyticsPluginModule;
  },
};
