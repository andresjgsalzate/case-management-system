import { useState } from "react";
import {
  TrashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
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
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!role) return;

    setIsLoading(true);
    try {
      await roleService.deleteRole(role.id);
      toast.success("Rol eliminado exitosamente");
      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error("Error al eliminar rol:", error);
      toast.error(error.response?.data?.message || "Error al eliminar el rol");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!role) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Eliminar Rol" size="md">
      {/* Icono de advertencia */}
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
        <ExclamationTriangleIcon
          className="h-6 w-6 text-red-600 dark:text-red-400"
          aria-hidden="true"
        />
      </div>

      {/* Información del rol */}
      <div className="text-center mb-4">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          ¿Estás seguro de eliminar este rol?
        </h4>
        <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 text-left">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
            <strong>Nombre:</strong> {role.name}
          </p>
          {role.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
              <strong>Descripción:</strong> {role.description}
            </p>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
            <strong>Estado:</strong> {role.isActive ? "Activo" : "Inactivo"}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <strong>Creado:</strong>{" "}
            {new Date(role.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Advertencias */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 dark:text-red-500 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-red-700 dark:text-red-300">
            <p className="font-medium mb-1">Esta acción no se puede deshacer</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Se eliminará el rol permanentemente</li>
              <li>Se removerán todos los permisos asociados</li>
              <li>Los usuarios con este rol perderán sus permisos</li>
              <li>Los datos históricos se mantendrán</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confirmación adicional */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-6">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          <strong>Recomendación:</strong> Considera desactivar el rol en lugar
          de eliminarlo si hay usuarios que podrían necesitarlo en el futuro.
        </p>
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-3">
        <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={handleDelete} disabled={isLoading}>
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
              Eliminando...
            </>
          ) : (
            <>
              <TrashIcon className="h-4 w-4 mr-1" />
              Sí, Eliminar
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
}
