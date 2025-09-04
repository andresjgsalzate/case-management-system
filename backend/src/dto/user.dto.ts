import {
  IsEmail,
  IsOptional,
  IsString,
  IsBoolean,
  IsUUID,
  MinLength,
  IsEnum,
} from "class-validator";

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2, {
    message: "El nombre completo debe tener al menos 2 caracteres",
  })
  fullName!: string;

  @IsString()
  @MinLength(8, { message: "La contraseña debe tener al menos 8 caracteres" })
  password!: string;

  @IsOptional()
  @IsUUID("4", { message: "ID de rol debe ser un UUID válido" })
  roleId?: string;

  @IsOptional()
  @IsString()
  roleName?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, {
    message: "El nombre completo debe tener al menos 2 caracteres",
  })
  fullName?: string;

  @IsOptional()
  @IsUUID("4", { message: "ID de rol debe ser un UUID válido" })
  roleId?: string;

  @IsOptional()
  @IsString()
  roleName?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(8, {
    message: "La contraseña actual debe tener al menos 8 caracteres",
  })
  currentPassword!: string;

  @IsString()
  @MinLength(8, {
    message: "La nueva contraseña debe tener al menos 8 caracteres",
  })
  newPassword!: string;
}

export class UpdatePasswordDto {
  @IsString()
  @MinLength(8, {
    message: "La nueva contraseña debe tener al menos 8 caracteres",
  })
  newPassword!: string;
}

export class UserFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID("4")
  roleId?: string;

  @IsOptional()
  @IsString()
  roleName?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  sortBy?: "createdAt" | "fullName" | "email" | "lastLoginAt";

  @IsOptional()
  @IsEnum(["ASC", "DESC"])
  sortOrder?: "ASC" | "DESC";

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}

export class UserResponseDto {
  id!: string;
  email!: string;
  fullName!: string;
  roleId?: string;
  roleName!: string;
  isActive!: boolean;
  lastLoginAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;
  role?: {
    id: string;
    name: string;
    description?: string;
  };
}

export class UserListResponseDto {
  users!: UserResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
  totalPages!: number;
}
