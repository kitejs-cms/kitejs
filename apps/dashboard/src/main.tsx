import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DashboardRouter } from "@kitejs/dashboard-core/router";

/* CSS */
import "./index.css";
import "@kitejs/dashboard-core/styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DashboardRouter />
  </StrictMode>
);
