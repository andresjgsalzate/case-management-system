import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUUID,
  IsDateString,
  IsInt,
  IsIn,
  Min,
  Max,
  MinLength,
  MaxLength,
} from "class-validator";

export class CreateNoteDto {
  @IsString()
  @MinLength(1, { message: "El título es requerido" })
  @MaxLength(500, { message: "El título no puede exceder 500 caracteres" })
  title: string;

  @IsString()
  @MinLength(1, { message: "El contenido es requerido" })
  content: string;

  @IsOptional()
  @IsString()
  @IsIn(["note", "solution", "guide", "faq", "template", "procedure"])
  noteType?: string;

  @IsOptional()
  @IsString()
  @IsIn(["low", "medium", "high", "urgent"])
  priority?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficultyLevel?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsUUID("4", { message: "ID de caso inválido" })
  caseId?: string;

  @IsOptional()
  @IsUUID("4", { message: "ID de usuario asignado inválido" })
  assignedTo?: string;

  @IsOptional()
  @IsBoolean()
  isImportant?: boolean;

  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsDateString({}, { message: "Fecha de recordatorio inválida" })
  reminderDate?: string;

  @IsOptional()
  @IsString()
  complexityNotes?: string;

  @IsOptional()
  @IsString()
  prerequisites?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedSolutionTime?: number;
}

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: "El título es requerido" })
  @MaxLength(500, { message: "El título no puede exceder 500 caracteres" })
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: "El contenido es requerido" })
  content?: string;

  @IsOptional()
  @IsString()
  @IsIn(["note", "solution", "guide", "faq", "template", "procedure"])
  noteType?: string;

  @IsOptional()
  @IsString()
  @IsIn(["low", "medium", "high", "urgent"])
  priority?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficultyLevel?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsUUID("4", { message: "ID de caso inválido" })
  caseId?: string;

  @IsOptional()
  @IsUUID("4", { message: "ID de usuario asignado inválido" })
  assignedTo?: string;

  @IsOptional()
  @IsBoolean()
  isImportant?: boolean;

  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsDateString({}, { message: "Fecha de recordatorio inválida" })
  reminderDate?: string;

  @IsOptional()
  @IsString()
  complexityNotes?: string;

  @IsOptional()
  @IsString()
  prerequisites?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedSolutionTime?: number;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @IsOptional()
  @IsBoolean()
  isDeprecated?: boolean;

  @IsOptional()
  @IsString()
  deprecationReason?: string;
}

export class NoteFiltersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsUUID("4", { message: "ID de usuario creador inválido" })
  createdBy?: string;

  @IsOptional()
  @IsUUID("4", { message: "ID de usuario asignado inválido" })
  assignedTo?: string;

  @IsOptional()
  @IsUUID("4", { message: "ID de caso inválido" })
  caseId?: string;

  @IsOptional()
  @IsString()
  @IsIn(["note", "solution", "guide", "faq", "template", "procedure"])
  noteType?: string;

  @IsOptional()
  @IsString()
  @IsIn(["low", "medium", "high", "urgent"])
  priority?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficultyLevel?: number;

  @IsOptional()
  @IsBoolean()
  isImportant?: boolean;

  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @IsOptional()
  @IsBoolean()
  isDeprecated?: boolean;

  @IsOptional()
  @IsBoolean()
  hasReminder?: boolean;

  @IsOptional()
  @IsDateString({}, { message: "Fecha desde inválida" })
  dateFrom?: string;

  @IsOptional()
  @IsDateString({}, { message: "Fecha hasta inválida" })
  dateTo?: string;
}

export class ArchiveNoteDto {
  @IsBoolean()
  isArchived: boolean;
}

// Response DTOs
export interface NoteResponseDto {
  id: string;
  title: string;
  content: string;
  noteType: string;
  priority: string;
  difficultyLevel: number;
  tags: string[];
  caseId?: string;
  createdBy: string;
  assignedTo?: string;
  isImportant: boolean;
  isTemplate: boolean;
  isPublished: boolean;
  isArchived: boolean;
  isDeprecated: boolean;
  deprecationReason?: string;
  archivedAt?: string;
  archivedBy?: string;
  reminderDate?: string;
  isReminderSent: boolean;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  version: number;
  complexityNotes?: string;
  prerequisites?: string;
  estimatedSolutionTime?: number;
  createdAt: string;
  updatedAt: string;
  // Relaciones pobladas
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

export interface NoteStatsDto {
  totalNotes: number;
  myNotes: number;
  assignedNotes: number;
  importantNotes: number;
  withReminders: number;
  archivedNotes: number;
  deprecatedNotes: number;
  templatesCount: number;
  publishedNotes: number;
  notesByType: {
    note: number;
    solution: number;
    guide: number;
    faq: number;
    template: number;
    procedure: number;
  };
  notesByPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  notesByDifficulty: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  totalViews: number;
  totalHelpful: number;
}

export interface NoteSearchResultDto {
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
