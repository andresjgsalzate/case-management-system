import { useState, useEffect } from "react";
import { ActionIcon } from "../../ui/ActionIcons";
import { useToast } from "../../../contexts/ToastContext";
import { roleService } from "../../../services/roleService";
import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";
import type { Role, Permission } from "../../../types/role";

interface RolePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role: Role | null;
}

export default function RolePermissionsModal({
  isOpen,
  onClose,
  onSuccess,
  role,
}: RolePermissionsModalProps) {
  const { success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("all");

  // Cargar permisos disponibles y permisos del rol
  useEffect(() => {
    if (isOpen && role) {
      loadPermissions();
      loadRolePermissions();
    }
  }, [isOpen, role]);

  const loadPermissions = async () => {
    try {
      // Aquí deberías cargar todos los permisos disponibles
      // Por ahora uso un mock, pero deberías implementar el endpoint en el backend
      const mockPermissions: Permission[] = [
        {
          id: "1",
          name: "users:view:all",
          description: "Ver todos los usuarios",
          module: "users",
          action: "view",
          scope: "all",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          name: "users.create.all",
          description: "Create users",
          module: "users",
          action: "create",
          scope: "all",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "3",
          name: "users.edit.all",
          description: "Edit users",
          module: "users",
          action: "edit",
          scope: "all",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "4",
          name: "users.delete.all",
          description: "Delete users",
          module: "users",
          action: "delete",
          scope: "all",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "5",
          name: "roles:view:all",
          description: "Ver todos los roles",
          module: "roles",
          action: "view",
          scope: "all",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "6",
          name: "roles.create.all",
          description: "Create roles",
          module: "roles",
          action: "create",
          scope: "all",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "7",
          name: "roles.edit.all",
          description: "Edit roles",
          module: "roles",
          action: "edit",
          scope: "all",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "8",
          name: "roles.delete.all",
          description: "Delete roles",
          module: "roles",
          action: "delete",
          scope: "all",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "9",
          name: "cases:view:all",
          description: "Ver todos los casos",
          module: "cases",
          action: "view",
          scope: "all",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "10",
          name: "cases.create.all",
          description: "Create cases",
          module: "cases",
          action: "create",
          scope: "all",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      setPermissions(mockPermissions);
    } catch (error) {
      console.error("Error al cargar permisos:", error);
      showError("Error al cargar permisos disponibles");
    }
  };

  const loadRolePermissions = async () => {
    if (!role) return;

    try {
      const response = await roleService.getRolePermissions(role.id);
      setRolePermissions(response.data.map((p: Permission) => p.id));
    } catch (error) {
      console.error("Error al cargar permisos del rol:", error);
      showError("Error al cargar permisos del rol");
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setRolePermissions((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((id) => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const handleSave = async () => {
    if (!role) return;

    setIsLoading(true);
    try {
      await roleService.assignPermissions(role.id, {
        permissionIds: rolePermissions,
      });
      success("Permisos actualizados exitosamente");
      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error("Error al actualizar permisos:", error);
      showError(
        error.response?.data?.message || "Error al actualizar permisos"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setSearchTerm("");
      setSelectedModule("all");
      setRolePermissions([]);
      setPermissions([]);
      onClose();
    }
  };

  // Filtrar permisos por búsqueda y módulo
  const filteredPermissions = permissions.filter((permission) => {
    const matchesSearch =
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (permission.description &&
        permission.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));
    const matchesModule =
      selectedModule === "all" || permission.module === selectedModule;
    return matchesSearch && matchesModule;
  });

  // Obtener módulos únicos
  const modules = Array.from(new Set(permissions.map((p) => p.module)));

  if (!role) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Gestionar Permisos - ${role.name}`}
      size="2xl"
    >
      {/* Filtros */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <ActionIcon
              action="search"
              size="sm"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
            />
            <input
              type="text"
              placeholder="Buscar permisos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Filtro por módulo */}
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Todos los módulos</option>
            {modules.map((module) => (
              <option key={module} value={module}>
                {module.charAt(0).toUpperCase() + module.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Estadísticas */}
        <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
            <span>Total de permisos: {permissions.length}</span>
            <span>Permisos asignados: {rolePermissions.length}</span>
            <span>Filtrados: {filteredPermissions.length}</span>
          </div>
        </div>
      </div>

      {/* Lista de permisos */}
      <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
        <div className="divide-y divide-gray-200 dark:divide-gray-600">
          {filteredPermissions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <ActionIcon
                action="shield"
                size="xl"
                className="mx-auto mb-4"
                color="neutral"
              />
              <p>No se encontraron permisos</p>
              <p className="text-sm">Ajusta los filtros de búsqueda</p>
            </div>
          ) : (
            filteredPermissions.map((permission) => (
              <div
                key={permission.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={rolePermissions.includes(permission.id)}
                      onChange={() => handlePermissionToggle(permission.id)}
                      disabled={isLoading}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 dark:bg-gray-700"
                    />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {permission.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {permission.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                      {permission.module}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                      {permission.action}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
                      {permission.scope}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600 mt-6">
        <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button variant="success" onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Guardando...
            </>
          ) : (
            <>
              <ActionIcon action="shield" size="sm" className="mr-1" />
              Guardar Permisos
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
}
