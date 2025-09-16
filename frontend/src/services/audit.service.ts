import {
  AuditLog,
  AuditLogFilters,
  AuditLogResponse,
  AuditStatsResponse,
  AuditEntityHistoryResponse,
  AuditExportRequest,
  CreateAuditLogRequest,
  AuditCleanupRequest,
} from "../types/audit";
import { ApiResponse } from "../types/api";
import { config } from "../config/config";
import { securityService } from "./security.service";

// Interface for backend audit response
interface BackendAuditResponse extends ApiResponse {
  data: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

class AuditService {
  private baseURL = `${config.api.baseUrl}/audit`;

  private getToken(): string | null {
    const tokens = securityService.getValidTokens();
    return tokens?.token || null;
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const response = await fetch(`${this.baseURL}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data: ApiResponse<T> = await response.json();
    if (!data.data) {
      throw new Error("No se recibieron datos del servidor");
    }

    return data.data;
  }

  /**
   * Obtener logs de auditoría con filtros y paginación
   */
  async getAuditLogs(filters?: AuditLogFilters): Promise<AuditLogResponse> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }

    const url = `/logs${params.toString() ? `?${params.toString()}` : ""}`;

    // Get the raw response from the backend
    const token = this.getToken();
    const response = await fetch(`${this.baseURL}${url}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data: BackendAuditResponse = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Error al obtener los logs de auditoría");
    }

    // Map the backend response structure to the frontend expected structure
    return {
      logs: data.data || [],
      total: data.pagination?.total || 0,
      page: data.pagination?.page || 1,
      limit: data.pagination?.limit || 25,
      totalPages: data.pagination?.totalPages || 0,
      hasNextPage: data.pagination?.hasNextPage || false,
      hasPreviousPage: data.pagination?.hasPrevPage || false,
    };
  }

  /**
   * Obtener estadísticas de auditoría
   */
  async getAuditStats(
    filters?: Partial<AuditLogFilters>
  ): Promise<AuditStatsResponse> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }

    const url = `/stats${params.toString() ? `?${params.toString()}` : ""}`;

    return this.makeRequest<AuditStatsResponse>(url);
  }

  /**
   * Obtener historial de una entidad específica
   */
  async getEntityHistory(
    entityType: string,
    entityId: string
  ): Promise<AuditEntityHistoryResponse> {
    return this.makeRequest<AuditEntityHistoryResponse>(
      `/entity/${entityType}/${entityId}`
    );
  }

  /**
   * Obtener un log de auditoría específico con sus cambios
   */
  async getAuditLogDetails(logId: string): Promise<AuditLog> {
    return this.makeRequest<AuditLog>(`/logs/${logId}`);
  }

  /**
   * Exportar logs de auditoría en diferentes formatos
   */
  async exportAuditLogs(exportRequest: AuditExportRequest): Promise<Blob> {
    const token = this.getToken();
    const response = await fetch(`${this.baseURL}/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(exportRequest),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Crear un log de auditoría manual (solo para administradores)
   */
  async createAuditLog(auditLogData: CreateAuditLogRequest): Promise<AuditLog> {
    return this.makeRequest<AuditLog>("/logs", {
      method: "POST",
      body: JSON.stringify(auditLogData),
    });
  }

  /**
   * Limpiar logs de auditoría antiguos (solo para administradores)
   */
  async cleanupOldLogs(
    cleanupRequest: AuditCleanupRequest
  ): Promise<{ deleted: number }> {
    return this.makeRequest<{ deleted: number }>("/cleanup", {
      method: "DELETE",
      body: JSON.stringify(cleanupRequest),
    });
  }

  /**
   * Obtener usuarios únicos que aparecen en los logs de auditoría
   */
  async getAuditUsers(): Promise<
    Array<{ userId: string; userEmail: string; userName?: string }>
  > {
    return this.makeRequest<
      Array<{ userId: string; userEmail: string; userName?: string }>
    >("/users");
  }

  /**
   * Helper para descargar un archivo exportado
   */
  downloadFile(blob: Blob, filename: string, format: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // Determinar la extensión según el formato
    let extension = "";
    switch (format) {
      case "JSON":
        extension = ".json";
        break;
      case "CSV":
        extension = ".csv";
        break;
      case "XLSX":
        extension = ".xlsx";
        break;
      default:
        extension = ".txt";
    }

    link.download = `${filename}${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Helper para formatear fechas para los filtros
   */
  formatDateForFilter(date: Date): string {
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  }

  /**
   * Helper para formatear fechas con hora para los filtros
   */
  formatDateTimeForFilter(date: Date): string {
    return date.toISOString(); // YYYY-MM-DDTHH:mm:ss.sssZ
  }

  /**
   * Helper para validar permisos de auditoría
   */
  hasAuditViewPermission(): boolean {
    // Aquí deberías implementar la lógica para verificar permisos
    // Por ahora, devolvemos true para que funcione
    return true;
  }

  hasAuditAdminPermission(): boolean {
    // Aquí deberías implementar la lógica para verificar permisos de administrador
    // Por ahora, devolvemos true para que funcione
    return true;
  }
}

export const auditService = new AuditService();
