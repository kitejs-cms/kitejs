import { DashboardModule } from "../../models/module.model";
import { Pages } from "./pages/pages";

/* i18n */
import it from "./locales/it.json";
import en from "./locales/en.json";
import { Package2 } from "lucide-react";

export const PageBuilderModule: DashboardModule = {
  name: "Page Builder",
  key: "page-builder",
  translations: { it, en },
  routes: [
    {
      path: "pages",
      element: <Pages />,
      label: "page-builder:pages",
    },
  ],
  menuItem: {
    title: "page-builder:pages",
    icon: Package2,
    url: "/pages",
  },
};
