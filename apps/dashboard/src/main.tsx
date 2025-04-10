import { createRoot } from "react-dom/client";
import { DashboardProvider } from "@kitejs/dashboard-core/dashboard-provider";

/* CSS */
import "./index.css";
import "@kitejs/dashboard-core/styles.css";

createRoot(document.getElementById("root")!).render(<DashboardProvider />);
