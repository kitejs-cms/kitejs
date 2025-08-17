import { Image } from "lucide-react";
import type { DashboardModule } from "@kitejs-cms/dashboard-core/models/module.model";
import { GalleriesManagePage } from "./pages/galleries-manage";

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
    },
  ],
  menuItem: {
    title: "gallery:menu.galleries",
    icon: Image,
    items: [
      {
        url: "/galleries",
        title: "gallery:menu.galleries",
        icon: Image,
      },
    ],
  },
};
