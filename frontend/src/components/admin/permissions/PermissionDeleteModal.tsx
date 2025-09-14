import React, { useState } from "react";
import { ActionIcon } from "../../ui/ActionIcons";
import { Permission } from "../../../types/permission";
import { permissionService } from "../../../services/permissionService";
import { Button } from "../../ui/Button";
import { Modal } from "../../ui/Modal";
import { useToast } from "../../../contexts/ToastContext";

interface PermissionDeleteModalProps {
  permission: Permission;
  onClose: () => void;
  onSuccess: () => void;
}

export const PermissionDeleteModal: React.FC<PermissionDeleteModalProps> = ({
  permission,
  onClose,
  onSuccess,
}) => {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await permissionService.deletePermission(permission.id);
      success("Permiso eliminado exitosamente");
      onSuccess();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al eliminar el permiso";
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Eliminar Permiso">
      <div className="space-y-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-full">
              <ActionIcon action="warning" size="md" color="danger" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              ¿Estás seguro de eliminar este permiso?
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Esta acción no se puede deshacer. El permiso será eliminado
              permanentemente del sistema.
            </p>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Nombre:
                </span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {permission.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Módulo:
                </span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {permission.module}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Acción:
                </span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {permission.action}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Scope:
                </span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {permission.scope}
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>Advertencia:</strong> Si este permiso está asignado a
                roles, también se removerá de dichos roles.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={loading}
          >
            {loading ? "Eliminando..." : "Eliminar Permiso"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
