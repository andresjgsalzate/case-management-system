import { useState } from "react";
import { ActionIcon } from "../../ui/ActionIcons";
import type { Role } from "../../../types/role";
import RoleEditModal from "./RoleEditModal";
import RoleDeleteModal from "./RoleDeleteModal";
import RoleCloneModal from "./RoleCloneModal";

interface RoleTableProps {
  roles: Role[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function RoleTable({
  roles,
  isLoading,
  onRefresh,
}: RoleTableProps) {
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    role: Role | null;
  }>({
    isOpen: false,
    role: null,
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    role: Role | null;
  }>({
    isOpen: false,
    role: null,
  });

  const [cloneModal, setCloneModal] = useState<{
    isOpen: boolean;
    role: Role | null;
  }>({
    isOpen: false,
    role: null,
  });

  const handleEdit = (role: Role) => {
    setEditModal({ isOpen: true, role });
  };

  const handleDelete = (role: Role) => {
    setDeleteModal({ isOpen: true, role });
  };

  const handleClone = (role: Role) => {
    setCloneModal({ isOpen: true, role });
  };

  const handleToggleStatus = (role: Role) => {
    // TODO: Implementar función de toggle status
    console.log(`Toggle status for role: ${role.name}`);
  };

  const closeModals = () => {
    setEditModal({ isOpen: false, role: null });
    setDeleteModal({ isOpen: false, role: null });
    setCloneModal({ isOpen: false, role: null });
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, index) => (
                <div
                  key={index}
                  className="h-16 bg-gray-100 dark:bg-gray-700 rounded"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (roles?.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-12 text-center">
          <ActionIcon
            action="shield"
            size="xl"
            className="mx-auto mb-4"
            color="neutral"
          />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay roles
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No se encontraron roles que coincidan con los filtros aplicados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Usuarios
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Permisos
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Creado
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {roles?.map((role) => (
                <tr
                  key={role.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className={`p-2 rounded-lg mr-3 ${
                          role.isActive
                            ? "bg-green-100 dark:bg-green-900"
                            : "bg-gray-100 dark:bg-gray-700"
                        }`}
                      >
                        <ActionIcon
                          action="shield"
                          size="sm"
                          color={role.isActive ? "success" : "neutral"}
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {role.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {role.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white max-w-xs">
                      {role.description ? (
                        <span title={role.description}>
                          {role.description.length > 50
                            ? `${role.description.slice(0, 50)}...`
                            : role.description}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 italic">
                          Sin descripción
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        role.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {role.isActive ? (
                        <>
                          <ActionIcon
                            action="view"
                            size="xs"
                            className="mr-1"
                          />
                          Activo
                        </>
                      ) : (
                        <>
                          <ActionIcon
                            action="hide"
                            size="xs"
                            className="mr-1"
                          />
                          Inactivo
                        </>
                      )}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900 dark:text-white">
                      <ActionIcon
                        action="user"
                        size="sm"
                        className="mr-1"
                        color="neutral"
                      />
                      {role.userCount || 0}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900 dark:text-white">
                      <ActionIcon
                        action="shield"
                        size="sm"
                        className="mr-1"
                        color="neutral"
                      />
                      {role.permissionCount || 0}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(role.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleToggleStatus(role)}
                        className={
                          role.isActive
                            ? "text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            : "text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        }
                        title={role.isActive ? "Desactivar rol" : "Activar rol"}
                      >
                        {role.isActive ? (
                          <ActionIcon action="warning" size="sm" />
                        ) : (
                          <ActionIcon action="shield" size="sm" />
                        )}
                      </button>

                      <button
                        onClick={() => handleClone(role)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition-colors p-1 rounded"
                        title="Clonar rol"
                      >
                        <ActionIcon action="duplicate" size="sm" />
                      </button>

                      <button
                        onClick={() => handleEdit(role)}
                        className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 transition-colors p-1 rounded"
                        title="Editar rol"
                      >
                        <ActionIcon action="edit" size="sm" />
                      </button>

                      <button
                        onClick={() => handleDelete(role)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded"
                        title="Eliminar rol"
                      >
                        <ActionIcon action="delete" size="sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      <RoleEditModal
        isOpen={editModal.isOpen}
        onClose={closeModals}
        onSuccess={() => {
          closeModals();
          onRefresh();
        }}
        role={editModal.role}
      />

      <RoleDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={closeModals}
        onSuccess={() => {
          closeModals();
          onRefresh();
        }}
        role={deleteModal.role}
      />

      <RoleCloneModal
        isOpen={cloneModal.isOpen}
        onClose={closeModals}
        onSuccess={() => {
          closeModals();
          onRefresh();
        }}
        role={cloneModal.role}
      />
    </>
  );
}
