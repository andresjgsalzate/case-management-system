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
  _userRole?: string
): boolean => {
  console.log(`🔍 checkPermissionVariants - Verificando: ${permission}`);

  // Para permisos de auditoría, verificar permisos específicos
  if (permission.startsWith("audit.")) {
    const hasAuditAccess = hasPermission("audit.view.all");
    console.log(
      `🔍 checkPermissionVariants - Permiso de auditoría: ${hasAuditAccess}`
    );
    if (hasAuditAccess) {
      return true;
    }
  }

  // Verificar el permiso directamente usando la función hasPermission
  const hasDirectPermission = hasPermission(permission);
  console.log(
    `🔍 checkPermissionVariants - Permiso directo ${permission}: ${hasDirectPermission}`
  );

  if (hasDirectPermission) {
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
    usuarios: ["users.view.own", "users.view.team", "users.view.all"],
    dashboard: [
      "dashboard.view.own",
      "dashboard.view.team",
      "dashboard.view.all",
    ],
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
    users: ["users.view.own", "users.view.team", "users.view.all"],
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
      "dashboard.view.own",
      "dashboard.view.team",
      "dashboard.view.all",
      "users.view.own",
      "users.view.team",
      "users.view.all",
    ];
    const hasAdminPermission = adminPermissions.some((permission) =>
      hasPermission(permission)
    );

    if (!hasAdminPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Si requiere un permiso específico
  if (requiredPermission) {
    console.log(
      `🔍 ProtectedRoute - Verificando permiso requerido: ${requiredPermission}`
    );
    console.log(`🔍 ProtectedRoute - Usuario: ${user?.fullName}`);

    const hasRequiredPermission = checkPermissionVariants(
      requiredPermission,
      hasPermission,
      userPermissions || [],
      user?.roleName
    );

    console.log(
      `${
        hasRequiredPermission ? "✅" : "❌"
      } ProtectedRoute - Permiso ${requiredPermission}: ${
        hasRequiredPermission ? "PERMITIDO" : "DENEGADO"
      }`
    );

    if (!hasRequiredPermission) {
      console.log(
        `❌ ProtectedRoute - Redirigiendo a /unauthorized por falta de permiso: ${requiredPermission}`
      );
      return <Navigate to="/unauthorized" replace />;
    }
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
  if (requiredModule) {
    console.log(
      `🔍 ProtectedRoute - Verificando módulo requerido: ${requiredModule}`
    );

    const hasModuleAccess = checkModuleAccess(requiredModule, hasPermission);

    console.log(
      `${
        hasModuleAccess ? "✅" : "❌"
      } ProtectedRoute - Módulo ${requiredModule}: ${
        hasModuleAccess ? "PERMITIDO" : "DENEGADO"
      }`
    );

    if (!hasModuleAccess) {
      console.log(
        `❌ ProtectedRoute - Redirigiendo a /unauthorized por falta de acceso al módulo: ${requiredModule}`
      );
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Si todo está bien, renderizar el contenido
  return children ? <>{children}</> : <Outlet />;
};
