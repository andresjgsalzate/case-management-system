import type { ApiResponse } from "../types/api";
import { securityService } from "./security.service";

export interface CaseStatus {
  id: number;
  name: string;
  description?: string;
  color?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CaseStatusStats {
  total: number;
  active: number;
  inactive: number;
  totalStatuses: number;
  activeStatuses: number;
  inactiveStatuses: number;
  casesCount: number;
  recentlyCreated: number;
}

export interface CaseStatusFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export class CaseStatusService {
  private baseUrl = "/api/case-statuses";

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

  async getAllStatuses(filters: CaseStatusFilters = {}): Promise<
    ApiResponse<{
      statuses: CaseStatus[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    return this.makeRequest(`?${params.toString()}`);
  }

  async createStatus(data: any): Promise<ApiResponse<any>> {
    return this.makeRequest("", { method: "POST", body: JSON.stringify(data) });
  }

  async updateStatus(id: number, data: any): Promise<ApiResponse<any>> {
    return this.makeRequest(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteStatus(id: number): Promise<ApiResponse<void>> {
    return this.makeRequest(`/${id}`, { method: "DELETE" });
  }

  async getStatusStats(): Promise<ApiResponse<any>> {
    return this.makeRequest("/stats");
  }

  async checkCanDeleteStatus(id: number): Promise<ApiResponse<any>> {
    return this.makeRequest(`/${id}/can-delete`);
  }
}

export const caseStatusService = new CaseStatusService();
