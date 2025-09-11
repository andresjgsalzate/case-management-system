import { useState } from "react";
import {
  TrashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "../../../contexts/ToastContext";
import { roleService } from "../../../services/roleService";
import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";
import type { Role } from "../../../types/role";

interface RoleDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role: Role | null;
}

export default function RoleDeleteModal({
  isOpen,
  onClose,
  onSuccess,
  role,
}: RoleDeleteModalProps) {
  const { success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!role) return;

    setIsLoading(true);
    try {
      await roleService.deleteRole(role.id);
      success("Rol eliminado exitosamente");
      onClose();
      onSuccess();
    } catch (error: any) {
      console.error("Error al eliminar rol:", error);
      showError(error.response?.data?.message || "Error al eliminar el rol");
    } finally {
      setIsLoading(false);
    }
  };

  if (!role) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Eliminar Rol" maxWidth="md">
      <div className="space-y-4">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
          <ExclamationTriangleIcon
            className="w-6 h-6 text-red-600"
            aria-hidden="true"
          />
        </div>

        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">
            ¿Estás seguro de eliminar este rol?
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Vas a eliminar el rol <strong>{role.name}</strong>. Esta acción no
            se puede deshacer.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-yellow-800">
                Advertencia
              </h4>
              <p className="mt-1 text-sm text-yellow-700">
                Los usuarios que tengan asignado este rol perderán todos los
                permisos asociados. Asegúrate de reasignar los roles necesarios
                antes de eliminar.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Eliminando..." : "Eliminar Rol"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
