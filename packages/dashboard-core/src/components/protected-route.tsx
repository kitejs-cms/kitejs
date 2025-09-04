import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useHasPermission } from "../hooks/use-has-permission";

interface ProtectedRouteProps {
  requiredPermissions?: string | string[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function ProtectedRoute({
  requiredPermissions,
  fallback = <Navigate to="/" replace />,
  children,
}: ProtectedRouteProps) {
  const hasPermission = useHasPermission();
  const allowed = hasPermission(requiredPermissions);

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
