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
  const { user, canAccessModule } = useAuth();

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

    // Verificar permisos específicos del módulo de dashboard
    const canAccessDashboard = canAccessModule("dashboard");

    if (!canAccessDashboard) {
      return {
        canReadOwnMetrics: false,
        canReadTeamMetrics: false,
        canReadAllMetrics: false,
        canExportMetrics: false,
        canManageMetrics: false,
      };
    }

    // Determinar permisos basados en el rol
    const isAdmin =
      user.roleName === "Administrador" || user.roleName === "admin";
    const isSupervisor =
      user.roleName === "Supervisor" || user.roleName === "supervisor";

    return {
      // Todos pueden ver sus propias métricas si tienen acceso al dashboard
      canReadOwnMetrics: true,

      // Supervisores y admins pueden ver métricas del equipo
      canReadTeamMetrics: isSupervisor || isAdmin,

      // Solo admins pueden ver todas las métricas
      canReadAllMetrics: isAdmin,

      // Supervisores y admins pueden exportar
      canExportMetrics: isSupervisor || isAdmin,

      // Solo admins pueden gestionar métricas
      canManageMetrics: isAdmin,
    };
  }, [user, canAccessModule]);
};
