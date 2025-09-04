import React, { useState, useEffect } from "react";
import { Plus, Search, ShieldCheck, Filter } from "lucide-react";
import { Permission, PermissionFilterParams } from "../../types/permission";
import { permissionService } from "../../services/permissionService";
import {
  PermissionTable,
  PermissionCreateModal,
  PermissionEditModal,
  PermissionDeleteModal,
  PermissionStatsCards,
} from "../../components/admin/permissions/index";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { toast } from "react-hot-toast";

export const PermissionsPage: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<PermissionFilterParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "DESC",
  });

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPermission, setSelectedPermission] =
    useState<Permission | null>(null);

  // Estados para opciones de filtros
  const [modules, setModules] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [scopes] = useState<string[]>(["own", "team", "all"]);

  // Cargar datos iniciales
  useEffect(() => {
    loadPermissions();
    loadFilterOptions();
  }, [filters]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await permissionService.getPermissions(filters);
      setPermissions(response.permissions);
      setTotal(response.total);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al cargar permisos";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const [modulesData, actionsData] = await Promise.all([
        permissionService.getUniqueModules(),
        permissionService.getUniqueActions(),
      ]);
      setModules(modulesData);
      setActions(actionsData);
    } catch (err) {
      console.error("Error loading filter options:", err);
    }
  };

  // Manejadores de filtros
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
    setCurrentPage(1);
  };

  const handleModuleFilter = (value: string) => {
    setModuleFilter(value);
    setFilters((prev) => ({ ...prev, module: value || undefined, page: 1 }));
    setCurrentPage(1);
  };

  const handleActionFilter = (value: string) => {
    setActionFilter(value);
    setFilters((prev) => ({ ...prev, action: value || undefined, page: 1 }));
    setCurrentPage(1);
  };

  const handleScopeFilter = (value: string) => {
    setScopeFilter(value);
    setFilters((prev) => ({ ...prev, scope: value || undefined, page: 1 }));
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    const isActive =
      value === "active" ? true : value === "inactive" ? false : undefined;
    setFilters((prev) => ({ ...prev, isActive, page: 1 }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleSortChange = (sortBy: string, sortOrder: "ASC" | "DESC") => {
    setFilters((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }));
    setCurrentPage(1);
  };

  // Manejadores de modales
  const handleCreatePermission = () => {
    setShowCreateModal(true);
  };

  const handleEditPermission = (permission: Permission) => {
    setSelectedPermission(permission);
    setShowEditModal(true);
  };

  const handleDeletePermission = (permission: Permission) => {
    setSelectedPermission(permission);
    setShowDeleteModal(true);
  };

  const handlePermissionCreated = () => {
    setShowCreateModal(false);
    loadPermissions();
    toast.success("Permiso creado exitosamente");
  };

  const handlePermissionUpdated = () => {
    setShowEditModal(false);
    setSelectedPermission(null);
    loadPermissions();
    toast.success("Permiso actualizado exitosamente");
  };

  const handlePermissionDeleted = () => {
    setShowDeleteModal(false);
    setSelectedPermission(null);
    loadPermissions();
    toast.success("Permiso eliminado exitosamente");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setModuleFilter("");
    setActionFilter("");
    setScopeFilter("");
    setStatusFilter("");
    setFilters({
      page: 1,
      limit: 10,
      sortBy: "createdAt",
      sortOrder: "DESC",
    });
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(total / (filters.limit || 10));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestión de Permisos
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Administra los permisos del sistema
            </p>
          </div>
        </div>
        <Button
          onClick={handleCreatePermission}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Permiso
        </Button>
      </div>

      {/* Stats Cards */}
      <PermissionStatsCards permissions={permissions} total={total} />

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Filtros de Búsqueda
            </h3>
          </div>
          <Button
            onClick={clearFilters}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Limpiar Filtros
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Buscar permisos..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10"
            />
          </div>

          <Select
            value={moduleFilter}
            onChange={(e) => handleModuleFilter(e.target.value)}
            className="w-full"
          >
            <option value="">Todos los módulos</option>
            {modules.map((module) => (
              <option key={module} value={module}>
                {module}
              </option>
            ))}
          </Select>

          <Select
            value={actionFilter}
            onChange={(e) => handleActionFilter(e.target.value)}
            className="w-full"
          >
            <option value="">Todas las acciones</option>
            {actions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </Select>

          <Select
            value={scopeFilter}
            onChange={(e) => handleScopeFilter(e.target.value)}
            className="w-full"
          >
            <option value="">Todos los scopes</option>
            {scopes.map((scope) => (
              <option key={scope} value={scope}>
                {scope}
              </option>
            ))}
          </Select>

          <Select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="w-full"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </Select>
        </div>
      </div>

      {/* Tabla de Permisos */}
      <PermissionTable
        permissions={permissions}
        loading={loading}
        error={error}
        onEdit={handleEditPermission}
        onDelete={handleDeletePermission}
        onSort={handleSortChange}
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        onPageChange={handlePageChange}
      />

      {/* Modales */}
      {showCreateModal && (
        <PermissionCreateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handlePermissionCreated}
          modules={modules}
          actions={actions}
        />
      )}

      {showEditModal && selectedPermission && (
        <PermissionEditModal
          permission={selectedPermission}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPermission(null);
          }}
          onSuccess={handlePermissionUpdated}
          modules={modules}
          actions={actions}
        />
      )}

      {showDeleteModal && selectedPermission && (
        <PermissionDeleteModal
          permission={selectedPermission}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedPermission(null);
          }}
          onSuccess={handlePermissionDeleted}
        />
      )}
    </div>
  );
};
