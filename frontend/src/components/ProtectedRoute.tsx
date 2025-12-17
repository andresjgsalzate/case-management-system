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
  console.log("🔍 checkPermissionVariants ENTRY:", permission);
  console.log(
    "📊 Available permissions:",
    userPermissions?.map((p) => p.name || p)
  );

  // Para permisos de auditoría, verificar permisos específicos
  if (permission.startsWith("audit.")) {
    const hasAuditAccess = hasPermission("audit.view.all");
    console.log("🔍 Audit permission check:", hasAuditAccess);
    if (hasAuditAccess) {
      return true;
    }
  }

  // Verificar el permiso directamente usando la función hasPermission
  const hasDirectPermission = hasPermission(permission);
  console.log("✅ hasPermission() result:", hasDirectPermission);

  if (hasDirectPermission) {
    return true;
  }

  // Fallback: verificar directamente en los permisos del usuario
  if (userPermissions && Array.isArray(userPermissions)) {
    const permissionNames = userPermissions.map((p) => p.name || p);
    console.log("🔍 Fallback check - permission names:", permissionNames);
    const fallbackResult = permissionNames.includes(permission);
    console.log("🔍 Fallback includes result:", fallbackResult);
    if (fallbackResult) {
      return true;
    }
  }

  console.log("❌ checkPermissionVariants: NO MATCH for", permission);
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

  // DEBUG: Estado inicial del ProtectedRoute
  console.log("🚀 ProtectedRoute ENTRY - Path:", window.location.pathname);
  console.log("🔐 Auth State:", { isAuthenticated, isLoading });
  console.log("📋 Permissions State:", {
    permissionsLoaded,
    isLoadingPermissions,
  });
  console.log(
    "👤 User State:",
    user ? { email: user.email, role: user.roleName } : "null"
  );
  console.log("🎯 Route Requirements:", {
    requiredPermission,
    requiredPermissions,
    requiredModule,
    adminOnly,
  });

  // CRUCIAL: Mostrar loading mientras se verifica la autenticación O se cargan los permisos
  if (isLoading || (isAuthenticated && isLoadingPermissions)) {
    console.log("⏳ LOADING STATE:", {
      isLoading,
      isAuthenticated,
      isLoadingPermissions,
    });
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
    console.log("🚫 REDIRECTING TO LOGIN - Not authenticated");
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
    // DEBUG: Logging detallado para "Nuevo Caso" issue
    console.log(
      "🔍 ProtectedRoute DEBUG - Checking permission:",
      requiredPermission
    );
    console.log("👤 User:", user?.email, user?.roleName);
    console.log("📋 UserPermissions loaded:", permissionsLoaded);
    console.log("🔄 IsLoadingPermissions:", isLoadingPermissions);
    console.log(
      "📊 UserPermissions array:",
      userPermissions?.map((p) => p.name || p)
    );

    // Verificar hasPermission directamente
    const directCheck = hasPermission(requiredPermission);
    console.log("✅ hasPermission direct check:", directCheck);

    const hasRequiredPermission = checkPermissionVariants(
      requiredPermission,
      hasPermission,
      userPermissions || [],
      user?.roleName
    );

    console.log("🎯 checkPermissionVariants result:", hasRequiredPermission);

    // Debug adicional: verificar casos específicos
    if (requiredPermission === "cases.create.own") {
      console.log("🏥 CASO ESPECÍFICO: cases.create.own debugging");
      const exactMatch = userPermissions?.find(
        (p) => (p.name || p) === "cases.create.own"
      );
      console.log("🔍 Exact permission object:", exactMatch);
      console.log(
        "🔍 All cases permissions:",
        userPermissions?.filter((p) => String(p.name || p).startsWith("cases."))
      );
    }

    if (!hasRequiredPermission) {
      console.error(
        "❌ REDIRECTING TO /unauthorized - Permission check failed!"
      );
      console.error("Required:", requiredPermission);
      console.error("Path:", window.location.pathname);
      console.error(
        "User permissions:",
        userPermissions?.map((p) => p.name || p)
      );
      console.error("hasPermission function result:", directCheck);
      console.error("User object:", user);
      console.error("Auth states:", {
        isAuthenticated,
        permissionsLoaded,
        isLoadingPermissions,
      });
    }

    if (!hasRequiredPermission) {
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
    const hasModuleAccess = checkModuleAccess(requiredModule, hasPermission);

    if (!hasModuleAccess) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Si todo está bien, renderizar el contenido
  console.log(
    "✅ ProtectedRoute SUCCESS - Rendering content for:",
    window.location.pathname
  );
  console.log("🎉 Final state:", {
    requiredPermission,
    user: user?.email,
    hasAccess: true,
  });
  return children ? <>{children}</> : <Outlet />;
};
