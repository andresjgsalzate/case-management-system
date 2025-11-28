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

// NOTA: Esta lista ahora usa permisos dinámicos de la base de datos
// Los permisos se verifican contra la base de datos en tiempo real
export const SYSTEM_MODULES: ModulePermission[] = [
  {
    name: "Dashboard",
    href: "/",
    icon: "HomeIcon",
    permissions: [
      "metrics.view.own",
      "metrics.view.team",
      "metrics.view.all",
      "metrics.time.own",
      "metrics.cases.own",
    ], // Requiere permisos de métricas
  },
  {
    name: "Casos",
    href: "/cases",
    icon: "DocumentTextIcon",
    permissions: ["cases.view.own", "cases.view.team", "cases.view.all"],
  },
  {
    name: "Nuevo Caso",
    href: "/cases/new",
    icon: "PlusIcon",
    permissions: ["cases.create.own", "cases.create.team", "cases.create.all"],
  },
  {
    name: "Notas",
    href: "/notes",
    icon: "DocumentDuplicateIcon",
    permissions: ["notes.view.own", "notes.view.team", "notes.view.all"],
  },
  {
    name: "TODOs",
    href: "/todos",
    icon: "ListBulletIcon",
    permissions: ["todos.view.own", "todos.view.team", "todos.view.all"],
  },
  {
    name: "Control de Casos",
    href: "/case-control",
    icon: "ClockIcon",
    permissions: [
      "case_control.view.own",
      "case_control.view.team",
      "case_control.view.all",
    ],
  },
  {
    name: "Disposiciones",
    href: "/dispositions",
    icon: "WrenchScrewdriverIcon",
    permissions: [
      "dispositions.view.own",
      "dispositions.view.team",
      "dispositions.view.all",
    ],
  },
  {
    name: "Archivo",
    href: "/archive",
    icon: "ArchiveBoxIcon",
    permissions: ["archive.view.own"],
  },
  {
    name: "Base de Conocimiento",
    href: "/knowledge",
    icon: "BookOpenIcon",
    permissions: [
      "knowledge.read.own",
      "knowledge.read.team",
      "knowledge.read.all",
    ],
  },
];

// NOTA: Secciones administrativas ahora usan permisos dinámicos de la base de datos
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
        permissions: ["users.view.all", "users.manage.all"],
        adminOnly: true,
      },
      {
        name: "Roles",
        href: "/roles",
        icon: "CogIcon",
        permissions: ["roles.manage.all"],
        adminOnly: true,
      },
      {
        name: "Equipos",
        href: "/teams",
        icon: "UsersIcon",
        permissions: ["teams.view.all"],
        adminOnly: false, // No restringido solo a administradores
      },
      {
        name: "Gestión de Permisos",
        href: "/permissions",
        icon: "ShieldCheckIcon",
        permissions: ["permissions.admin.all", "permissions.read.all"],
        adminOnly: true,
      },
      {
        name: "Orígenes",
        href: "/admin/origins",
        icon: "BuildingOffice2Icon",
        permissions: ["admin.config.all", "origins.admin.all"],
        adminOnly: true,
      },
      {
        name: "Aplicaciones",
        href: "/admin/applications",
        icon: "CubeIcon",
        permissions: ["admin.config.all", "applications.admin.all"],
        adminOnly: true,
      },
      {
        name: "Estados de Control",
        href: "/admin/case-statuses",
        icon: "FlagIcon",
        permissions: ["admin.config.all", "case_statuses.admin.all"],
        adminOnly: true,
      },
      {
        name: "Etiquetas",
        href: "/admin/tags",
        icon: "TagIcon",
        permissions: [
          "tags.manage.all",
          "tags.read.all",
          "tags.create.all",
          "tags.update.all",
        ],
        adminOnly: false,
      },
      {
        name: "Tipos de Documento",
        href: "/admin/document-types",
        icon: "DocumentTextIcon",
        permissions: [
          "knowledge_types.manage.all",
          "knowledge_types.read.all",
          "knowledge_types.create.all",
          "knowledge_types.update.all",
        ],
        adminOnly: false, // No restringido solo a administradores
      },
      {
        name: "Prioridades de Tareas",
        href: "/admin/todo-priorities",
        icon: "FlagIcon",
        permissions: ["todos.create.all", "todos.edit.all", "todos.admin.all"],
        adminOnly: false, // No restringido solo a administradores
      },
      {
        name: "Auditoría",
        href: "/admin/audit",
        icon: "ShieldCheckIcon",
        permissions: ["audit.view.all", "audit.admin.all"],
        adminOnly: true,
      },
      {
        name: "Estado del Sistema",
        href: "/system/status",
        icon: "CogIcon",
        permissions: ["admin.config.all", "admin.read.all"],
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
    console.log("🔍 useModulePermissions - Iniciando verificación de permisos");
    console.log("🔍 useModulePermissions - Usuario actual:", user);

    // Verificar si el usuario tiene permisos de administrador usando el sistema dinámico
    const adminPermissions = {
      "permissions.admin.all": hasPermission("permissions.admin.all"),
      "roles.manage.all": hasPermission("roles.manage.all"),
      "users.admin.all": hasPermission("users.admin.all"),
    };

    console.log(
      "🔍 useModulePermissions - Permisos de administrador:",
      adminPermissions
    );

    const isAdmin =
      hasPermission("permissions.admin.all") ||
      hasPermission("roles.manage.all") ||
      hasPermission("users.admin.all");

    console.log("🔍 useModulePermissions - Es administrador?:", isAdmin);

    // Función para verificar si el usuario puede acceder a un módulo específico
    const canAccessModuleWithPermissions = (
      module: ModulePermission
    ): boolean => {
      console.log(
        `🔍 canAccessModuleWithPermissions - Verificando módulo: ${module.name}`
      );
      console.log(
        `🔍 canAccessModuleWithPermissions - Permisos requeridos:`,
        module.permissions
      );
      console.log(
        `🔍 canAccessModuleWithPermissions - Solo admin?:`,
        module.adminOnly
      );

      // Si tiene permisos administrativos, puede acceder a todo
      if (isAdmin) {
        console.log(
          `✅ canAccessModuleWithPermissions - ${module.name}: Acceso permitido (es admin)`
        );
        return true;
      }

      // Si el módulo es solo para administradores y el usuario no es admin
      if (module.adminOnly && !isAdmin) {
        console.log(
          `❌ canAccessModuleWithPermissions - ${module.name}: Acceso denegado (requiere admin)`
        );
        return false;
      }

      // Si no hay permisos específicos requeridos, permitir acceso
      if (!module.permissions || module.permissions.length === 0) {
        console.log(
          `✅ canAccessModuleWithPermissions - ${module.name}: Acceso permitido (sin permisos requeridos)`
        );
        return true;
      }

      // Verificar si tiene al menos uno de los permisos requeridos
      const permissionResults = module.permissions.map((permission) => ({
        permission,
        hasIt: hasPermission(permission),
      }));

      console.log(
        `🔍 canAccessModuleWithPermissions - ${module.name}: Resultados de permisos:`,
        permissionResults
      );

      const hasAccess = module.permissions.some((permission) =>
        hasPermission(permission)
      );

      console.log(
        `${hasAccess ? "✅" : "❌"} canAccessModuleWithPermissions - ${
          module.name
        }: ${hasAccess ? "Acceso permitido" : "Acceso denegado"}`
      );

      return hasAccess;
    };

    // Función para verificar acceso a secciones administrativas
    const canAccessAdminSection = (
      section: (typeof ADMIN_SECTIONS)[0]
    ): boolean => {
      console.log(
        `🔍 canAccessAdminSection - Verificando sección: ${section.title}`
      );
      console.log(`🔍 canAccessAdminSection - Solo admin?:`, section.adminOnly);

      // Si es administrador, puede ver todas las secciones
      if (isAdmin) {
        console.log(
          `✅ canAccessAdminSection - ${section.title}: Acceso permitido (es admin)`
        );
        return true;
      }

      // Si la sección es solo para administradores
      if (section.adminOnly && !isAdmin) {
        console.log(
          `❌ canAccessAdminSection - ${section.title}: Acceso denegado (requiere admin)`
        );
        return false;
      }

      // Verificar si tiene acceso a al menos un item de la sección
      const hasAccessToItems = section.items.some((item) =>
        canAccessModuleWithPermissions(item)
      );

      console.log(
        `${hasAccessToItems ? "✅" : "❌"} canAccessAdminSection - ${
          section.title
        }: ${
          hasAccessToItems ? "Acceso permitido" : "Acceso denegado"
        } (basado en items)`
      );

      return hasAccessToItems;
    };

    // Filtrar módulos permitidos
    console.log(
      "🔍 useModulePermissions - Iniciando filtrado de módulos del sistema..."
    );
    const allowedModules = SYSTEM_MODULES.filter(
      canAccessModuleWithPermissions
    );
    console.log(
      "🔍 useModulePermissions - Módulos permitidos:",
      allowedModules.map((m) => m.name)
    );

    // Filtrar secciones administrativas permitidas
    console.log(
      "🔍 useModulePermissions - Iniciando filtrado de secciones administrativas..."
    );
    const allowedAdminSections = ADMIN_SECTIONS.filter(canAccessAdminSection)
      .map((section) => ({
        ...section,
        items: section.items.filter(canAccessModuleWithPermissions),
      }))
      .filter((section) => section.items.length > 0); // Solo mantener secciones con items

    console.log(
      "🔍 useModulePermissions - Secciones administrativas permitidas:"
    );
    allowedAdminSections.forEach((section) => {
      console.log(
        `  📂 ${section.title}:`,
        section.items.map((item) => item.name)
      );
    });

    // Verificar específicamente el módulo de Equipos
    const teamsModule = ADMIN_SECTIONS[0]?.items.find(
      (item) => item.name === "Equipos"
    );
    if (teamsModule) {
      console.log(
        "🔍 useModulePermissions - Estado específico del módulo Equipos:"
      );
      console.log("  📋 Nombre:", teamsModule.name);
      console.log("  🔗 URL:", teamsModule.href);
      console.log("  🔑 Permisos requeridos:", teamsModule.permissions);
      console.log("  👑 Solo admin?:", teamsModule.adminOnly);
      console.log(
        "  ✅ Puede acceder?:",
        canAccessModuleWithPermissions(teamsModule)
      );
    }

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
 * Completamente dinámico basado en la base de datos
 */
export const useFeaturePermissions = () => {
  const { hasPermission, user } = useAuth();

  return useMemo(() => {
    const isAdmin =
      hasPermission("permissions.admin.all") ||
      hasPermission("roles.manage.all") ||
      hasPermission("users.admin.all");

    return {
      // Permisos de casos (usando permisos estandarizados de BD)
      canCreateCases:
        hasPermission("cases.create.own") ||
        hasPermission("cases.create.team") ||
        hasPermission("cases.create.all"),
      canViewAllCases: hasPermission("cases.view.all"),
      canEditCases:
        hasPermission("cases.edit.own") ||
        hasPermission("cases.edit.team") ||
        hasPermission("cases.edit.all"),
      canDeleteCases:
        hasPermission("cases.delete.own") ||
        hasPermission("cases.delete.team") ||
        hasPermission("cases.delete.all"),

      // Permisos de notas (usando permisos estandarizados de BD)
      canCreateNotes:
        hasPermission("notes.create.own") ||
        hasPermission("notes.create.team") ||
        hasPermission("notes.create.all"),
      canViewAllNotes: hasPermission("notes.view.all"),
      canEditNotes:
        hasPermission("notes.edit.own") ||
        hasPermission("notes.edit.team") ||
        hasPermission("notes.edit.all"),

      // Permisos de TODOs (usando permisos estandarizados de BD)
      canCreateTodos:
        hasPermission("todos.create.own") ||
        hasPermission("todos.create.team") ||
        hasPermission("todos.create.all"),
      canViewAllTodos: hasPermission("todos.view.all"),
      canEditTodos:
        hasPermission("todos.edit.own") ||
        hasPermission("todos.edit.team") ||
        hasPermission("todos.edit.all"),

      // Permisos de Base de Conocimiento - 100% dinámicos (usando permisos estandarizados de BD)
      canCreateKnowledge:
        hasPermission("knowledge.create.own") ||
        hasPermission("knowledge.create.team") ||
        hasPermission("knowledge.create.all"),
      canViewAllKnowledge: hasPermission("knowledge.read.all"),
      canEditKnowledge:
        hasPermission("knowledge.update.own") ||
        hasPermission("knowledge.update.team") ||
        hasPermission("knowledge.update.all"),
      canDeleteKnowledge:
        hasPermission("knowledge.delete.own") ||
        hasPermission("knowledge.delete.team") ||
        hasPermission("knowledge.delete.all"),
      canArchiveKnowledge:
        hasPermission("knowledge.archive.own") ||
        hasPermission("knowledge.archive.team") ||
        hasPermission("knowledge.archive.all"),
      canExportKnowledge:
        hasPermission("knowledge.export.own") ||
        hasPermission("knowledge.export.team") ||
        hasPermission("knowledge.export.all"),
      canDuplicateKnowledge:
        hasPermission("knowledge.duplicate.own") ||
        hasPermission("knowledge.duplicate.team") ||
        hasPermission("knowledge.duplicate.all"),

      // Permisos de disposiciones (usando permisos estandarizados de BD)
      canCreateDispositions:
        hasPermission("dispositions.create.own") ||
        hasPermission("dispositions.create.team") ||
        hasPermission("dispositions.create.all"),
      canViewAllDispositions: hasPermission("dispositions.view.all"),
      canEditDispositions:
        hasPermission("dispositions.edit.own") ||
        hasPermission("dispositions.edit.team") ||
        hasPermission("dispositions.edit.all"),

      // Permisos administrativos (usando permisos estandarizados de BD)
      canManageUsers:
        hasPermission("users.manage.all") || hasPermission("users.edit.all"),
      canManageRoles:
        hasPermission("roles.manage.all") || hasPermission("roles.edit.all"),
      canManageSystem:
        hasPermission("admin.config.all") ||
        hasPermission("permissions.admin.all"),
      canViewReports:
        hasPermission("reports.generate.team") ||
        hasPermission("reports.generate.all"),

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
    const isAdmin =
      hasPermission("permissions.admin.all") ||
      hasPermission("roles.manage.all") ||
      hasPermission("users.admin.all");

    if (isAdmin) {
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

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (_permissionKey: string): boolean => {
    if (!user) return false;

    // DEPRECATED: Este hook usa el contexto de autenticación principal
    // que ya maneja permisos dinámicos desde la base de datos
    console.warn(
      "🚨 usePermissions hook is deprecated. Use useAuth().hasPermission instead"
    );

    // Retornar false para forzar el uso del sistema principal
    return false;
  };

  return {
    hasPermission,
  };
};
