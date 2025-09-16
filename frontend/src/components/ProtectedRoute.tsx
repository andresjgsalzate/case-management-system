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

// Helper function to check alternative permission formats (simplificado para nombres exactos)
const checkPermissionVariants = (
  permission: string,
  hasPermission: (perm: string) => boolean,
  userPermissions: any[],
  userRole?: string
): boolean => {
  // Para permisos de auditoría, también verificar el rol directamente
  if (permission.startsWith("audit.") && userRole === "Administrador") {
    return true;
  }

  // Verificar el permiso directamente usando la función hasPermission
  if (hasPermission(permission)) {
    return true;
  }

  // Fallback: verificar directamente en los permisos del usuario
  if (userPermissions && Array.isArray(userPermissions)) {
    const permissionNames = userPermissions.map((p) => p.name || p);
    return permissionNames.includes(permission);
  }

  return false;
};

// Helper function to check module access via permissions instead of canAccessModule
const checkModuleAccess = (
  module: string,
  hasPermission: (perm: string) => boolean
): boolean => {
  // Map of modules to their basic view permissions (usando nombres exactos de la base de datos)
  const modulePermissions: Record<string, string[]> = {
    // Módulos usando nombres exactos de la base de datos
    casos: ["cases.view.own", "cases.view.team", "cases.view.all"],
    notas: ["notes.view.own", "notes.view.team", "notes.view.all"],
    todos: ["todos.view.own", "todos.view.team", "todos.view.all"],
    disposiciones: [
      "dispositions.view.own",
      "dispositions.view.team",
      "dispositions.view.all",
    ],
    usuarios: ["usuarios.ver.own", "usuarios.ver.team", "usuarios.ver.all"],
    dashboard: ["dashboard.ver.own", "dashboard.ver.team", "dashboard.ver.all"],
    knowledge: [
      "knowledge.read.own",
      "knowledge.read.team",
      "knowledge.read.all",
    ],
    tags: ["tags.read.all", "tags.manage.all"],
    // English variants (para compatibilidad con rutas en inglés)
    cases: ["cases.view.own", "cases.view.team", "cases.view.all"],
    notes: ["notes.view.own", "notes.view.team", "notes.view.all"],
    tasks: ["todos.view.own", "todos.view.team", "todos.view.all"],
    dispositions: [
      "dispositions.view.own",
      "dispositions.view.team",
      "dispositions.view.all",
    ],
    users: ["usuarios.ver.own", "usuarios.ver.team", "usuarios.ver.all"],
  };

  const permissions = modulePermissions[module] || [];
  return permissions.some((permission) => hasPermission(permission));
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredPermissions,
  requiredModule,
  adminOnly = false,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const {
    hasPermission,
    isLoadingPermissions,
    permissionsLoaded,
    userPermissions,
    user,
  } = useAuthStore();

  // CRUCIAL: Mostrar loading mientras se verifica la autenticación O se cargan los permisos
  if (isLoading || (isAuthenticated && isLoadingPermissions)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {isLoading ? "Verificando acceso..." : "Cargando permisos..."}
          </p>
        </div>
      </div>
    );
  }

  // Si no está autenticado después de cargar, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // NUEVO: Si está autenticado pero los permisos no han cargado, esperar
  if (isAuthenticated && !permissionsLoaded && !isLoadingPermissions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Cargando permisos...
          </p>
        </div>
      </div>
    );
  }

  // Si requiere ser admin (basado en permisos en lugar de rol hardcodeado)
  if (adminOnly) {
    // Un admin debería tener permisos amplios como acceso al dashboard y gestión de usuarios
    const adminPermissions = [
      "dashboard.ver.own",
      "dashboard.ver.team",
      "dashboard.ver.all",
      "usuarios.ver.own",
      "usuarios.ver.team",
      "usuarios.ver.all",
    ];
    const hasAdminPermission = adminPermissions.some((permission) =>
      hasPermission(permission)
    );

    if (!hasAdminPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Si requiere un permiso específico
  if (
    requiredPermission &&
    !checkPermissionVariants(
      requiredPermission,
      hasPermission,
      userPermissions || [],
      user?.roleName
    )
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Si requiere múltiples permisos (al menos uno debe cumplirse)
  if (
    requiredPermissions &&
    !requiredPermissions.some((permission) =>
      checkPermissionVariants(
        permission,
        hasPermission,
        userPermissions || [],
        user?.roleName
      )
    )
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Si requiere acceso a un módulo específico
  if (requiredModule && !checkModuleAccess(requiredModule, hasPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Si todo está bien, renderizar el contenido
  return children ? <>{children}</> : <Outlet />;
};
