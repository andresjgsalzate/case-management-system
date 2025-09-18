import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsObject,
  IsUUID,
  IsEnum,
  Min,
  Max,
  MaxLength,
} from "class-validator";
import { Transform } from "class-transformer";
import { KnowledgeDocument } from "../entities/KnowledgeDocument";

export enum Priority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export class CreateKnowledgeDocumentDto {
  @IsString()
  @MaxLength(500)
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsObject()
  jsonContent: object; // Contenido BlockNote

  @IsOptional()
  @IsUUID()
  documentTypeId?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority = Priority.MEDIUM;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  difficultyLevel?: number = 1;

  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean = false;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[] = [];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  associatedCases?: string[] = [];
}

export class UpdateKnowledgeDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsObject()
  jsonContent?: object;

  @IsOptional()
  @IsUUID()
  documentTypeId?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  difficultyLevel?: number;

  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  associatedCases?: string[];

  @IsOptional()
  @IsString()
  changeSummary?: string; // Para crear nueva versión
}

export class PublishKnowledgeDocumentDto {
  @IsBoolean()
  isPublished: boolean;

  @IsOptional()
  @IsString()
  changeSummary?: string;
}

export class ArchiveKnowledgeDocumentDto {
  @IsBoolean()
  isArchived: boolean;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsUUID()
  replacementDocumentId?: string;
}

export class KnowledgeDocumentQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  documentTypeId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  caseNumber?: string; // Nuevo: búsqueda por número de caso

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  difficultyLevel?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true")
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true")
  isTemplate?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true")
  isArchived?: boolean;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = "createdAt";

  @IsOptional()
  @IsString()
  sortOrder?: "ASC" | "DESC" = "DESC";

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true")
  includeStats?: boolean = false; // Nuevo: incluir estadísticas de búsqueda
}

// Nuevo DTO para sugerencias de búsqueda
export class SearchSuggestionsDto {
  @IsString()
  @MaxLength(100)
  search: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  @Max(10)
  limit?: number = 5;
}

// Nuevo DTO para respuesta de búsqueda mejorada
export class EnhancedSearchResponseDto {
  documents: KnowledgeDocument[];
  total: number;
  page: number;
  totalPages: number;
  searchStats?: {
    foundInTitle: number;
    foundInContent: number;
    foundInTags: number;
    foundInCases: number;
  };
  suggestions?: {
    documents: Array<{ id: string; title: string; type: "document" }>;
    tags: Array<{ name: string; type: "tag" }>;
    cases: Array<{ id: string; caseNumber: string; type: "case" }>;
  };
}
