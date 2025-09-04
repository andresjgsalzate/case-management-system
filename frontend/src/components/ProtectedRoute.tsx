import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredPermissions?: string[];
  requiredModule?: string;
  adminOnly?: boolean;
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredPermissions = [],
  requiredModule,
  adminOnly = false,
  fallbackPath = "/unauthorized",
}) => {
  const { isAuthenticated, isLoading, hasPermission, canAccessModule } =
    useAuth();
  const location = useLocation();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Cargando...
          </p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar si tiene permisos administrativos mediante un permiso específico
  const hasAdminPermissions =
    hasPermission("permissions.admin_all") ||
    hasPermission("roles.gestionar.all");

  // Si la ruta es solo para administradores
  if (adminOnly && !hasAdminPermissions) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Si se requiere un permiso específico (retrocompatibilidad)
  if (
    requiredPermission &&
    !hasPermission(requiredPermission) &&
    !hasAdminPermissions
  ) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Si se requieren múltiples permisos
  if (requiredPermissions.length > 0) {
    const hasRequiredPermission = requiredPermissions.some((permission) =>
      hasPermission(permission)
    );

    if (!hasRequiredPermission && !hasAdminPermissions) {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  // Si se requiere acceso a un módulo específico
  if (requiredModule && !canAccessModule(requiredModule)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Si todas las verificaciones pasan, mostrar el contenido
  return <>{children}</>;
};

// Componente específico para rutas administrativas
interface AdminRouteProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({
  children,
  fallbackPath = "/unauthorized",
}) => {
  return (
    <ProtectedRoute adminOnly={true} fallbackPath={fallbackPath}>
      {children}
    </ProtectedRoute>
  );
};

// Componente para renderizado condicional basado en permisos
interface ConditionalRenderProps {
  children: React.ReactNode;
  permissions?: string[];
  adminOnly?: boolean;
  fallback?: React.ReactNode;
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  children,
  permissions = [],
  adminOnly = false,
  fallback = null,
}) => {
  const { user, hasPermission } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  // Verificar si tiene permisos administrativos
  const hasAdminPermissions =
    hasPermission("permissions.admin_all") ||
    hasPermission("roles.gestionar.all");

  // Si es solo para administradores
  if (adminOnly && !hasAdminPermissions) {
    return <>{fallback}</>;
  }

  // Si hay permisos específicos requeridos
  if (permissions.length > 0) {
    const hasRequiredPermission = permissions.some((permission) =>
      hasPermission(permission)
    );

    if (!hasRequiredPermission && !hasAdminPermissions) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

// Hook para verificar permisos de manera programática
export const usePermissionCheck = () => {
  const { user, hasPermission, canAccessModule } = useAuth();

  const checkPermission = (permission: string): boolean => {
    if (!user) return false;
    const hasAdminPermissions =
      hasPermission("permissions.admin_all") ||
      hasPermission("roles.gestionar.all");
    return hasPermission(permission) || hasAdminPermissions;
  };

  const checkPermissions = (permissions: string[]): boolean => {
    if (!user) return false;
    const hasAdminPermissions =
      hasPermission("permissions.admin_all") ||
      hasPermission("roles.gestionar.all");
    if (hasAdminPermissions) return true;
    return permissions.some((permission) => hasPermission(permission));
  };

  const checkAdminAccess = (): boolean => {
    return (
      hasPermission("permissions.admin_all") ||
      hasPermission("roles.gestionar.all")
    );
  };

  const checkModuleAccess = (moduleName: string): boolean => {
    return canAccessModule(moduleName);
  };

  return {
    checkPermission,
    checkPermissions,
    checkAdminAccess,
    checkModuleAccess,
    isAdmin:
      hasPermission("permissions.admin_all") ||
      hasPermission("roles.gestionar.all"),
    user,
  };
};
