import { Logger } from "@nestjs/common";
import { CORE_NAMESPACE, CorePermissions, CoreSetting } from "./constants";
import { CoreModule } from "./core.module";
import { IPlugin } from "./modules/plugins";

const logger = new Logger("CorePluginConfig");

const CorePluginConfig: IPlugin = {
  namespace: CORE_NAMESPACE,
  name: "Core CMS",
  version: "1.0.0",
  description: "Default configuration for the CMS core",
  settings: CoreSetting,
  permissions: CorePermissions,
  initialize: async () => {
    logger.log("Initializing the CMS core");
  },
  getModule: () => {
    return CoreModule;
  },
};

export default CorePluginConfig;
