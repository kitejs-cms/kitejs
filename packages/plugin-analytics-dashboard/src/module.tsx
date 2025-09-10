import { BarChart3 } from "lucide-react";
import type { DashboardModule } from "@kitejs-cms/dashboard-core";
import { AnalyticsOverviewPage } from "./pages/analytics-overview";
import { ANALYTICS_PLUGIN_NAMESPACE } from "@kitejs-cms/plugin-analytics-api";

/* i18n */
import it from "./locales/it.json";
import en from "./locales/en.json";

export const AnalyticsModule: DashboardModule = {
  key: ANALYTICS_PLUGIN_NAMESPACE,
  name: "analytics",
  translations: { it, en },
  routes: [
    {
      path: "analytics",
      element: <AnalyticsOverviewPage />,
      label: "analytics:menu.analytics",
      requiredPermissions: ["analytics:events.read"],
    },
  ],
  menuItem: {
    title: "analytics:menu.analytics",
    icon: BarChart3,
    requiredPermissions: ["analytics:events.read"],
    items: [
      {
        url: "/analytics",
        title: "analytics:menu.analytics",
        icon: BarChart3,
        requiredPermissions: ["analytics:events.read"],
      },
    ],
  },
};
