import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/login";
import { Layout } from "./components/layout";
import { AuthProvider } from "./context/auth-context";
import { InitCmsPage } from "./pages/init-cms";
import { SettingsProvider } from "./context/settings-context";
import i18n from "./i18n";
import { I18nextProvider } from "react-i18next";

interface DashboardRouterProps {
  extraRoutes?: React.ReactNode;
}

export function DashboardRouter({ extraRoutes }: DashboardRouterProps) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <I18nextProvider i18n={i18n}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/init-cms" element={<InitCmsPage />} />

              <Route path="/*" element={<Layout />}>
                {extraRoutes}
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </I18nextProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
