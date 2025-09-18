import {
  ArchivedCase,
  ArchivedTodo,
  ArchivedItem,
  ArchiveStats,
  ArchiveFilters,
  CreateArchivedCaseData,
  CreateArchivedTodoData,
  RestoreArchivedItemData,
} from "../types/archive.types";
import { authService } from "./auth.service";

class ArchiveApi {
  private baseUrl = "/archive";

  // =============================================
  // MÉTODOS PARA ESTADÍSTICAS
  // =============================================

  /**
   * Obtener estadísticas del archivo
   */
  async getArchiveStats(): Promise<ArchiveStats> {
    const response = await authService.authenticatedRequest<ArchiveStats>(
      `${this.baseUrl}/stats`
    );

    if (!response.data) {
      throw new Error("Failed to load archive stats");
    }
    return response.data;
  }

  // =============================================
  // MÉTODOS PARA CASOS ARCHIVADOS
  // =============================================

  /**
   * Obtener casos archivados con filtros
   */
  async getArchivedCases(filters?: ArchiveFilters): Promise<ArchivedCase[]> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === "boolean") {
            params.append(key, String(value));
          } else if (Array.isArray(value)) {
            params.append(key, value.join(","));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const response = await authService.authenticatedRequest<ArchivedCase[]>(
      `${this.baseUrl}/cases${params.toString() ? `?${params.toString()}` : ""}`
    );
    return response.data || [];
  }

  /**
   * Obtener un caso archivado por ID
   */
  async getArchivedCaseById(id: string): Promise<ArchivedCase> {
    const response = await authService.authenticatedRequest<ArchivedCase>(
      `${this.baseUrl}/cases/${id}`
    );
    if (!response.data) {
      throw new Error("Archived case not found");
    }
    return response.data;
  }

  /**
   * Archivar un caso
   */
  async archiveCase(caseData: CreateArchivedCaseData): Promise<ArchivedCase> {
    const response = await authService.authenticatedRequest<ArchivedCase>(
      `${this.baseUrl}/cases`,
      {
        method: "POST",
        body: JSON.stringify(caseData),
      }
    );
    if (!response.data) {
      throw new Error("Failed to archive case");
    }
    return response.data;
  }

  /**
   * Restaurar un caso archivado
   */
  async restoreCase(
    id: string,
    restoreData: RestoreArchivedItemData
  ): Promise<ArchivedCase> {
    const response = await authService.authenticatedRequest<ArchivedCase>(
      `${this.baseUrl}/case/${id}/restore`,
      {
        method: "POST",
        body: JSON.stringify(restoreData),
      }
    );
    if (!response.data) {
      throw new Error("Failed to restore case");
    }
    return response.data;
  }

  /**
   * Eliminar permanentemente un caso archivado
   */
  async deleteArchivedCase(id: string): Promise<void> {
    await authService.authenticatedRequest(`${this.baseUrl}/cases/${id}`, {
      method: "DELETE",
    });
  }

  // =============================================
  // MÉTODOS PARA TODOS ARCHIVADOS
  // =============================================

  /**
   * Obtener TODOs archivados con filtros
   */
  async getArchivedTodos(filters?: ArchiveFilters): Promise<ArchivedTodo[]> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === "boolean") {
            params.append(key, String(value));
          } else if (Array.isArray(value)) {
            params.append(key, value.join(","));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const response = await authService.authenticatedRequest<ArchivedTodo[]>(
      `${this.baseUrl}/todos${params.toString() ? `?${params.toString()}` : ""}`
    );
    return response.data || [];
  }

  /**
   * Obtener un TODO archivado por ID
   */
  async getArchivedTodoById(id: string): Promise<ArchivedTodo> {
    const response = await authService.authenticatedRequest<ArchivedTodo>(
      `${this.baseUrl}/todos/${id}`
    );
    if (!response.data) {
      throw new Error("Archived todo not found");
    }
    return response.data;
  }

  /**
   * Archivar un TODO
   */
  async archiveTodo(todoData: CreateArchivedTodoData): Promise<ArchivedTodo> {
    const response = await authService.authenticatedRequest<ArchivedTodo>(
      `${this.baseUrl}/todos`,
      {
        method: "POST",
        body: JSON.stringify(todoData),
      }
    );
    if (!response.data) {
      throw new Error("Failed to archive todo");
    }
    return response.data;
  }

  /**
   * Restaurar un TODO archivado
   */
  async restoreTodo(
    id: string,
    restoreData: RestoreArchivedItemData
  ): Promise<ArchivedTodo> {
    const response = await authService.authenticatedRequest<ArchivedTodo>(
      `${this.baseUrl}/todo/${id}/restore`,
      {
        method: "POST",
        body: JSON.stringify(restoreData),
      }
    );
    if (!response.data) {
      throw new Error("Failed to restore todo");
    }
    return response.data;
  }

  /**
   * Eliminar permanentemente un TODO archivado
   */
  async deleteArchivedTodo(id: string): Promise<void> {
    await authService.authenticatedRequest(`${this.baseUrl}/todos/${id}`, {
      method: "DELETE",
    });
  }

  // =============================================
  // MÉTODOS GENERALES
  // =============================================

  /**
   * Obtener elementos archivados combinados (casos y TODOs)
   */
  async getArchivedItems(filters?: ArchiveFilters): Promise<ArchivedItem[]> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === "boolean") {
            params.append(key, String(value));
          } else if (Array.isArray(value)) {
            params.append(key, value.join(","));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const url = `${this.baseUrl}/items${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    const response = await authService.authenticatedRequest<ArchivedItem[]>(
      url
    );

    return response.data || [];
  }

  /**
   * Buscar elementos archivados
   */
  async searchArchivedItems(
    searchTerm: string,
    type?: "cases" | "todos" | "all",
    limit?: number
  ): Promise<ArchivedItem[]> {
    const params = new URLSearchParams({
      q: searchTerm,
    });

    if (type) {
      params.append("type", type);
    }

    if (limit) {
      params.append("limit", String(limit));
    }

    const response = await authService.authenticatedRequest<ArchivedItem[]>(
      `${this.baseUrl}/search?${params.toString()}`
    );
    return response.data || [];
  }

  // =============================================
  // MÉTODOS DE UTILIDAD
  // =============================================

  /**
   * Formatear tiempo en minutos a formato legible
   */
  formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  /**
   * Formatear fecha a formato legible
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /**
   * Formatear fecha relativa (ej: "hace 2 días")
   */
  formatRelativeDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return "Hoy";
    } else if (diffInDays === 1) {
      return "Ayer";
    } else if (diffInDays < 7) {
      return `Hace ${diffInDays} días`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `Hace ${weeks} semana${weeks > 1 ? "s" : ""}`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `Hace ${months} mes${months > 1 ? "es" : ""}`;
    } else {
      const years = Math.floor(diffInDays / 365);
      return `Hace ${years} año${years > 1 ? "s" : ""}`;
    }
  }

  /**
   * Obtener color para el estado
   */
  getStatusColor(isRestored: boolean): string {
    return isRestored
      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  }

  /**
   * Obtener color para la prioridad
   */
  getPriorityColor(priority: string): string {
    switch (priority.toLowerCase()) {
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  }

  /**
   * Obtener color para la clasificación
   */
  getClassificationColor(classification: string): string {
    switch (classification.toLowerCase()) {
      case "complex":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "simple":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  }

  // =============================================
  // MÉTODOS SIMPLES PARA ARCHIVADO
  // =============================================

  /**
   * Archivar un caso por ID (método simple)
   */
  async archiveCaseById(
    caseId: string | number,
    reason?: string
  ): Promise<ArchivedCase> {
    try {
      const response = await authService.authenticatedRequest<{
        success: boolean;
        data: ArchivedCase;
        message?: string;
      }>(`${this.baseUrl}/case/${caseId}`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });

      if (!response.data?.data && !response.data) {
        console.error("Estructura de respuesta inesperada:", response);
        throw new Error("Failed to archive case");
      }

      // El backend devuelve { success: true, data: ArchivedCase }
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Error en archiveCaseById:", error);
      throw error;
    }
  }

  /**
   * Archivar un todo por ID (método simple)
   */
  async archiveTodoById(
    todoId: number,
    reason?: string
  ): Promise<ArchivedTodo> {
    const response = await authService.authenticatedRequest<{
      data: ArchivedTodo;
    }>(`${this.baseUrl}/todo/${todoId}`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    if (!response.data?.data) {
      throw new Error("Failed to archive todo");
    }
    return response.data.data;
  }
}

export const archiveApi = new ArchiveApi();
