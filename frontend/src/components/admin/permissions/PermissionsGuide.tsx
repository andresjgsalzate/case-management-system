import React from "react";
import {
  Shield,
  Users,
  Database,
  Settings,
  Lock,
  Unlock,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export const PermissionsGuide: React.FC = () => {
  const permissionStructure = [
    {
      module: "usuarios",
      description: "Gestión de usuarios del sistema",
      actions: [
        { action: "read", description: "Ver información de usuarios" },
        { action: "create", description: "Crear nuevos usuarios" },
        { action: "update", description: "Modificar usuarios existentes" },
        { action: "delete", description: "Eliminar usuarios" },
        {
          action: "manage",
          description: "Administración completa de usuarios",
        },
      ],
    },
    {
      module: "roles",
      description: "Administración de roles y permisos",
      actions: [
        { action: "read", description: "Ver roles del sistema" },
        { action: "create", description: "Crear nuevos roles" },
        { action: "update", description: "Modificar roles existentes" },
        { action: "delete", description: "Eliminar roles" },
        { action: "assign", description: "Asignar roles a usuarios" },
      ],
    },
    {
      module: "permisos",
      description: "Gestión del sistema de permisos",
      actions: [
        { action: "read", description: "Ver permisos del sistema" },
        { action: "create", description: "Crear nuevos permisos" },
        { action: "update", description: "Modificar permisos existentes" },
        { action: "delete", description: "Eliminar permisos" },
        { action: "assign", description: "Asignar permisos a roles" },
      ],
    },
  ];

  const scopes = [
    {
      name: "own",
      description: "Solo recursos propios",
      color: "blue",
      icon: Lock,
      example: "Un usuario solo puede ver sus propios casos",
    },
    {
      name: "team",
      description: "Recursos del equipo",
      color: "yellow",
      icon: Users,
      example: "Un supervisor puede ver casos de su equipo",
    },
    {
      name: "all",
      description: "Todos los recursos",
      color: "green",
      icon: Unlock,
      example: "Un administrador puede ver todos los casos",
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
      yellow:
        "bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
      green:
        "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
      purple:
        "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Shield className="h-10 w-10 text-purple-600 dark:text-purple-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Guía del Sistema de Permisos
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Comprende cómo funciona nuestro sistema de permisos basado en roles
        </p>
      </div>

      {/* Conceptos Básicos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Database className="h-5 w-5 mr-2 text-purple-600" />
          Conceptos Básicos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
              <UserCheck className="h-4 w-4 mr-2 text-blue-600" />
              Usuarios
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Personas que utilizan el sistema. Cada usuario tiene uno o más
              roles asignados.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
              <Users className="h-4 w-4 mr-2 text-green-600" />
              Roles
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Conjuntos de permisos que definen qué puede hacer un usuario en el
              sistema.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
              <Shield className="h-4 w-4 mr-2 text-purple-600" />
              Permisos
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Autorizaciones específicas para realizar acciones en módulos del
              sistema.
            </p>
          </div>
        </div>
      </div>

      {/* Estructura de Permisos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2 text-purple-600" />
          Estructura de Permisos
        </h2>
        <div className="space-y-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <h3 className="text-lg font-medium text-purple-900 dark:text-purple-100 mb-2">
              Formato: módulo.acción_scope
            </h3>
            <p className="text-purple-700 dark:text-purple-300 text-sm">
              Ejemplo:{" "}
              <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">
                usuarios.read_all
              </code>
            </p>
            <p className="text-purple-600 dark:text-purple-400 text-xs mt-2">
              Permite leer todos los usuarios del sistema
            </p>
          </div>
        </div>
      </div>

      {/* Scopes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Eye className="h-5 w-5 mr-2 text-purple-600" />
          Niveles de Acceso (Scopes)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scopes.map((scope) => {
            const IconComponent = scope.icon;
            return (
              <div
                key={scope.name}
                className={`border rounded-lg p-4 ${getColorClasses(
                  scope.color
                )}`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <IconComponent className="h-5 w-5" />
                  <h3 className="font-medium">{scope.name}</h3>
                </div>
                <p className="text-sm mb-3">{scope.description}</p>
                <div className="text-xs opacity-75">
                  <strong>Ejemplo:</strong> {scope.example}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Módulos y Acciones */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Database className="h-5 w-5 mr-2 text-purple-600" />
          Módulos y Acciones Disponibles
        </h2>
        <div className="space-y-6">
          {permissionStructure.map((module) => (
            <div
              key={module.module}
              className="border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {module.module}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {module.description}
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {module.actions.map((action) => (
                    <div
                      key={action.action}
                      className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {action.action === "read" && (
                          <Eye className="h-4 w-4 text-blue-600" />
                        )}
                        {action.action === "create" && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        {action.action === "update" && (
                          <Edit className="h-4 w-4 text-yellow-600" />
                        )}
                        {action.action === "delete" && (
                          <Trash2 className="h-4 w-4 text-red-600" />
                        )}
                        {action.action === "manage" && (
                          <Settings className="h-4 w-4 text-purple-600" />
                        )}
                        {action.action === "assign" && (
                          <UserCheck className="h-4 w-4 text-indigo-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {action.action}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {action.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mejores Prácticas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <CheckCircle className="h-5 w-5 mr-2 text-purple-600" />
          Mejores Prácticas
        </h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Principio del Mínimo Privilegio
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Asigna solo los permisos necesarios para que el usuario pueda
                realizar su trabajo.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Uso de Roles
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Agrupa permisos relacionados en roles para facilitar la
                administración.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Revisión Regular
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Revisa periódicamente los permisos asignados para mantener la
                seguridad.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Cuidado con Permisos Amplios
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Los permisos con scope "all" deben asignarse cuidadosamente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
