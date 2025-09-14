import React from "react";
import { ActionIcon } from "../ui/ActionIcons";
import { User } from "../../types/user";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { LoadingSpinner } from "../ui/LoadingSpinner";

interface UserTableProps {
  users: User[];
  loading: boolean;
  onView?: (user: User) => void;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  onToggleStatus?: (user: User) => void;
  onChangePassword?: (user: User) => void;
  currentPage: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  loading,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onChangePassword,
  currentPage,
  totalPages,
  total,
  onPageChange,
}) => {
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleBadgeColor = (roleName: string) => {
    // En lugar de hardcodear los roles, se debe usar una función hash o mapeo dinámico
    const hash = roleName.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    const colors = [
      "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
      "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
    ];

    return colors[Math.abs(hash) % colors.length];
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header con información */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Mostrando {users.length} de {total} usuarios
        </p>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Último acceso
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Creado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  No se encontraron usuarios
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  {/* Usuario */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {user.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user.fullName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          <ActionIcon
                            action="email"
                            size="xs"
                            className="mr-1"
                          />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Rol */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getRoleBadgeColor(user.roleName)}>
                      {user.roleName}
                    </Badge>
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.isActive ? (
                        <>
                          <ActionIcon
                            action="check"
                            size="sm"
                            color="success"
                            className="mr-2"
                          />
                          <span className="text-green-800 dark:text-green-400 text-sm">
                            Activo
                          </span>
                        </>
                      ) : (
                        <>
                          <ActionIcon
                            action="warning"
                            size="sm"
                            color="danger"
                            className="mr-2"
                          />
                          <span className="text-red-800 dark:text-red-400 text-sm">
                            Inactivo
                          </span>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Último acceso */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.lastLoginAt ? (
                      <div className="flex items-center">
                        <ActionIcon
                          action="calendar"
                          size="xs"
                          className="mr-1"
                        />
                        {formatDate(user.lastLoginAt)}
                      </div>
                    ) : (
                      <span className="text-gray-400">Nunca</span>
                    )}
                  </td>

                  {/* Creado */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <ActionIcon
                        action="calendar"
                        size="xs"
                        className="mr-1"
                      />
                      {formatDate(user.createdAt)}
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {onView && (
                        <button
                          onClick={() => onView(user)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Ver detalles"
                        >
                          <ActionIcon action="view" size="sm" />
                        </button>
                      )}

                      {onEdit && (
                        <button
                          onClick={() => onEdit(user)}
                          className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                          title="Editar"
                        >
                          <ActionIcon action="edit" size="sm" />
                        </button>
                      )}

                      {onChangePassword && (
                        <button
                          onClick={() => onChangePassword(user)}
                          className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                          title="Cambiar contraseña"
                        >
                          <ActionIcon action="changePassword" size="sm" />
                        </button>
                      )}

                      {onToggleStatus && (
                        <button
                          onClick={() => onToggleStatus(user)}
                          className={
                            user.isActive
                              ? "text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              : "text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          }
                          title={
                            user.isActive
                              ? "Desactivar usuario"
                              : "Activar usuario"
                          }
                        >
                          {user.isActive ? (
                            <ActionIcon action="warning" size="sm" />
                          ) : (
                            <ActionIcon action="check" size="sm" />
                          )}
                        </button>
                      )}

                      {onDelete && (
                        <button
                          onClick={() => onDelete(user)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Eliminar"
                        >
                          <ActionIcon action="delete" size="sm" />
                        </button>
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
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>

            {/* Números de página */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, currentPage - 2) + i;
              if (pageNum > totalPages) return null;

              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}

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
      )}
    </div>
  );
};
