import { useAuthStore } from "../stores/authStore";

interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: string;
  scope: "own" | "team" | "all";
  isActive: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

interface PermissionResponse {
  success: boolean;
  data: Permission[];
  total: number;
}

interface RoleResponse {
  success: boolean;
  data: Role[];
  total: number;
}

interface RolePermissionsResponse {
  success: boolean;
  role: Role;
  permissions: Permission[];
  permissionsByModule: Record<string, Permission[]>;
}

const API_BASE_URL = "http://localhost:3000/api";

class PermissionService {
  private baseUrl = API_BASE_URL;

  // Obtener el token del localStorage
  private getAuthToken(): string | null {
    return localStorage.getItem("token");
  }

  // Obtener headers de autenticación
  private getAuthHeaders() {
    const token = this.getAuthToken();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Obtener usuario actual del localStorage
  private getCurrentUserFromStorage() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  // Obtener todos los permisos
  async getAllPermissions(): Promise<PermissionResponse> {
    const response = await fetch(`${API_BASE_URL}/permissions`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Error fetching permissions: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: data.success,
      data: data.data || [],
      total: data.data?.length || 0,
    };
  }

  // Obtener permisos por módulo
  async getPermissionsByModule(module: string): Promise<PermissionResponse> {
    const response = await fetch(
      `${API_BASE_URL}/permissions/module/${module}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Error fetching permissions for module ${module}: ${response.status}`
      );
    }

    const data = await response.json();
    return {
      success: data.success,
      data: data.data || [],
      total: data.data?.length || 0,
    };
  }

  // Obtener todos los roles
  async getAllRoles(): Promise<RoleResponse> {
    const response = await fetch(`${API_BASE_URL}/roles`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Error fetching roles: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: data.success,
      data: data.data || [],
      total: data.data?.length || 0,
    };
  }

  // Obtener permisos de un rol específico
  async getRolePermissions(roleId: string): Promise<RolePermissionsResponse> {
    // Usar endpoint de testing para obtener permisos del rol
    const response = await fetch(
      `${API_BASE_URL}/test/roles/${roleId}/permissions`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching role permissions: ${response.status}`);
    }

    return await response.json();
  }

  // Verificar si el usuario actual tiene un permiso específico
  async hasPermission(permissionName: string): Promise<boolean> {
    try {
      // Verificar si hay un usuario autenticado
      const user = this.getCurrentUserFromStorage();
      if (!user) return false;

      // Obtener permisos desde el store dinámico en lugar de verificación hardcodeada
      // El sistema ahora es completamente dinámico y usa el authStore
      return useAuthStore.getState().hasPermission(permissionName);

      // TODO: Implementar verificación real con el backend
      // Hacer petición al endpoint de verificación de permisos
      const response = await fetch(`${this.baseUrl}/auth/verify-permission`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({ permission: permissionName }),
      });

      if (!response.ok) {
        console.warn(
          `Error verificando permiso ${permissionName}:`,
          response.statusText
        );
        return false;
      }

      const result = await response.json();
      return result.success && result.data?.hasPermission === true;
    } catch (error) {
      console.error("Error verificando permiso:", error);
      return false;
    }
  }

  // Verificar múltiples permisos
  async hasPermissions(
    permissionNames: string[]
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const permissionName of permissionNames) {
      results[permissionName] = await this.hasPermission(permissionName);
    }

    return results;
  }

  // Obtener módulos disponibles basados en permisos
  async getAvailableModules(): Promise<string[]> {
    try {
      const permissions = await this.getAllPermissions();
      const modules = new Set(permissions.data.map((p) => p.module));
      return Array.from(modules);
    } catch (error) {
      console.error("Error getting available modules:", error);
      return [];
    }
  }

  // Verificar si el usuario puede acceder a un módulo
  async canAccessModule(module: string): Promise<boolean> {
    try {
      const user = this.getCurrentUserFromStorage();
      if (!user) return false;

      // Usar el store dinámico en lugar de verificación hardcodeada
      return useAuthStore.getState().canAccessModule(module);
    } catch (error) {
      console.error(`Error checking module access for ${module}:`, error);
      return false;
    }
  }
}

export const permissionService = new PermissionService();
export type {
  Permission,
  Role,
  PermissionResponse,
  RoleResponse,
  RolePermissionsResponse,
};
