import { useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";

export interface DashboardPermissions {
  canReadOwnMetrics: boolean;
  canReadTeamMetrics: boolean;
  canReadAllMetrics: boolean;
  canExportMetrics: boolean;
  canManageMetrics: boolean;
}

export const useDashboardPermissions = (): DashboardPermissions => {
  const { user, hasPermission } = useAuth();

  return useMemo(() => {
    if (!user) {
      return {
        canReadOwnMetrics: false,
        canReadTeamMetrics: false,
        canReadAllMetrics: false,
        canExportMetrics: false,
        canManageMetrics: false,
      };
    }

    // Determinar permisos basados en permisos específicos de la base de datos
    const isAdmin =
      hasPermission("permissions.admin.all") ||
      hasPermission("roles.manage.all") ||
      hasPermission("users.admin.all");
    const isSupervisor =
      hasPermission("metrics.view.team") || hasPermission("cases.view.team");

    return {
      // Verificar permisos específicos de métricas
      canReadOwnMetrics:
        hasPermission("metrics.time.own") ||
        hasPermission("metrics.cases.own") ||
        hasPermission("metrics.todos.own"),

      // Supervisores y admins pueden ver métricas del equipo
      canReadTeamMetrics:
        hasPermission("metrics.time.team") ||
        hasPermission("metrics.cases.team") ||
        hasPermission("metrics.todos.team") ||
        hasPermission("metrics.users.team"),

      // Solo admins pueden ver todas las métricas
      canReadAllMetrics:
        hasPermission("metrics.time.all") ||
        hasPermission("metrics.cases.all") ||
        hasPermission("metrics.todos.all") ||
        hasPermission("metrics.users.all") ||
        hasPermission("metrics.applications.all"),

      // Supervisores y admins pueden exportar
      canExportMetrics: isSupervisor || isAdmin,

      // Solo admins pueden gestionar métricas
      canManageMetrics: isAdmin,
    };
  }, [user, hasPermission]);
};
