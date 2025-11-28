import type { ApiResponse } from "../types/api";
import { securityService } from "./security.service";
import {
  Team,
  CreateTeamData,
  UpdateTeamData,
  TeamQueryParams,
  TeamMember,
  AddTeamMemberData,
  UpdateTeamMemberData,
  TeamStatsResponse,
} from "../types/teams";

export class TeamsService {
  private baseUrl = "/api/teams";

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const tokens = securityService.getValidTokens();
    const token = tokens?.token;

    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      let data;

      try {
        data = await response.json();
      } catch (jsonError) {
        data = {
          message: `Error en el servidor: ${response.status} ${response.statusText}`,
        };
      }

      if (!response.ok) {
        // Extraer el mensaje de error específico del servidor
        const errorMessage =
          data.message ||
          data.error ||
          data.details ||
          `HTTP error! status: ${response.status}`;

        console.error("Teams API error response:", {
          status: response.status,
          statusText: response.statusText,
          data,
          endpoint: `${this.baseUrl}${endpoint}`,
        });

        throw new Error(errorMessage);
      }

      return {
        success: true,
        data: data as T,
        message: data.message,
      };
    } catch (error) {
      console.error("Teams API request failed:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  // Gestión de equipos
  async getTeams(params?: TeamQueryParams): Promise<Team[]> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    const endpoint = queryString ? `?${queryString}` : "";

    const response = await this.makeRequest<{
      message: string;
      data: Team[];
      pagination: any;
    }>(endpoint);
    if (!response.success) {
      throw new Error(response.message || "Failed to fetch teams");
    }
    // La respuesta del backend tiene: {message, data: [teams], pagination}
    // makeRequest ahora devuelve todo el objeto, extraemos el array de teams
    return (response.data as any)?.data || [];
  }

  async getTeamById(id: string): Promise<Team> {
    const response = await this.makeRequest<Team>(`/${id}`);
    if (!response.success) {
      throw new Error(response.message || "Failed to fetch team");
    }
    return response.data!;
  }

  async createTeam(teamData: CreateTeamData): Promise<Team> {
    const response = await this.makeRequest<Team>("", {
      method: "POST",
      body: JSON.stringify(teamData),
    });
    if (!response.success) {
      throw new Error(response.message || "Failed to create team");
    }
    return response.data!;
  }

  async updateTeam(id: string, teamData: UpdateTeamData): Promise<Team> {
    const response = await this.makeRequest<Team>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(teamData),
    });
    if (!response.success) {
      throw new Error(response.message || "Failed to update team");
    }
    return response.data!;
  }

  async deleteTeam(id: string): Promise<void> {
    const response = await this.makeRequest<void>(`/${id}`, {
      method: "DELETE",
    });
    if (!response.success) {
      throw new Error(response.message || "Failed to delete team");
    }
  }

  async toggleTeamStatus(id: string): Promise<Team> {
    const response = await this.makeRequest<Team>(`/${id}/toggle-status`, {
      method: "PATCH",
    });
    if (!response.success) {
      throw new Error(response.message || "Failed to toggle team status");
    }
    return response.data!;
  }

  // Gestión de miembros
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const response = await this.makeRequest<{
      message: string;
      data: TeamMember[];
      count: number;
    }>(`/${teamId}/members`);
    if (!response.success) {
      throw new Error(response.message || "Failed to fetch team members");
    }
    // La respuesta del backend tiene: {message, data: [members], count}
    // makeRequest ahora devuelve todo el objeto, extraemos el array de members
    return (response.data as any)?.data || [];
  }

  async addTeamMember(
    teamId: string,
    memberData: AddTeamMemberData
  ): Promise<TeamMember> {
    const response = await this.makeRequest<TeamMember>(`/${teamId}/members`, {
      method: "POST",
      body: JSON.stringify(memberData),
    });
    if (!response.success) {
      throw new Error(response.message || "Failed to add team member");
    }
    return response.data!;
  }

  async addBulkMembers(
    teamId: string,
    data: { userIds: string[]; role: string }
  ): Promise<TeamMember[]> {
    const response = await this.makeRequest<TeamMember[]>(
      `/${teamId}/bulk-members`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    if (!response.success) {
      throw new Error(response.message || "Failed to add bulk members");
    }
    return response.data!;
  }

  async updateTeamMember(
    teamId: string,
    userId: string,
    memberData: UpdateTeamMemberData
  ): Promise<TeamMember> {
    const response = await this.makeRequest<TeamMember>(
      `/${teamId}/members/${userId}`,
      {
        method: "PUT",
        body: JSON.stringify(memberData),
      }
    );
    if (!response.success) {
      throw new Error(response.message || "Failed to update team member");
    }
    return response.data!;
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    const response = await this.makeRequest<void>(
      `/${teamId}/members/${userId}`,
      {
        method: "DELETE",
      }
    );
    if (!response.success) {
      throw new Error(response.message || "Failed to remove team member");
    }
  }

  async updateMemberRole(
    teamId: string,
    userId: string,
    role: string
  ): Promise<TeamMember> {
    const response = await this.makeRequest<TeamMember>(
      `/${teamId}/members/${userId}/role`,
      {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }
    );
    if (!response.success) {
      throw new Error(response.message || "Failed to update member role");
    }
    return response.data!;
  }

  // Operaciones especiales
  async getMyTeams(): Promise<Team[]> {
    const response = await this.makeRequest<Team[]>("/my-teams");
    if (!response.success) {
      throw new Error(response.message || "Failed to fetch my teams");
    }
    return response.data!;
  }

  async transferLeadership(
    teamId: string,
    newManagerId: string
  ): Promise<Team> {
    const response = await this.makeRequest<Team>(
      `/${teamId}/transfer-leadership`,
      {
        method: "POST",
        body: JSON.stringify({ newManagerId }),
      }
    );
    if (!response.success) {
      throw new Error(response.message || "Failed to transfer leadership");
    }
    return response.data!;
  }

  async checkUserMembership(
    teamId: string,
    userId: string
  ): Promise<{ isMember: boolean; role?: string }> {
    const response = await this.makeRequest<{
      isMember: boolean;
      role?: string;
    }>(`/${teamId}/members/${userId}/check`);
    if (!response.success) {
      throw new Error(response.message || "Failed to check user membership");
    }
    return response.data!;
  }

  // Estadísticas
  async getTeamsOverview(): Promise<TeamStatsResponse> {
    const response = await this.makeRequest<TeamStatsResponse>(
      "/stats/overview"
    );
    if (!response.success) {
      throw new Error(response.message || "Failed to fetch teams overview");
    }
    return response.data!;
  }

  async getTeamStats(teamId: string): Promise<TeamStatsResponse> {
    const response = await this.makeRequest<TeamStatsResponse>(
      `/${teamId}/stats`
    );
    if (!response.success) {
      throw new Error(response.message || "Failed to fetch team stats");
    }
    return response.data!;
  }
}

// Exportamos una instancia singleton
export const teamsApi = new TeamsService();
