import { ApiResponse } from "../types/api";
import { Permission, Role, UserPermissionsResponse } from "../types/auth";
import { config } from "../config/config";
import { securityService } from "./security.service";

const API_BASE_URL = config.api.baseUrl;

class AuthPermissionService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Prioridad 1: Usar token del authStore (más rápido)
    const { useAuthStore } = await import("../stores/authStore");
    let token = useAuthStore.getState().token;

    // Prioridad 2: Si no hay token en authStore, usar SecurityService
    if (!token) {
      const tokens = securityService.getValidTokens();
      token = tokens?.token || null;
    }

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Obtiene todos los permisos del usuario actual
   */
  async getUserPermissions(): Promise<UserPermissionsResponse> {
    return this.makeRequest<UserPermissionsResponse>("/auth/permissions");
  }

  /**
   * Obtiene todos los roles disponibles (solo admin)
   */
  async getAllRoles(): Promise<ApiResponse<Role[]>> {
    return this.makeRequest<ApiResponse<Role[]>>("/roles");
  }

  /**
   * Obtiene todos los permisos disponibles (solo admin)
   */
  async getAllPermissions(): Promise<ApiResponse<Permission[]>> {
    return this.makeRequest<ApiResponse<Permission[]>>("/permissions");
  }

  /**
   * Obtiene los módulos disponibles basados en los permisos del usuario
   */
  async getUserModules(): Promise<ApiResponse<string[]>> {
    return this.makeRequest<ApiResponse<string[]>>("/auth/modules");
  }

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  async checkPermission(permission: string): Promise<ApiResponse<boolean>> {
    return this.makeRequest<ApiResponse<boolean>>(`/auth/check-permission`, {
      method: "POST",
      body: JSON.stringify({ permission }),
    });
  }

  /**
   * Verifica si el usuario puede acceder a un módulo
   */
  async checkModuleAccess(module: string): Promise<ApiResponse<boolean>> {
    return this.makeRequest<ApiResponse<boolean>>(`/auth/check-module`, {
      method: "POST",
      body: JSON.stringify({ module }),
    });
  }
}

export const authPermissionService = new AuthPermissionService();
