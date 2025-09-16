import { Logger } from "@nestjs/common";
import {
  COMMERCE_PLUGIN_NAMESPACE,
  CommercePermissions,
  CommerceSetting,
} from "./constants";
import { CommercePluginModule } from "./commerce-plugin.module";
import { IPlugin } from "@kitejs-cms/core";
import { version } from "../package.json";

const logger = new Logger("CommercePluginConfig");

export const CommercePlugin: IPlugin = {
  namespace: COMMERCE_PLUGIN_NAMESPACE,
  name: "Commerce Plugin",
  version,
  description:
    "Plugin that provides foundational commerce APIs for products, orders and customers.",
  enabled: true,
  settings: CommerceSetting,
  permissions: CommercePermissions,
  initialize: async () => {
    logger.log("Initializing commerce plugin");
  },
  getModule: () => {
    return CommercePluginModule;
  },
};
