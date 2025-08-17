import { DashboardModule } from "../../models/module.model";
import { GalleriesManagePage } from "./pages/galleries-manage";
import { Images } from "lucide-react";

import it from "./locales/it.json";
import en from "./locales/en.json";

export const GalleryModule: DashboardModule = {
  name: "galleries",
  key: "galleries",
  translations: { it, en },
  routes: [
    {
      path: "galleries",
      element: <GalleriesManagePage />,
      label: "galleries:menu.galleries",
    },
  ],
  menuItem: {
    title: "galleries:menu.galleries",
    icon: Images,
    url: "/galleries",
  },
};
