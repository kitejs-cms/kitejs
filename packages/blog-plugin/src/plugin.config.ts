import { Logger } from "@nestjs/common";
import { BLOG_NAMESPACE, BlogPermissions, BlogSetting } from "./constants";
import { IPlugin } from "@kitejs-cms/core/index";
import { BlogPluginModule } from "./blog-plugin.module";

const logger = new Logger("BlogPluginConfig");

const BlogPluginConfig: IPlugin = {
  namespace: BLOG_NAMESPACE,
  name: "blog-plugin",
  version: "1.0.0",
  description: "Default configuration for the CMS blog-plugin",
  settings: BlogSetting,
  permissions: BlogPermissions,
  initialize: async () => {
    logger.log("Initializing the CMS blog-plugin");
  },
  getModule: () => {
    return BlogPluginModule;
  },
};

export default BlogPluginConfig;
