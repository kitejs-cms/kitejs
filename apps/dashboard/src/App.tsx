import { LoginPage } from "@kitejs/dashboard-core/pages/login";
import { Layout } from "@kitejs/dashboard-core/components/layout";
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

const TestPage = () => (
  <div>
    <h1 className="text-2xl font-bold">Welcome to the Backoffice</h1>
    <p>This is your main content areae.</p>
  </div>
);

export default function App() {
  return (
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          {/* Route per il login */}
          <Route path="/admin/login" element={<LoginPage />} />

          {/* Rotte protette (Backoffice) */}
          <Route path="/admin/*" element={<Layout />}>
            <Route index element={<TestPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
  );
}
