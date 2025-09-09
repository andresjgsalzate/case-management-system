import type { ApiResponse } from "../types/api";

export interface Application {
  id: number;
  nombre: string;
  descripcion?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationData {
  nombre: string;
  descripcion?: string;
  isActive?: boolean;
}

export interface UpdateApplicationData {
  nombre?: string;
  descripcion?: string;
  isActive?: boolean;
}

export interface ApplicationFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface ApplicationStats {
  total: number;
  active: number;
  inactive: number;
  totalApplications: number;
  activeApplications: number;
  inactiveApplications: number;
  casesCount: number;
  recentlyCreated: number;
}

export class ApplicationService {
  private baseUrl = "/api/applications";

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
      return {
        success: response.ok,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error desconocido",
        errors: [error instanceof Error ? error.message : "Error desconocido"],
      };
    }
  }

  async getAllApplications(filters: ApplicationFilters = {}): Promise<
    ApiResponse<{
      applications: Application[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });
    return this.makeRequest(`?${params.toString()}`);
  }

  async getApplicationById(id: number): Promise<ApiResponse<Application>> {
    return this.makeRequest(`/${id}`);
  }

  async createApplication(
    data: CreateApplicationData
  ): Promise<ApiResponse<Application>> {
    return this.makeRequest("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateApplication(
    id: number,
    data: UpdateApplicationData
  ): Promise<ApiResponse<Application>> {
    return this.makeRequest(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteApplication(id: number): Promise<ApiResponse<void>> {
    return this.makeRequest(`/${id}`, {
      method: "DELETE",
    });
  }

  async getApplicationStats(): Promise<ApiResponse<ApplicationStats>> {
    return this.makeRequest("/stats");
  }

  async checkCanDeleteApplication(
    id: number
  ): Promise<ApiResponse<{ canDelete: boolean; message?: string }>> {
    return this.makeRequest(`/${id}/can-delete`);
  }

  async toggleApplicationStatus(id: number): Promise<ApiResponse<Application>> {
    return this.makeRequest(`/${id}/toggle-status`, {
      method: "PATCH",
    });
  }

  async searchApplications(query: string): Promise<ApiResponse<Application[]>> {
    return this.makeRequest(`/search?q=${encodeURIComponent(query)}`);
  }
}

export const applicationService = new ApplicationService();
