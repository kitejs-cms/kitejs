import { createRoot } from "react-dom/client";
import { DashboardProvider } from "@kitejs-cms/dashboard-core/dashboard-provider";

/* CSS */
import "./index.css";
import "@kitejs-cms/dashboard-core/styles.css";

createRoot(document.getElementById("root")!).render(<DashboardProvider />);
