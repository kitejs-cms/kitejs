import { Logger } from "@nestjs/common";
import {
  GALLERY_PLUGIN_NAMESPACE,
  GalleryPermissions,
  GallerySetting,
} from "./constants";
import { GalleryPluginModule } from "./gallery-plugin.module";
import { IPlugin } from "@kitejs-cms/core";
import { version } from "../package.json";
import {
  galleryIndexesMigration,
  galleryRenameCollectionMigration,
} from "./migrations";

const logger = new Logger("GalleryPluginConfig");

export const GalleryPlugin: IPlugin = {
  namespace: GALLERY_PLUGIN_NAMESPACE,
  name: "Gallery Plugin",
  version,
  description: "Plugin providing gallery functionality",
  enabled: true,
  settings: GallerySetting,
  permissions: GalleryPermissions,
  migrations: [galleryIndexesMigration, galleryRenameCollectionMigration],
  initialize: async () => {
    logger.log("Initializing gallery plugin");
  },
  getModule: () => {
    return GalleryPluginModule;
  },
};
