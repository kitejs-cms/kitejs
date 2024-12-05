import { hydrateRoot } from "react-dom/client";
import HomePage from "./pages/home";

// Idratazione del componente server-side
hydrateRoot(document.getElementById("app") as HTMLElement, <HomePage />);
