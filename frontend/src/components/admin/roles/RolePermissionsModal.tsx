import { useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import {
  XMarkIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { roleService } from "../../../services/roleService";
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
          name: "users:create",
          description: "Crear usuarios",
          module: "users",
          action: "create",
          scope: "all",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "3",
          name: "users:edit",
          description: "Editar usuarios",
          module: "users",
          action: "edit",
          scope: "all",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "4",
          name: "users:delete",
          description: "Eliminar usuarios",
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
          name: "roles:create",
          description: "Crear roles",
          module: "roles",
          action: "create",
          scope: "all",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "7",
          name: "roles:edit",
          description: "Editar roles",
          module: "roles",
          action: "edit",
          scope: "all",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "8",
          name: "roles:delete",
          description: "Eliminar roles",
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
          name: "cases:create",
          description: "Crear casos",
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
      toast.error("Error al cargar permisos disponibles");
    }
  };

  const loadRolePermissions = async () => {
    if (!role) return;

    try {
      const response = await roleService.getRolePermissions(role.id);
      setRolePermissions(response.data.map((p: Permission) => p.id));
    } catch (error) {
      console.error("Error al cargar permisos del rol:", error);
      toast.error("Error al cargar permisos del rol");
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
      toast.success("Permisos actualizados exitosamente");
      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error("Error al actualizar permisos:", error);
      toast.error(
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
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 flex items-center"
                  >
                    <ShieldCheckIcon className="h-5 w-5 mr-2 text-green-600" />
                    Gestionar Permisos - {role.name}
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    disabled={isLoading}
                    className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Filtros */}
                <div className="mb-6 space-y-4">
                  <div className="flex gap-4">
                    {/* Búsqueda */}
                    <div className="flex-1 relative">
                      <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar permisos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    {/* Filtro por módulo */}
                    <select
                      value={selectedModule}
                      onChange={(e) => setSelectedModule(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Total de permisos: {permissions.length}</span>
                      <span>Permisos asignados: {rolePermissions.length}</span>
                      <span>Filtrados: {filteredPermissions.length}</span>
                    </div>
                  </div>
                </div>

                {/* Lista de permisos */}
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  <div className="divide-y divide-gray-200">
                    {filteredPermissions.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <ShieldCheckIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No se encontraron permisos</p>
                        <p className="text-sm">
                          Ajusta los filtros de búsqueda
                        </p>
                      </div>
                    ) : (
                      filteredPermissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={rolePermissions.includes(
                                  permission.id
                                )}
                                onChange={() =>
                                  handlePermissionToggle(permission.id)
                                }
                                disabled={isLoading}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded disabled:opacity-50"
                              />
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">
                                  {permission.name}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {permission.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {permission.module}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {permission.action}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
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
                <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                        <ShieldCheckIcon className="h-4 w-4 mr-1" />
                        Guardar Permisos
                      </>
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
