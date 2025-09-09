import { Image } from "lucide-react";
import type { DashboardModule } from "@kitejs-cms/dashboard-core";
import { GalleriesManagePage } from "./pages/galleries-manage";
import { GalleryDetailsPage } from "./pages/gallery-details";
import {
  GalleryFieldsSettings,
  GALLERY_PLUGIN_NAMESPACE,
} from "./components/gallery-fields-settings";

/* i18n */
import it from "./locales/it.json";
import en from "./locales/en.json";

export const GalleryModule: DashboardModule = {
  key: GALLERY_PLUGIN_NAMESPACE,
  name: "gallery",
  translations: { it, en },
  settings: {
    key: GALLERY_PLUGIN_NAMESPACE,
    title: "gallery:menu.galleries",
    icon: <Image />,
    description: "gallery:settings.description",
    children: [
      {
        key: "gallery-fields",
        title: "gallery:settings.gallery-fields.title",
        icon: <Image />,
        component: <GalleryFieldsSettings />,
      },
    ],
  },
  routes: [
    {
      path: "galleries",
      element: <GalleriesManagePage />,
      label: "gallery:menu.galleries",
      requiredPermissions: ["gallery-plugin:galleries.read"],
    },
    {
      path: "galleries/:id",
      element: <GalleryDetailsPage />,
      label: "",
      requiredPermissions: ["gallery-plugin:galleries.read"],
    },
  ],
  menuItem: {
    title: "gallery:menu.galleries",
    icon: Image,
    requiredPermissions: ["gallery-plugin:galleries.read"],
    items: [
      {
        url: "/galleries",
        title: "gallery:menu.galleries",
        icon: Image,
        requiredPermissions: ["gallery-plugin:galleries.read"],
      },
    ],
  },
};
