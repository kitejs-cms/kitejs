import { DashboardModule } from "../../models/module.model";
import { InitCmsPage } from "./pages/init-cms";
import { LoginPage } from "./pages/login";
import { Settings, Settings2 } from "lucide-react";
import { CmsSettings } from "./components/cms-settings";
import { DeveloperSettings } from "./components/developer-settings";

/* i18n */
import it from "./locales/it.json";
import en from "./locales/en.json";

export const CoreModule: DashboardModule = {
  name: "core",
  key: "core",
  translations: { it, en },
  routes: [
    {
      path: "/login",
      element: <LoginPage />,
      label: "core:login",
    },
    {
      path: "/init",
      element: <InitCmsPage />,
      label: "core:init.title",
    },
    {
      path: "settings",
      element: <InitCmsPage />,
      label: "core:settings.menu.title",
      icon: <Settings />,
    },
  ],
  settings: {
    key: "general",
    title: "core:settings.general.title",
    icon: <Settings2 />,
    description: "core:settings.general.description",
    children: [
      {
        key: "cms",
        title: "core:settings.cms.title",
        component: <CmsSettings />,
      },
      {
        key: "developer",
        title: "core:settings.developer.title",
        component: <DeveloperSettings />,
      },
    ],
  },
};
