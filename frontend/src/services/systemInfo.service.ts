import type { ApiResponse } from "../types/api";
import { securityService } from "./security.service";

export interface SystemModule {
  name: string;
  version: string;
  description: string;
  features: string[];
  endpoints: string[];
  status: "active" | "maintenance" | "deprecated";
  permissions: string[];
}

export interface SystemInfo {
  version: string;
  name: string;
  description: string;
  buildDate: string;
  environment: string;
  modules: SystemModule[];
  stats: {
    totalModules: number;
    activeModules: number;
    totalEndpoints: number;
    uptime: number;
  };
}

export interface SystemVersion {
  version: string;
  name: string;
  buildDate: string;
}

export interface SystemStats {
  totalModules: number;
  activeModules: number;
  totalEndpoints: number;
  uptime: number;
}

export interface SystemChangelog {
  changelog: string;
  lastUpdate: string;
}

export class SystemInfoService {
  private baseUrl = "/api/system";

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const tokens = securityService.getValidTokens();

      if (!tokens && !endpoint.includes("/version")) {
        throw new Error("No hay tokens válidos disponibles");
      }

      const headers = new Headers({
        "Content-Type": "application/json",
      });

      // Agregar headers adicionales si existen
      if (options.headers) {
        const additionalHeaders = new Headers(options.headers);
        additionalHeaders.forEach((value, key) => {
          headers.set(key, value);
        });
      }

      // Solo agregar autorización si hay tokens y no es la ruta pública de versión
      if (tokens && !endpoint.includes("/version")) {
        headers.set("Authorization", `Bearer ${tokens.token}`);
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Error en SystemInfoService ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Obtener información completa del sistema
   */
  async getSystemInfo(): Promise<ApiResponse<SystemInfo>> {
    return this.makeRequest<SystemInfo>("/info");
  }

  /**
   * Obtener solo la versión del sistema (endpoint público)
   */
  async getVersion(): Promise<ApiResponse<SystemVersion>> {
    return this.makeRequest<SystemVersion>("/version");
  }

  /**
   * Obtener módulos disponibles del sistema
   */
  async getModules(): Promise<ApiResponse<SystemModule[]>> {
    return this.makeRequest<SystemModule[]>("/modules");
  }

  /**
   * Obtener changelog del sistema
   */
  async getChangelog(): Promise<ApiResponse<SystemChangelog>> {
    return this.makeRequest<SystemChangelog>("/changelog");
  }

  /**
   * Obtener estadísticas del sistema
   */
  async getStats(): Promise<ApiResponse<SystemStats>> {
    return this.makeRequest<SystemStats>("/stats");
  }

  /**
   * Formatear el tiempo de uptime en formato legible
   */
  static formatUptime(uptimeSeconds: number): string {
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(" ");
  }

  /**
   * Obtener el color del estado del módulo
   */
  static getModuleStatusColor(status: SystemModule["status"]): string {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-50";
      case "maintenance":
        return "text-yellow-600 bg-yellow-50";
      case "deprecated":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  }

  /**
   * Obtener el texto del estado del módulo
   */
  static getModuleStatusText(status: SystemModule["status"]): string {
    switch (status) {
      case "active":
        return "Activo";
      case "maintenance":
        return "Mantenimiento";
      case "deprecated":
        return "Obsoleto";
      default:
        return "Desconocido";
    }
  }
}

export const systemInfoService = new SystemInfoService();
