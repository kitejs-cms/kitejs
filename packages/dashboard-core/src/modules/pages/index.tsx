import { DashboardModule } from "../../models/module.model";
import { PagesManagePage } from "./pages/pages-manage";
import { FilePenLine } from "lucide-react";
import { PageDetailsPage } from "./pages/pages-details";

/* i18n */
import it from "./locales/it.json";
import en from "./locales/en.json";

export const PageModule: DashboardModule = {
  name: "pages",
  key: "pages",
  translations: { it, en },
  routes: [
    {
      path: "pages",
      element: <PagesManagePage />,
      label: "pages:menu.pages",
    },
    {
      path: "pages/:id",
      element: <PageDetailsPage />,
      label: "pages:menu.pages",
    },
  ],
  menuItem: {
    title: "pages:menu.pages",
    icon: FilePenLine,
    url: "/pages",
  },
};
