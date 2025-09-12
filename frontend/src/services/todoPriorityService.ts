import { config } from "../config/config";

const API_BASE_URL = config.api.baseUrl;

export interface TodoPriority {
  id: string;
  name: string;
  description?: string;
  color: string;
  level: number;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoPriorityRequest {
  name: string;
  description?: string;
  color: string;
  level: number;
}

export interface UpdateTodoPriorityRequest {
  name?: string;
  description?: string;
  color?: string;
  level?: number;
}

export interface TodoPrioritiesResponse {
  success: boolean;
  message: string;
  data?: {
    priorities: TodoPriority[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
  };
}

export interface TodoPriorityResponse {
  success: boolean;
  message: string;
  data?: TodoPriority;
}

export interface TodoPriorityStatsResponse {
  success: boolean;
  message: string;
  data?: {
    total: number;
    active: number;
    inactive: number;
  };
}

export interface TodoPriorityFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  search?: string;
  isActive?: boolean;
}

class TodoPriorityService {
  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const token = localStorage.getItem("token");
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    if (response.status === 204) {
      return null; // No content
    }

    return response.json();
  }

  async getAllPriorities(
    filters?: TodoPriorityFilters
  ): Promise<TodoPrioritiesResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.page) {
        params.append("page", filters.page.toString());
      }

      if (filters?.limit) {
        params.append("limit", filters.limit.toString());
      }

      if (filters?.sortBy) {
        params.append("sortBy", filters.sortBy);
      }

      if (filters?.sortOrder) {
        params.append("sortOrder", filters.sortOrder);
      }

      if (filters?.search) {
        params.append("search", filters.search);
      }

      if (filters?.isActive !== undefined) {
        params.append("isActive", filters.isActive.toString());
      }

      const queryString = params.toString();
      const endpoint = queryString
        ? `/admin/todo-priorities?${queryString}`
        : "/admin/todo-priorities";

      const response = await this.makeRequest(endpoint);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getPriorityById(id: string): Promise<TodoPriorityResponse> {
    try {
      const response = await this.makeRequest(`/admin/todo-priorities/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async createPriority(
    data: CreateTodoPriorityRequest
  ): Promise<TodoPriorityResponse> {
    try {
      const response = await this.makeRequest("/admin/todo-priorities", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updatePriority(
    id: string,
    data: UpdateTodoPriorityRequest
  ): Promise<TodoPriorityResponse> {
    try {
      const response = await this.makeRequest(`/admin/todo-priorities/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async deletePriority(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.makeRequest(`/admin/todo-priorities/${id}`, {
        method: "DELETE",
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async togglePriorityStatus(id: string): Promise<TodoPriorityResponse> {
    try {
      const response = await this.makeRequest(
        `/admin/todo-priorities/${id}/toggle`,
        {
          method: "PATCH",
        }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async reorderPriorities(
    priorities: { id: string; displayOrder: number }[]
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await this.makeRequest(
        "/admin/todo-priorities/reorder",
        {
          method: "POST",
          body: JSON.stringify({ priorities }),
        }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getPriorityStats(): Promise<TodoPriorityStatsResponse> {
    try {
      const response = await this.makeRequest("/admin/todo-priorities/stats");
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export { TodoPriorityService };
export default new TodoPriorityService();
