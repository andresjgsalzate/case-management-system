import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsEnum,
  IsHexColor,
  IsNotEmpty,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

// ============================================
// DTO para crear equipo
// ============================================

export class CreateTeamDto {
  @IsString({ message: "El nombre debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El nombre del equipo es requerido" })
  @Length(1, 100, { message: "El nombre debe tener entre 1 y 100 caracteres" })
  name!: string;

  @IsString({ message: "El código debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El código del equipo es requerido" })
  @Length(2, 10, { message: "El código debe tener entre 2 y 10 caracteres" })
  @Matches(/^[A-Z0-9_-]+$/, {
    message:
      "El código solo puede contener letras mayúsculas, números, guiones y guiones bajos",
  })
  code!: string;

  @IsOptional()
  @IsString({ message: "La descripción debe ser una cadena de texto" })
  @MaxLength(1000, {
    message: "La descripción no puede exceder 1000 caracteres",
  })
  description?: string;

  @IsOptional()
  @IsHexColor({
    message: "El color debe estar en formato hexadecimal válido (#RRGGBB)",
  })
  color?: string;

  @IsOptional()
  @IsUUID(4, { message: "El ID del manager debe ser un UUID válido" })
  managerId?: string;

  @IsOptional()
  @IsBoolean({ message: "isActive debe ser un valor booleano" })
  isActive?: boolean;
}

// ============================================
// DTO para actualizar equipo
// ============================================

export class UpdateTeamDto {
  @IsOptional()
  @IsString({ message: "El nombre debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El nombre del equipo no puede estar vacío" })
  @Length(1, 100, { message: "El nombre debe tener entre 1 y 100 caracteres" })
  name?: string;

  @IsOptional()
  @IsString({ message: "El código debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El código del equipo no puede estar vacío" })
  @Length(2, 10, { message: "El código debe tener entre 2 y 10 caracteres" })
  @Matches(/^[A-Z0-9_-]+$/, {
    message:
      "El código solo puede contener letras mayúsculas, números, guiones y guiones bajos",
  })
  code?: string;

  @IsOptional()
  @IsString({ message: "La descripción debe ser una cadena de texto" })
  @MaxLength(1000, {
    message: "La descripción no puede exceder 1000 caracteres",
  })
  description?: string;

  @IsOptional()
  @IsHexColor({
    message: "El color debe estar en formato hexadecimal válido (#RRGGBB)",
  })
  color?: string;

  @IsOptional()
  @IsUUID(4, { message: "El ID del manager debe ser un UUID válido" })
  managerId?: string;

  @IsOptional()
  @IsBoolean({ message: "isActive debe ser un valor booleano" })
  isActive?: boolean;
}

// ============================================
// DTO para agregar miembro al equipo
// ============================================

export class AddTeamMemberDto {
  @IsUUID(4, { message: "El ID del usuario debe ser un UUID válido" })
  userId!: string;

  @IsEnum(["manager", "lead", "senior", "member"], {
    message: "El rol debe ser uno de: manager, lead, senior, member",
  })
  role!: "manager" | "lead" | "senior" | "member";

  @IsOptional()
  @IsBoolean({ message: "isActive debe ser un valor booleano" })
  isActive?: boolean;
}

// ============================================
// DTO para actualizar miembro del equipo
// ============================================

export class UpdateTeamMemberDto {
  @IsOptional()
  @IsEnum(["manager", "lead", "senior", "member"], {
    message: "El rol debe ser uno de: manager, lead, senior, member",
  })
  role?: "manager" | "lead" | "senior" | "member";

  @IsOptional()
  @IsBoolean({ message: "isActive debe ser un valor booleano" })
  isActive?: boolean;
}

// ============================================
// DTO para búsqueda y filtros
// ============================================

export class TeamQueryDto {
  @IsOptional()
  @IsString({ message: "La búsqueda debe ser una cadena de texto" })
  @MinLength(1, { message: "La búsqueda debe tener al menos 1 caracter" })
  search?: string;

  @IsOptional()
  @IsBoolean({ message: "isActive debe ser un valor booleano" })
  isActive?: boolean;

  @IsOptional()
  @IsUUID(4, { message: "El ID del manager debe ser un UUID válido" })
  managerId?: string;

  @IsOptional()
  @IsString({ message: "El código debe ser una cadena de texto" })
  code?: string;

  @IsOptional()
  @IsString({ message: "El ordenamiento debe ser una cadena de texto" })
  @IsEnum(["name", "code", "createdAt", "updatedAt", "membersCount"], {
    message:
      "El ordenamiento debe ser uno de: name, code, createdAt, updatedAt, membersCount",
  })
  sortBy?: string;

  @IsOptional()
  @IsEnum(["ASC", "DESC"], {
    message: "La dirección debe ser ASC o DESC",
  })
  sortOrder?: "ASC" | "DESC";

  @IsOptional()
  @IsString({ message: "La página debe ser un número" })
  @Matches(/^\d+$/, { message: "La página debe ser un número entero positivo" })
  page?: string;

  @IsOptional()
  @IsString({ message: "El límite debe ser un número" })
  @Matches(/^\d+$/, { message: "El límite debe ser un número entero positivo" })
  limit?: string;
}

// ============================================
// DTO para búsqueda de miembros
// ============================================

export class TeamMemberQueryDto {
  @IsOptional()
  @IsUUID(4, { message: "El ID del equipo debe ser un UUID válido" })
  teamId?: string;

  @IsOptional()
  @IsUUID(4, { message: "El ID del usuario debe ser un UUID válido" })
  userId?: string;

  @IsOptional()
  @IsEnum(["manager", "lead", "senior", "member"], {
    message: "El rol debe ser uno de: manager, lead, senior, member",
  })
  role?: "manager" | "lead" | "senior" | "member";

  @IsOptional()
  @IsBoolean({ message: "isActive debe ser un valor booleano" })
  isActive?: boolean;

  @IsOptional()
  @IsString({ message: "La búsqueda debe ser una cadena de texto" })
  @MinLength(1, { message: "La búsqueda debe tener al menos 1 caracter" })
  search?: string;

  @IsOptional()
  @IsEnum(["joinedAt", "leftAt", "role", "user.fullName"], {
    message:
      "El ordenamiento debe ser uno de: joinedAt, leftAt, role, user.fullName",
  })
  sortBy?: string;

  @IsOptional()
  @IsEnum(["ASC", "DESC"], {
    message: "La dirección debe ser ASC o DESC",
  })
  sortOrder?: "ASC" | "DESC";
}

// ============================================
// DTO para transferir liderazgo del equipo
// ============================================

export class TransferTeamLeadershipDto {
  @IsUUID(4, { message: "El ID del nuevo manager debe ser un UUID válido" })
  newManagerId!: string;

  @IsOptional()
  @IsString({ message: "La razón debe ser una cadena de texto" })
  @MaxLength(500, { message: "La razón no puede exceder 500 caracteres" })
  reason?: string;
}

// ============================================
// DTO para operaciones en lote
// ============================================

export class BulkTeamMemberDto {
  @IsUUID(4, {
    each: true,
    message: "Todos los IDs de usuario deben ser UUIDs válidos",
  })
  userIds!: string[];

  @IsEnum(["manager", "lead", "senior", "member"], {
    message: "El rol debe ser uno de: manager, lead, senior, member",
  })
  role!: "manager" | "lead" | "senior" | "member";

  @IsOptional()
  @IsString({ message: "La razón debe ser una cadena de texto" })
  @MaxLength(500, { message: "La razón no puede exceder 500 caracteres" })
  reason?: string;
}

// ============================================
// DTO para reportes y estadísticas
// ============================================

export class TeamStatsQueryDto {
  @IsOptional()
  @IsUUID(4, { message: "El ID del equipo debe ser un UUID válido" })
  teamId?: string;

  @IsOptional()
  @IsString({ message: "El período debe ser una cadena de texto" })
  @IsEnum(["week", "month", "quarter", "year"], {
    message: "El período debe ser uno de: week, month, quarter, year",
  })
  period?: "week" | "month" | "quarter" | "year";

  @IsOptional()
  @IsBoolean({ message: "includeInactive debe ser un valor booleano" })
  includeInactive?: boolean;
}

// ============================================
// Tipos de respuesta (interfaces de lectura)
// ============================================

export interface TeamResponseDto {
  id: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  managerId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  memberCount?: number;
  manager?: {
    id: string;
    fullName?: string;
    email: string;
  };
  stats?: {
    totalMembers: number;
    activeMembers: number;
    membersByRole: {
      managers: number;
      leads: number;
      seniors: number;
      members: number;
    };
  };
}

export interface TeamMemberResponseDto {
  id: string;
  teamId: string;
  userId: string;
  role: "manager" | "lead" | "senior" | "member";
  isActive: boolean;
  joinedAt?: Date;
  leftAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    fullName?: string;
    email: string;
    isActive: boolean;
  };
  team?: {
    id: string;
    name: string;
    code: string;
    color?: string;
  };
  stats?: {
    isCurrentlyActive: boolean;
    membershipDurationDays: number;
    hasManagementRole: boolean;
    roleLevel: number;
  };
}

export interface TeamStatsResponseDto {
  teamId: string;
  teamName: string;
  teamCode: string;
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  membersByRole: {
    managers: number;
    leads: number;
    seniors: number;
    members: number;
  };
  averageMembershipDuration: number;
  recentJoins: number;
  recentLeaves: number;
  isActive: boolean;
}
