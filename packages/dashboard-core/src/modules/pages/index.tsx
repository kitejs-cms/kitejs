import { DashboardModule } from "../../models/module.model";
import { PagesManagePage } from "./pages/pages-manage";
import { FilePenLine } from "lucide-react";
import { PageDetailsPage } from "./pages/pages-details";
import { PagesDashboardCard } from "./components/pages-dashboard-card";

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
      requiredPermissions: ["core:pages.read"],
    },
    {
      path: "pages/:id",
      element: <PageDetailsPage />,
      label: "pages:menu.pages",
      requiredPermissions: ["core:pages.read"],
    },
  ],
  menuItem: {
    title: "pages:menu.pages",
    icon: FilePenLine,
    url: "/pages",
    requiredPermissions: ["core:pages.read"],
  },
  dashboardWidgets: [
    { key: "pages-card", component: <PagesDashboardCard />, defaultWidth: 1 },
  ],
};
