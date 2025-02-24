import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

/* CSS */
import "./index.css";
import "@kitejs/dashboard-core/styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
