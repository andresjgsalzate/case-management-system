// Tipos para el sistema de equipos

export interface Team {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  manager?: {
    id: string;
    fullName: string;
    email: string;
  };
  members?: TeamMember[];
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

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: TeamRole;
  joinedAt: string;
  leftAt?: string;
  isActive: boolean;
  user: {
    id: string;
    fullName: string;
    email: string;
    // Rol del SISTEMA (no de equipo)
    role?: {
      id: string;
      name: string; // "Administrador", "Analista de Aplicaciones", "Usuario"
    };
  };
}

// Roles dentro del EQUIPO (diferentes de los roles del sistema)
export enum TeamRole {
  MANAGER = "manager",
  LEAD = "lead",
  SENIOR = "senior",
  MEMBER = "member",
}

export interface CreateTeamData {
  name: string;
  code: string;
  description: string;
  color: string;
  managerId?: string;
}

export interface UpdateTeamData extends Partial<CreateTeamData> {}

export interface AddTeamMemberData {
  userId: string;
  role: TeamRole;
}

export interface UpdateTeamMemberData {
  role: TeamRole;
}

export interface TeamQueryParams {
  search?: string;
  isActive?: boolean;
  hasMembers?: boolean;
  page?: number;
  limit?: number;
}

export interface TeamsResponse {
  success: boolean;
  data: Team[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message: string;
}

export interface TeamStatsResponse {
  success: boolean;
  data: {
    totalMembers: number;
    activeMembers: number;
    roleDistribution: {
      [key in TeamRole]: number;
    };
    averageTeamSize: number;
    recentActivity: Array<{
      action: string;
      user: string;
      timestamp: string;
    }>;
  };
}
