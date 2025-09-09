import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout";
import { AuthProvider } from "./context/auth-context";
import {
  SettingsProvider,
  useSettingsContext,
} from "./context/settings-context";
import i18n from "./i18n";
import { I18nextProvider } from "react-i18next";
import { BreadcrumbProvider } from "./context/breadcrumb-context";
import { ThemeProvider } from "./context/theme-context";
import { LoadingProvider } from "./context/loading-context";
import { useMemo } from "react";
import { DashboardModule } from "./models/module.model";
import { DashboardWidgetModel } from "./models/dashboard-widget.model";
import { UsersModule } from "./modules/users";
import { ProfileModule } from "./modules/profile";
import { CoreModule } from "./modules/core";
import { PageModule } from "./modules/pages";
import { PostModule } from "./modules/articles";
import { PluginsModule } from "./modules/plugins";
import { DashboardPage } from "./modules/core/pages/dashboard";
import { ProtectedRoute } from "./components/protected-route";

interface DashboardRouterProps {
  modules?: DashboardModule[];
}

export function DashboardProvider({ modules = [] }: DashboardRouterProps) {
  const coreModules: DashboardModule[] = [
    UsersModule,
    ProfileModule,
    PageModule,
    PostModule,
    PluginsModule,
  ];
  const allModules = [...coreModules, ...modules];

  const modulesWithTranslations = [CoreModule, ...allModules].filter(
    (mod) => mod.translations
  );
  modulesWithTranslations.forEach((mod) => {
    Object.entries(mod.translations!).forEach(([lang, translations]) => {
      if (!i18n.hasResourceBundle(lang, mod.name)) {
        i18n.addResourceBundle(lang, mod.name, translations, true, true);
      }
    });
  });

  const settingsSections = [CoreModule, ...allModules]
    .filter((mod) => mod.settings)
    .map((mod) => mod.settings);

  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="light" storageKey="ui-theme">
        <LoadingProvider>
          <AuthProvider>
            <SettingsProvider settingsSection={settingsSections}>
              <BreadcrumbProvider>
                <I18nextProvider i18n={i18n}>
                  <DashboardRoutes modules={allModules} />
                </I18nextProvider>
              </BreadcrumbProvider>
            </SettingsProvider>
          </AuthProvider>
        </LoadingProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

function DashboardRoutes({ modules }: { modules: DashboardModule[] }) {
  const { plugins } = useSettingsContext();
  const enabledModules = useMemo(() => {
    return modules.filter((mod) => {
      const plugin = plugins.find((p) => p.namespace === mod.key);
      return !plugin || (plugin.enabled && !plugin.requiresRestart);
    });
  }, [modules, plugins]);

  const menuItems = useMemo(
    () =>
      enabledModules.filter((mod) => mod.menuItem).map((mod) => mod.menuItem),
    [enabledModules]
  );

  const moduleRoutes = useMemo(
    () =>
      enabledModules.flatMap((mod) =>
        mod.routes.map((route) => (
          <Route
            key={`${mod.name}-${route.path}`}
            path={route.path}
            element={
              <ProtectedRoute requiredPermissions={route.requiredPermissions}>
                {route.element}
              </ProtectedRoute>
            }
          />
        ))
      ),
    [enabledModules]
  );

  const widgets: DashboardWidgetModel[] = [];

  for (const module of enabledModules) {
    if (module.dashboardWidgets)
      for (const widget of module.dashboardWidgets) widgets.push(widget);
  }

  return (
    <Routes>
      {/* Router core - Routes che stanno fuori dal Layout */}
      {CoreModule.routes.map((route) => (
        <Route
          key={`core-${route.path}`}
          path={route.path}
          element={route.element}
        />
      ))}

      {/* Routes che stanno dentro al Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute
            requiredPermissions="*"
            fallback={<Navigate to="/login" replace />}
          >
            <Layout menuItems={menuItems} />
          </ProtectedRoute>
        }
      >
        {/* Dashboard route - homepage */}
        <Route index element={<DashboardPage widgets={widgets} />} />

        {/* Module routes */}
        {moduleRoutes}
      </Route>

      {/* Catch-all - redirect to homepage */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
