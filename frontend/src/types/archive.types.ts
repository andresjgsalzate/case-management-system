// =============================================
// TIPOS PARA EL SISTEMA DE ARCHIVO
// =============================================

export interface ArchivedCase {
  id: string;
  originalCaseId: string;
  caseNumber: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  classification: string;
  userId: string;
  assignedUserId?: string;
  createdByUserId: string;
  originalCreatedAt: string;
  originalUpdatedAt: string;
  completedAt?: string;
  archivedAt: string;
  archivedBy: string;
  archiveReason?: string;
  restoredAt?: string;
  restoredBy?: string;
  isRestored: boolean;
  totalTimeMinutes: number;
  createdAt: string;
  updatedAt: string;

  // Información de usuarios relacionados
  user?: UserInfo;
  assignedUser?: UserInfo;
  archivedByUser?: UserInfo;
  restoredByUser?: UserInfo;
}

export interface ArchivedTodo {
  id: string;
  originalTodoId: string;
  title: string;
  description?: string;
  priority: string;
  category?: string;
  isCompleted: boolean;
  dueDate?: string;
  originalCreatedAt: string;
  originalUpdatedAt: string;
  completedAt?: string;
  createdByUserId: string;
  assignedUserId?: string;
  caseId?: string;
  archivedAt: string;
  archivedBy: string;
  archiveReason?: string;
  restoredAt?: string;
  restoredBy?: string;
  isRestored: boolean;
  totalTimeMinutes: number;
  createdAt: string;
  updatedAt: string;

  // Información de usuarios relacionados
  createdByUser?: UserInfo;
  assignedUser?: UserInfo;
  archivedByUser?: UserInfo;
  restoredByUser?: UserInfo;
}

export interface ArchivedItem {
  id: string;
  itemType: "case" | "todo";
  title: string;
  description?: string;
  archivedAt: string;
  archivedBy: string;
  isRestored: boolean;
  totalTimeMinutes: number;
  timerTimeMinutes?: number;
  manualTimeMinutes?: number;

  // Campos específicos de casos
  caseNumber?: string;
  status?: string;
  classification?: string;

  // Campos específicos de TODOs
  priority?: string;
  category?: string;
  isCompleted?: boolean;

  // Usuario que archivó
  archivedByUser?: UserInfo;
}

export interface ArchiveStats {
  totalArchivedCases: number;
  totalArchivedTodos: number;
  totalArchivedTimeMinutes: number;
  archivedThisMonth: number;
  restoredThisMonth: number;
}

export interface ArchiveFilters {
  type?: "cases" | "todos" | "all";
  archivedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  classification?: string;
  priority?: string;
  search?: string;
  showRestored?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateArchivedCaseData {
  originalCaseId: string;
  caseNumber: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  classification: string;
  userId: string;
  assignedUserId?: string;
  createdByUserId: string;
  originalCreatedAt: string;
  originalUpdatedAt: string;
  completedAt?: string;
  archiveReason?: string;
  originalData: any;
  controlData: any;
  totalTimeMinutes?: number;
}

export interface CreateArchivedTodoData {
  originalTodoId: string;
  title: string;
  description?: string;
  priority: string;
  category?: string;
  isCompleted?: boolean;
  dueDate?: string;
  originalCreatedAt: string;
  originalUpdatedAt: string;
  completedAt?: string;
  createdByUserId: string;
  assignedUserId?: string;
  caseId?: string;
  archiveReason?: string;
  originalData: any;
  controlData: any;
  totalTimeMinutes?: number;
}

export interface RestoreArchivedItemData {
  reason?: string;
}

export interface DeleteArchivedItemData {
  reason?: string;
}

export interface UserInfo {
  id: string;
  fullName?: string;
  email: string;
}

// Tipos para respuestas de la API
export interface ArchiveApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ArchiveSearchResult extends ArchivedItem {
  matchedFields: string[];
  relevanceScore: number;
}

// Estados para modales
export interface ArchiveModalState {
  isOpen: boolean;
  item: ArchivedItem | null;
  loading: boolean;
}

export interface RestoreModalState {
  isOpen: boolean;
  item: { id: string; title: string; type: "case" | "todo" } | null;
  loading: boolean;
}

export interface DeleteModalState {
  isOpen: boolean;
  item: ArchivedItem | null;
  type: "case" | "todo" | null;
}

export interface DetailsModalState {
  isOpen: boolean;
  item: ArchivedCase | ArchivedTodo | null;
  type: "case" | "todo";
}

// Constantes para clasificaciones y prioridades
export const CASE_CLASSIFICATIONS = {
  SIMPLE: "simple",
  MEDIUM: "medium",
  COMPLEX: "complex",
} as const;

export const TODO_PRIORITIES = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const;

export const CASE_STATUSES = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type CaseClassification =
  (typeof CASE_CLASSIFICATIONS)[keyof typeof CASE_CLASSIFICATIONS];
export type TodoPriority =
  (typeof TODO_PRIORITIES)[keyof typeof TODO_PRIORITIES];
export type CaseStatus = (typeof CASE_STATUSES)[keyof typeof CASE_STATUSES];

// Opciones para filtros
export const ARCHIVE_TYPE_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "cases", label: "Casos" },
  { value: "todos", label: "TODOs" },
] as const;

export const CLASSIFICATION_OPTIONS = [
  { value: "simple", label: "Simple" },
  { value: "medium", label: "Medio" },
  { value: "complex", label: "Complejo" },
] as const;

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
] as const;

export const STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente" },
  { value: "in_progress", label: "En Progreso" },
  { value: "completed", label: "Completado" },
  { value: "cancelled", label: "Cancelado" },
] as const;
