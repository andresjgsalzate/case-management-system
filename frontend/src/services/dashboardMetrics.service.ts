import { authService } from "./auth.service";

const API_BASE_URL = "http://localhost:3000/api";

// Helper para hacer peticiones autenticadas a métricas
const metricsRequest = async <T>(
  url: string,
  params?: Record<string, string>
): Promise<T> => {
  const token = localStorage.getItem("token");
  const queryString = params
    ? "?" + new URLSearchParams(params).toString()
    : "";

  const response = await fetch(`${API_BASE_URL}${url}${queryString}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (response.status === 401) {
    // Token expirado, intentar renovar
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      try {
        const refreshResponse = await authService.refreshToken(refreshToken);
        if (refreshResponse.success && refreshResponse.data) {
          localStorage.setItem("token", refreshResponse.data.token);
          // Reintentar la petición original
          return metricsRequest(url, params);
        }
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        throw new Error("Session expired");
      }
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
      const data = await metricsRequest<CaseTimeMetrics[]>(
        "/metrics/cases/time",
        {
          startDate: start,
          endDate: end,
        }
      );
      return data || [];
    } catch (error) {
      console.error("Error fetching case time metrics:", error);
      return [];
    }
  },

  // Métricas por estado
  async getStatusMetrics(): Promise<StatusMetrics[]> {
    try {
      const { start, end } = getCurrentMonthRange();
      const data = await metricsRequest<StatusMetrics[]>("/metrics/status", {
        startDate: start,
        endDate: end,
      });
      return data || [];
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

  // Métricas de TODOs (temporalmente retornando datos vacíos hasta implementar)
  async getTodoMetrics(): Promise<TodoMetrics> {
    try {
      // TODO: Implementar endpoint de TODOs en el backend
      console.warn("Endpoint de métricas de TODOs no implementado aún");
      return {
        totalTodos: 0,
        completedTodos: 0,
        inProgressTodos: 0,
        overdueTodos: 0,
        totalTimeMonth: 0,
        totalTimeToday: 0,
      };
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
