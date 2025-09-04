import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  useModulePermissions,
  useFeaturePermissions,
} from "../hooks/usePermissions";
import {
  InformationCircleIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

interface PermissionIndicatorProps {
  showInProduction?: boolean;
}

export const PermissionIndicator: React.FC<PermissionIndicatorProps> = ({
  showInProduction = false,
}) => {
  const { user, hasPermission } = useAuth();
  const { allowedModules, allowedAdminSections, isAdmin } =
    useModulePermissions();
  const featurePermissions = useFeaturePermissions();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // En producción, solo mostrar si se permite explícitamente o en desarrollo
  const isDevelopment =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  if (!isDevelopment && !showInProduction) {
    return null;
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-lg z-50 transition-all"
        title="Mostrar información de permisos"
      >
        <EyeIcon className="h-5 w-5" />
      </button>
    );
  }

  const samplePermissions = [
    "cases.read_own",
    "cases.create_own",
    "cases.update_own",
    "notes.read_own",
    "todos.read_own",
    "users.read_all",
    "roles.read_all",
    "config.read_all",
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-sm">
        {/* Header */}
        <div
          className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            <InformationCircleIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Permisos Usuario
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsVisible(false);
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Ocultar"
            >
              <EyeSlashIcon className="h-4 w-4 text-gray-500" />
            </button>
            <ChevronDownIcon
              className={`h-4 w-4 text-gray-500 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
            {/* User Info */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Usuario Actual
              </h4>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>
                  <strong>Nombre:</strong> {user?.fullName || "N/A"}
                </p>
                <p>
                  <strong>Email:</strong> {user?.email || "N/A"}
                </p>
                <p>
                  <strong>Rol:</strong>
                  <span
                    className={`ml-1 px-2 py-1 rounded text-xs ${
                      isAdmin
                        ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                    }`}
                  >
                    {user?.roleName || "N/A"}
                  </span>
                </p>
              </div>
            </div>

            {/* Modules Access */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Módulos Permitidos ({allowedModules.length})
              </h4>
              <div className="space-y-1">
                {allowedModules.map((module) => (
                  <div
                    key={module.name}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {module.name}
                    </span>
                  </div>
                ))}
                {allowedModules.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Sin módulos permitidos
                  </p>
                )}
              </div>
            </div>

            {/* Admin Sections */}
            {allowedAdminSections.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Secciones Admin ({allowedAdminSections.length})
                </h4>
                <div className="space-y-1">
                  {allowedAdminSections.map((section) => (
                    <div key={section.id} className="space-y-1">
                      <div className="flex items-center space-x-2 text-sm">
                        <CheckCircleIcon className="h-4 w-4 text-orange-500" />
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          {section.title}
                        </span>
                      </div>
                      {section.items.map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center space-x-2 text-sm ml-6"
                        >
                          <div className="h-1 w-1 bg-gray-400 rounded-full"></div>
                          <span className="text-gray-600 dark:text-gray-400">
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sample Permissions Check */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Verificación de Permisos
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {samplePermissions.map((permission) => {
                  const hasAccess = hasPermission(permission);
                  return (
                    <div
                      key={permission}
                      className="flex items-center space-x-2 text-xs"
                    >
                      {hasAccess ? (
                        <CheckCircleIcon className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-3 w-3 text-red-500" />
                      )}
                      <code className="text-gray-600 dark:text-gray-400">
                        {permission}
                      </code>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Feature Permissions Summary */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Funcionalidades
              </h4>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div
                  className={`px-2 py-1 rounded ${
                    featurePermissions.canCreateCases
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  Crear Casos
                </div>
                <div
                  className={`px-2 py-1 rounded ${
                    featurePermissions.canCreateNotes
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  Crear Notas
                </div>
                <div
                  className={`px-2 py-1 rounded ${
                    featurePermissions.canManageUsers
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  Gestión Usuarios
                </div>
                <div
                  className={`px-2 py-1 rounded ${
                    featurePermissions.canViewReports
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  Ver Reportes
                </div>
              </div>
            </div>

            {/* Environment indicator */}
            <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2">
              Entorno: {isDevelopment ? "Desarrollo" : "Producción"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
