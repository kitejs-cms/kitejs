import { Puzzle } from "lucide-react";
import { DashboardModule } from "../../models/module.model";
import { PluginsSettings } from "./components/plugins-settings";
import { PluginDetailPage } from "./pages/plugin-detail";

/* i18n */
import it from "./locales/it.json";
import en from "./locales/en.json";

export const PluginsModule: DashboardModule = {
  name: "plugins",
  key: "plugins",
  translations: { it, en },
  settings: {
    key: "plugins",
    title: "plugins:settings.title",
    icon: <Puzzle />,
    description: "plugins:settings.description",
    component: <PluginsSettings />,
  },
  routes: [
    {
      path: "plugins/:namespace",
      element: <PluginDetailPage />,
      label: "plugins:settings.title",
    },
  ],
};

export default PluginsModule;
