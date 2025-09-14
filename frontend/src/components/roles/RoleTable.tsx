import React from "react";
import { ActionIcon } from "../ui/ActionIcons";
import { Role } from "../../types/role";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { LoadingSpinner } from "../ui/LoadingSpinner";

interface RoleTableProps {
  roles: Role[];
  loading: boolean;
  onEdit?: (role: Role) => void;
  onDelete?: (role: Role) => void;
  onManagePermissions?: (role: Role) => void;
  onClone?: (role: Role) => void;
  currentPage: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export const RoleTable: React.FC<RoleTableProps> = ({
  roles,
  loading,
  onEdit,
  onDelete,
  onManagePermissions,
  onClone,
  currentPage,
  totalPages,
  total,
  onPageChange,
}) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const isSystemRole = (_roleName: string) => {
    // Los roles del sistema se determinan por la propiedad isSystemRole del backend
    // En lugar de hardcodear, esto debería venir del objeto role
    return false; // Temporalmente disabled, debe implementarse consultando role.isSystemRole
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Roles ({total})
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Página {currentPage} de {totalPages}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Permisos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Usuarios
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Creado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {roles.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <ActionIcon
                      action="shield"
                      size="xl"
                      color="neutral"
                      className="mb-4"
                    />
                    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                      No se encontraron roles
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm">
                      Intenta modificar los filtros de búsqueda
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              roles.map((role) => (
                <tr
                  key={role.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  {/* Nombre del rol */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div
                          className={`p-2 rounded-full ${
                            isSystemRole(role.name)
                              ? "bg-blue-100 dark:bg-blue-900/20"
                              : "bg-purple-100 dark:bg-purple-900/20"
                          }`}
                        >
                          <ActionIcon
                            action="shield"
                            size="sm"
                            className={
                              isSystemRole(role.name)
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-purple-600 dark:text-purple-400"
                            }
                          />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {role.name}
                          {isSystemRole(role.name) && (
                            <Badge variant="primary" className="ml-2 text-xs">
                              Sistema
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {role.id.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Descripción */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                      {role.description || "Sin descripción"}
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={role.isActive ? "success" : "danger"}
                      className="flex items-center gap-1"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          role.isActive ? "bg-green-400" : "bg-red-400"
                        }`}
                      />
                      {role.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>

                  {/* Permisos */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900 dark:text-gray-100">
                      <ActionIcon
                        action="settings"
                        size="sm"
                        color="neutral"
                        className="mr-1"
                      />
                      {role.permissions?.length || 0} permisos
                    </div>
                  </td>

                  {/* Usuarios */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900 dark:text-gray-100">
                      <ActionIcon
                        action="user"
                        size="sm"
                        color="neutral"
                        className="mr-1"
                      />
                      {role.userCount || 0} usuarios
                    </div>
                  </td>

                  {/* Fecha de creación */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <ActionIcon
                        action="calendar"
                        size="xs"
                        className="mr-1"
                      />
                      {formatDate(role.createdAt)}
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(role)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar rol"
                        >
                          <ActionIcon action="edit" size="sm" />
                        </Button>
                      )}

                      {onManagePermissions && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onManagePermissions(role)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Gestionar permisos"
                        >
                          <ActionIcon action="settings" size="sm" />
                        </Button>
                      )}

                      {onClone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onClone(role)}
                          className="text-green-600 hover:text-green-900"
                          title="Clonar rol"
                        >
                          <ActionIcon action="duplicate" size="sm" />
                        </Button>
                      )}

                      {onDelete && !isSystemRole(role.name) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(role)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar rol"
                        >
                          <ActionIcon action="delete" size="sm" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando {(currentPage - 1) * 10 + 1} a{" "}
              {Math.min(currentPage * 10, total)} de {total} roles
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>

              {/* Números de página */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
