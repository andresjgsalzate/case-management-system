import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { User, UserFilterParams, Role } from "../../types/user";
import { userService } from "../../services/userService";
import {
  UserTable,
  UserCreateModal,
  UserEditModal,
  UserDeleteModal,
  UserPasswordModal,
} from "../../components/users";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [filters, setFilters] = useState<UserFilterParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "DESC",
  });

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Permisos (temporal hasta implementar el hook completo)
  const canCreate = true; // hasPermission("users:create:all");
  const canEdit = true; // hasPermission("users:edit:all") || hasPermission("users:edit:team");
  const canDelete = true; // hasPermission("users:delete:all");
  const canManageStatus = true; // hasPermission("users:manage:status");
  const canManagePasswords = true; // hasPermission("users:manage:passwords");

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, [filters]);

  const loadRoles = async () => {
    try {
      const roles = await userService.getRoles();
      setAvailableRoles(roles);
    } catch (err) {
      console.error("Error loading roles:", err);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getUsers(filters);
      setUsers(response.users);
      setTotal(response.total);
      setCurrentPage(response.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setShowCreateModal(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    // Para ahora, reutilizamos el modal de editar pero en modo solo lectura
    // TODO: Crear un modal específico para ver detalles
    setShowEditModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleChangePassword = (user: User) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await userService.toggleUserStatus(user.id);
      await loadUsers(); // Recargar la lista
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar estado");
    }
  };

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  };

  const handleFilterChange = (key: keyof UserFilterParams, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleUserCreated = () => {
    setShowCreateModal(false);
    loadUsers();
  };

  const handleUserUpdated = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    loadUsers();
  };

  const handleUserDeleted = () => {
    setShowDeleteModal(false);
    setSelectedUser(null);
    loadUsers();
  };

  const totalPages = Math.ceil(total / (filters.limit || 10));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <UsersIcon className="w-8 h-8" />
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administra usuarios del sistema
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={handleCreateUser}
            className="flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Nuevo Usuario
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nombre o email..."
                className="pl-10"
                value={filters.search || ""}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Filtro por rol */}
          <div className="w-full sm:w-48">
            <Select
              value={filters.roleName || ""}
              onChange={(value) =>
                handleFilterChange("roleName", value || undefined)
              }
            >
              <option value="">Todos los roles</option>
              {availableRoles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.name}
                </option>
              ))}
            </Select>
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
              <option value="fullName-ASC">Nombre A-Z</option>
              <option value="fullName-DESC">Nombre Z-A</option>
              <option value="email-ASC">Email A-Z</option>
              <option value="lastLoginAt-DESC">Último login</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Tabla de usuarios */}
      <UserTable
        users={users}
        loading={loading}
        onView={handleViewUser}
        onEdit={canEdit ? handleEditUser : undefined}
        onDelete={canDelete ? handleDeleteUser : undefined}
        onToggleStatus={canManageStatus ? handleToggleStatus : undefined}
        onChangePassword={canManagePasswords ? handleChangePassword : undefined}
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        onPageChange={handlePageChange}
      />

      {/* Modales */}
      {showCreateModal && (
        <UserCreateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleUserCreated}
        />
      )}

      {showEditModal && selectedUser && (
        <UserEditModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSuccess={handleUserUpdated}
        />
      )}

      {showDeleteModal && selectedUser && (
        <UserDeleteModal
          user={selectedUser}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedUser(null);
          }}
          onSuccess={handleUserDeleted}
        />
      )}

      {showPasswordModal && selectedUser && (
        <UserPasswordModal
          user={selectedUser}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowPasswordModal(false);
            setSelectedUser(null);
            loadUsers();
          }}
        />
      )}
    </div>
  );
};
