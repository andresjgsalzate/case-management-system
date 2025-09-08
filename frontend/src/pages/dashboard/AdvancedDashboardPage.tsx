import React from "react";
import { Link } from "react-router-dom";
import {
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  ComputerDesktopIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import {
  useTimeMetrics,
  useUserTimeMetrics,
  useCaseTimeMetrics,
  useStatusMetrics,
  useApplicationTimeMetrics,
  useTodoMetrics,
  useDashboardStats,
} from "../../hooks/useDashboardMetrics";
import { useCases } from "../../hooks/useCases";
import { Button } from "../../components/ui/Button";
import { PageWrapper } from "../../components/layout/PageWrapper";

const LoadingSpinner: React.FC<{ size?: "sm" | "lg"; text?: string }> = ({
  size = "sm",
  text,
}) => (
  <div className="flex flex-col items-center justify-center">
    <div
      className={`animate-spin rounded-full border-b-2 border-indigo-600 ${
        size === "lg" ? "h-12 w-12" : "h-6 w-6"
      }`}
    ></div>
    {text && <p className="mt-2 text-sm text-gray-500">{text}</p>}
  </div>
);

const ErrorMessage: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => (
  <div className="text-center py-8">
    <p className="text-red-600 mb-4">{message}</p>
    {onRetry && (
      <Button onClick={onRetry} variant="danger">
        Reintentar
      </Button>
    )}
  </div>
);

export const AdvancedDashboardPage: React.FC = () => {
  // Hooks para obtener datos
  const {
    data: dashboardStats,
    isLoading,
    error,
    refetch,
  } = useDashboardStats();

  // Hook para obtener casos
  const { data: cases } = useCases();

  // Hooks para métricas de tiempo
  const { data: timeMetrics, isLoading: timeLoading } = useTimeMetrics();
  const { data: userTimeMetrics, isLoading: userTimeLoading } =
    useUserTimeMetrics();
  const { data: caseTimeMetrics, isLoading: caseTimeLoading } =
    useCaseTimeMetrics();
  const { data: statusMetrics, isLoading: statusLoading } = useStatusMetrics();
  const { data: appTimeMetrics, isLoading: appTimeLoading } =
    useApplicationTimeMetrics();

  // Métricas de TODOs
  const { data: todoMetrics, isLoading: todoLoading } = useTodoMetrics();

  // Calcular estadísticas desde los casos reales - usar useMemo para estabilizar
  const stats = React.useMemo(() => {
    if (!dashboardStats)
      return {
        totalCases: 0,
        lowComplexity: 0,
        mediumComplexity: 0,
        highComplexity: 0,
        thisMonth: 0,
        thisWeek: 0,
      };

    return {
      totalCases: dashboardStats.totalCases,
      lowComplexity: dashboardStats.lowComplexity,
      mediumComplexity: dashboardStats.mediumComplexity,
      highComplexity: dashboardStats.highComplexity,
      thisMonth: dashboardStats.thisMonth,
      thisWeek: dashboardStats.thisWeek,
    };
  }, [dashboardStats]);

  // Para los casos recientes usar los casos reales
  const recentCases = React.useMemo(() => {
    if (!cases) return [];
    return [...cases]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 5);
  }, [cases]);

  const formatDateLocal = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("es-ES");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" text="Cargando dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message="Error al cargar el dashboard"
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Resumen general del sistema de gestión de casos
          </p>
        </div>
      </div>

      {/* Stats Grid - Optimized for wide screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
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

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
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

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
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

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
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

      {/* Time Metrics */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Métricas de Tiempo
          </h2>
          {timeMetrics && (
            <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
              📅 {timeMetrics.currentMonth} {timeMetrics.currentYear}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Tiempo Total (Este Mes)
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {timeLoading
                    ? "..."
                    : timeMetrics
                    ? `${timeMetrics.totalHours.toFixed(1)}h`
                    : "0h"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {timeLoading
                    ? "..."
                    : timeMetrics
                    ? `${timeMetrics.totalTimeMinutes} min`
                    : "0 min"}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Tiempo por Casos (Este Mes)
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {timeLoading
                    ? "..."
                    : timeMetrics
                    ? `${timeMetrics.casesTimeHours.toFixed(1)}h`
                    : "0h"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {timeLoading
                    ? "..."
                    : timeMetrics
                    ? `${Math.round(timeMetrics.casesTimeMinutes)} min`
                    : "0 min"}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ListBulletIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Tiempo por TODOs (Este Mes)
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {timeLoading
                    ? "..."
                    : timeMetrics
                    ? `${timeMetrics.todosTimeHours.toFixed(1)}h`
                    : "0h"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {timeLoading
                    ? "..."
                    : timeMetrics
                    ? `${timeMetrics.todosTimeMinutes} min`
                    : "0 min"}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ComputerDesktopIcon className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Aplicaciones (Este Mes)
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {appTimeLoading
                    ? "..."
                    : appTimeMetrics
                    ? appTimeMetrics.length
                    : "0"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TODO Metrics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Métricas de TODOs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ListBulletIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total TODOs
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {todoLoading ? "..." : todoMetrics?.totalTodos || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  En Progreso
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {todoLoading ? "..." : todoMetrics?.inProgressTodos || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Completados
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {todoLoading ? "..." : todoMetrics?.completedTodos || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Vencidos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {todoLoading ? "..." : todoMetrics?.overdueTodos || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time by User */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Tiempo por Usuario
        </h2>
        <div className="table-card">
          {userTimeLoading ? (
            <div className="p-6 text-center">
              <LoadingSpinner
                size="sm"
                text="Cargando métricas por usuario..."
              />
            </div>
          ) : (
            <div className="table-overflow-container">
              <table className="full-width-table">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tiempo Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Casos Trabajados
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Promedio por Caso
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {userTimeMetrics && userTimeMetrics.length > 0 ? (
                    userTimeMetrics.map((user) => (
                      <tr
                        key={user.userId}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {user.userName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {user.totalTimeMinutes &&
                          !isNaN(user.totalTimeMinutes)
                            ? `${Math.floor(user.totalTimeMinutes / 60)}h ${
                                user.totalTimeMinutes % 60
                              }m`
                            : "0h 0m"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {user.casesWorked || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {user.casesWorked > 0 &&
                          user.totalTimeMinutes &&
                          !isNaN(user.totalTimeMinutes)
                            ? `${Math.round(
                                user.totalTimeMinutes / user.casesWorked
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

      {/* Status Metrics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Métricas por Estado
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {statusLoading ? (
            <div className="col-span-full text-center py-8">
              <LoadingSpinner
                size="sm"
                text="Cargando métricas por estado..."
              />
            </div>
          ) : statusMetrics && statusMetrics.length > 0 ? (
            statusMetrics.map((status, index) => (
              <div
                key={status.statusId || `status-${index}`}
                className="card p-6"
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

      {/* Application Metrics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Tiempo por Aplicación
        </h2>
        <div className="table-card">
          {appTimeLoading ? (
            <div className="p-6 text-center">
              <LoadingSpinner
                size="sm"
                text="Cargando métricas por aplicación..."
              />
            </div>
          ) : (
            <div className="table-overflow-container">
              <table className="full-width-table">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Aplicación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tiempo Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Casos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Promedio por Caso
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {appTimeMetrics && appTimeMetrics.length > 0 ? (
                    appTimeMetrics.map((app) => (
                      <tr
                        key={app.applicationId}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {app.applicationName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {app.totalTimeMinutes && !isNaN(app.totalTimeMinutes)
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

      {/* Cases with Most Time */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Casos con Mayor Tiempo Invertido
        </h2>
        <div className="table-card">
          {caseTimeLoading ? (
            <div className="p-6 text-center">
              <LoadingSpinner size="sm" text="Cargando métricas por caso..." />
            </div>
          ) : (
            <div className="table-overflow-container">
              <table className="full-width-table">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Número de Caso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tiempo Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {caseTimeMetrics && caseTimeMetrics.length > 0 ? (
                    caseTimeMetrics
                      .sort((a, b) => b.totalTimeMinutes - a.totalTimeMinutes)
                      .slice(0, 5)
                      .map((caseData) => (
                        <tr
                          key={caseData.caseId}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {caseData.caseNumber}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                            {caseData.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                              style={{
                                backgroundColor:
                                  caseData.statusColor || "#6b7280",
                              }}
                            >
                              {caseData.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {caseData.totalTimeMinutes &&
                            !isNaN(caseData.totalTimeMinutes)
                              ? `${Math.floor(
                                  caseData.totalTimeMinutes / 60
                                )}h ${caseData.totalTimeMinutes % 60}m`
                              : "0h 0m"}
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No hay métricas de tiempo por caso disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent Cases */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Casos Recientes
          </h2>
          <Link
            to="/cases"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Ver todos →
          </Link>
        </div>
        <div className="table-card">
          <div className="table-overflow-container">
            <table className="full-width-table">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Número de Caso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Clasificación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fecha
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
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {caso.descripcion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            caso.clasificacion === "Alta Complejidad"
                              ? "complexity-high"
                              : caso.clasificacion === "Media Complejidad"
                              ? "complexity-medium"
                              : "complexity-low"
                          }`}
                        >
                          {caso.clasificacion}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDateLocal(caso.fecha)}
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
                        className="text-primary-600 hover:text-primary-700"
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
    </PageWrapper>
  );
};
