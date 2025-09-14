import React, { useState } from "react";
import { ActionIcon } from "../ui/ActionIcons";
import { User as UserType } from "../../types/user";
import { userService } from "../../services/userService";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { LoadingSpinner } from "../ui/LoadingSpinner";

interface UserDeleteModalProps {
  user: UserType;
  onClose: () => void;
  onSuccess: () => void;
}

export const UserDeleteModal: React.FC<UserDeleteModalProps> = ({
  user,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const expectedConfirmText = "ELIMINAR";
  const isConfirmValid = confirmText === expectedConfirmText;

  const handleDelete = async () => {
    if (!isConfirmValid) {
      setError(`Debe escribir "${expectedConfirmText}" para confirmar`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await userService.deleteUser(user.id);
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar usuario"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmText(e.target.value);
    if (error) {
      setError(null);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Eliminar Usuario" size="md">
      <div className="space-y-6">
        {/* Icono de advertencia */}
        <div className="flex items-center justify-center">
          <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-3">
            <ActionIcon action="warning" size="lg" color="danger" />
          </div>
        </div>

        {/* Mensaje de advertencia */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            ¿Está seguro que desea eliminar este usuario?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Esta acción no se puede deshacer. Se eliminará permanentemente toda
            la información del usuario.
          </p>
        </div>

        {/* Información del usuario */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start space-x-3">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full p-2">
              <ActionIcon action="user" size="sm" color="neutral" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {user.fullName}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {user.email}
              </p>
              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-500">
                <span>ID: {user.id}</span>
                <span>Rol: {user.roleName}</span>
                <span
                  className={`px-2 py-1 rounded-full ${
                    user.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                  }`}
                >
                  {user.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de datos que se eliminarán */}
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            Los siguientes datos se eliminarán permanentemente:
          </h4>
          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
            <li>• Información personal del usuario</li>
            <li>• Historial de accesos y actividad</li>
            <li>• Asignaciones de permisos y roles</li>
            <li>• Registros asociados en el sistema</li>
          </ul>
        </div>

        {/* Campo de confirmación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Para confirmar, escriba{" "}
            <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">
              {expectedConfirmText}
            </span>
            :
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={handleConfirmTextChange}
            placeholder={`Escriba "${expectedConfirmText}" para confirmar`}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 ${
              error ? "border-red-500" : "border-gray-300"
            }`}
            disabled={loading}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleDelete}
            disabled={loading || !isConfirmValid}
            className={`flex items-center gap-2 ${
              !isConfirmValid || loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            {loading && <LoadingSpinner size="sm" />}
            <ActionIcon action="delete" size="sm" />
            Eliminar Usuario
          </Button>
        </div>
      </div>
    </Modal>
  );
};
