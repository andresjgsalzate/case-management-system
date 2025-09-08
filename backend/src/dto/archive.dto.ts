// =============================================
// DTOs PARA EL SISTEMA DE ARCHIVO
// =============================================

import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  IsDateString,
  IsObject,
} from "class-validator";

// DTO para crear casos archivados
export class CreateArchivedCaseDto {
  @IsUUID()
  originalCaseId: string;

  @IsString()
  caseNumber: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  status: string;

  @IsString()
  priority: string;

  @IsString()
  classification: string;

  @IsUUID()
  userId: string;

  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @IsUUID()
  createdByUserId: string;

  @IsDateString()
  originalCreatedAt: string;

  @IsDateString()
  originalUpdatedAt: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @IsOptional()
  @IsString()
  archiveReason?: string;

  @IsObject()
  originalData: any;

  @IsObject()
  controlData: any;

  @IsOptional()
  @IsNumber()
  totalTimeMinutes?: number;
}

// DTO para crear TODOs archivados
export class CreateArchivedTodoDto {
  @IsUUID()
  originalTodoId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  priority: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsDateString()
  originalCreatedAt: string;

  @IsDateString()
  originalUpdatedAt: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @IsUUID()
  createdByUserId: string;

  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @IsOptional()
  @IsUUID()
  caseId?: string;

  @IsOptional()
  @IsString()
  archiveReason?: string;

  @IsObject()
  originalData: any;

  @IsObject()
  controlData: any;

  @IsOptional()
  @IsNumber()
  totalTimeMinutes?: number;
}

// DTO para restaurar elementos archivados
export class RestoreArchivedItemDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

// DTO para eliminar permanentemente elementos archivados
export class DeleteArchivedItemDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

// DTO para estadísticas del archivo
export class ArchiveStatsDto {
  @IsNumber()
  totalArchivedCases: number;

  @IsNumber()
  totalArchivedTodos: number;

  @IsNumber()
  totalArchivedTimeMinutes: number;

  @IsNumber()
  archivedThisMonth: number;

  @IsNumber()
  restoredThisMonth: number;
}

// DTO para filtros de archivo
export class ArchiveFiltersDto {
  @IsOptional()
  @IsString()
  type?: "cases" | "todos" | "all";

  @IsOptional()
  @IsUUID()
  archivedBy?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  classification?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  showRestored?: boolean;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  offset?: number;
}

// DTO de respuesta para casos archivados
export class ArchivedCaseResponseDto {
  id: string;
  originalCaseId: string;
  caseNumber: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  classification: string;
  assignedTo?: string;
  createdBy?: string;
  originalCreatedAt: string;
  originalUpdatedAt?: string;
  archivedAt: string;
  archivedBy: string;
  archivedReason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;

  // Información de usuarios relacionados (opcional)
  assignedToUser?: {
    id: string;
    fullName?: string;
    email: string;
  };
  createdByUser?: {
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

// DTO de respuesta para TODOs archivados
export class ArchivedTodoResponseDto {
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
  timerTimeMinutes: number;
  manualTimeMinutes: number;
  createdAt: string;
  updatedAt: string;

  // Información de usuarios relacionados (opcional)
  createdByUser?: {
    id: string;
    fullName?: string;
    email: string;
  };
  assignedUser?: {
    id: string;
    fullName?: string;
    email: string;
  };
  archivedByUser?: {
    id: string;
    fullName?: string;
    email: string;
  };
  restoredByUser?: {
    id: string;
    fullName?: string;
    email: string;
  };
}

// DTO para elementos combinados del archivo
export class ArchivedItemResponseDto {
  id: string;
  itemType: "case" | "todo";
  originalId: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  archivedAt: string;
  archivedBy: string;
  archivedReason?: string;
  createdAt: string;
  updatedAt: string;
  isRestored: boolean;

  // Información detallada del tiempo
  totalTimeMinutes: number;
  timerTimeMinutes?: number;
  manualTimeMinutes?: number;

  // Campos específicos de casos
  caseNumber?: string;
  classification?: string;

  // Usuario que archivó
  archivedByUser?: {
    id: string;
    fullName?: string;
    email: string;
    displayName?: string;
  };
}

// DTO para estadísticas del archivo
export class ArchiveStatsResponseDto {
  @IsNumber()
  totalArchivedCases: number;

  @IsNumber()
  totalArchivedTodos: number;

  @IsNumber()
  totalArchivedTimeMinutes: number;

  @IsNumber()
  archivedThisMonth: number;

  @IsNumber()
  restoredThisMonth: number;
}
