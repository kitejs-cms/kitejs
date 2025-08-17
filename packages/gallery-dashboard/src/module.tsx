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
    },
    { path: "galleries/:id", element: <GalleryDetailsPage /> },
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
