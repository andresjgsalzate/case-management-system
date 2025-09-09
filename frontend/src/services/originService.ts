import type { ApiResponse } from "../types/api";

export interface Origin {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOriginData {
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export interface UpdateOriginData {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

export interface OriginFilters {
  search?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface PaginatedResponse<T> {
  origins: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OriginStats {
  totalOrigins: number;
  activeOrigins: number;
  inactiveOrigins: number;
  casesCount: number;
  recentlyCreated: number;
}

export class OriginService {
  private baseUrl = "/api/origins";

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem("token");

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
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      console.error("API request failed:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Obtener todos los orígenes con filtros
   */
  async getAllOrigins(
    filters: OriginFilters = {}
  ): Promise<ApiResponse<PaginatedResponse<Origin>>> {
    const params = new URLSearchParams();

    if (filters.search) params.append("search", filters.search);
    if (filters.activo !== undefined)
      params.append("activo", String(filters.activo));
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

    const queryString = params.toString();
    const endpoint = queryString ? `?${queryString}` : "";

    return this.makeRequest<PaginatedResponse<Origin>>(endpoint);
  }

  /**
   * Buscar orígenes con filtros avanzados
   */
  async searchOrigins(
    filters: OriginFilters
  ): Promise<ApiResponse<PaginatedResponse<Origin>>> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    return this.makeRequest<PaginatedResponse<Origin>>(
      `/search?${params.toString()}`
    );
  }

  /**
   * Obtener estadísticas de orígenes
   */
  async getOriginStats(): Promise<ApiResponse<OriginStats>> {
    return this.makeRequest<OriginStats>("/stats");
  }

  /**
   * Obtener origen por ID
   */
  async getOriginById(id: number): Promise<ApiResponse<Origin>> {
    return this.makeRequest<Origin>(`/${id}`);
  }

  /**
   * Crear nuevo origen
   */
  async createOrigin(data: CreateOriginData): Promise<ApiResponse<Origin>> {
    return this.makeRequest<Origin>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Actualizar origen
   */
  async updateOrigin(
    id: number,
    data: UpdateOriginData
  ): Promise<ApiResponse<Origin>> {
    return this.makeRequest<Origin>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * Eliminar origen
   */
  async deleteOrigin(id: number): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`/${id}`, {
      method: "DELETE",
    });
  }

  /**
   * Verificar si se puede eliminar un origen
   */
  async checkCanDeleteOrigin(
    id: number
  ): Promise<
    ApiResponse<{ canDelete: boolean; reason?: string; casesCount?: number }>
  > {
    return this.makeRequest<{
      canDelete: boolean;
      reason?: string;
      casesCount?: number;
    }>(`/${id}/can-delete`);
  }
}

// Instancia singleton del servicio
export const originService = new OriginService();
