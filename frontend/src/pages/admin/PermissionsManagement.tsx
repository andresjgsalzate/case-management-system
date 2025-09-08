import React, { useState, useEffect } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Trash2, Edit, Plus, Shield, Settings, Key } from "lucide-react";
import { authPermissionService } from "../../services/authPermission.service";
import { Permission } from "../../types/auth";
import { useToast as useToastContext } from "../../contexts/ToastContext";
import RolePermissionsTab from "../../components/admin/RolePermissionsTab";

interface PermissionsManagementProps {}

const PermissionsManagement: React.FC<PermissionsManagementProps> = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("permissions");

  // Estados para formularios
  const [permissionForm, setPermissionForm] = useState({
    name: "",
    module: "",
    action: "",
    scope: "",
    description: "",
    isActive: true,
  });

  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(
    null
  );

  const { success, error: showErrorToast } = useToastContext();

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const response = await authPermissionService.getAllPermissions();
      setPermissions(response.data || []);
    } catch (error) {
      console.error("Error al cargar permisos:", error);
      showErrorToast("Error al cargar los permisos");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePermission = async () => {
    try {
      // TODO: Implementar createPermission en el servicio
      /*
      const newPermission = await authPermissionService.createPermission(
        permissionForm
      );
      setPermissions([...permissions, newPermission]);
      */
      setIsPermissionModalOpen(false);
      setPermissionForm({
        name: "",
        module: "",
        action: "",
        scope: "",
        description: "",
        isActive: true,
      });
      success("Funcionalidad en desarrollo - Permiso no creado");
    } catch (error) {
      console.error("Error al crear permiso:", error);
      showErrorToast("Error al crear el permiso");
    }
  };

  const handleEditPermission = (permission: Permission) => {
    setEditingPermission(permission);
    setPermissionForm({
      name: permission.name,
      module: permission.module,
      action: permission.action,
      scope: permission.scope,
      description: permission.description || "",
      isActive: permission.isActive,
    });
    setIsPermissionModalOpen(true);
  };

  const handleUpdatePermission = async () => {
    if (!editingPermission) return;

    try {
      // TODO: Implementar updatePermission en el servicio
      /*
      const updatedPermission = await authPermissionService.updatePermission(
        editingPermission.id,
        permissionForm
      );
      setPermissions(
        permissions.map((p) =>
          p.id === editingPermission.id ? updatedPermission : p
        )
      );
      */
      setIsPermissionModalOpen(false);
      setEditingPermission(null);
      setPermissionForm({
        name: "",
        module: "",
        action: "",
        scope: "",
        description: "",
        isActive: true,
      });
      success("Funcionalidad en desarrollo - Permiso no actualizado");
    } catch (error) {
      console.error("Error al actualizar permiso:", error);
      showErrorToast("Error al actualizar el permiso");
    }
  };

  const handleDeletePermission = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este permiso?")) {
      try {
        // TODO: Implementar deletePermission en el servicio
        /*
        await authPermissionService.deletePermission(id);
        setPermissions(permissions.filter((p) => p.id !== id));
        */
        console.log("Eliminando permiso:", id);
        success("Funcionalidad en desarrollo - Permiso no eliminado");
      } catch (error) {
        console.error("Error al eliminar permiso:", error);
        showErrorToast("Error al eliminar el permiso");
      }
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gestión de Permisos
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Administra los permisos y asignaciones del sistema
            </p>
          </div>
        </div>

        {/* Navegación de pestañas */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("permissions")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "permissions"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <Shield className="h-4 w-4 inline mr-2" />
              Permisos
            </button>
            <button
              onClick={() => setActiveTab("assign")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "assign"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <Key className="h-4 w-4 inline mr-2" />
              Asignar Permisos
            </button>
            <button
              onClick={() => setActiveTab("guide")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "guide"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <Settings className="h-4 w-4 inline mr-2" />
              Guía
            </button>
          </nav>
        </div>

        {/* Contenido de las pestañas */}

        {/* Tab de Permisos */}
        {activeTab === "permissions" && (
          <Card className="p-6 dark:bg-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Permisos del Sistema
              </h2>
              <Button
                onClick={() => {
                  setEditingPermission(null);
                  setPermissionForm({
                    name: "",
                    module: "",
                    action: "",
                    scope: "",
                    description: "",
                    isActive: true,
                  });
                  setIsPermissionModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Permiso
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-500 dark:text-gray-400">
                  Cargando permisos...
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Módulo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Acción
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Alcance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {permissions.map((permission) => (
                      <tr
                        key={permission.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {permission.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant="secondary"
                            className="dark:bg-gray-600 dark:text-gray-200"
                          >
                            {permission.module}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-300">
                            {permission.action}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={
                              permission.scope === "global"
                                ? "primary"
                                : "secondary"
                            }
                            className={
                              permission.scope === "global"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "dark:border-gray-500 dark:text-gray-300"
                            }
                          >
                            {permission.scope}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              permission.isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {permission.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditPermission(permission)}
                            className="mr-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              handleDeletePermission(permission.id)
                            }
                            className="dark:bg-red-600 dark:hover:bg-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Tab de Asignar Permisos */}
        {activeTab === "assign" && <RolePermissionsTab />}

        {/* Tab de Guía */}
        {activeTab === "guide" && (
          <Card className="p-6 dark:bg-gray-800">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
              Guía del Sistema de Permisos
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                  Estructura de Permisos
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  Los permisos siguen una estructura jerárquica basada en
                  módulos:
                </p>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <code className="text-sm text-gray-800 dark:text-gray-200">
                    {`{
  "name": "users.create",
  "module": "users",
  "action": "create",
  "scope": "global" | "own" | "department"
}`}
                  </code>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                  Ejemplos de Permisos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                      Usuarios
                    </h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-200 mt-2 space-y-1">
                      <li>• users.create - Crear usuarios</li>
                      <li>• users.read - Ver usuarios</li>
                      <li>• users.update - Actualizar usuarios</li>
                      <li>• users.delete - Eliminar usuarios</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 dark:text-green-100">
                      Casos
                    </h4>
                    <ul className="text-sm text-green-700 dark:text-green-200 mt-2 space-y-1">
                      <li>• cases.create - Crear casos</li>
                      <li>• cases.read - Ver casos</li>
                      <li>• cases.update - Actualizar casos</li>
                      <li>• cases.delete - Eliminar casos</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                  Alcances de Permisos
                </h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <p>
                    <strong className="text-gray-900 dark:text-white">
                      Global:
                    </strong>{" "}
                    Puede realizar la acción en todos los registros del sistema
                  </p>
                  <p>
                    <strong className="text-gray-900 dark:text-white">
                      Propio:
                    </strong>{" "}
                    Solo puede realizar la acción en sus propios registros
                  </p>
                  <p>
                    <strong className="text-gray-900 dark:text-white">
                      Departamento:
                    </strong>{" "}
                    Puede realizar la acción en registros de su departamento
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                  Asignación de Permisos a Roles
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Para asignar permisos a roles, utiliza la pestaña "Asignar
                  Permisos". Selecciona un rol existente y marca los permisos
                  que deseas asignar. Los permisos están organizados por módulos
                  para facilitar su gestión.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Modal para Permisos */}
        <Modal
          isOpen={isPermissionModalOpen}
          onClose={() => setIsPermissionModalOpen(false)}
          title={editingPermission ? "Editar Permiso" : "Crear Nuevo Permiso"}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="dark:text-gray-200">
                Nombre del Permiso
              </Label>
              <Input
                id="name"
                value={permissionForm.name}
                onChange={(e) =>
                  setPermissionForm({ ...permissionForm, name: e.target.value })
                }
                placeholder="ej: users.create"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="module" className="dark:text-gray-200">
                Módulo
              </Label>
              <Input
                id="module"
                value={permissionForm.module}
                onChange={(e) =>
                  setPermissionForm({
                    ...permissionForm,
                    module: e.target.value,
                  })
                }
                placeholder="ej: users"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="action" className="dark:text-gray-200">
                Acción
              </Label>
              <Input
                id="action"
                value={permissionForm.action}
                onChange={(e) =>
                  setPermissionForm({
                    ...permissionForm,
                    action: e.target.value,
                  })
                }
                placeholder="ej: create"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="scope" className="dark:text-gray-200">
                Alcance
              </Label>
              <Select
                value={permissionForm.scope}
                onChange={(e) =>
                  setPermissionForm({
                    ...permissionForm,
                    scope: e.target.value,
                  })
                }
              >
                <option value="">Seleccionar alcance</option>
                <option value="global">Global</option>
                <option value="own">Propio</option>
                <option value="department">Departamento</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="description" className="dark:text-gray-200">
                Descripción (opcional)
              </Label>
              <Input
                id="description"
                value={permissionForm.description}
                onChange={(e) =>
                  setPermissionForm({
                    ...permissionForm,
                    description: e.target.value,
                  })
                }
                placeholder="Descripción del permiso"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={permissionForm.isActive}
                onChange={(e) =>
                  setPermissionForm({
                    ...permissionForm,
                    isActive: e.target.checked,
                  })
                }
                className="dark:bg-gray-700 dark:border-gray-600"
              />
              <Label htmlFor="isActive" className="dark:text-gray-200">
                Permiso activo
              </Label>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="secondary"
              onClick={() => setIsPermissionModalOpen(false)}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={
                editingPermission
                  ? handleUpdatePermission
                  : handleCreatePermission
              }
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {editingPermission ? "Actualizar" : "Crear"} Permiso
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default PermissionsManagement;
