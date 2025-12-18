import React from "react";
import { Link } from "react-router-dom";
import { ActionIcon } from "../components/ui/ActionIcons";
import { useAuth } from "../contexts/AuthContext";
import { useCases } from "../hooks/useCases";
import { useAllDashboardMetrics } from "../hooks/useDashboardMetrics";
import { useDashboardPermissions } from "../hooks/useDashboardPermissions";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const {
    data: cases,
    isLoading: casesLoading,
    error: casesError,
  } = useCases();
  const allDashboardMetrics = useAllDashboardMetrics();

  // Destructurar datos de métricas con validación de permisos incluida
  const {
    timeMetrics,
    userTimeMetrics,
    statusMetrics,
    applicationTimeMetrics,
    todoMetrics,
    dashboardStats,
    caseTimeMetrics,
  } = allDashboardMetrics.data || {};

  const metricsLoading = allDashboardMetrics.isLoading;
  const dashboardPermissions = useDashboardPermissions();

  // Calcular estadísticas desde los casos reales
  const stats = React.useMemo(() => {
    if (dashboardStats) {
      return dashboardStats;
    }

    if (!cases)
      return {
        totalCases: 0,
        lowComplexity: 0,
        mediumComplexity: 0,
        highComplexity: 0,
        thisMonth: 0,
        thisWeek: 0,
      };

    const now = new Date();
    const thisMonth = cases.filter((caso) => {
      const caseDate = new Date(caso.fecha);
      return (
        caseDate.getMonth() === now.getMonth() &&
        caseDate.getFullYear() === now.getFullYear()
      );
    }).length;

    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeek = cases.filter(
      (caso) => new Date(caso.fecha) >= oneWeekAgo
    ).length;

    return {
      totalCases: cases.length,
      lowComplexity: cases.filter((c) => c.clasificacion === "Baja Complejidad")
        .length,
      mediumComplexity: cases.filter(
        (c) => c.clasificacion === "Media Complejidad"
      ).length,
      highComplexity: cases.filter(
        (c) => c.clasificacion === "Alta Complejidad"
      ).length,
      thisMonth,
      thisWeek,
    };
  }, [cases, dashboardStats]);

  // Mostrar los casos más recientes ordenados por fecha de creación
  const recentCases = React.useMemo(() => {
    if (!cases) return [];
    return [...cases]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);
  }, [cases]);

  /**
   * Formatea una fecha preservando el día exacto de la base de datos.
   * Evita problemas de timezone que pueden alterar el día.
   */
  const formatDatePreservingDay = (dateValue: string | Date): string => {
    if (!dateValue) return "N/A";
    try {
      const dateStr =
        typeof dateValue === "string" ? dateValue : dateValue.toISOString();
      // Extraer directamente año, mes, día del string ISO sin conversión de timezone
      const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const [, year, month, day] = match;
        return `${day}/${month}/${year}`;
      }
      // Fallback: usar toLocaleDateString con UTC
      return new Date(dateStr).toLocaleDateString("es-ES", { timeZone: "UTC" });
    } catch {
      return "N/A";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!dashboardPermissions.canReadOwnMetrics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sin permisos
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            No tienes permisos para acceder al dashboard
          </p>
        </div>
      </div>
    );
  }

  if (casesLoading && metricsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (casesError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Error al cargar los datos del dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                Resumen general del sistema de gestión de casos
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Bienvenido,
              </p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {user.fullName}
              </p>
              <p className="text-sm text-indigo-600 dark:text-indigo-400">
                {user.roleName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Grid - Casos */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Estadísticas de Casos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ActionIcon action="document" size="xl" color="blue" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total de Casos
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalCases}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ActionIcon action="check" size="xl" color="green" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Baja Complejidad
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.lowComplexity}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ActionIcon action="time" size="xl" color="yellow" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Media Complejidad
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.mediumComplexity}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ActionIcon action="warning" size="xl" color="red" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Alta Complejidad
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.highComplexity}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Time Metrics */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Métricas de Tiempo
            </h2>
            {timeMetrics && (
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                📅 {timeMetrics.currentMonth} {timeMetrics.currentYear}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ActionIcon action="time" size="xl" color="purple" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Tiempo Total (Este Mes)
                  </p>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metricsLoading ? (
                      <div className="flex items-center">
                        <LoadingSpinner />
                        <span className="ml-2">...</span>
                      </div>
                    ) : timeMetrics ? (
                      `${timeMetrics.totalHours?.toFixed(1) || 0}h`
                    ) : (
                      "0h"
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {metricsLoading
                      ? "..."
                      : timeMetrics
                      ? `${timeMetrics.currentMonth} ${timeMetrics.currentYear}`
                      : "0 min"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ActionIcon action="document" size="xl" color="blue" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Tiempo por Casos (Este Mes)
                  </p>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metricsLoading ? (
                      <div className="flex items-center">
                        <LoadingSpinner />
                        <span className="ml-2">...</span>
                      </div>
                    ) : timeMetrics ? (
                      `${timeMetrics.casesTimeHours?.toFixed(1) || 0}h`
                    ) : (
                      "0h"
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {metricsLoading
                      ? "..."
                      : timeMetrics
                      ? `${timeMetrics.casesTimeMinutes || 0} min`
                      : "0 min"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ActionIcon action="list" size="xl" color="green" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Tiempo por TODOs (Este Mes)
                  </p>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metricsLoading ? (
                      <div className="flex items-center">
                        <LoadingSpinner />
                        <span className="ml-2">...</span>
                      </div>
                    ) : timeMetrics ? (
                      `${timeMetrics.todosTimeHours?.toFixed(1) || 0}h`
                    ) : (
                      "0h"
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {metricsLoading
                      ? "..."
                      : timeMetrics
                      ? `${timeMetrics.todosTimeMinutes || 0} min`
                      : "0 min"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ActionIcon action="desktop" size="xl" color="green" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Aplicaciones (Este Mes)
                  </p>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metricsLoading ? (
                      <div className="flex items-center">
                        <LoadingSpinner />
                        <span className="ml-2">...</span>
                      </div>
                    ) : applicationTimeMetrics ? (
                      applicationTimeMetrics.length || 0
                    ) : (
                      "0"
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TODO Metrics */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Métricas de TODOs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ActionIcon action="list" size="xl" color="blue" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total TODOs
                  </p>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metricsLoading ? (
                      <div className="flex items-center">
                        <LoadingSpinner />
                        <span className="ml-2">...</span>
                      </div>
                    ) : (
                      todoMetrics?.totalTodos || "0"
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ActionIcon action="time" size="xl" color="yellow" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    En Progreso
                  </p>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metricsLoading ? (
                      <div className="flex items-center">
                        <LoadingSpinner />
                        <span className="ml-2">...</span>
                      </div>
                    ) : (
                      todoMetrics?.inProgressTodos || "0"
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ActionIcon action="check" size="xl" color="green" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Completados
                  </p>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metricsLoading ? (
                      <div className="flex items-center">
                        <LoadingSpinner />
                        <span className="ml-2">...</span>
                      </div>
                    ) : (
                      todoMetrics?.completedTodos || "0"
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ActionIcon action="warning" size="xl" color="red" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Vencidos
                  </p>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metricsLoading ? (
                      <div className="flex items-center">
                        <LoadingSpinner />
                        <span className="ml-2">...</span>
                      </div>
                    ) : (
                      todoMetrics?.overdueTodos || "0"
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Time by User - Solo si tiene permisos */}
        {dashboardPermissions.canReadTeamMetrics && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Tiempo por Usuario
            </h2>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              {metricsLoading ? (
                <div className="p-6 text-center">
                  <LoadingSpinner />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Cargando métricas por usuario...
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Tiempo Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Casos Trabajados
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Promedio por Caso
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {userTimeMetrics && userTimeMetrics.length > 0 ? (
                        userTimeMetrics.map((userMetric) => (
                          <tr
                            key={userMetric.userId}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {userMetric.userName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {userMetric.totalTimeMinutes &&
                              !isNaN(userMetric.totalTimeMinutes)
                                ? `${Math.floor(
                                    userMetric.totalTimeMinutes / 60
                                  )}h ${userMetric.totalTimeMinutes % 60}m`
                                : "0h 0m"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {userMetric.casesWorked || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {userMetric.casesWorked > 0 &&
                              userMetric.totalTimeMinutes &&
                              !isNaN(userMetric.totalTimeMinutes)
                                ? `${Math.round(
                                    userMetric.totalTimeMinutes /
                                      userMetric.casesWorked
                                  )}m`
                                : "-"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                          >
                            No hay métricas de tiempo disponibles
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Metrics - Solo si tiene permisos */}
        {dashboardPermissions.canReadTeamMetrics && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Métricas por Estado
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {metricsLoading ? (
                <div className="col-span-full text-center py-8">
                  <LoadingSpinner />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Cargando métricas por estado...
                  </p>
                </div>
              ) : statusMetrics && statusMetrics.length > 0 ? (
                statusMetrics.map((status, index) => (
                  <div
                    key={status.statusId || `status-${index}`}
                    className="bg-white dark:bg-gray-800 shadow rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full mr-3"
                          style={{
                            backgroundColor: status.statusColor || "#6b7280",
                          }}
                        />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {status.statusName || "Estado sin nombre"}
                        </h3>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Casos:
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {status.casesCount || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Tiempo Total:
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {status.totalTimeMinutes &&
                          !isNaN(status.totalTimeMinutes)
                            ? `${Math.floor(status.totalTimeMinutes / 60)}h ${
                                status.totalTimeMinutes % 60
                              }m`
                            : "0h 0m"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Promedio:
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {status.casesCount &&
                          status.casesCount > 0 &&
                          status.totalTimeMinutes &&
                          !isNaN(status.totalTimeMinutes)
                            ? `${Math.round(
                                status.totalTimeMinutes / status.casesCount
                              )}m`
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                  No hay métricas por estado disponibles
                </div>
              )}
            </div>
          </div>
        )}

        {/* Application Time Metrics - Solo si tiene permisos */}
        {dashboardPermissions.canReadTeamMetrics && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Tiempo por Aplicación
            </h2>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              {metricsLoading ? (
                <div className="p-6 text-center">
                  <LoadingSpinner />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Cargando métricas por aplicación...
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Aplicación
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Tiempo Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Casos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Promedio por Caso
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {applicationTimeMetrics &&
                      applicationTimeMetrics.length > 0 ? (
                        applicationTimeMetrics.map((app: any) => (
                          <tr
                            key={app.applicationId}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {app.applicationName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {app.totalTimeMinutes &&
                              !isNaN(app.totalTimeMinutes)
                                ? `${Math.floor(app.totalTimeMinutes / 60)}h ${
                                    app.totalTimeMinutes % 60
                                  }m`
                                : "0h 0m"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {app.casesCount || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {app.casesCount > 0 &&
                              app.totalTimeMinutes &&
                              !isNaN(app.totalTimeMinutes)
                                ? `${Math.round(
                                    app.totalTimeMinutes / app.casesCount
                                  )}m`
                                : "-"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                          >
                            No hay métricas por aplicación disponibles
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cases with Most Time - Solo si tiene permisos */}
        {dashboardPermissions.canReadTeamMetrics && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Casos con Mayor Tiempo Invertido
            </h2>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Número de Caso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Complejidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tiempo Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {metricsLoading ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                        >
                          <div className="py-8">
                            <LoadingSpinner />
                            <p className="mt-2 text-sm">
                              Cargando casos con mayor tiempo invertido...
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : caseTimeMetrics && caseTimeMetrics.length > 0 ? (
                      caseTimeMetrics.map((caso: any, index: number) => (
                        <tr
                          key={caso.caseId || `case-${index}`}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {caso.caseNumber}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            <div
                              className="max-w-xs truncate"
                              title={caso.description}
                            >
                              {caso.title}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                caso.complexity === "Alta Complejidad"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                  : caso.complexity === "Media Complejidad"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              }`}
                            >
                              {caso.complexity}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            <div className="flex items-center">
                              <div
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: caso.statusColor }}
                              />
                              {caso.status}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {Math.floor(caso.totalTimeMinutes / 60)}h{" "}
                            {caso.totalTimeMinutes % 60}m
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                        >
                          <div className="py-8">
                            <div className="flex flex-col items-center">
                              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <ActionIcon
                                  action="time"
                                  size="xl"
                                  className="text-gray-400"
                                />
                              </div>
                              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                No hay casos con tiempo registrado
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
                                Para ver casos en esta tabla, necesitas
                                registrar tiempo en los casos asignados.
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Recent Cases */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Casos Recientes
            </h2>
            <Link
              to="/cases"
              className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
            >
              Ver todos →
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Número de Caso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Clasificación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fecha de Creación
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {recentCases.length > 0 ? (
                    recentCases.map((caso) => (
                      <tr
                        key={caso.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {caso.numeroCaso}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                          {caso.descripcion}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              caso.clasificacion === "Alta Complejidad"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : caso.clasificacion === "Media Complejidad"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            }`}
                          >
                            {caso.clasificacion}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDatePreservingDay(caso.createdAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No hay casos registrados aún.{" "}
                        <Link
                          to="/cases/new"
                          className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Crear el primer caso
                        </Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
