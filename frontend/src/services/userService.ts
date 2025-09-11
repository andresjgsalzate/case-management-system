import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  UpdatePasswordRequest,
  UserFilterParams,
  UserListResponse,
  Role,
} from "../types/user";
import { config } from "../config/config";

const API_BASE_URL = config.api.baseUrl;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

class UserService {
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

  // Obtener lista de usuarios con filtros
  async getUsers(params?: UserFilterParams): Promise<UserListResponse> {
    const searchParams = new URLSearchParams();

    if (params?.search) searchParams.append("search", params.search);
    if (params?.roleId) searchParams.append("roleId", params.roleId);
    if (params?.roleName) searchParams.append("roleName", params.roleName);
    if (params?.isActive !== undefined)
      searchParams.append("isActive", params.isActive.toString());
    if (params?.sortBy) searchParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.append("sortOrder", params.sortOrder);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const queryString = searchParams.toString();
    const url = queryString ? `/users?${queryString}` : "/users";

    return this.makeRequest<UserListResponse>(url);
  }

  // Obtener usuario por ID
  async getUserById(id: string): Promise<User> {
    return this.makeRequest<User>(`/users/${id}`);
  }

  // Crear nuevo usuario
  async createUser(userData: CreateUserRequest): Promise<User> {
    return this.makeRequest<User>("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  // Actualizar usuario
  async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    return this.makeRequest<User>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  // Eliminar usuario
  async deleteUser(id: string): Promise<void> {
    await this.makeRequest<void>(`/users/${id}`, {
      method: "DELETE",
    });
  }

  // Cambiar contraseña (usuario autenticado)
  async changePassword(
    id: string,
    passwordData: ChangePasswordRequest
  ): Promise<void> {
    await this.makeRequest<void>(`/users/${id}/change-password`, {
      method: "PUT",
      body: JSON.stringify(passwordData),
    });
  }

  // Actualizar contraseña (admin)
  async updatePassword(
    id: string,
    passwordData: UpdatePasswordRequest
  ): Promise<void> {
    await this.makeRequest<void>(`/users/${id}/update-password`, {
      method: "PUT",
      body: JSON.stringify(passwordData),
    });
  }

  // Cambiar estado del usuario
  async toggleUserStatus(id: string): Promise<User> {
    return this.makeRequest<User>(`/users/${id}/toggle-status`, {
      method: "PATCH",
    });
  }

  // Obtener roles disponibles
  async getRoles(): Promise<Role[]> {
    const response = await this.makeRequest<{
      roles: Role[];
      total: number;
      page: number;
      limit: number;
    }>("/roles");
    return response.roles;
  }
}

// Exportar instancia singleton
export const userService = new UserService();

// Hook personalizado para gestión de usuarios
export const useUserService = () => {
  return {
    getUsers: userService.getUsers.bind(userService),
    getUserById: userService.getUserById.bind(userService),
    createUser: userService.createUser.bind(userService),
    updateUser: userService.updateUser.bind(userService),
    deleteUser: userService.deleteUser.bind(userService),
    changePassword: userService.changePassword.bind(userService),
    updatePassword: userService.updatePassword.bind(userService),
    toggleUserStatus: userService.toggleUserStatus.bind(userService),
    getRoles: userService.getRoles.bind(userService),
  };
};
