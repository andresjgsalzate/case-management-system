export interface AuditLog {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  entityName?: string;
  module: string;
  userId: string;
  userEmail: string;
  userName?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  requestPath?: string;
  requestMethod?: string;
  operationSuccess: boolean;
  errorMessage?: string;
  createdAt: string;
  operationContext?: Record<string, any>;

  // Relaciones
  user?: {
    id: string;
    email: string;
    fullName?: string;
    roleName?: string;
  };
  changes?: AuditEntityChange[];
}

export interface AuditEntityChange {
  id: string;
  auditLogId: string;
  fieldName: string;
  changeType: ChangeType;
  oldValue?: string;
  newValue?: string;
  fieldType?: string;
  createdAt: string;

  // Relación
  auditLog?: AuditLog;
}

export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  LOGOUT_ALL = "LOGOUT_ALL",
  FORCE_LOGOUT = "FORCE_LOGOUT",
  PASSWORD_CHANGE = "PASSWORD_CHANGE",
  PERMISSION_CHANGE = "PERMISSION_CHANGE",
  BULK_OPERATION = "BULK_OPERATION",
  EXPORT = "EXPORT",
  IMPORT = "IMPORT",
  ARCHIVE = "ARCHIVE",
  RESTORE = "RESTORE",
  READ = "READ",
  VIEW = "VIEW",
  DOWNLOAD = "DOWNLOAD",
}

export enum ChangeType {
  FIELD_ADDED = "FIELD_ADDED",
  FIELD_MODIFIED = "FIELD_MODIFIED",
  FIELD_REMOVED = "FIELD_REMOVED",
  FIELD_CLEARED = "FIELD_CLEARED",
  RELATION_ADDED = "RELATION_ADDED",
  RELATION_REMOVED = "RELATION_REMOVED",
  STATUS_CHANGE = "STATUS_CHANGE",
}

export enum AuditModule {
  AUTH = "AUTH",
  USERS = "USERS",
  ROLES = "ROLES",
  PERMISSIONS = "PERMISSIONS",
  CASES = "CASES",
  TODOS = "TODOS",
  NOTES = "NOTES",
  DISPOSITIONS = "DISPOSITIONS",
  ARCHIVE = "ARCHIVE",
  TIME_TRACKING = "TIME_TRACKING",
  KNOWLEDGE_BASE = "KNOWLEDGE_BASE",
  TAGS = "TAGS",
  SYSTEM = "SYSTEM",
  ADMIN = "ADMIN",
  FILES = "FILES",
  REPORTS = "REPORTS",
  SESSION_MANAGEMENT = "SessionManagement",
}

export enum AuditEntityType {
  USER = "USER",
  ROLE = "ROLE",
  PERMISSION = "PERMISSION",
  CASE = "CASE",
  TODO = "TODO",
  NOTE = "NOTE",
  DISPOSITION = "DISPOSITION",
  TIME_ENTRY = "TIME_ENTRY",
  KNOWLEDGE_DOCUMENT = "KNOWLEDGE_DOCUMENT",
  TAG = "TAG",
  FILE = "FILE",
  COMMENT = "COMMENT",
  ATTACHMENT = "ATTACHMENT",
}

export interface AuditLogFilters {
  // Filtros de fechas
  startDate?: string;
  endDate?: string;

  // Filtros de usuario
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;

  // Filtros de operación
  action?: AuditAction;
  module?: AuditModule;
  entityType?: AuditEntityType;
  entityId?: string;

  // Filtros de sistema
  ipAddress?: string;
  operationSuccess?: boolean;
  hasErrors?: boolean;

  // Filtros de contexto
  requestPath?: string;
  requestMethod?: string;
  sessionId?: string;

  // Búsqueda
  searchTerm?: string;

  // Paginación
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface AuditLogResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AuditStatsResponse {
  totalLogs: number;
  totalUsers: number;
  totalModules: number;
  totalEntities: number;
  actionBreakdown: Record<AuditAction, number>;
  moduleBreakdown: Record<AuditModule, number>;
  entityBreakdown: Record<AuditEntityType, number>;
  dailyActivity: Array<{
    date: string;
    count: number;
    actions: Record<AuditAction, number>;
  }>;
  userActivity: Array<{
    userId: string;
    userEmail: string;
    userName?: string;
    operationCount: number;
    lastActivity: string;
  }>;
  errorRate: number;
  topUsers: Array<{
    userId: string;
    userEmail: string;
    userName?: string;
    operationCount: number;
  }>;
  recentErrors: AuditLog[];
}

export interface AuditExportRequest {
  format: "JSON" | "CSV" | "XLSX";
  filters?: AuditLogFilters;
  includeChanges?: boolean;
  dateFormat?: string;
}

export interface AuditEntityHistoryResponse {
  entity: {
    type: string;
    id: string;
    name?: string;
  };
  history: AuditLog[];
  changes: AuditEntityChange[];
  timeline: Array<{
    date: string;
    action: AuditAction;
    user: string;
    changes: number;
    details?: string;
  }>;
}

export interface CreateAuditLogRequest {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  entityName?: string;
  operationSuccess: boolean;
  errorMessage?: string;
  operationContext?: Record<string, any>;
  changes?: Array<{
    fieldName: string;
    changeType: ChangeType;
    oldValue?: string;
    newValue?: string;
    fieldType?: string;
  }>;
}

export interface AuditCleanupRequest {
  daysToKeep: number;
}

// Constantes para validaciones
export const AUDIT_VALIDATION = {
  MIN_RETENTION_DAYS: 30,
  MAX_RETENTION_DAYS: 2555, // ~7 años
  MAX_SEARCH_TERM_LENGTH: 100,
  MAX_EXPORT_RECORDS: 10000,
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,
} as const;

// Opciones para select/dropdown
export const AUDIT_ACTION_OPTIONS = Object.values(AuditAction).map(
  (action) => ({
    value: action,
    label: action,
  })
);

export const AUDIT_MODULE_OPTIONS = Object.values(AuditModule).map(
  (module) => ({
    value: module,
    label: module,
  })
);

export const AUDIT_ENTITY_TYPE_OPTIONS = Object.values(AuditEntityType).map(
  (type) => ({
    value: type,
    label: type,
  })
);

export const CHANGE_TYPE_OPTIONS = Object.values(ChangeType).map((type) => ({
  value: type,
  label: type,
}));

// Helpers para mostrar información
export const getActionLabel = (action: AuditAction): string => {
  const labels: Record<AuditAction, string> = {
    [AuditAction.CREATE]: "Crear",
    [AuditAction.UPDATE]: "Actualizar",
    [AuditAction.DELETE]: "Eliminar",
    [AuditAction.LOGIN]: "Iniciar Sesión",
    [AuditAction.LOGOUT]: "Cerrar Sesión",
    [AuditAction.LOGOUT_ALL]: "Cerrar Todas las Sesiones",
    [AuditAction.FORCE_LOGOUT]: "Forzar Cierre de Sesión",
    [AuditAction.PASSWORD_CHANGE]: "Cambiar Contraseña",
    [AuditAction.PERMISSION_CHANGE]: "Cambiar Permisos",
    [AuditAction.BULK_OPERATION]: "Operación Masiva",
    [AuditAction.EXPORT]: "Exportar",
    [AuditAction.IMPORT]: "Importar",
    [AuditAction.ARCHIVE]: "Archivar",
    [AuditAction.RESTORE]: "Restaurar",
    [AuditAction.READ]: "Leer",
    [AuditAction.VIEW]: "Ver",
    [AuditAction.DOWNLOAD]: "Descargar",
  };
  return labels[action] || action;
};

export const getModuleLabel = (module: AuditModule): string => {
  const labels: Record<AuditModule, string> = {
    [AuditModule.AUTH]: "Autenticación",
    [AuditModule.USERS]: "Usuarios",
    [AuditModule.ROLES]: "Roles",
    [AuditModule.PERMISSIONS]: "Permisos",
    [AuditModule.CASES]: "Casos",
    [AuditModule.TODOS]: "Tareas",
    [AuditModule.NOTES]: "Notas",
    [AuditModule.DISPOSITIONS]: "Disposiciones",
    [AuditModule.ARCHIVE]: "Archivo",
    [AuditModule.TIME_TRACKING]: "Seguimiento de Tiempo",
    [AuditModule.KNOWLEDGE_BASE]: "Base de Conocimiento",
    [AuditModule.TAGS]: "Etiquetas",
    [AuditModule.SYSTEM]: "Sistema",
    [AuditModule.ADMIN]: "Administración",
    [AuditModule.FILES]: "Archivos",
    [AuditModule.REPORTS]: "Reportes",
    [AuditModule.SESSION_MANAGEMENT]: "Gestión de Sesiones",
  };
  return labels[module] || module;
};

export const getEntityTypeLabel = (entityType: AuditEntityType): string => {
  const labels: Record<AuditEntityType, string> = {
    [AuditEntityType.USER]: "Usuario",
    [AuditEntityType.ROLE]: "Rol",
    [AuditEntityType.PERMISSION]: "Permiso",
    [AuditEntityType.CASE]: "Caso",
    [AuditEntityType.TODO]: "Tarea",
    [AuditEntityType.NOTE]: "Nota",
    [AuditEntityType.DISPOSITION]: "Disposición",
    [AuditEntityType.TIME_ENTRY]: "Entrada de Tiempo",
    [AuditEntityType.KNOWLEDGE_DOCUMENT]: "Documento de Conocimiento",
    [AuditEntityType.TAG]: "Etiqueta",
    [AuditEntityType.FILE]: "Archivo",
    [AuditEntityType.COMMENT]: "Comentario",
    [AuditEntityType.ATTACHMENT]: "Adjunto",
  };
  return labels[entityType] || entityType;
};

export const getChangeTypeLabel = (changeType: ChangeType): string => {
  const labels: Record<ChangeType, string> = {
    [ChangeType.FIELD_ADDED]: "Campo Agregado",
    [ChangeType.FIELD_MODIFIED]: "Campo Modificado",
    [ChangeType.FIELD_REMOVED]: "Campo Eliminado",
    [ChangeType.FIELD_CLEARED]: "Campo Vaciado",
    [ChangeType.RELATION_ADDED]: "Relación Agregada",
    [ChangeType.RELATION_REMOVED]: "Relación Eliminada",
    [ChangeType.STATUS_CHANGE]: "Cambio de Estado",
  };
  return labels[changeType] || changeType;
};

export const getActionColor = (action: AuditAction): string => {
  const colors: Record<AuditAction, string> = {
    [AuditAction.CREATE]: "text-green-600 bg-green-100",
    [AuditAction.UPDATE]: "text-blue-600 bg-blue-100",
    [AuditAction.DELETE]: "text-red-600 bg-red-100",
    [AuditAction.LOGIN]: "text-indigo-600 bg-indigo-100",
    [AuditAction.LOGOUT]: "text-gray-600 bg-gray-100",
    [AuditAction.LOGOUT_ALL]: "text-red-700 bg-red-200",
    [AuditAction.FORCE_LOGOUT]: "text-red-800 bg-red-300",
    [AuditAction.PASSWORD_CHANGE]: "text-yellow-600 bg-yellow-100",
    [AuditAction.PERMISSION_CHANGE]: "text-orange-600 bg-orange-100",
    [AuditAction.BULK_OPERATION]: "text-purple-600 bg-purple-100",
    [AuditAction.EXPORT]: "text-cyan-600 bg-cyan-100",
    [AuditAction.IMPORT]: "text-teal-600 bg-teal-100",
    [AuditAction.ARCHIVE]: "text-amber-600 bg-amber-100",
    [AuditAction.RESTORE]: "text-emerald-600 bg-emerald-100",
    [AuditAction.READ]: "text-sky-600 bg-sky-100",
    [AuditAction.VIEW]: "text-slate-600 bg-slate-100",
    [AuditAction.DOWNLOAD]: "text-lime-600 bg-lime-100",
  };
  return colors[action] || "text-gray-600 bg-gray-100";
};
