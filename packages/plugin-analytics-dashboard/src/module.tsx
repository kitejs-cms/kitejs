import { BarChart3 } from "lucide-react";
import type { DashboardModule } from "@kitejs-cms/dashboard-core";
import { AnalyticsOverviewPage } from "./pages/analytics-overview";
import { AnalyticsEventsPage } from "./pages/analytics-events";
import { AnalyticsTechnologiesPage } from "./pages/analytics-technologies";
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
      label: "analytics:menu.overview",
      requiredPermissions: ["analytics:events.read"],
    },
    {
      path: "analytics/events",
      element: <AnalyticsEventsPage />,
      label: "analytics:menu.events",
      requiredPermissions: ["analytics:events.read"],
    },
    {
      path: "analytics/technologies",
      element: <AnalyticsTechnologiesPage />,
      label: "analytics:menu.technologies",
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
        title: "analytics:menu.overview",
        icon: BarChart3,
        requiredPermissions: ["analytics:events.read"],
      },
      {
        url: "/analytics/events",
        title: "analytics:menu.events",
        icon: BarChart3,
        requiredPermissions: ["analytics:events.read"],
      },
      {
        url: "/analytics/technologies",
        title: "analytics:menu.technologies",
        icon: BarChart3,
        requiredPermissions: ["analytics:events.read"],
      },
    ],
  },
};
