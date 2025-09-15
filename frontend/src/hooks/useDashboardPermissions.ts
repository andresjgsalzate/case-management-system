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
      user.roleName === "Administrador" || user.roleName === "admin";
    const isSupervisor =
      user.roleName === "Supervisor" || user.roleName === "supervisor";

    return {
      // Verificar permisos específicos de métricas
      canReadOwnMetrics:
        hasPermission("metrics.time.read.own") ||
        hasPermission("metrics.cases.read.own") ||
        hasPermission("metrics.todos.read.own"),

      // Supervisores y admins pueden ver métricas del equipo
      canReadTeamMetrics:
        hasPermission("metrics.time.read.team") ||
        hasPermission("metrics.cases.read.team") ||
        hasPermission("metrics.todos.read.team") ||
        hasPermission("metrics.users.read.team"),

      // Solo admins pueden ver todas las métricas
      canReadAllMetrics:
        hasPermission("metrics.time.read.all") ||
        hasPermission("metrics.cases.read.all") ||
        hasPermission("metrics.todos.read.all") ||
        hasPermission("metrics.users.read.all") ||
        hasPermission("metrics.applications.read.all"),

      // Supervisores y admins pueden exportar
      canExportMetrics: isSupervisor || isAdmin,

      // Solo admins pueden gestionar métricas
      canManageMetrics: isAdmin,
    };
  }, [user, hasPermission]);
};
