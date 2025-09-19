import { createRoot } from "react-dom/client";
import { DashboardProvider } from "@kitejs-cms/dashboard-core/dashboard-provider";
import { GalleryModule } from "@kitejs-cms/plugin-gallery-dashboard";
import { AnalyticsModule } from "@kitejs-cms/plugin-analytics-dashboard";
import { CommerceModule } from "@kitejs-cms/plugin-commerce-dashboard";

/* CSS */
import "./index.css";
import "@kitejs-cms/dashboard-core/styles.css";

createRoot(document.getElementById("root")!).render(
  <DashboardProvider
    modules={[GalleryModule, AnalyticsModule, CommerceModule]}
  />
);
