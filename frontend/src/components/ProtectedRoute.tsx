import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAuthStore } from "../stores/authStore";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredPermission?: string;
  requiredPermissions?: string[];
  requiredModule?: string;
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredPermissions,
  requiredModule,
  adminOnly = false,
}) => {
  const { isAuthenticated } = useAuth();
  const { hasPermission, canAccessModule, user } = useAuthStore();

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si requiere ser admin
  if (adminOnly && user?.roleName !== "Admin") {
    return <Navigate to="/unauthorized" replace />;
  }

  // Si requiere un permiso específico
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Si requiere múltiples permisos (todos deben cumplirse)
  if (
    requiredPermissions &&
    !requiredPermissions.every((permission) => hasPermission(permission))
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Si requiere acceso a un módulo específico
  if (requiredModule && !canAccessModule(requiredModule)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Si todo está bien, renderizar el contenido
  return children ? <>{children}</> : <Outlet />;
};
