import {
  IsString,
  IsOptional,
  IsBoolean,
  Length,
  IsArray,
  IsUUID,
} from "class-validator";

export class CreateRoleRequest {
  @IsString({ message: "El nombre es requerido" })
  @Length(2, 50, { message: "El nombre debe tener entre 2 y 50 caracteres" })
  name: string;

  @IsOptional()
  @IsString({ message: "La descripción debe ser un texto" })
  @Length(0, 255, { message: "La descripción no puede exceder 255 caracteres" })
  description?: string;

  @IsOptional()
  @IsBoolean({ message: "El estado activo debe ser verdadero o falso" })
  isActive?: boolean = true;

  @IsOptional()
  @IsArray({ message: "Los permisos deben ser un array" })
  @IsUUID("all", {
    each: true,
    message: "Cada permiso debe ser un UUID válido",
  })
  permissionIds?: string[];
}

export class UpdateRoleRequest {
  @IsOptional()
  @IsString({ message: "El nombre debe ser un texto" })
  @Length(2, 50, { message: "El nombre debe tener entre 2 y 50 caracteres" })
  name?: string;

  @IsOptional()
  @IsString({ message: "La descripción debe ser un texto" })
  @Length(0, 255, { message: "La descripción no puede exceder 255 caracteres" })
  description?: string;

  @IsOptional()
  @IsBoolean({ message: "El estado activo debe ser verdadero o falso" })
  isActive?: boolean;

  @IsOptional()
  @IsArray({ message: "Los permisos deben ser un array" })
  @IsUUID("all", {
    each: true,
    message: "Cada permiso debe ser un UUID válido",
  })
  permissionIds?: string[];
}

export class RoleFilterParams {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  sortBy?: "createdAt" | "name" | "updatedAt";

  @IsOptional()
  @IsString()
  sortOrder?: "ASC" | "DESC";

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 10;
}

export class AssignPermissionsRequest {
  @IsArray({ message: "Los permisos deben ser un array" })
  @IsUUID("all", {
    each: true,
    message: "Cada permiso debe ser un UUID válido",
  })
  permissionIds: string[];
}
