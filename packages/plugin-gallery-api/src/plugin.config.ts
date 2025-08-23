import { Logger } from "@nestjs/common";
import {
  GALLERY_PLUGIN_NAMESPACE,
  GalleryPermissions,
  GallerySetting,
} from "./constants";
import { GalleryPluginModule } from "./gallery-plugin.module";
import { IPlugin } from "@kitejs-cms/core";
import { version } from "../package.json";

const logger = new Logger("GalleryPluginConfig");

export const GalleryPlugin: IPlugin = {
  namespace: GALLERY_PLUGIN_NAMESPACE,
  name: "Gallery Plugin",
  version,
  description: "Plugin providing gallery functionality",
  settings: GallerySetting,
  permissions: GalleryPermissions,
  initialize: async () => {
    logger.log("Initializing gallery plugin");
  },
  getModule: () => {
    return GalleryPluginModule;
  },
};
