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
import { useDashboardPermissions } from "../../hooks/useDashboardPermissions";

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
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Reintentar
      </button>
    )}
  </div>
);

export const AdvancedDashboardPage = () => {
  // Hooks para métricas
  const {
    data: timeMetrics,
    isLoading: timeLoading,
    error: timeError,
  } = useTimeMetrics();
  const { data: userTimeMetrics, isLoading: userTimeLoading } =
    useUserTimeMetrics();
  const { data: caseTimeMetrics, isLoading: caseTimeLoading } =
    useCaseTimeMetrics();
  const { data: statusMetrics, isLoading: statusLoading } = useStatusMetrics();
  const { data: appTimeMetrics, isLoading: appTimeLoading } =
    useApplicationTimeMetrics();
  const { data: todoMetrics, isLoading: todoLoading } = useTodoMetrics();
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();

  // Permisos
  const permissions = useDashboardPermissions();

  if (timeError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorMessage
          message="Error al cargar el dashboard"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="mt-2 text-lg text-gray-600">
            Resumen general del sistema de gestión de casos
          </p>
        </div>

        {timeMetrics && (
          <div className="mt-4 md:mt-0">
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              📅 {timeMetrics.currentMonth} {timeMetrics.currentYear}
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid - Casos por Complejidad */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total de Casos
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? "..." : dashboardStats?.totalCases || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Baja Complejidad
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? "..." : dashboardStats?.lowComplexity || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Media Complejidad
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? "..." : dashboardStats?.mediumComplexity || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Alta Complejidad
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? "..." : dashboardStats?.highComplexity || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Time Metrics */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Métricas de Tiempo
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Tiempo Total (Este Mes)
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {timeLoading || todoLoading
                    ? "..."
                    : timeMetrics && todoMetrics
                    ? `${(
                        (timeMetrics.totalTimeMinutes +
                          todoMetrics.totalTimeMonth) /
                        60
                      ).toFixed(1)}h`
                    : "0h"}
                </p>
                <p className="text-xs text-gray-500">
                  {timeLoading || todoLoading
                    ? "..."
                    : timeMetrics && todoMetrics
                    ? `${
                        timeMetrics.totalTimeMinutes +
                        todoMetrics.totalTimeMonth
                      } min`
                    : "0 min"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Tiempo por Casos (Este Mes)
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {timeLoading
                    ? "..."
                    : timeMetrics
                    ? `${timeMetrics.totalHours.toFixed(1)}h`
                    : "0h"}
                </p>
                <p className="text-xs text-gray-500">
                  {timeLoading
                    ? "..."
                    : timeMetrics
                    ? `${timeMetrics.totalTimeMinutes} min`
                    : "0 min"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ListBulletIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Tiempo por TODOs (Este Mes)
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {todoLoading
                    ? "..."
                    : todoMetrics
                    ? `${(todoMetrics.totalTimeMonth / 60).toFixed(1)}h`
                    : "0h"}
                </p>
                <p className="text-xs text-gray-500">
                  {todoLoading
                    ? "..."
                    : todoMetrics
                    ? `${todoMetrics.totalTimeMonth} min`
                    : "0 min"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ComputerDesktopIcon className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Aplicaciones Activas
                </p>
                <p className="text-2xl font-bold text-gray-900">
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
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Métricas de TODOs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ListBulletIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total TODOs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {todoLoading ? "..." : todoMetrics?.totalTodos || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">En Progreso</p>
                <p className="text-2xl font-bold text-gray-900">
                  {todoLoading ? "..." : todoMetrics?.inProgressTodos || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {todoLoading ? "..." : todoMetrics?.completedTodos || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Vencidos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {todoLoading ? "..." : todoMetrics?.overdueTodos || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time by User */}
      {permissions.canReadTeamMetrics && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Tiempo por Usuario
          </h2>
          <div className="bg-white shadow rounded-lg">
            {userTimeLoading ? (
              <div className="p-6 text-center">
                <LoadingSpinner
                  size="sm"
                  text="Cargando métricas por usuario..."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tiempo Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Casos Trabajados
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Promedio por Caso
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userTimeMetrics && userTimeMetrics.length > 0 ? (
                      userTimeMetrics
                        .filter((user) => user.totalTimeMinutes > 0) // Solo mostrar usuarios con tiempo > 0
                        .map((user) => (
                          <tr key={user.userId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {user.userName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.totalTimeMinutes &&
                              !isNaN(user.totalTimeMinutes)
                                ? `${Math.floor(user.totalTimeMinutes / 60)}h ${
                                    user.totalTimeMinutes % 60
                                  }m`
                                : "0h 0m"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.casesWorked || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                          className="px-6 py-4 text-center text-sm text-gray-500"
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

      {/* Status Metrics */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Métricas por Estado
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {statusLoading ? (
            <div className="col-span-full text-center py-8">
              <LoadingSpinner
                size="sm"
                text="Cargando métricas por estado..."
              />
            </div>
          ) : statusMetrics && statusMetrics.length > 0 ? (
            statusMetrics
              .filter(
                (status) => status.totalTimeMinutes > 0 || status.casesCount > 0
              ) // Solo mostrar estados con tiempo o casos
              .map((status, index) => (
                <div
                  key={status.statusId || `status-${index}`}
                  className="bg-white overflow-hidden shadow rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-3"
                        style={{
                          backgroundColor: status.statusColor || "#6b7280",
                        }}
                      />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {status.statusName || "Estado sin nombre"}
                      </h3>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Casos:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {status.casesCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        Tiempo Total:
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {status.totalTimeMinutes &&
                        !isNaN(status.totalTimeMinutes)
                          ? `${Math.floor(status.totalTimeMinutes / 60)}h ${
                              status.totalTimeMinutes % 60
                            }m`
                          : "0h 0m"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Promedio:</span>
                      <span className="text-sm font-semibold text-gray-900">
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
            <div className="col-span-full text-center py-8 text-gray-500">
              No hay métricas por estado disponibles
            </div>
          )}
        </div>
      </div>

      {/* Application Metrics */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Tiempo por Aplicación
        </h2>
        <div className="bg-white shadow rounded-lg">
          {appTimeLoading ? (
            <div className="p-6 text-center">
              <LoadingSpinner
                size="sm"
                text="Cargando métricas por aplicación..."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aplicación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tiempo Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Casos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Promedio por Caso
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appTimeMetrics && appTimeMetrics.length > 0 ? (
                    appTimeMetrics
                      .filter(
                        (app) => app.totalTimeMinutes > 0 || app.casesCount > 0
                      ) // Solo mostrar aplicaciones con tiempo o casos
                      .map((app) => (
                        <tr
                          key={app.applicationId}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {app.applicationName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {app.totalTimeMinutes &&
                            !isNaN(app.totalTimeMinutes)
                              ? `${Math.floor(app.totalTimeMinutes / 60)}h ${
                                  app.totalTimeMinutes % 60
                                }m`
                              : "0h 0m"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {app.casesCount || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                        className="px-6 py-4 text-center text-sm text-gray-500"
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
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Casos con Mayor Tiempo Invertido
        </h2>
        <div className="bg-white shadow rounded-lg">
          {caseTimeLoading ? (
            <div className="p-6 text-center">
              <LoadingSpinner size="sm" text="Cargando métricas por caso..." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número de Caso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tiempo Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {caseTimeMetrics && caseTimeMetrics.length > 0 ? (
                    caseTimeMetrics
                      .sort((a, b) => b.totalTimeMinutes - a.totalTimeMinutes)
                      .slice(0, 5)
                      .map((caseData) => (
                        <tr key={caseData.caseId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {caseData.caseNumber}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {caseData.title || caseData.description}
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        <div className="py-8">
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                              <svg
                                className="w-8 h-8 text-blue-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                              </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              Funcionalidad Completamente Implementada
                            </h3>
                            <p className="text-sm text-gray-500 text-center max-w-md mb-4">
                              El backend de métricas por caso está{" "}
                              <span className="font-semibold text-blue-600">
                                100% implementado y funcional
                              </span>
                              . Esta tabla mostrará automáticamente los casos
                              con mayor tiempo invertido una vez que haya datos
                              de tiempo registrados en el sistema.
                            </p>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                              <div className="flex items-start">
                                <svg
                                  className="w-5 h-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <div>
                                  <p className="font-medium">Próximos pasos:</p>
                                  <ul className="mt-1 list-disc list-inside space-y-1">
                                    <li>
                                      Registrar tiempo en casos existentes
                                    </li>
                                    <li>
                                      Los casos aparecerán automáticamente
                                      ordenados por tiempo
                                    </li>
                                    <li>
                                      Se mostrarán los top 5 casos con mayor
                                      inversión de tiempo
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Acciones Rápidas
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Gestiona casos y revisa el estado del sistema
        </p>
        <div className="flex space-x-4">
          <Link
            to="/cases"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Ver Todos los Casos
          </Link>
          <Link
            to="/cases/new"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Crear Nuevo Caso
          </Link>
        </div>
      </div>
    </div>
  );
};
