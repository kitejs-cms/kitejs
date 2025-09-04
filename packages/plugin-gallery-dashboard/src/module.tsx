import { Image } from "lucide-react";
import type { DashboardModule } from "@kitejs-cms/dashboard-core";
import { GalleriesManagePage } from "./pages/galleries-manage";
import { GalleryDetailsPage } from "./pages/gallery-details";

/* i18n */
import it from "./locales/it.json";
import en from "./locales/en.json";

export const GalleryModule: DashboardModule = {
  key: "gallery",
  name: "gallery",
  translations: { it, en },
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
