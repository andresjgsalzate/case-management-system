import type {
  CreateTagRequest,
  UpdateTagRequest,
  TagResponse,
  TagsResponse,
  TagFilters,
} from "../types/tag";
import { config } from "../config/config";
import { securityService } from "./security.service";

const API_BASE_URL = config.api.baseUrl;

class TagService {
  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const tokens = securityService.getValidTokens();
    const token = tokens?.token;
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

  async getAllTags(filters?: TagFilters): Promise<TagsResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.category && filters.category !== "all") {
        params.append("category", filters.category);
      }

      if (filters?.isActive !== undefined) {
        params.append("isActive", String(filters.isActive));
      }

      if (filters?.search) {
        params.append("search", filters.search);
      }

      const queryString = params.toString();
      const endpoint = queryString
        ? `/knowledge/tags?${queryString}`
        : "/knowledge/tags";

      const data = await this.makeRequest(endpoint);
      return {
        success: true,
        data: Array.isArray(data) ? data : [],
      };
    } catch (error: any) {
      console.error("Error fetching tags:", error);
      throw new Error(error.message || "Error al obtener las etiquetas");
    }
  }

  async getTagById(id: string): Promise<TagResponse> {
    try {
      const data = await this.makeRequest(`/knowledge/tags/${id}`);
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error("Error fetching tag:", error);
      throw new Error(error.message || "Error al obtener la etiqueta");
    }
  }

  async createTag(tagData: CreateTagRequest): Promise<TagResponse> {
    try {
      const data = await this.makeRequest("/knowledge/tags", {
        method: "POST",
        body: JSON.stringify(tagData),
      });
      return {
        success: true,
        data,
        message: "Etiqueta creada exitosamente",
      };
    } catch (error: any) {
      console.error("Error creating tag:", error);
      throw new Error(error.message || "Error al crear la etiqueta");
    }
  }

  async updateTag(id: string, tagData: UpdateTagRequest): Promise<TagResponse> {
    try {
      const data = await this.makeRequest(`/knowledge/tags/${id}`, {
        method: "PUT",
        body: JSON.stringify(tagData),
      });
      return {
        success: true,
        data,
        message: "Etiqueta actualizada exitosamente",
      };
    } catch (error: any) {
      console.error("Error updating tag:", error);
      throw new Error(error.message || "Error al actualizar la etiqueta");
    }
  }

  async deleteTag(id: string): Promise<void> {
    try {
      await this.makeRequest(`/knowledge/tags/${id}`, {
        method: "DELETE",
      });
    } catch (error: any) {
      console.error("Error deleting tag:", error);
      throw new Error(error.message || "Error al eliminar la etiqueta");
    }
  }

  async toggleTagStatus(id: string): Promise<TagResponse> {
    try {
      const tagResponse = await this.getTagById(id);
      return this.updateTag(id, { isActive: !tagResponse.data.isActive });
    } catch (error: any) {
      console.error("Error toggling tag status:", error);
      throw new Error(
        error.message || "Error al cambiar el estado de la etiqueta"
      );
    }
  }
}

export const tagService = new TagService();
