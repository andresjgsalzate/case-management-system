import React from "react";
import { Permission } from "../../../types/permission";
import { ActionIcon } from "../../ui/ActionIcons";

interface PermissionStatsCardsProps {
  permissions: Permission[];
  total: number;
}

export const PermissionStatsCards: React.FC<PermissionStatsCardsProps> = ({
  permissions,
  total,
}) => {
  // Estadísticas calculadas
  const activePermissions = permissions.filter((p) => p.isActive).length;
  // const inactivePermissions = total - activePermissions;
  const modules = new Set(permissions.map((p) => p.module)).size;
  const actions = new Set(permissions.map((p) => p.action)).size;

  const stats = [
    {
      title: "Total Permisos",
      value: total,
      icon: "shield",
      color: "blue",
      description: "Permisos en el sistema",
    },
    {
      title: "Permisos Activos",
      value: activePermissions,
      icon: "activity",
      color: "green",
      description: "Permisos habilitados",
    },
    {
      title: "Módulos",
      value: modules,
      icon: "chart",
      color: "purple",
      description: "Módulos con permisos",
    },
    {
      title: "Acciones",
      value: actions,
      icon: "user",
      color: "orange",
      description: "Tipos de acciones",
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
      green:
        "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
      purple:
        "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
      orange:
        "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {stat.description}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                <ActionIcon action={stat.icon as any} size="md" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
