import { useQuery } from "@tanstack/react-query";
import { dashboardMetricsService } from "../services/dashboardMetrics.service";
import { useAuthStore } from "../stores/authStore";
// Hook optimizado para cargar todas las métricas del dashboard en paralelo
export const useAllDashboardMetrics = () => {
  // Usar una clave más estable para evitar re-renders
  const month = new Date().getMonth();
  const year = new Date().getFullYear();
  // Obtener función para verificar permisos
  const { hasPermission } = useAuthStore();
  return useQuery({
    queryKey: ["allDashboardMetrics", `${year}-${month}`],
    queryFn: async () => {
      try {
        // Verificar permisos antes de hacer las llamadas
        const canReadUserMetrics =
          hasPermission("metrics.users.read.team") ||
          hasPermission("metrics.users.read.all") ||
          hasPermission("admin.full");
        const canReadTimeMetrics =
          hasPermission("metrics.time.read.all") || hasPermission("admin.full");
        console.log("🔐 Permisos de métricas:", {
          canReadUserMetrics,
          canReadTimeMetrics,
        });
        // Cargar métricas básicas que siempre están disponibles
        const [
          dashboardStats,
          caseTimeMetrics,
          statusMetrics,
          applicationTimeMetrics,
          todoMetrics,
        ] = await Promise.all([
          dashboardMetricsService.getDashboardStats(),
          dashboardMetricsService.getCaseTimeMetrics(),
          dashboardMetricsService.getStatusMetrics(),
          dashboardMetricsService.getApplicationTimeMetrics(),
          dashboardMetricsService.getTodoMetrics(),
        ]);
        // Cargar métricas que requieren permisos específicos de forma condicional
        let timeMetrics = null;
        let userTimeMetrics = null;
        if (canReadTimeMetrics) {
          try {
            timeMetrics = await dashboardMetricsService.getTimeMetrics();
          } catch (error) {
            console.warn("⚠️ No se pudieron cargar métricas de tiempo:", error);
          }
        }
        if (canReadUserMetrics) {
          try {
            userTimeMetrics =
              await dashboardMetricsService.getUserTimeMetrics();
          } catch (error) {
            console.warn(
              "⚠️ No se pudieron cargar métricas de usuarios:",
              error
            );
          }
        }
        console.log(
          "✅ Métricas del dashboard cargadas según permisos del usuario"
        );
        return {
          dashboardStats,
          timeMetrics,
          userTimeMetrics,
          caseTimeMetrics,
          statusMetrics,
          applicationTimeMetrics,
          todoMetrics,
        };
      } catch (error) {
        console.error("❌ Error cargando métricas del dashboard:", error);
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - más tiempo para evitar re-fetch
    gcTime: 15 * 60 * 1000, // 15 minutos en caché
    refetchOnMount: "always", // Siempre refrescar en mount
    refetchOnWindowFocus: false, // No refrescar cuando se enfoca la ventana
    refetchOnReconnect: false, // No refrescar en reconexión automáticamente
    retry: 1, // Solo reintentar 1 vez
    retryDelay: 2000,
  });
};
// Hook para métricas generales de tiempo
export const useTimeMetrics = () => {
  return useQuery({
    queryKey: ["timeMetrics", new Date().getMonth(), new Date().getFullYear()],
    queryFn: () => dashboardMetricsService.getTimeMetrics(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 5 * 60 * 1000, // Refrescar cada 5 minutos
  });
};
// Hook para métricas de tiempo por usuario
export const useUserTimeMetrics = () => {
  return useQuery({
    queryKey: [
      "userTimeMetrics",
      new Date().getMonth(),
      new Date().getFullYear(),
    ],
    queryFn: () => dashboardMetricsService.getUserTimeMetrics(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
};
// Hook para métricas de tiempo por caso
export const useCaseTimeMetrics = () => {
  return useQuery({
    queryKey: [
      "caseTimeMetrics",
      new Date().getMonth(),
      new Date().getFullYear(),
    ],
    queryFn: () => dashboardMetricsService.getCaseTimeMetrics(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
};
// Hook para métricas por estado
export const useStatusMetrics = () => {
  return useQuery({
    queryKey: [
      "statusMetrics",
      new Date().getMonth(),
      new Date().getFullYear(),
    ],
    queryFn: () => dashboardMetricsService.getStatusMetrics(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
};
// Hook para métricas por aplicación
export const useApplicationTimeMetrics = () => {
  return useQuery({
    queryKey: [
      "applicationTimeMetrics",
      new Date().getMonth(),
      new Date().getFullYear(),
    ],
    queryFn: () => dashboardMetricsService.getApplicationTimeMetrics(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
};
// Hook para métricas de TODOs
export const useTodoMetrics = () => {
  return useQuery({
    queryKey: ["todoMetrics", new Date().getMonth(), new Date().getFullYear()],
    queryFn: () => dashboardMetricsService.getTodoMetrics(),
    staleTime: 2 * 60 * 1000, // 2 minutos (más frecuente para TODOs)
    refetchInterval: 2 * 60 * 1000,
  });
};
// Hook para estadísticas básicas del dashboard
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => dashboardMetricsService.getDashboardStats(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
};
// Hook combinado para todas las métricas (para loading states)
export const useDashboardMetrics = () => {
  const timeMetrics = useTimeMetrics();
  const userTimeMetrics = useUserTimeMetrics();
  const caseTimeMetrics = useCaseTimeMetrics();
  const statusMetrics = useStatusMetrics();
  const applicationTimeMetrics = useApplicationTimeMetrics();
  const todoMetrics = useTodoMetrics();
  const dashboardStats = useDashboardStats();
  return {
    timeMetrics: {
      data: timeMetrics.data,
      isLoading: timeMetrics.isLoading,
      error: timeMetrics.error,
    },
    userTimeMetrics: {
      data: userTimeMetrics.data,
      isLoading: userTimeMetrics.isLoading,
      error: userTimeMetrics.error,
    },
    caseTimeMetrics: {
      data: caseTimeMetrics.data,
      isLoading: caseTimeMetrics.isLoading,
      error: caseTimeMetrics.error,
    },
    statusMetrics: {
      data: statusMetrics.data,
      isLoading: statusMetrics.isLoading,
      error: statusMetrics.error,
    },
    applicationTimeMetrics: {
      data: applicationTimeMetrics.data,
      isLoading: applicationTimeMetrics.isLoading,
      error: applicationTimeMetrics.error,
    },
    todoMetrics: {
      data: todoMetrics.data,
      isLoading: todoMetrics.isLoading,
      error: todoMetrics.error,
    },
    dashboardStats: {
      data: dashboardStats.data,
      isLoading: dashboardStats.isLoading,
      error: dashboardStats.error,
    },
    // Estados globales
    isLoading:
      timeMetrics.isLoading ||
      userTimeMetrics.isLoading ||
      caseTimeMetrics.isLoading ||
      statusMetrics.isLoading ||
      applicationTimeMetrics.isLoading ||
      todoMetrics.isLoading ||
      dashboardStats.isLoading,
    hasError:
      timeMetrics.error ||
      userTimeMetrics.error ||
      caseTimeMetrics.error ||
      statusMetrics.error ||
      applicationTimeMetrics.error ||
      todoMetrics.error ||
      dashboardStats.error,
  };
};
