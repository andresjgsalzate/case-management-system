import {
  Permission,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  PermissionFilterParams,
  PermissionListResponse,
  PermissionsByModule,
  ModulePermissionStructure,
  RolePermissionAssignment,
} from "../types/permission";

const API_BASE_URL = "http://localhost:3000/api";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

class PermissionService {
  private getToken(): string | null {
    return localStorage.getItem("token");
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Error desconocido" }));
      throw new Error(errorData.message || `Error ${response.status}`);
    }

    const data: ApiResponse<T> = await response.json();
    return data.data as T;
  }

  // Obtener lista de permisos con filtros
  async getPermissions(
    filters: PermissionFilterParams = {}
  ): Promise<PermissionListResponse> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const url = `/permissions${queryString ? `?${queryString}` : ""}`;

    return this.makeRequest<PermissionListResponse>(url);
  }

  // Obtener permiso por ID
  async getPermissionById(id: string): Promise<Permission> {
    return this.makeRequest<Permission>(`/permissions/${id}`);
  }

  // Crear nuevo permiso
  async createPermission(data: CreatePermissionRequest): Promise<Permission> {
    return this.makeRequest<Permission>("/permissions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Actualizar permiso
  async updatePermission(
    id: string,
    data: UpdatePermissionRequest
  ): Promise<Permission> {
    return this.makeRequest<Permission>(`/permissions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Eliminar permiso
  async deletePermission(id: string): Promise<void> {
    await this.makeRequest<void>(`/permissions/${id}`, {
      method: "DELETE",
    });
  }

  // Obtener permisos por módulo
  async getPermissionsByModule(module: string): Promise<Permission[]> {
    return this.makeRequest<Permission[]>(`/permissions/module/${module}`);
  }

  // Obtener estructura de módulos y permisos
  async getModulesStructure(): Promise<ModulePermissionStructure[]> {
    return this.makeRequest<ModulePermissionStructure[]>(
      "/permissions/structure"
    );
  }

  // Obtener permisos agrupados por módulo
  async getPermissionsGroupedByModule(): Promise<PermissionsByModule> {
    const response = await this.getPermissions({ limit: 1000 });
    const grouped: PermissionsByModule = {};

    response.permissions.forEach((permission) => {
      if (!grouped[permission.module]) {
        grouped[permission.module] = [];
      }
      grouped[permission.module].push(permission);
    });

    return grouped;
  }

  // Asignar permisos a un rol
  async assignPermissionsToRole(
    assignment: RolePermissionAssignment
  ): Promise<void> {
    await this.makeRequest<void>(`/roles/${assignment.roleId}/permissions`, {
      method: "POST",
      body: JSON.stringify({ permissionIds: assignment.permissionIds }),
    });
  }

  // Obtener módulos únicos
  async getUniqueModules(): Promise<string[]> {
    const response = await this.getPermissions({ limit: 1000 });
    const modules = [...new Set(response.permissions.map((p) => p.module))];
    return modules.sort();
  }

  // Obtener acciones únicas
  async getUniqueActions(): Promise<string[]> {
    const response = await this.getPermissions({ limit: 1000 });
    const actions = [...new Set(response.permissions.map((p) => p.action))];
    return actions.sort();
  }

  // Obtener scopes únicos
  async getUniqueScopes(): Promise<string[]> {
    return ["own", "team", "all"];
  }

  // Verificar si un permiso puede ser eliminado
  async canDeletePermission(id: string): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ canDelete: boolean }>(
        `/permissions/${id}/can-delete`
      );
      return response.canDelete;
    } catch {
      return false;
    }
  }

  // Buscar permisos con texto libre
  async searchPermissions(searchTerm: string): Promise<Permission[]> {
    const response = await this.getPermissions({
      search: searchTerm,
      limit: 100,
    });
    return response.permissions;
  }
}

// Exportar instancia singleton
export const permissionService = new PermissionService();

// Hook personalizado para gestión de permisos
export const usePermissionService = () => {
  return {
    getPermissions: permissionService.getPermissions.bind(permissionService),
    getPermissionById:
      permissionService.getPermissionById.bind(permissionService),
    createPermission:
      permissionService.createPermission.bind(permissionService),
    updatePermission:
      permissionService.updatePermission.bind(permissionService),
    deletePermission:
      permissionService.deletePermission.bind(permissionService),
    getPermissionsByModule:
      permissionService.getPermissionsByModule.bind(permissionService),
    getModulesStructure:
      permissionService.getModulesStructure.bind(permissionService),
    getPermissionsGroupedByModule:
      permissionService.getPermissionsGroupedByModule.bind(permissionService),
    assignPermissionsToRole:
      permissionService.assignPermissionsToRole.bind(permissionService),
    getUniqueModules:
      permissionService.getUniqueModules.bind(permissionService),
    getUniqueActions:
      permissionService.getUniqueActions.bind(permissionService),
    getUniqueScopes: permissionService.getUniqueScopes.bind(permissionService),
    canDeletePermission:
      permissionService.canDeletePermission.bind(permissionService),
    searchPermissions:
      permissionService.searchPermissions.bind(permissionService),
  };
};
