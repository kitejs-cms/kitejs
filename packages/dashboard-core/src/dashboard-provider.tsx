import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout";
import { AuthProvider } from "./context/auth-context";
import { SettingsProvider } from "./context/settings-context";
import i18n from "./i18n";
import { I18nextProvider } from "react-i18next";
import { BreadcrumbProvider } from "./context/breadcrumb-context";
import { ThemeProvider } from "./context/theme-context";
import { DashboardModule } from "./models/module.model";
import { UsersModule } from "./modules/users";
import { ProfileModule } from "./modules/profile";
import { CoreModule } from "./modules/core";
import { PageModule } from "./modules/pages";
import { PostModule } from "./modules/articles";
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

  const menuItems = allModules
    .filter((mod) => mod.menuItem)
    .map((mod) => mod.menuItem);

  const moduleRoutes = allModules.flatMap((mod) =>
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
  );

  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="light" storageKey="ui-theme">
        <AuthProvider>
          <SettingsProvider settingsSection={settingsSections}>
            <BreadcrumbProvider>
              <I18nextProvider i18n={i18n}>
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
                  <Route path="/" element={<Layout menuItems={menuItems} />}>
                    {/* Dashboard route - homepage */}
                    <Route index element={<DashboardPage />} />

                    {/* Module routes */}
                    {moduleRoutes}
                  </Route>

                  {/* Catch-all - redirect to homepage */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </I18nextProvider>
            </BreadcrumbProvider>
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
