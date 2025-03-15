import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/login";
import { Layout } from "./components/layout";
import { AuthProvider } from "./context/auth-context";
import { InitCmsPage } from "./pages/init-cms";
import { SettingsProvider } from "./context/settings-context";
import i18n from "./i18n";
import { I18nextProvider } from "react-i18next";
import { ProfilePage } from "./modules/profile/pages/profile";
import { UsersManagePage } from "./modules/users/pages/users-manage";
import { BreadcrumbProvider } from "./context/breadcrumb-context";
import { ThemeProvider } from "./context/theme-context";

interface DashboardRouterProps {
  extraRoutes?: React.ReactNode;
}

export function DashboardRouter({ extraRoutes }: DashboardRouterProps) {
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

                  <Route path="/*" element={<Layout />}>
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="users/manage" element={<UsersManagePage />} />

                    {extraRoutes}
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
