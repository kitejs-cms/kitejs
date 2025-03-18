import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/login";
import { Layout } from "./components/layout";
import { AuthProvider } from "./context/auth-context";
import { InitCmsPage } from "./pages/init-cms";
import { SettingsProvider } from "./context/settings-context";
import i18n from "./i18n";
import { I18nextProvider } from "react-i18next";
import { BreadcrumbProvider } from "./context/breadcrumb-context";
import { ThemeProvider } from "./context/theme-context";
import { DashboardModule } from "./models/module.model";
import { UsersModule } from "./modules/users";
import { ProfileModule } from "./modules/profile";

const coreModules: DashboardModule[] = [UsersModule, ProfileModule];

interface DashboardRouterProps {
  modules?: DashboardModule[];
}

export function DashboardRouter({ modules = [] }: DashboardRouterProps) {
  const allModules = [...coreModules, ...modules];
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="light" storageKey="ui-theme">
        <AuthProvider>
          <SettingsProvider>
            <BreadcrumbProvider>
              <I18nextProvider i18n={i18n}>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/init-cms" element={<InitCmsPage />} />

                  <Route
                    path="/*"
                    element={
                      <Layout
                        menuItems={allModules
                          .filter((m) => m.menuItem)
                          .map((m) => m.menuItem)}
                      />
                    }
                  >
                    {allModules.map((module) =>
                      module.routes.map((route) => (
                        <Route
                          key={`${module.name}-${route.path}`}
                          path={route.path}
                          element={route.element}
                        />
                      ))
                    )}
                  </Route>

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
