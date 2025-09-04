import React, { useState, useEffect } from "react";
import { Shield, Plus, Search, Filter, BarChart3 } from "lucide-react";
import { Role, RoleFilterParams } from "../../types/role";
import { roleService } from "../../services/roleService";
import RoleTable from "../../components/admin/roles/RoleTable";
import RoleCreateModal from "../../components/admin/roles/RoleCreateModal";
import RoleEditModal from "../../components/admin/roles/RoleEditModal";
import RoleDeleteModal from "../../components/admin/roles/RoleDeleteModal";
import RolePermissionsModal from "../../components/admin/roles/RolePermissionsModal";
import RoleCloneModal from "../../components/admin/roles/RoleCloneModal";
import RoleStatsCards from "../../components/admin/roles/RoleStatsCards";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";

export const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  // const [stats, setStats] = useState<RoleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [total, setTotal] = useState(0);
  // const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<RoleFilterParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "DESC",
  });

  // Estados de modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showStats, setShowStats] = useState(true);

  // Permisos (temporal hasta implementar el hook completo)
  const canCreate = true; // hasPermission("roles:create:all");
  // const canEdit = true; // hasPermission("roles:edit:all");
  // const canDelete = true; // hasPermission("roles:delete:all");
  // const canManagePermissions = true; // hasPermission("roles:manage:permissions");
  // const canClone = true; // hasPermission("roles:clone:all");

  useEffect(() => {
    loadRoles();
    if (showStats) {
      loadStats();
    }
  }, [filters]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await roleService.getRoles(filters);
      setRoles(response?.roles || []);
      // setTotal(response?.total || 0);
      // setCurrentPage(response?.page || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar roles");
      setRoles([]); // Asegurar que siempre sea un array en caso de error
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await roleService.getRoleStats();
      // setStats(statsData);
      console.log("Stats loaded:", statsData);
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  };

  const handleFilterChange = (key: keyof RoleFilterParams, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  // const handlePageChange = (page: number) => {
  //   setFilters((prev) => ({ ...prev, page }));
  // };

  const handleCreateRole = () => {
    setShowCreateModal(true);
  };

  const handleRoleCreated = () => {
    setShowCreateModal(false);
    loadRoles();
    if (showStats) loadStats();
  };

  // const handleEditRole = (role: Role) => {
  //   setSelectedRole(role);
  //   setShowEditModal(true);
  // };

  const handleRoleUpdated = () => {
    setShowEditModal(false);
    setSelectedRole(null);
    loadRoles();
    if (showStats) loadStats();
  };

  // const handleDeleteRole = (role: Role) => {
  //   setSelectedRole(role);
  //   setShowDeleteModal(true);
  // };

  const handleRoleDeleted = () => {
    setShowDeleteModal(false);
    setSelectedRole(null);
    loadRoles();
    if (showStats) loadStats();
  };

  // const handleManagePermissions = (role: Role) => {
  //   setSelectedRole(role);
  //   setShowPermissionsModal(true);
  // };

  const handlePermissionsUpdated = () => {
    setShowPermissionsModal(false);
    setSelectedRole(null);
    loadRoles();
  };

  // const handleCloneRole = (role: Role) => {
  //   setSelectedRole(role);
  //   setShowCloneModal(true);
  // };

  const handleRoleCloned = () => {
    setShowCloneModal(false);
    setSelectedRole(null);
    loadRoles();
    if (showStats) loadStats();
  };

  const handleRefresh = () => {
    loadRoles();
    if (showStats) loadStats();
  };

  // const totalPages = Math.ceil(total / (filters.limit || 10));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Gestión de Roles
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administra roles del sistema
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            {showStats ? "Ocultar" : "Mostrar"} Estadísticas
          </Button>
          {canCreate && (
            <Button
              onClick={handleCreateRole}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Rol
            </Button>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      {showStats && <RoleStatsCards />}

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar por nombre o descripción..."
                value={filters.search || ""}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtro por estado */}
          <div className="w-full sm:w-48">
            <Select
              value={filters.isActive?.toString() || ""}
              onChange={(e) =>
                handleFilterChange(
                  "isActive",
                  e.target.value ? e.target.value === "true" : undefined
                )
              }
            >
              <option value="">Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </Select>
          </div>

          {/* Ordenamiento */}
          <div className="w-full sm:w-48">
            <Select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split("-");
                handleFilterChange("sortBy", sortBy);
                handleFilterChange("sortOrder", sortOrder);
              }}
            >
              <option value="createdAt-DESC">Más recientes</option>
              <option value="createdAt-ASC">Más antiguos</option>
              <option value="name-ASC">Nombre A-Z</option>
              <option value="name-DESC">Nombre Z-A</option>
              <option value="updatedAt-DESC">Últimas modificaciones</option>
            </Select>
          </div>

          {/* Botón de filtros avanzados */}
          <Button
            variant="secondary"
            className="flex items-center gap-2 whitespace-nowrap"
            onClick={handleRefresh}
          >
            <Filter className="w-4 h-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Tabla de roles */}
      {!loading && (
        <RoleTable
          roles={roles}
          isLoading={loading}
          onRefresh={handleRefresh}
        />
      )}

      {/* Modales */}
      {showCreateModal && (
        <RoleCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleRoleCreated}
        />
      )}

      {showEditModal && selectedRole && (
        <RoleEditModal
          isOpen={showEditModal}
          role={selectedRole}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRole(null);
          }}
          onSuccess={handleRoleUpdated}
        />
      )}

      {showDeleteModal && selectedRole && (
        <RoleDeleteModal
          isOpen={showDeleteModal}
          role={selectedRole}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedRole(null);
          }}
          onSuccess={handleRoleDeleted}
        />
      )}

      {showPermissionsModal && selectedRole && (
        <RolePermissionsModal
          isOpen={showPermissionsModal}
          role={selectedRole}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedRole(null);
          }}
          onSuccess={handlePermissionsUpdated}
        />
      )}

      {showCloneModal && selectedRole && (
        <RoleCloneModal
          isOpen={showCloneModal}
          role={selectedRole}
          onClose={() => {
            setShowCloneModal(false);
            setSelectedRole(null);
          }}
          onSuccess={handleRoleCloned}
        />
      )}
    </div>
  );
};
