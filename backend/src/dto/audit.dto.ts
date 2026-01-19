import { AuditAction } from "../entities/AuditLog";
import { ChangeType } from "../entities/AuditEntityChange";

// ===========================
// DTOs DE REQUEST
// ===========================

export interface CreateAuditLogDto {
  userId?: string;
  userEmail: string;
  userName?: string;
  userRole?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityName?: string;
  module: string;
  operationContext?: any;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  requestPath?: string;
  requestMethod?: string;
  changes?: CreateAuditEntityChangeDto[];
}

export interface CreateAuditEntityChangeDto {
  fieldName: string;
  fieldType: string;
  oldValue?: string;
  newValue?: string;
  changeType: ChangeType;
  isSensitive?: boolean;
}

export interface AuditLogFiltersDto {
  // Filtros de usuario
  userId?: string;
  userEmail?: string;
  userRole?: string;

  // Filtros de acción
  action?: AuditAction | AuditAction[];
  module?: string | string[];
  entityType?: string | string[];
  entityId?: string;

  // Filtros de fecha
  startDate?: Date | string;
  endDate?: Date | string;

  // Filtros técnicos
  ipAddress?: string;
  sessionId?: string;

  // Filtros de búsqueda
  search?: string; // búsqueda general en entityName, userName, userEmail

  // Paginación
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "action" | "entityType" | "userName";
  sortOrder?: "ASC" | "DESC";

  // Incluir cambios detallados
  includeChanges?: boolean;
}

export interface AuditExportFiltersDto extends AuditLogFiltersDto {
  format?: "csv" | "xlsx" | "json";
  includeHeaders?: boolean;
  includeSensitiveData?: boolean;
}

// ===========================
// DTOs DE RESPONSE
// ===========================

export interface AuditLogResponseDto {
  id: string;
  userId?: string;
  userEmail: string;
  userName?: string;
  userRole?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityName?: string;
  module: string;
  operationContext?: any;
  ipAddress?: string;
  // Datos de geolocalización de IP
  ipGeolocation?: {
    city?: string;
    country?: string;
    countryCode?: string;
    timezone?: string;
    latitude?: number;
    longitude?: number;
    networkCidr?: string;
    asn?: number;
    isp?: string;
    organization?: string;
    enrichmentSource?: string;
    isPrivateIp?: boolean;
  };
  userAgent?: string;
  sessionId?: string;
  requestPath?: string;
  requestMethod?: string;
  operationSuccess: boolean;
  errorMessage?: string;
  createdAt: string; // ISO string
  changes?: AuditEntityChangeResponseDto[];

  // Campos calculados
  actionDescription?: string;
  entityDisplayName?: string;
  fullDescription?: string;
  changeCount?: number;
}

export interface AuditEntityChangeResponseDto {
  id: string;
  auditLogId: string;
  fieldName: string;
  fieldType: string;
  oldValue?: string;
  newValue?: string;
  changeType: ChangeType;
  isSensitive: boolean;
  createdAt: string; // ISO string

  // Campos calculados
  changeDescription?: string;
  fieldDisplayName?: string;
  oldDisplayValue?: string;
  newDisplayValue?: string;
  fullChangeDescription?: string;
}

export interface AuditLogListResponseDto {
  data: AuditLogResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AuditStatisticsResponseDto {
  totalActions: number;
  createActions: number;
  updateActions: number;
  deleteActions: number;
  archiveActions: number;
  restoreActions: number;
  uniqueUsers: number;
  uniqueEntities: number;
  mostActiveUser?: string;
  mostModifiedEntityType?: string;

  // Estadísticas por período
  actionsToday: number;
  actionsThisWeek: number;
  actionsThisMonth: number;

  // Distribución por módulo
  moduleStats: Array<{
    module: string;
    count: number;
    percentage: number;
  }>;

  // Actividad por usuario (top 10)
  userActivity: Array<{
    userId?: string;
    userEmail: string;
    userName?: string;
    actionCount: number;
  }>;

  // Entidades más modificadas (top 10)
  entityActivity: Array<{
    entityType: string;
    entityId: string;
    entityName?: string;
    actionCount: number;
  }>;
}

export interface AuditEntityHistoryResponseDto {
  entityType: string;
  entityId: string;
  entityName?: string;
  currentState?: any;
  history: AuditLogResponseDto[];
  totalChanges: number;
  firstChange?: string; // ISO string
  lastChange?: string; // ISO string
  uniqueUsers: number;
}

// ===========================
// QUERY BUILDERS
// ===========================

export interface AuditQueryBuilder {
  userId?: string;
  userIds?: string[];
  action?: AuditAction;
  actions?: AuditAction[];
  entityType?: string;
  entityTypes?: string[];
  entityId?: string;
  entityIds?: string[];
  module?: string;
  modules?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  ipAddress?: string;
  sessionId?: string;
  search?: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "ASC" | "DESC";
  includeChanges: boolean;
}

// ===========================
// HELPERS Y UTILIDADES
// ===========================

export interface AuditLogSearchCriteria {
  terms: string[];
  fields: ("userName" | "userEmail" | "entityName" | "module")[];
}

export interface AuditConfigDto {
  retentionDays: number;
  enableAutoCleanup: boolean;
  sensitiveFields: string[];
  excludedModules: string[];
  maxLogSize: number;
  enableRealTimeNotifications: boolean;
}

// ===========================
// TIPOS PARA MIDDLEWARE
// ===========================

export interface AuditContext {
  userId?: string;
  userEmail: string;
  userName?: string;
  userRole?: string;
  module: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  requestPath?: string;
  requestMethod?: string;
  // Datos de geolocalización de IP (enriquecidos via ip.guide)
  ipGeolocation?: {
    city?: string;
    country?: string;
    countryCode?: string;
    timezone?: string;
    latitude?: number;
    longitude?: number;
    networkCidr?: string;
    asn?: number;
    isp?: string;
    organization?: string;
    enrichmentSource?: string;
    isPrivateIp?: boolean;
  };
}

export interface EntityChange {
  field: string;
  oldValue: any;
  newValue: any;
  type?: string;
  isSensitive?: boolean;
}

export interface AuditMetadata {
  entityType: string;
  entityId: string;
  entityName?: string;
  action: AuditAction;
  changes: EntityChange[];
  context?: any;
}

// ===========================
// ENUMS ADICIONALES
// ===========================

export enum AuditModule {
  CASES = "cases",
  TODOS = "todos",
  USERS = "users",
  ROLES = "roles",
  PERMISSIONS = "permissions",
  NOTES = "notes",
  TIME_TRACKING = "time_tracking",
  MANUAL_TIME_ENTRIES = "manual_time_entries",
  ADMIN = "admin",
  AUTH = "auth",
  ARCHIVE = "archive",
  DASHBOARD = "dashboard",
  SESSION_MANAGEMENT = "SessionManagement",
}

export enum AuditEntityType {
  CASE = "cases",
  TODO = "todos",
  USER_PROFILE = "user_profiles",
  ROLE = "roles",
  PERMISSION = "permissions",
  NOTE = "notes",
  TIME_ENTRY = "time_entries",
  MANUAL_TIME_ENTRY = "manual_time_entries",
  TODO_TIME_ENTRY = "todo_time_entries",
  TODO_MANUAL_TIME_ENTRY = "todo_manual_time_entries",
  CASE_CONTROL = "case_control",
  TODO_CONTROL = "todo_control",
  APPLICATION = "applications",
  ORIGIN = "origins",
  DISPOSITION = "dispositions",
  KNOWLEDGE_DOCUMENT = "knowledge_documents",
  ARCHIVED_CASE = "archived_cases",
  ARCHIVED_TODO = "archived_todos",
}

// ===========================
// VALIDACIONES
// ===========================

export const AUDIT_VALIDATION_RULES = {
  MAX_ENTITY_NAME_LENGTH: 500,
  MAX_USER_NAME_LENGTH: 500,
  MAX_MODULE_LENGTH: 50,
  MAX_FIELD_NAME_LENGTH: 100,
  MAX_FIELD_TYPE_LENGTH: 50,
  MAX_CHANGE_VALUE_LENGTH: 10000, // Para evitar valores extremadamente largos
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_RETENTION_DAYS: 365,
  MAX_RETENTION_DAYS: 2555, // ~7 años
} as const;
