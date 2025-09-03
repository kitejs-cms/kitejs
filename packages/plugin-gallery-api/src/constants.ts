import { PermissionModel, SettingModel } from "@kitejs-cms/core";

export const GALLERY_PLUGIN_NAMESPACE = "gallery-plugin";

export const GALLERY_SLUG_NAMESPACE = `${GALLERY_PLUGIN_NAMESPACE}:galleries`;

export const GalleryPermissions: PermissionModel[] = [
  {
    name: `${GALLERY_PLUGIN_NAMESPACE}:galleries.read`,
    description: "Permission to view gallery items",
    role: ["admin", "editor", "viewer"],
  },
  {
    name: `${GALLERY_PLUGIN_NAMESPACE}:galleries.create`,
    description: "Permission to create gallery items",
    role: ["admin", "editor"],
  },
  {
    name: `${GALLERY_PLUGIN_NAMESPACE}:galleries.update`,
    description: "Permission to update gallery items",
    role: ["admin", "editor"],
  },
  {
    name: `${GALLERY_PLUGIN_NAMESPACE}:galleries.delete`,
    description: "Permission to delete gallery items",
    role: ["admin"],
  },
];

export const GallerySetting: SettingModel[] = [];

