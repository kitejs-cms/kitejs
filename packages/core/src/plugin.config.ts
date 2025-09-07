import { Logger } from "@nestjs/common";
import { CORE_NAMESPACE, CorePermissions, CoreSetting } from "./constants";
import { CoreModule } from "./core.module";
import { IPlugin } from "./modules/plugins";
import { version } from "../package.json";

const logger = new Logger("CorePluginConfig");

const CorePluginConfig: IPlugin = {
  namespace: CORE_NAMESPACE,
  name: "Core CMS",
  version,
  description: "Default configuration for the CMS core",
  enabled: true,
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
