import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/login";
import { Layout } from "./components/layout";
import { AuthProvider } from "./context/auth-context";
import "./i18n";

interface DashboardRouterProps {
  extraRoutes?: React.ReactNode;
}

export function DashboardRouter({ extraRoutes }: DashboardRouterProps) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/*" element={<Layout />}>
            {extraRoutes}
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>{" "}
      </AuthProvider>
    </BrowserRouter>
  );
}
