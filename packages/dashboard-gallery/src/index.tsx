import { Images } from "lucide-react";
import type { DashboardModule } from "@kitejs-cms/dashboard-core/models/module.model";
import { GalleriesManagePage } from "./pages/galleries-manage";
import { GalleryDetailsPage } from "./pages/gallery-details";
import { GallerySettings } from "./components/gallery-settings";

import it from "./locales/it.json";
import en from "./locales/en.json";

export const GalleryModule: DashboardModule = {
  name: "galleries",
  key: "galleries",
  translations: { it, en },
  settings: {
    key: "galleries",
    title: "galleries:menu.galleries",
    icon: <Images />,
    description: "galleries:settings.description",
    children: [
      {
        key: "gallery-fields",
        title: "galleries:settings.fields.title",
        icon: <Images />,
        component: <GallerySettings />,
      },
    ],
  },
  routes: [
    {
      path: "galleries",
      element: <GalleriesManagePage />,
      label: "galleries:menu.galleries",
    },
    {
      path: "galleries/:id",
      element: <GalleryDetailsPage />,
      label: "galleries:menu.galleries",
    },
  ],
  menuItem: {
    title: "galleries:menu.galleries",
    icon: Images,
    url: "/galleries",
  },
};
