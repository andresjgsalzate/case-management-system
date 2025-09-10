export interface Permission {
  id: string;
  name: string;
  description?: string;
  module: string;
  action: string;
  scope: "own" | "team" | "all";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePermissionRequest {
  name: string;
  description?: string;
  module: string;
  action: string;
  scope: "own" | "team" | "all";
  isActive?: boolean;
}

export interface UpdatePermissionRequest {
  name?: string;
  description?: string;
  module?: string;
  action?: string;
  scope?: "own" | "team" | "all";
  isActive?: boolean;
}

export interface PermissionFilterParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  search?: string;
  module?: string;
  action?: string;
  scope?: string;
  isActive?: boolean;
}

export interface PermissionListResponse {
  permissions: Permission[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PermissionsByModule {
  [module: string]: Permission[];
}

export interface ModulePermissionStructure {
  module: string;
  displayName: string;
  permissions: Permission[];
  actions: string[];
  scopes: string[];
}

export interface RolePermissionAssignment {
  roleId: string;
  permissionIds: string[];
}

// Constantes para módulos y acciones comunes
export const PERMISSION_MODULES = {
  CASES: "cases",
  TODOS: "todos",
  NOTES: "notes",
  USERS: "users",
  ROLES: "roles",
  PERMISSIONS: "permissions",
  DASHBOARD: "dashboard",
  REPORTS: "reports",
  SYSTEM: "system",
  DISPOSITIONS: "dispositions",
  TIME_ENTRIES: "time_entries",
  DOCUMENTATION: "documentation",
  ARCHIVE: "archive",
  SEARCH: "search",
} as const;

export const PERMISSION_ACTIONS = {
  READ: "read",
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  ADMIN: "admin",
  ASSIGN: "assign",
  MANAGE: "manage",
  EXPORT: "export",
  IMPORT: "import",
  APPROVE: "approve",
  ARCHIVE: "archive",
} as const;

export const PERMISSION_SCOPES = {
  OWN: "own",
  TEAM: "team",
  ALL: "all",
} as const;

// Mapeos para nombres amigables
export const MODULE_DISPLAY_NAMES: Record<string, string> = {
  cases: "📋 Gestión de Casos",
  todos: "✅ Tareas y TODOs",
  notes: "📝 Notas y Anotaciones",
  users: "👥 Gestión de Usuarios",
  roles: "🔑 Gestión de Roles",
  permissions: "🛡️ Gestión de Permisos",
  dashboard: "🏠 Dashboard",
  reports: "📈 Reportes y Estadísticas",
  system: "🖥️ Sistema",
  dispositions: "📄 Disposiciones",
  time_entries: "⏱️ Control de Tiempo",
  documentation: "📚 Documentación",
  archive: "📦 Archivo",
  knowledge: "📖 Base de Conocimiento",
  knowledge_types: "📑 Tipos de Documentos",
  knowledge_feedback: "💬 Feedback de Documentos",
  search: "🔍 Búsqueda",
};

export const ACTION_DISPLAY_NAMES: Record<string, string> = {
  read: "👁️ Ver/Leer",
  create: "➕ Crear",
  update: "✏️ Actualizar/Editar",
  delete: "🗑️ Eliminar",
  admin: "⚡ Administrar",
  assign: "👉 Asignar",
  manage: "🎮 Gestionar",
  export: "📤 Exportar",
  import: "📥 Importar",
  approve: "✅ Aprobar",
  archive: "📦 Archivar",
};

export const SCOPE_DISPLAY_NAMES: Record<string, string> = {
  own: "👤 Solo Propios",
  team: "👥 Del Equipo",
  all: "🌐 Todos/Sistema Completo",
};
