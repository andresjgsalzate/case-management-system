// =============================================
// TIPOS PARA EL MÓDULO DE NOTAS - VERSIÓN MEJORADA
// =============================================

export type NoteType =
  | "note"
  | "solution"
  | "guide"
  | "faq"
  | "template"
  | "procedure";
export type NotePriority = "low" | "medium" | "high" | "urgent";
export type TagCategory =
  | "priority"
  | "technical"
  | "type"
  | "technology"
  | "module"
  | "custom";

// ===== ETIQUETAS REUTILIZABLES =====
export interface NoteTag {
  id: string;
  name: string;
  description?: string;
  color: string;
  category: TagCategory;
  usageCount: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteTagData {
  name: string;
  description?: string;
  color?: string;
  category: TagCategory;
}

// ===== INTERFACE PRINCIPAL DE NOTA MEJORADA =====
export interface Note {
  id: string;
  title: string;
  content: string;

  // Tipo y clasificación
  noteType: NoteType;
  priority: NotePriority;
  difficultyLevel: number; // 1-5

  // Etiquetas (por ahora mantenemos compatibilidad con string[])
  tags: string[];
  tagIds?: string[];
  noteTagsObjects?: NoteTag[];

  // Referencias
  caseId?: string;

  // Asignación y creación
  createdBy: string;
  assignedTo?: string;

  // Estados y flags
  isImportant: boolean;
  isArchived: boolean;
  isTemplate: boolean;
  isPublished: boolean;
  isDeprecated: boolean;

  // Archivo
  archivedAt?: string;
  archivedBy?: string;

  // Recordatorios
  reminderDate?: string;
  isReminderSent: boolean;

  // Métricas
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;

  // Metadatos adicionales
  complexityNotes?: string;
  prerequisites?: string;
  estimatedSolutionTime?: number; // minutos

  // Deprecación
  deprecationReason?: string;
  replacementNoteId?: string;

  // Versionado
  version: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastReviewedAt?: string;
  lastReviewedBy?: string;

  // Relaciones pobladas (mantener compatibilidad)
  case?: {
    id: string;
    numeroCaso: string;
    descripcion: string;
  };
  createdByUser?: {
    id: string;
    fullName?: string;
    email: string;
  };
  assignedToUser?: {
    id: string;
    fullName?: string;
    email: string;
  };
  archivedByUser?: {
    id: string;
    fullName?: string;
    email: string;
  };
}

export interface CreateNoteData {
  title: string;
  content: string;
  noteType?: NoteType;
  priority?: NotePriority;
  difficultyLevel?: number;
  tags?: string[];
  tagIds?: string[];
  caseId?: string;
  assignedTo?: string;
  isImportant?: boolean;
  isTemplate?: boolean;
  isPublished?: boolean;
  reminderDate?: string;
  complexityNotes?: string;
  prerequisites?: string;
  estimatedSolutionTime?: number;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
  noteType?: NoteType;
  priority?: NotePriority;
  difficultyLevel?: number;
  tags?: string[];
  tagIds?: string[];
  caseId?: string;
  assignedTo?: string;
  isImportant?: boolean;
  isTemplate?: boolean;
  isPublished?: boolean;
  isDeprecated?: boolean;
  reminderDate?: string;
  complexityNotes?: string;
  prerequisites?: string;
  estimatedSolutionTime?: number;
  deprecationReason?: string;
  replacementNoteId?: string;
  lastReviewedAt?: string;
}

export interface UpdateNoteData extends Partial<CreateNoteData> {
  id: string;
}

export interface NoteFilters {
  search?: string;
  tags?: string[];
  createdBy?: string;
  assignedTo?: string;
  caseId?: string;
  isImportant?: boolean;
  isArchived?: boolean;
  hasReminder?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface NoteStats {
  totalNotes: number;
  myNotes: number;
  assignedNotes: number;
  importantNotes: number;
  withReminders: number;
  archivedNotes: number;
}

export interface NoteSearchResult {
  id: string;
  title: string;
  content: string;
  tags: string[];
  caseId?: string;
  createdBy: string;
  assignedTo?: string;
  isImportant: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  caseNumber?: string;
  creatorName?: string;
  assignedName?: string;
}

export interface NoteFormData {
  title: string;
  content: string;
  tags: string[];
  caseId?: string;
  assignedTo?: string;
  isImportant: boolean;
  reminderDate?: string;
}

// Respuestas de API
export interface NotesResponse {
  success: boolean;
  data: Note[];
  message?: string;
}

export interface NoteResponse {
  success: boolean;
  data: Note;
  message?: string;
}

export interface NoteStatsResponse {
  success: boolean;
  data: NoteStats;
}

export interface NoteSearchResponse {
  success: boolean;
  data: NoteSearchResult[];
}

export interface ApiError {
  success: false;
  message: string;
  error?: string;
  errors?: string[];
}

// ===== CONSTANTES =====

export const NOTE_TYPES: Array<{
  value: NoteType;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: "note",
    label: "Nota",
    description: "Nota simple o comentario",
    icon: "📝",
  },
  {
    value: "solution",
    label: "Solución",
    description: "Solución a un problema específico",
    icon: "✅",
  },
  {
    value: "guide",
    label: "Guía",
    description: "Guía paso a paso para realizar una tarea",
    icon: "📋",
  },
  {
    value: "faq",
    label: "FAQ",
    description: "Preguntas frecuentes y respuestas",
    icon: "❓",
  },
  {
    value: "template",
    label: "Plantilla",
    description: "Plantilla reutilizable para documentos",
    icon: "📄",
  },
  {
    value: "procedure",
    label: "Procedimiento",
    description: "Procedimiento formal o protocolo",
    icon: "⚙️",
  },
];

export const NOTE_PRIORITIES: Array<{
  value: NotePriority;
  label: string;
  color: string;
}> = [
  { value: "low", label: "Baja", color: "#22C55E" },
  { value: "medium", label: "Media", color: "#EAB308" },
  { value: "high", label: "Alta", color: "#F97316" },
  { value: "urgent", label: "Urgente", color: "#EF4444" },
];

export const DIFFICULTY_LEVELS: Array<{
  value: number;
  label: string;
  description: string;
  color: string;
}> = [
  {
    value: 1,
    label: "Muy Fácil",
    description: "Solución muy simple, no requiere conocimientos técnicos",
    color: "#22C55E",
  },
  {
    value: 2,
    label: "Fácil",
    description: "Solución simple, conocimientos básicos requeridos",
    color: "#84CC16",
  },
  {
    value: 3,
    label: "Medio",
    description: "Solución moderada, conocimientos intermedios requeridos",
    color: "#EAB308",
  },
  {
    value: 4,
    label: "Difícil",
    description: "Solución compleja, conocimientos avanzados requeridos",
    color: "#F97316",
  },
  {
    value: 5,
    label: "Muy Difícil",
    description:
      "Solución muy compleja, conocimientos especializados requeridos",
    color: "#EF4444",
  },
];

export const TAG_CATEGORIES: Array<{
  value: TagCategory;
  label: string;
  description: string;
  color: string;
}> = [
  {
    value: "priority",
    label: "Prioridad",
    description: "Etiquetas de prioridad",
    color: "#EF4444",
  },
  {
    value: "technical",
    label: "Técnico",
    description: "Etiquetas técnicas por área",
    color: "#3B82F6",
  },
  {
    value: "type",
    label: "Tipo",
    description: "Tipo de trabajo realizado",
    color: "#8B5CF6",
  },
  {
    value: "technology",
    label: "Tecnología",
    description: "Tecnologías específicas",
    color: "#10B981",
  },
  {
    value: "module",
    label: "Módulo",
    description: "Módulos del sistema",
    color: "#F59E0B",
  },
  {
    value: "custom",
    label: "Personalizado",
    description: "Etiquetas personalizadas",
    color: "#6B7280",
  },
];
