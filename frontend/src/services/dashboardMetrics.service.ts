import { authService } from "./auth.service";
import { securityService } from "./security.service";
import { config } from "../config/config";

const API_BASE_URL = config.api.baseUrl;

// Helper para hacer peticiones autenticadas a métricas
const metricsRequest = async <T>(
  url: string,
  params?: Record<string, string>
): Promise<T> => {
  // Usar SecurityService en lugar de localStorage directo
  const tokens = securityService.getValidTokens();
  const token = tokens?.token;

  const queryString = params
    ? "?" + new URLSearchParams(params).toString()
    : "";

  console.log("🔍 [MetricsRequest] Debug info:", {
    url: `${API_BASE_URL}${url}${queryString}`,
    hasToken: !!token,
    tokenStart: token ? token.substring(0, 20) + "..." : "no token",
    fullToken: token, // Log del token completo para debugging
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  const response = await fetch(`${API_BASE_URL}${url}${queryString}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (response.status === 401) {
    // Token expirado, intentar renovar usando SecurityService
    const refreshTokens = securityService.getValidTokens();
    if (refreshTokens?.refreshToken) {
      try {
        const refreshResponse = await authService.refreshToken(
          refreshTokens.refreshToken
        );
        if (refreshResponse.success && refreshResponse.data) {
          // Actualizar tokens en SecurityService
          const refreshToken =
            (refreshResponse.data as any).refreshToken ||
            refreshResponse.data.token;
          securityService.updateTokens(
            refreshResponse.data.token,
            refreshToken
          );

          // Reintentar la petición original
          return metricsRequest(url, params);
        }
      } catch (error) {
        console.error("❌ [MetricsRequest] Token refresh failed:", error);
        securityService.clearSession();
        throw new Error("Session expired");
      }
    } else {
      console.warn("⚠️ [MetricsRequest] No refresh token available");
      securityService.clearSession();
      throw new Error("No authentication tokens available");
    }
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result.data || result;
};

// Interfaces para las métricas
export interface TimeMetrics {
  totalTimeMinutes: number;
  totalHours: number;
  casesTimeMinutes: number;
  casesTimeHours: number;
  todosTimeMinutes: number;
  todosTimeHours: number;
  averageTimePerCase: number;
  activeTimers: number;
  currentMonth: string;
  currentYear: number;
}

export interface UserTimeMetrics {
  userId: string;
  userName: string;
  totalTimeMinutes: number;
  casesWorked: number;
}

export interface CaseTimeMetrics {
  caseId: string;
  caseNumber: string;
  title?: string;
  description: string;
  totalTimeMinutes: number;
  status: string;
  statusColor?: string;
}

export interface StatusMetrics {
  statusId: string;
  statusName: string;
  statusColor: string;
  casesCount: number;
  totalTimeMinutes: number;
}

export interface ApplicationTimeMetrics {
  applicationId: string;
  applicationName: string;
  totalTimeMinutes: number;
  casesCount: number;
}

export interface TodoMetrics {
  totalTodos: number;
  completedTodos: number;
  inProgressTodos: number;
  overdueTodos: number;
  totalTimeMonth: number;
  totalTimeToday: number;
}

export interface DashboardStats {
  totalCases: number;
  lowComplexity: number;
  mediumComplexity: number;
  highComplexity: number;
  thisMonth: number;
  thisWeek: number;
}

// Función helper para obtener fechas del mes actual
const getCurrentMonthRange = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  return {
    start: startOfMonth.toISOString(),
    end: endOfMonth.toISOString(),
  };
};

export const dashboardMetricsService = {
  // Métricas generales de tiempo del mes actual
  async getTimeMetrics(): Promise<TimeMetrics> {
    try {
      const { start, end } = getCurrentMonthRange();
      const data = await metricsRequest<TimeMetrics>("/metrics/time", {
        startDate: start,
        endDate: end,
      });

      const now = new Date();
      return {
        ...data,
        currentMonth: now.toLocaleString("es-ES", { month: "long" }),
        currentYear: now.getFullYear(),
      };
    } catch (error) {
      console.error("Error fetching time metrics:", error);
      const now = new Date();
      return {
        totalTimeMinutes: 0,
        totalHours: 0,
        casesTimeMinutes: 0,
        casesTimeHours: 0,
        todosTimeMinutes: 0,
        todosTimeHours: 0,
        averageTimePerCase: 0,
        activeTimers: 0,
        currentMonth: now.toLocaleString("es-ES", { month: "long" }),
        currentYear: now.getFullYear(),
      };
    }
  },

  // Métricas de tiempo por usuario
  async getUserTimeMetrics(): Promise<UserTimeMetrics[]> {
    try {
      const { start, end } = getCurrentMonthRange();
      const data = await metricsRequest<UserTimeMetrics[]>(
        "/metrics/users/time",
        {
          startDate: start,
          endDate: end,
        }
      );
      return data || [];
    } catch (error) {
      console.error("Error fetching user time metrics:", error);
      return [];
    }
  },

  // Métricas de tiempo por caso
  async getCaseTimeMetrics(): Promise<CaseTimeMetrics[]> {
    try {
      const { start, end } = getCurrentMonthRange();
      const response = await metricsRequest<{
        cases: CaseTimeMetrics[];
        scope: string;
      }>("/metrics/cases/time", {
        startDate: start,
        endDate: end,
      });
      return response?.cases || [];
    } catch (error) {
      console.error("Error fetching case time metrics:", error);
      return [];
    }
  },

  // Métricas por estado
  async getStatusMetrics(): Promise<StatusMetrics[]> {
    try {
      const { start, end } = getCurrentMonthRange();
      const response = await metricsRequest<{
        statuses: StatusMetrics[];
        scope: string;
      }>("/metrics/status", {
        startDate: start,
        endDate: end,
      });
      return response?.statuses || [];
    } catch (error) {
      console.error("Error fetching status metrics:", error);
      return [];
    }
  },

  // Métricas por aplicación
  async getApplicationTimeMetrics(): Promise<ApplicationTimeMetrics[]> {
    try {
      const { start, end } = getCurrentMonthRange();
      const data = await metricsRequest<ApplicationTimeMetrics[]>(
        "/metrics/applications",
        {
          startDate: start,
          endDate: end,
        }
      );
      return data || [];
    } catch (error) {
      console.error("Error fetching application time metrics:", error);
      return [];
    }
  },

  // Métricas de TODOs - ahora conectado al endpoint real
  async getTodoMetrics(): Promise<TodoMetrics> {
    try {
      const data = await metricsRequest<any>("/todos/metrics");

      // Mapear los datos del backend al formato esperado por el frontend
      const result = {
        totalTodos: data.totalTodos || 0,
        completedTodos: data.completedTodos || 0,
        inProgressTodos: data.activeTodos || 0, // activeTodos = inProgressTodos
        overdueTodos: data.overdueTodos || 0,
        totalTimeMonth:
          Math.round(((data.totalTimeMinutes || 0) / 60) * 10) / 10, // Convertir a horas con 1 decimal
        totalTimeToday: 0, // TODO: Implementar lógica para tiempo de hoy
      };

      return result;
    } catch (error) {
      console.error("Error fetching todo metrics:", error);
      return {
        totalTodos: 0,
        completedTodos: 0,
        inProgressTodos: 0,
        overdueTodos: 0,
        totalTimeMonth: 0,
        totalTimeToday: 0,
      };
    }
  },

  // Estadísticas básicas del dashboard (con métricas de complejidad)
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const data = await metricsRequest<{
        totalCases: number;
        lowComplexity: number;
        mediumComplexity: number;
        highComplexity: number;
        thisMonth: number;
        thisWeek: number;
      }>("/metrics/dashboard-stats");

      return {
        totalCases: data?.totalCases || 0,
        lowComplexity: data?.lowComplexity || 0,
        mediumComplexity: data?.mediumComplexity || 0,
        highComplexity: data?.highComplexity || 0,
        thisMonth: data?.thisMonth || 0,
        thisWeek: data?.thisWeek || 0,
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return {
        totalCases: 0,
        lowComplexity: 0,
        mediumComplexity: 0,
        highComplexity: 0,
        thisMonth: 0,
        thisWeek: 0,
      };
    }
  },
};
