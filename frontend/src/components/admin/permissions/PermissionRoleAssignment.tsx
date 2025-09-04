import React, { useState, useEffect } from "react";
import { Users, Shield, ArrowRight, Plus } from "lucide-react";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { Select } from "../../ui/Select";
import { Badge } from "../../ui/Badge";
import { Modal } from "../../ui/Modal";
import { toast } from "react-hot-toast";

// Tipos temporales (estos deberían venir de types)
interface Role {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  permissions?: Permission[];
}

interface Permission {
  id: string;
  name: string;
  module: string;
  action: string;
  scope: string;
  description?: string;
  isActive: boolean;
}

// interface RolePermission {
//   roleId: string;
//   permissionId: string;
//   assignedAt: string;
//   assignedBy: string;
// }

export const PermissionRoleAssignment: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  // const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");

  // Estados para la asignación de permisos
  const [availablePermissions, setAvailablePermissions] = useState<
    Permission[]
  >([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: Implementar servicios reales
      // const [rolesData, permissionsData, rolePermissionsData] = await Promise.all([
      //   roleService.getRoles(),
      //   permissionService.getPermissions(),
      //   rolePermissionService.getRolePermissions()
      // ]);

      // Datos de ejemplo
      setRoles([
        {
          id: "1",
          name: "Administrador",
          description: "Acceso completo al sistema",
          isActive: true,
        },
        {
          id: "2",
          name: "Usuario",
          description: "Acceso básico",
          isActive: true,
        },
      ]);

      setPermissions([
        {
          id: "1",
          name: "users.read_all",
          module: "users",
          action: "read",
          scope: "all",
          isActive: true,
        },
      ]);
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    loadRolePermissions(role.id);
  };

  const loadRolePermissions = async (_roleId: string) => {
    try {
      // TODO: Cargar permisos del rol específico
      // const rolePerms = await rolePermissionService.getPermissionsByRole(roleId);
      const rolePerms = permissions; // Temporal
      setSelectedRole((prev) =>
        prev ? { ...prev, permissions: rolePerms } : null
      );
    } catch (error) {
      toast.error("Error al cargar permisos del rol");
    }
  };

  const handleAssignPermissions = (role: Role) => {
    setSelectedRole(role);
    // Filtrar permisos no asignados al rol
    const unassignedPermissions = permissions.filter(
      (p) => !role.permissions?.some((rp) => rp.id === p.id)
    );
    setAvailablePermissions(unassignedPermissions);
    setSelectedPermissions([]);
    setShowAssignModal(true);
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleAssignSubmit = async () => {
    if (!selectedRole || selectedPermissions.length === 0) return;

    try {
      // TODO: Implementar asignación de permisos
      // await rolePermissionService.assignPermissions(selectedRole.id, selectedPermissions);
      toast.success(
        `${selectedPermissions.length} permisos asignados al rol ${selectedRole.name}`
      );
      setShowAssignModal(false);
      loadRolePermissions(selectedRole.id);
    } catch (error) {
      toast.error("Error al asignar permisos");
    }
  };

  const handleRevokePermission = async (
    roleId: string,
    _permissionId: string
  ) => {
    try {
      // TODO: Implementar revocación de permiso
      // await rolePermissionService.revokePermission(roleId, permissionId);
      toast.success("Permiso revocado exitosamente");
      loadRolePermissions(roleId);
    } catch (error) {
      toast.error("Error al revocar permiso");
    }
  };

  const filteredPermissions = availablePermissions.filter((permission) => {
    const matchesSearch =
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = !moduleFilter || permission.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Asignación de Permisos por Rol
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona los permisos asignados a cada rol
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Roles */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Roles
            </h3>
          </div>
          <div className="p-6 space-y-3">
            {roles.map((role) => (
              <div
                key={role.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedRole?.id === role.id
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
                onClick={() => handleRoleSelect(role)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {role.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {role.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={role.isActive ? "success" : "danger"}>
                      {role.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Permisos del Rol Seleccionado */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {selectedRole
                  ? `Permisos de ${selectedRole.name}`
                  : "Selecciona un rol"}
              </h3>
              {selectedRole && (
                <Button
                  onClick={() => handleAssignPermissions(selectedRole)}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Asignar Permisos
                </Button>
              )}
            </div>
          </div>
          <div className="p-6">
            {selectedRole ? (
              <div className="space-y-3">
                {selectedRole.permissions &&
                selectedRole.permissions.length > 0 ? (
                  selectedRole.permissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {permission.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {permission.module} • {permission.action} •{" "}
                          {permission.scope}
                        </div>
                      </div>
                      <Button
                        onClick={() =>
                          handleRevokePermission(selectedRole.id, permission.id)
                        }
                        size="sm"
                        variant="danger"
                      >
                        Revocar
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Este rol no tiene permisos asignados
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Selecciona un rol para ver sus permisos
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Asignación de Permisos */}
      {showAssignModal && selectedRole && (
        <Modal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          title={`Asignar Permisos a ${selectedRole.name}`}
        >
          <div className="space-y-6">
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="text"
                placeholder="Buscar permisos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
              >
                <option value="">Todos los módulos</option>
                {[...new Set(availablePermissions.map((p) => p.module))].map(
                  (module) => (
                    <option key={module} value={module}>
                      {module}
                    </option>
                  )
                )}
              </Select>
            </div>

            {/* Lista de Permisos */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredPermissions.map((permission) => (
                <div
                  key={permission.id}
                  className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <input
                    type="checkbox"
                    id={`perm-${permission.id}`}
                    checked={selectedPermissions.includes(permission.id)}
                    onChange={() => handlePermissionToggle(permission.id)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`perm-${permission.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {permission.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {permission.module} • {permission.action} •{" "}
                      {permission.scope}
                    </div>
                    {permission.description && (
                      <div className="text-xs text-gray-400 mt-1">
                        {permission.description}
                      </div>
                    )}
                  </label>
                </div>
              ))}
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {selectedPermissions.length} permisos seleccionados
              </div>
              <div className="space-x-3">
                <Button
                  onClick={() => setShowAssignModal(false)}
                  variant="ghost"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAssignSubmit}
                  disabled={selectedPermissions.length === 0}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Asignar Permisos
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
