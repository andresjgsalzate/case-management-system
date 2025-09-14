import React, { useState, useEffect } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Badge } from "../../components/ui/Badge";
import { ActionIcon } from "../../components/ui/ActionIcons";
import { authPermissionService } from "../../services/authPermission.service";
import { roleService } from "../../services/roleService";
import { Permission, Role } from "../../types/auth";
import { useToast as useToastContext } from "../../contexts/ToastContext";

interface PermissionsByModule {
  [module: string]: Permission[];
}

const RolePermissionsTab: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterModule, setFilterModule] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterScope, setFilterScope] = useState("");

  const { success: showSuccessToast, error: showErrorToast } =
    useToastContext();

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);

  // Actualizar permisos seleccionados cuando cambia el rol
  useEffect(() => {
    if (selectedRoleId) {
      loadRolePermissions();
    } else {
      setSelectedPermissions(new Set());
    }
  }, [selectedRoleId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        authPermissionService.getAllRoles(),
        authPermissionService.getAllPermissions(),
      ]);

      if (rolesResponse.success && rolesResponse.data) {
        const rolesData: any =
          (rolesResponse.data as any).roles || rolesResponse.data;
        setRoles(
          Array.isArray(rolesData)
            ? rolesData.filter((role: any) => role.isActive)
            : []
        );
      } else {
        setRoles([]);
      }

      if (permissionsResponse.success && permissionsResponse.data) {
        const permissionsData: any = permissionsResponse.data;
        setPermissions(
          Array.isArray(permissionsData)
            ? permissionsData.filter((permission: any) => permission.isActive)
            : []
        );
      } else {
        setPermissions([]);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("404")) {
        console.info(
          "🔧 Algunos endpoints no están disponibles, usando datos de fallback"
        );
      } else {
        console.error("Error loading data:", error);
        showErrorToast(`Error al cargar datos: ${errorMessage}`);
      }

      setRoles([]);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRolePermissions = async () => {
    if (!selectedRoleId) return;

    try {
      const response = await roleService.getRolePermissions(selectedRoleId);

      if (response.data) {
        const rolePermissions = response.data.map((p: any) => p.id);
        setSelectedPermissions(new Set(rolePermissions));
      } else if (Array.isArray(response)) {
        // Si response es directamente un array, lo usamos
        const rolePermissions = response.map((p: any) => p.id);
        setSelectedPermissions(new Set(rolePermissions));
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("404")) {
        // Error 404 esperado - API no implementada aún
        console.info(
          "🔧 API endpoint no disponible, usando permisos vacíos como fallback"
        );
      } else {
        console.error("Error loading role permissions:", error);
        showErrorToast("Error al cargar permisos del rol");
      }

      // Siempre inicializamos con permisos vacíos
      setSelectedPermissions(new Set());
    }
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    const newSelected = new Set(selectedPermissions);
    if (checked) {
      newSelected.add(permissionId);
    } else {
      newSelected.delete(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const handleModuleToggle = (
    modulePermissions: Permission[],
    allSelected: boolean
  ) => {
    const newSelected = new Set(selectedPermissions);
    modulePermissions.forEach((permission) => {
      if (allSelected) {
        newSelected.delete(permission.id);
      } else {
        newSelected.add(permission.id);
      }
    });
    setSelectedPermissions(newSelected);
  };

  const handleSave = async () => {
    if (!selectedRoleId) {
      showErrorToast("Por favor selecciona un rol");
      return;
    }

    setIsSaving(true);
    try {
      const permissionIds = Array.from(selectedPermissions);

      // Intentar guardar usando la API
      try {
        await roleService.assignPermissions(selectedRoleId, {
          permissionIds: permissionIds,
        });
        showSuccessToast("Permisos asignados correctamente");
      } catch (apiError) {
        // Si la API no está disponible, simular el guardado
        const errorMessage =
          apiError instanceof Error ? apiError.message : String(apiError);
        if (
          errorMessage.includes("404") ||
          errorMessage.includes("Not Found")
        ) {
          console.info(
            "🔧 API de asignación no disponible, simulando guardado:",
            {
              roleId: selectedRoleId,
              permissionIds: permissionIds,
            }
          );
          showSuccessToast(
            "Permisos configurados (funcionalidad en desarrollo)"
          );
        } else {
          throw apiError;
        }
      }
    } catch (error) {
      console.error("Error saving permissions:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      showErrorToast(`Error al guardar los cambios: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Filtrar permisos
  const filteredPermissions = permissions.filter((permission) => {
    const matchesSearch = permission.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesModule = filterModule
      ? permission.module === filterModule
      : true;
    const matchesAction = filterAction
      ? permission.action === filterAction
      : true;
    const matchesScope = filterScope ? permission.scope === filterScope : true;
    return matchesSearch && matchesModule && matchesAction && matchesScope;
  });

  // Agrupar permisos por módulo
  const permissionsByModule = filteredPermissions.reduce<PermissionsByModule>(
    (acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    },
    {}
  );

  // Obtener valores únicos para filtros
  const modules = [...new Set(permissions.map((p) => p.module))];
  const actions = [...new Set(permissions.map((p) => p.action))];
  const scopes = [...new Set(permissions.map((p) => p.scope))];

  const getScopeIcon = (scope: string) => {
    switch (scope.toLowerCase()) {
      case "global":
        return <ActionIcon action="globe" size="xs" />;
      case "own":
        return <ActionIcon action="lock" size="xs" />;
      case "department":
        return <ActionIcon action="users" size="xs" />;
      default:
        return <ActionIcon action="shield" size="xs" />;
    }
  };

  const getScopeBadgeVariant = (scope: string) => {
    switch (scope.toLowerCase()) {
      case "global":
        return "success";
      case "own":
        return "warning";
      case "department":
        return "info";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selector de Rol */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seleccionar Rol
            </label>
            <Select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
            >
              <option value="">-- Seleccionar Rol --</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Select>
          </div>
          <Button
            onClick={loadData}
            variant="secondary"
            size="sm"
            className="mt-7"
          >
            <ActionIcon action="loading" size="sm" className="mr-2" />
            Actualizar
          </Button>
        </div>

        {selectedRoleId && (
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Permisos seleccionados: {selectedPermissions.size} de{" "}
              {filteredPermissions.length}
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <ActionIcon
                    action="loading"
                    size="sm"
                    className="mr-2 animate-spin"
                  />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </div>
        )}
      </Card>

      {selectedRoleId && (
        <>
          {/* Filtros */}
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <ActionIcon
                    action="search"
                    size="sm"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar permisos..."
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Módulo
                </label>
                <Select
                  value={filterModule}
                  onChange={(e) => setFilterModule(e.target.value)}
                >
                  <option value="">Todos los módulos</option>
                  {modules.map((module) => (
                    <option key={module} value={module}>
                      {module}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Acción
                </label>
                <Select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                >
                  <option value="">Todas las acciones</option>
                  {actions.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Alcance
                </label>
                <Select
                  value={filterScope}
                  onChange={(e) => setFilterScope(e.target.value)}
                >
                  <option value="">Todos los alcances</option>
                  {scopes.map((scope) => (
                    <option key={scope} value={scope}>
                      {scope}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </Card>

          {/* Lista de Permisos por Módulo */}
          <div className="space-y-4">
            {Object.entries(permissionsByModule).map(
              ([module, modulePermissions]) => {
                const allSelected = modulePermissions.every((p) =>
                  selectedPermissions.has(p.id)
                );

                return (
                  <Card key={module} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                          {module}
                        </h3>
                        <Badge variant="secondary">
                          {modulePermissions.length} permisos
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            handleModuleToggle(modulePermissions, allSelected)
                          }
                        >
                          {allSelected ? (
                            <>
                              <ActionIcon
                                action="error"
                                size="sm"
                                className="mr-1"
                              />
                              Deseleccionar Todo
                            </>
                          ) : (
                            <>
                              <ActionIcon
                                action="success"
                                size="sm"
                                className="mr-1"
                              />
                              Seleccionar Todo
                            </>
                          )}
                        </Button>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {
                            modulePermissions.filter((p) =>
                              selectedPermissions.has(p.id)
                            ).length
                          }{" "}
                          / {modulePermissions.length} seleccionados
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {modulePermissions.map((permission) => {
                        const isSelected = selectedPermissions.has(
                          permission.id
                        );
                        return (
                          <label
                            key={permission.id}
                            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) =>
                                handlePermissionChange(
                                  permission.id,
                                  e.target.checked
                                )
                              }
                              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {permission.action}
                                </span>
                                <Badge
                                  variant={getScopeBadgeVariant(
                                    permission.scope
                                  )}
                                  className="flex items-center gap-1"
                                >
                                  {getScopeIcon(permission.scope)}
                                  {permission.scope}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {permission.description || permission.name}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </Card>
                );
              }
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default RolePermissionsTab;
