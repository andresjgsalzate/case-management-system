import { useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";

// Definición de módulos del sistema con sus permisos requeridos
export interface ModulePermission {
  name: string;
  href: string;
  icon: any;
  permissions: string[]; // Permisos requeridos para ver el módulo
  scope?: "own" | "team" | "all"; // Scope del permiso
  adminOnly?: boolean; // Si es solo para administradores
}

// Lista de todos los módulos disponibles en el sistema
export const SYSTEM_MODULES: ModulePermission[] = [
  {
    name: "Dashboard",
    href: "/",
    icon: "HomeIcon",
    permissions: [], // Dashboard siempre visible para usuarios autenticados
  },
  {
    name: "Casos",
    href: "/cases",
    icon: "DocumentTextIcon",
    permissions: ["cases.read_own", "cases.read_team", "cases.read_all"],
  },
  {
    name: "Nuevo Caso",
    href: "/cases/new",
    icon: "PlusIcon",
    permissions: ["cases.create_own", "cases.create_team", "cases.create_all"],
  },
  {
    name: "Notas",
    href: "/notes",
    icon: "DocumentDuplicateIcon",
    permissions: ["notes.read_own", "notes.read_team", "notes.read_all"],
  },
  {
    name: "TODOs",
    href: "/todos",
    icon: "ListBulletIcon",
    permissions: ["todos.read_own", "todos.read_team", "todos.read_all"],
  },
  {
    name: "Control de Casos",
    href: "/case-control",
    icon: "ClockIcon",
    permissions: [
      "case_control.read_own",
      "case_control.read_team",
      "case_control.read_all",
    ],
  },
  {
    name: "Disposiciones",
    href: "/dispositions",
    icon: "WrenchScrewdriverIcon",
    permissions: [
      "dispositions.read_own",
      "dispositions.read_team",
      "dispositions.read_all",
    ],
  },
  {
    name: "Archivo",
    href: "/archive",
    icon: "ArchiveBoxIcon",
    permissions: ["archive.view"],
  },
];

// Secciones administrativas agrupadas
export const ADMIN_SECTIONS: Array<{
  id: string;
  title: string;
  icon: string;
  adminOnly: boolean;
  items: ModulePermission[];
}> = [
  {
    id: "user-management",
    title: "Administración",
    icon: "UsersIcon",
    adminOnly: true,
    items: [
      {
        name: "Usuarios",
        href: "/users",
        icon: "UsersIcon",
        permissions: ["users.read_all", "users.admin_all"],
        adminOnly: true,
      },
      {
        name: "Roles",
        href: "/roles",
        icon: "CogIcon",
        permissions: ["roles.read_all", "roles.admin_all"],
        adminOnly: true,
      },
      {
        name: "Gestión de Permisos",
        href: "/permissions",
        icon: "ShieldCheckIcon",
        permissions: ["permissions.admin_all", "permissions.gestionar.all"],
        adminOnly: true,
      },
      {
        name: "Orígenes",
        href: "/admin/origins",
        icon: "BuildingOffice2Icon",
        permissions: ["admin.config", "origins.admin_all"],
        adminOnly: true,
      },
      {
        name: "Aplicaciones",
        href: "/admin/applications",
        icon: "CubeIcon",
        permissions: ["admin.config", "applications.admin_all"],
        adminOnly: true,
      },
      {
        name: "Estados de Control",
        href: "/admin/case-statuses",
        icon: "FlagIcon",
        permissions: ["admin.config", "case_statuses.admin_all"],
        adminOnly: true,
      },
      {
        name: "Estado del Sistema",
        href: "/system/status",
        icon: "CogIcon",
        permissions: ["system.read_all", "system.admin_all"],
        adminOnly: true,
      },
    ],
  },
];

/**
 * Hook para obtener permisos específicos del módulo
 */
export const useModulePermissions = () => {
  const { user, hasPermission, canAccessModule } = useAuth();

  return useMemo(() => {
    // Verificar si el usuario tiene permisos de administrador usando el sistema dinámico
    const isAdmin =
      hasPermission("permissions.admin_all") ||
      hasPermission("roles.gestionar.all") ||
      hasPermission("users.admin_all");

    // Función para verificar si el usuario puede acceder a un módulo específico
    const canAccessModuleWithPermissions = (
      module: ModulePermission
    ): boolean => {
      // Si tiene permisos administrativos, puede acceder a todo
      if (isAdmin) {
        return true;
      }

      // Si el módulo es solo para administradores y el usuario no es admin
      if (module.adminOnly && !isAdmin) {
        return false;
      }

      // Si no hay permisos específicos requeridos, permitir acceso
      if (!module.permissions || module.permissions.length === 0) {
        return true;
      }

      // Verificar si tiene al menos uno de los permisos requeridos
      return module.permissions.some((permission) => hasPermission(permission));
    };

    // Función para verificar acceso a secciones administrativas
    const canAccessAdminSection = (
      section: (typeof ADMIN_SECTIONS)[0]
    ): boolean => {
      // Si es administrador, puede ver todas las secciones
      if (isAdmin) {
        return true;
      }

      // Si la sección es solo para administradores
      if (section.adminOnly && !isAdmin) {
        return false;
      }

      // Verificar si tiene acceso a al menos un item de la sección
      return section.items.some((item) => canAccessModuleWithPermissions(item));
    };

    // Filtrar módulos permitidos
    const allowedModules = SYSTEM_MODULES.filter(
      canAccessModuleWithPermissions
    );

    // Debug logging para el módulo de Archivo
    const archiveModule = SYSTEM_MODULES.find((m) => m.href === "/archive");
    console.log("🔍 MODULE PERMISSIONS - Archive Debug:");
    console.log("  - Archive module found:", archiveModule);
    console.log(
      "  - Can access archive:",
      archiveModule
        ? canAccessModuleWithPermissions(archiveModule)
        : "module not found"
    );
    console.log(
      "  - Has archive.view permission:",
      hasPermission("archive.view")
    );
    console.log("  - Is admin:", isAdmin);
    console.log("  - Allowed modules count:", allowedModules.length);
    console.log(
      "  - Allowed modules:",
      allowedModules.map((m) => m.name)
    );

    // Filtrar secciones administrativas permitidas
    const allowedAdminSections = ADMIN_SECTIONS.filter(canAccessAdminSection)
      .map((section) => ({
        ...section,
        items: section.items.filter(canAccessModuleWithPermissions),
      }))
      .filter((section) => section.items.length > 0); // Solo mantener secciones con items

    return {
      allowedModules,
      allowedAdminSections,
      canAccessModuleWithPermissions,
      canAccessAdminSection,
      isAdmin,
    };
  }, [user, hasPermission, canAccessModule]);
};

/**
 * Hook para permisos específicos de funcionalidades
 */
export const useFeaturePermissions = () => {
  const { hasPermission, user } = useAuth();

  return useMemo(() => {
    const isAdmin = user?.roleName === "Administrador";

    return {
      // Permisos de casos
      canCreateCases:
        hasPermission("cases.create_own") ||
        hasPermission("cases.create_team") ||
        hasPermission("cases.create_all"),
      canViewAllCases: hasPermission("cases.read_all"),
      canEditCases:
        hasPermission("cases.update_own") ||
        hasPermission("cases.update_team") ||
        hasPermission("cases.update_all"),
      canDeleteCases:
        hasPermission("cases.delete_own") ||
        hasPermission("cases.delete_team") ||
        hasPermission("cases.delete_all"),

      // Permisos de notas
      canCreateNotes:
        hasPermission("notes.create_own") ||
        hasPermission("notes.create_team") ||
        hasPermission("notes.create_all"),
      canViewAllNotes: hasPermission("notes.read_all"),
      canEditNotes:
        hasPermission("notes.update_own") ||
        hasPermission("notes.update_team") ||
        hasPermission("notes.update_all"),

      // Permisos de TODOs
      canCreateTodos:
        hasPermission("todos.create_own") ||
        hasPermission("todos.create_team") ||
        hasPermission("todos.create_all"),
      canViewAllTodos: hasPermission("todos.read_all"),
      canEditTodos:
        hasPermission("todos.update_own") ||
        hasPermission("todos.update_team") ||
        hasPermission("todos.update_all"),

      // Permisos de disposiciones
      canCreateDispositions:
        hasPermission("dispositions.create_own") ||
        hasPermission("dispositions.create_team") ||
        hasPermission("dispositions.create_all"),
      canViewAllDispositions: hasPermission("dispositions.read_all"),
      canEditDispositions:
        hasPermission("dispositions.update_own") ||
        hasPermission("dispositions.update_team") ||
        hasPermission("dispositions.update_all"),

      // Permisos administrativos
      canManageUsers:
        hasPermission("users.admin_all") || hasPermission("users.update_all"),
      canManageRoles:
        hasPermission("roles.admin_all") || hasPermission("roles.update_all"),
      canManageSystem:
        hasPermission("system.admin_all") || hasPermission("system.update_all"),
      canViewReports:
        hasPermission("reports.read_team") || hasPermission("reports.read_all"),

      // Estado general
      isAdmin,
    };
  }, [hasPermission, user]);
};

/**
 * Hook para verificar permisos de scope específico
 */
export const useScopePermissions = () => {
  const { hasPermission, user } = useAuth();

  const checkScopePermission = (
    resource: string,
    action: string,
    targetUserId?: string
  ): boolean => {
    // Si es administrador, puede hacer todo
    if (user?.roleName === "Administrador") {
      return true;
    }

    // Verificar permiso 'all' primero
    if (hasPermission(`${resource}.${action}_all`)) {
      return true;
    }

    // Verificar permiso 'team'
    if (hasPermission(`${resource}.${action}_team`)) {
      // TODO: Implementar lógica de equipos cuando esté disponible
      return true;
    }

    // Verificar permiso 'own'
    if (hasPermission(`${resource}.${action}_own`)) {
      // Si no se especifica un targetUserId, asumir que es para el usuario actual
      if (!targetUserId) {
        return true;
      }
      // Verificar si es el mismo usuario
      return targetUserId === user?.id;
    }

    return false;
  };

  return {
    checkScopePermission,
  };
};
