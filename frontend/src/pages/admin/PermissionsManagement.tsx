import React, { useState, useEffect } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Trash2, Edit, Plus, Users, Shield, Settings } from "lucide-react";
import { authPermissionService } from "../../services/authPermission.service";
import { Permission, Role } from "../../types/auth";
import { useToast } from "../../hooks/use-toast";
import { useToast as useToastContext } from "../../contexts/ToastContext";
import { useConfirmationModal } from "../../hooks/useConfirmationModal";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";

interface PermissionsManagementProps {}

const PermissionsManagement: React.FC<PermissionsManagementProps> = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
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

  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    isActive: true,
    permissionIds: [] as string[],
  });

  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(
    null
  );
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const { toast } = useToast();
  const { success, error: showErrorToast } = useToastContext();
  const { confirmDangerAction, modalState, modalHandlers } =
    useConfirmationModal();

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [permissionsResponse, rolesResponse] = await Promise.all([
        authPermissionService.getAllPermissions(),
        authPermissionService.getAllRoles(),
      ]);

      if (permissionsResponse.success && permissionsResponse.data) {
        setPermissions(permissionsResponse.data);
      }

      if (rolesResponse.success && rolesResponse.data) {
        setRoles(rolesResponse.data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar los datos de permisos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Funciones para gestión de permisos
  const handleCreatePermission = async () => {
    try {
      // Aquí iría la llamada al backend para crear el permiso
      // Por ahora simularemos la creación
      const newPermission: Permission = {
        id: Date.now().toString(),
        ...permissionForm,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setPermissions((prev) => [...prev, newPermission]);
      setPermissionForm({
        name: "",
        module: "",
        action: "",
        scope: "",
        description: "",
        isActive: true,
      });
      setIsPermissionModalOpen(false);

      toast({
        title: "Éxito",
        description: "Permiso creado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al crear el permiso",
        variant: "destructive",
      });
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
      // Aquí iría la llamada al backend para actualizar el permiso
      const updatedPermissions = permissions.map((p) =>
        p.id === editingPermission.id
          ? { ...p, ...permissionForm, updatedAt: new Date().toISOString() }
          : p
      );

      setPermissions(updatedPermissions);
      setEditingPermission(null);
      setPermissionForm({
        name: "",
        module: "",
        action: "",
        scope: "",
        description: "",
        isActive: true,
      });
      setIsPermissionModalOpen(false);

      toast({
        title: "Éxito",
        description: "Permiso actualizado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar el permiso",
        variant: "destructive",
      });
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    const confirmed = await confirmDangerAction(
      "Eliminar Permiso",
      "¿Estás seguro de que quieres eliminar este permiso?",
      "Esta acción no se puede deshacer."
    );

    if (!confirmed) return;

    try {
      // Aquí iría la llamada al backend para eliminar el permiso
      setPermissions((prev) => prev.filter((p) => p.id !== permissionId));

      success("Permiso eliminado correctamente");
    } catch (error) {
      showErrorToast("Error al eliminar el permiso");
    }
  };

  // Funciones para gestión de roles
  const handleCreateRole = async () => {
    try {
      // Aquí iría la llamada al backend para crear el rol
      const selectedPermissions = permissions.filter((p) =>
        roleForm.permissionIds.includes(p.id)
      );

      const newRole: Role = {
        id: Date.now().toString(),
        name: roleForm.name,
        description: roleForm.description,
        isActive: roleForm.isActive,
        permissions: selectedPermissions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setRoles((prev) => [...prev, newRole]);
      setRoleForm({
        name: "",
        description: "",
        isActive: true,
        permissionIds: [],
      });
      setIsRoleModalOpen(false);

      toast({
        title: "Éxito",
        description: "Rol creado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al crear el rol",
        variant: "destructive",
      });
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || "",
      isActive: role.isActive,
      permissionIds: role.permissions.map((p) => p.id),
    });
    setIsRoleModalOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;

    try {
      // Aquí iría la llamada al backend para actualizar el rol
      const selectedPermissions = permissions.filter((p) =>
        roleForm.permissionIds.includes(p.id)
      );

      const updatedRoles = roles.map((r) =>
        r.id === editingRole.id
          ? {
              ...r,
              name: roleForm.name,
              description: roleForm.description,
              isActive: roleForm.isActive,
              permissions: selectedPermissions,
              updatedAt: new Date().toISOString(),
            }
          : r
      );

      setRoles(updatedRoles);
      setEditingRole(null);
      setRoleForm({
        name: "",
        description: "",
        isActive: true,
        permissionIds: [],
      });
      setIsRoleModalOpen(false);

      toast({
        title: "Éxito",
        description: "Rol actualizado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar el rol",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    const confirmed = await confirmDangerAction(
      "Eliminar Rol",
      "¿Estás seguro de que quieres eliminar este rol?",
      "Esta acción no se puede deshacer."
    );

    if (!confirmed) return;

    try {
      // Aquí iría la llamada al backend para eliminar el rol
      setRoles((prev) => prev.filter((r) => r.id !== roleId));

      success("Rol eliminado correctamente");
    } catch (error) {
      showErrorToast("Error al eliminar el rol");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Permisos
          </h1>
          <p className="text-gray-600 mt-2">
            Administra permisos, roles y asignaciones de usuarios de forma
            dinámica
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("permissions")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "permissions"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Shield className="h-4 w-4 inline mr-2" />
            Permisos
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "roles"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Roles
          </button>
          <button
            onClick={() => setActiveTab("guide")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "guide"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Guía
          </button>
        </nav>
      </div>

      {/* Tab de Permisos */}
      {activeTab === "permissions" && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Permisos del Sistema</h2>
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
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Permiso
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Módulo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alcance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {permissions.map((permission) => (
                  <tr key={permission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {permission.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {permission.module}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {permission.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {permission.scope}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={permission.isActive ? "success" : "secondary"}
                      >
                        {permission.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPermission(permission)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePermission(permission.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab de Roles */}
      {activeTab === "roles" && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Roles del Sistema</h2>
            <Button
              onClick={() => {
                setEditingRole(null);
                setRoleForm({
                  name: "",
                  description: "",
                  isActive: true,
                  permissionIds: [],
                });
                setIsRoleModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Rol
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permisos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {roles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {role.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {role.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 3).map((permission) => (
                          <Badge
                            key={permission.id}
                            variant="info"
                            className="text-xs"
                          >
                            {permission.name}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge variant="info" className="text-xs">
                            +{role.permissions.length - 3} más
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={role.isActive ? "success" : "secondary"}>
                        {role.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRole(role)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRole(role.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab de Guía */}
      {activeTab === "guide" && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">
            Guía del Sistema de Permisos
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">
                ¿Cómo funciona el sistema de permisos?
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  <strong>1. Permisos:</strong> Son las acciones específicas que
                  se pueden realizar en el sistema. Cada permiso tiene un nombre
                  único, módulo, acción y alcance.
                </p>
                <p>
                  <strong>2. Roles:</strong> Son conjuntos de permisos agrupados
                  lógicamente. Un rol puede tener múltiples permisos asignados.
                </p>
                <p>
                  <strong>3. Usuarios:</strong> Cada usuario tiene asignado un
                  rol, y a través de ese rol obtiene todos los permisos
                  correspondientes.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                Estructura de Permisos
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <code className="text-sm">
                  {`{
  "nombre": "users.create",
  "modulo": "users",
  "accion": "create", 
  "alcance": "global" | "own" | "department"
}`}
                </code>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                Ejemplos de Permisos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">Usuarios</h4>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>• users.create - Crear usuarios</li>
                    <li>• users.read - Ver usuarios</li>
                    <li>• users.update - Actualizar usuarios</li>
                    <li>• users.delete - Eliminar usuarios</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900">Casos</h4>
                  <ul className="text-sm text-green-700 mt-2 space-y-1">
                    <li>• cases.create - Crear casos</li>
                    <li>• cases.read - Ver casos</li>
                    <li>• cases.update - Actualizar casos</li>
                    <li>• cases.delete - Eliminar casos</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                Alcances de Permisos
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Global:</strong> Puede realizar la acción en todos los
                  registros del sistema
                </p>
                <p>
                  <strong>Propio:</strong> Solo puede realizar la acción en sus
                  propios registros
                </p>
                <p>
                  <strong>Departamento:</strong> Puede realizar la acción en
                  registros de su departamento
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">
                💡 Sistema 100% Parametrizable
              </h4>
              <p className="text-sm text-yellow-700">
                Este sistema es completamente dinámico. No hay roles ni permisos
                hardcodeados en el código. Todos los permisos se cargan desde la
                base de datos, lo que permite total flexibilidad para agregar
                nuevos permisos, roles y configuraciones sin necesidad de
                modificar el código.
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
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={permissionForm.name}
              onChange={(e) =>
                setPermissionForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="ej: users.create"
            />
          </div>
          <div>
            <Label htmlFor="module">Módulo</Label>
            <Input
              id="module"
              value={permissionForm.module}
              onChange={(e) =>
                setPermissionForm((prev) => ({
                  ...prev,
                  module: e.target.value,
                }))
              }
              placeholder="ej: users"
            />
          </div>
          <div>
            <Label htmlFor="action">Acción</Label>
            <Input
              id="action"
              value={permissionForm.action}
              onChange={(e) =>
                setPermissionForm((prev) => ({
                  ...prev,
                  action: e.target.value,
                }))
              }
              placeholder="ej: create"
            />
          </div>
          <div>
            <Label htmlFor="scope">Alcance</Label>
            <Select
              value={permissionForm.scope}
              onChange={(e) =>
                setPermissionForm((prev) => ({
                  ...prev,
                  scope: e.target.value,
                }))
              }
            >
              <option value="">Seleccionar alcance</option>
              <option value="global">Global</option>
              <option value="own">Propio</option>
              <option value="department">Departamento</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">Descripción</Label>
            <textarea
              id="description"
              value={permissionForm.description}
              onChange={(e) =>
                setPermissionForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Descripción del permiso"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={permissionForm.isActive}
              onChange={(e) =>
                setPermissionForm((prev) => ({
                  ...prev,
                  isActive: e.target.checked,
                }))
              }
              className="rounded"
            />
            <Label htmlFor="isActive">Activo</Label>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="ghost"
            onClick={() => setIsPermissionModalOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={
              editingPermission
                ? handleUpdatePermission
                : handleCreatePermission
            }
          >
            {editingPermission ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </Modal>

      {/* Modal para Roles */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={editingRole ? "Editar Rol" : "Crear Nuevo Rol"}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="roleName">Nombre</Label>
            <Input
              id="roleName"
              value={roleForm.name}
              onChange={(e) =>
                setRoleForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="ej: Administrador"
            />
          </div>
          <div>
            <Label htmlFor="roleDescription">Descripción</Label>
            <textarea
              id="roleDescription"
              value={roleForm.description}
              onChange={(e) =>
                setRoleForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Descripción del rol"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="roleIsActive"
              checked={roleForm.isActive}
              onChange={(e) =>
                setRoleForm((prev) => ({ ...prev, isActive: e.target.checked }))
              }
              className="rounded"
            />
            <Label htmlFor="roleIsActive">Activo</Label>
          </div>
          <div>
            <Label>Permisos Asignados</Label>
            <div className="mt-2 max-h-60 overflow-y-auto border rounded-md p-4">
              {permissions.map((permission) => (
                <div
                  key={permission.id}
                  className="flex items-center space-x-2 mb-2"
                >
                  <input
                    type="checkbox"
                    id={`permission-${permission.id}`}
                    checked={roleForm.permissionIds.includes(permission.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setRoleForm((prev) => ({
                          ...prev,
                          permissionIds: [...prev.permissionIds, permission.id],
                        }));
                      } else {
                        setRoleForm((prev) => ({
                          ...prev,
                          permissionIds: prev.permissionIds.filter(
                            (id) => id !== permission.id
                          ),
                        }));
                      }
                    }}
                    className="rounded"
                  />
                  <Label
                    htmlFor={`permission-${permission.id}`}
                    className="text-sm"
                  >
                    {permission.name} ({permission.module}.{permission.action})
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={() => setIsRoleModalOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={editingRole ? handleUpdateRole : handleCreateRole}>
            {editingRole ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </Modal>

      {/* Modal de confirmación */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={modalHandlers.onClose}
        onConfirm={modalHandlers.onConfirm}
        title={modalState.options?.title || ""}
        message={modalState.options?.message || ""}
        confirmText={modalState.options?.confirmText}
        cancelText={modalState.options?.cancelText}
        type={modalState.options?.type}
      />
    </div>
  );
};

export default PermissionsManagement;
