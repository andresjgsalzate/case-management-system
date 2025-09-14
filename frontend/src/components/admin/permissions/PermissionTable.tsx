import React from "react";
import { ActionIcon } from "../../ui/ActionIcons";
import { Permission } from "../../../types/permission";
import { Button } from "../../ui/Button";
import { Badge } from "../../ui/Badge";
import { MODULE_DISPLAY_NAMES } from "../../../types/permission";

interface PermissionTableProps {
  permissions: Permission[];
  loading: boolean;
  error: string | null;
  onEdit: (permission: Permission) => void;
  onDelete: (permission: Permission) => void;
  onSort: (sortBy: string, sortOrder: "ASC" | "DESC") => void;
  currentPage: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export const PermissionTable: React.FC<PermissionTableProps> = ({
  permissions,
  loading,
  error,
  onEdit,
  onDelete,
  onSort,
  currentPage,
  totalPages,
  total,
  onPageChange,
}) => {
  const [sortField, setSortField] = React.useState<string>("createdAt");
  const [sortOrder, setSortOrder] = React.useState<"ASC" | "DESC">("DESC");

  const handleSort = (field: string) => {
    const newSortOrder =
      sortField === field && sortOrder === "ASC" ? "DESC" : "ASC";
    setSortField(field);
    setSortOrder(newSortOrder);
    onSort(field, newSortOrder);
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ActionIcon action="chevronUp" size="sm" color="neutral" />;
    }
    return sortOrder === "ASC" ? (
      <ActionIcon action="chevronUp" size="sm" color="purple" />
    ) : (
      <ActionIcon
        action="chevronUp"
        size="sm"
        color="purple"
        style={{ transform: "rotate(180deg)" }}
      />
    );
  };

  const getModuleDisplayName = (module: string) => {
    return MODULE_DISPLAY_NAMES[module] || module;
  };

  const getScopeColor = (scope: string) => {
    const colors = {
      own: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      team: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      all: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    };
    return (
      colors[scope as keyof typeof colors] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Cargando permisos...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-8 text-center">
          <ActionIcon
            action="shield"
            size="xl"
            color="danger"
            className="mx-auto mb-4"
          />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Error al cargar permisos
          </h3>
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (permissions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-8 text-center">
          <ActionIcon
            action="shield"
            size="xl"
            color="neutral"
            className="mx-auto mb-4"
          />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay permisos
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            No se encontraron permisos con los filtros actuales.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <span>Nombre</span>
                  {getSortIcon("name")}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => handleSort("module")}
                  className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <span>Módulo</span>
                  {getSortIcon("module")}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => handleSort("action")}
                  className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <span>Acción</span>
                  {getSortIcon("action")}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => handleSort("scope")}
                  className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <span>Scope</span>
                  {getSortIcon("scope")}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => handleSort("isActive")}
                  className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <span>Estado</span>
                  {getSortIcon("isActive")}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <button
                  onClick={() => handleSort("createdAt")}
                  className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <span>Creado</span>
                  {getSortIcon("createdAt")}
                </button>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {permissions.map((permission) => (
              <tr
                key={permission.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {permission.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {getModuleDisplayName(permission.module)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {permission.action}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge
                    variant="secondary"
                    className={getScopeColor(permission.scope)}
                  >
                    {permission.scope}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                    {permission.description || "Sin descripción"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={permission.isActive ? "success" : "danger"}>
                    {permission.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(permission.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      onClick={() => onEdit(permission)}
                      size="sm"
                      variant="ghost"
                      className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                    >
                      <ActionIcon action="edit" size="sm" />
                    </Button>
                    <Button
                      onClick={() => onDelete(permission)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <ActionIcon action="delete" size="sm" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                variant="ghost"
                size="sm"
              >
                Anterior
              </Button>
              <Button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="ghost"
                size="sm"
              >
                Siguiente
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrando{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * 10 + 1}
                  </span>{" "}
                  a{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * 10, total)}
                  </span>{" "}
                  de <span className="font-medium">{total}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <Button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="ghost"
                    size="sm"
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md"
                  >
                    <ActionIcon
                      action="chevronUp"
                      size="sm"
                      style={{ transform: "rotate(-90deg)" }}
                    />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        onClick={() => onPageChange(page)}
                        variant={currentPage === page ? "primary" : "ghost"}
                        size="sm"
                        className="relative inline-flex items-center px-4 py-2"
                      >
                        {page}
                      </Button>
                    )
                  )}
                  <Button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    variant="ghost"
                    size="sm"
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md"
                  >
                    <ActionIcon
                      action="chevronUp"
                      size="sm"
                      style={{ transform: "rotate(90deg)" }}
                    />
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
