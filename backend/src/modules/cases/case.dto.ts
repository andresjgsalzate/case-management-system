import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";
import { ClasificacionCase, EstadoCase } from "../../entities/Case";

export class CreateCaseDto {
  @IsString()
  @MinLength(1, { message: "El número de caso es requerido" })
  @MaxLength(50, {
    message: "El número de caso no puede exceder 50 caracteres",
  })
  numeroCaso!: string;

  @IsString()
  @MinLength(1, { message: "La descripción es requerida" })
  @MaxLength(500, { message: "La descripción no puede exceder 500 caracteres" })
  descripcion!: string;

  @IsDateString()
  fecha!: string;

  @IsInt()
  @Min(1, { message: "Debe seleccionar una opción" })
  @Max(3, { message: "Valor inválido" })
  historialCaso!: number;

  @IsInt()
  @Min(1, { message: "Debe seleccionar una opción" })
  @Max(3, { message: "Valor inválido" })
  conocimientoModulo!: number;

  @IsInt()
  @Min(1, { message: "Debe seleccionar una opción" })
  @Max(3, { message: "Valor inválido" })
  manipulacionDatos!: number;

  @IsInt()
  @Min(1, { message: "Debe seleccionar una opción" })
  @Max(3, { message: "Valor inválido" })
  claridadDescripcion!: number;

  @IsInt()
  @Min(1, { message: "Debe seleccionar una opción" })
  @Max(3, { message: "Valor inválido" })
  causaFallo!: number;

  @IsOptional()
  @IsUUID()
  originId?: string;

  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message: "Las observaciones no pueden exceder 1000 caracteres",
  })
  observaciones?: string;
}

export class UpdateCaseDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: "El número de caso es requerido" })
  @MaxLength(50, {
    message: "El número de caso no puede exceder 50 caracteres",
  })
  numeroCaso?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: "La descripción es requerida" })
  @MaxLength(500, { message: "La descripción no puede exceder 500 caracteres" })
  descripcion?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  historialCaso?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  conocimientoModulo?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  manipulacionDatos?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  claridadDescripcion?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  causaFallo?: number;

  @IsOptional()
  @IsUUID()
  originId?: string;

  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string;

  @IsOptional()
  @IsEnum(EstadoCase)
  estado?: EstadoCase;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}

export class CaseFiltersDto {
  @IsOptional()
  @IsString()
  fecha?: string;

  @IsOptional()
  @IsEnum(ClasificacionCase)
  clasificacion?: ClasificacionCase;

  @IsOptional()
  @IsUUID()
  originId?: string;

  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @IsOptional()
  @IsString()
  busqueda?: string;

  @IsOptional()
  @IsEnum(EstadoCase)
  estado?: EstadoCase;
}

export interface CaseResponse {
  id: string;
  numeroCaso: string;
  descripcion: string;
  fecha: string;
  historialCaso: number;
  conocimientoModulo: number;
  manipulacionDatos: number;
  claridadDescripcion: number;
  causaFallo: number;
  puntuacion: number;
  clasificacion: ClasificacionCase;
  estado: EstadoCase;
  observaciones?: string;
  originId?: string;
  applicationId?: string;
  userId?: string;
  assignedToId?: string;
  createdAt: string;
  updatedAt: string;
  // Relaciones populadas
  origin?: {
    id: string;
    nombre: string;
    descripcion?: string;
  };
  application?: {
    id: string;
    nombre: string;
    descripcion?: string;
  };
  user?: {
    id: string;
    email: string;
    fullName?: string;
  };
  assignedTo?: {
    id: string;
    email: string;
    fullName?: string;
  };
}
