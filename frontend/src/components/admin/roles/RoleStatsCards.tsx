import { useEffect, useState } from "react";
import {
  UserGroupIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { roleService } from "../../../services/roleService";
import type { RoleStats } from "../../../types/role";

export default function RoleStatsCards() {
  const [stats, setStats] = useState<RoleStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const data = await roleService.getRoleStats();
      setStats(data);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
      // Datos mock en caso de error
      setStats({
        totalRoles: 0,
        activeRoles: 0,
        inactiveRoles: 0,
        totalPermissions: 0,
        rolesWithUsers: 0,
        systemRoles: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4"
          >
            <div className="animate-pulse">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats && !isLoading) return null;

  const statsCards = [
    {
      id: "total",
      label: "Total de Roles",
      value: stats?.totalRoles || 0,
      icon: UserGroupIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
    },
    {
      id: "active",
      label: "Roles Activos",
      value: stats?.activeRoles || 0,
      icon: EyeIcon,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-100",
    },
    {
      id: "inactive",
      label: "Roles Inactivos",
      value: stats?.inactiveRoles || 0,
      icon: EyeSlashIcon,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-100",
    },
    {
      id: "withPerms",
      label: "Roles Configurados",
      value: (stats as any)?.rolesWithMostPermissions?.length || 0,
      icon: ShieldCheckIcon,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statsCards.map((card) => {
        const IconComponent = card.icon;

        return (
          <div
            key={card.id}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${card.borderColor} dark:border-gray-700 p-4 hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <IconComponent className={`h-5 w-5 ${card.color}`} />
              </div>
              <button
                onClick={loadStats}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1 rounded"
                title="Actualizar estadísticas"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                {card.label}
              </p>
              <p className={`text-2xl font-bold ${card.color}`}>
                {card.value.toLocaleString()}
              </p>
            </div>

            {/* Indicador de progreso para algunos cards */}
            {card.id === "active" && (stats?.totalRoles || 0) > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>Activos</span>
                  <span>
                    {Math.round(
                      ((stats?.activeRoles || 0) / (stats?.totalRoles || 1)) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                  <div
                    className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        ((stats?.activeRoles || 0) / (stats?.totalRoles || 1)) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
