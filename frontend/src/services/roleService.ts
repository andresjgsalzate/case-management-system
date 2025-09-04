import {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  RoleFilterParams,
  RoleListResponse,
  AssignPermissionsRequest,
  Permission,
  RoleStats,
  CloneRoleRequest,
} from "../types/role";

class RoleService {
  private baseUrl = "/api/roles";

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem("token");

    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.data || data;
  }

  // Obtener lista de roles con filtros
  async getRoles(params?: RoleFilterParams): Promise<RoleListResponse> {
    const searchParams = new URLSearchParams();

    if (params?.search) searchParams.append("search", params.search);
    if (params?.isActive !== undefined)
      searchParams.append("isActive", params.isActive.toString());
    if (params?.sortBy) searchParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.append("sortOrder", params.sortOrder);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `?${queryString}` : "";

    return this.makeRequest<RoleListResponse>(endpoint);
  }

  // Obtener rol por ID
  async getRoleById(id: string): Promise<Role> {
    return this.makeRequest<Role>(`/${id}`);
  }

  // Crear nuevo rol
  async createRole(roleData: CreateRoleRequest): Promise<Role> {
    return this.makeRequest<Role>("", {
      method: "POST",
      body: JSON.stringify(roleData),
    });
  }

  // Actualizar rol
  async updateRole(id: string, roleData: UpdateRoleRequest): Promise<Role> {
    return this.makeRequest<Role>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(roleData),
    });
  }

  // Eliminar rol
  async deleteRole(id: string): Promise<void> {
    await this.makeRequest<void>(`/${id}`, {
      method: "DELETE",
    });
  }

  // Clonar rol
  async cloneRole(id: string, cloneData: CloneRoleRequest): Promise<Role> {
    return this.makeRequest<Role>(`/${id}/clone`, {
      method: "POST",
      body: JSON.stringify(cloneData),
    });
  }

  // Obtener permisos de un rol específico
  async getRolePermissions(id: string): Promise<{ data: Permission[] }> {
    return this.makeRequest<{ data: Permission[] }>(`/${id}/permissions`);
  }

  // Asignar permisos a un rol
  async assignPermissions(
    id: string,
    permissionsData: AssignPermissionsRequest
  ): Promise<Role> {
    return this.makeRequest<Role>(`/${id}/permissions`, {
      method: "PUT",
      body: JSON.stringify(permissionsData),
    });
  }

  // Obtener permisos disponibles
  async getAvailablePermissions(): Promise<Permission[]> {
    return this.makeRequest<Permission[]>("/permissions");
  }

  // Obtener estadísticas de roles
  async getRoleStats(): Promise<RoleStats> {
    return this.makeRequest<RoleStats>("/stats");
  }

  // Buscar roles con filtros avanzados
  async searchRoles(params: RoleFilterParams): Promise<RoleListResponse> {
    return this.makeRequest<RoleListResponse>("/search", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }
}

// Exportar instancia singleton
export const roleService = new RoleService();

// Hook personalizado para gestión de roles
export const useRoleService = () => {
  return {
    getRoles: roleService.getRoles.bind(roleService),
    getRoleById: roleService.getRoleById.bind(roleService),
    createRole: roleService.createRole.bind(roleService),
    updateRole: roleService.updateRole.bind(roleService),
    deleteRole: roleService.deleteRole.bind(roleService),
    cloneRole: roleService.cloneRole.bind(roleService),
    getRolePermissions: roleService.getRolePermissions.bind(roleService),
    assignPermissions: roleService.assignPermissions.bind(roleService),
    getAvailablePermissions:
      roleService.getAvailablePermissions.bind(roleService),
    getRoleStats: roleService.getRoleStats.bind(roleService),
    searchRoles: roleService.searchRoles.bind(roleService),
  };
};
