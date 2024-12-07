import { hydrateRoot } from "react-dom/client";
import HomePage from "./pages/home";
import ContactPage from "./pages/contact";

const pages: Record<string, React.FC> = {
  home: HomePage,
  contact: ContactPage,
};

// Determina la pagina corrente basandoti sull'URL
function getPageComponent(): React.FC | null {
  const pageName =
    window.location.pathname.split("/").filter(Boolean)[0] || "home";
  return pages[pageName] || null;
}

// Aspetta che il DOM sia completamente caricato
document.addEventListener("DOMContentLoaded", () => {
  const appElement = document.getElementById("app");

  if (!appElement) {
    console.error("❌ Target container `#app` not found.");
    return;
  }

  const PageComponent = getPageComponent();

  if (PageComponent) {
    hydrateRoot(appElement, <PageComponent />, {
      onRecoverableError: (error, errorInfo) => {
        console.error("Hydration error:", error, errorInfo);
      },
    });
  } else {
    console.error("❌ No matching component found for the current page.");
  }
});
