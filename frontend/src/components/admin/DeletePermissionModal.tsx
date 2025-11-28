import { useState } from "react";
import { ActionIcon } from "../../components/ui/ActionIcons";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";

interface DeletePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  permissionName: string;
  permissionDescription: string;
}

export default function DeletePermissionModal({
  isOpen,
  onClose,
  onConfirm,
  permissionName,
  permissionDescription,
}: DeletePermissionModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } catch (error) {
      // El error se maneja en el componente padre
      console.error("Error in modal:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <ActionIcon action="delete" size="md" color="red" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Eliminar Permiso
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Esta acción afectará el sistema de permisos
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              ¿Estás seguro de que quieres eliminar el permiso{" "}
              <strong>{permissionName}</strong>?
            </p>

            {/* Permission Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <ActionIcon action="lock" size="md" color="blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {permissionName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {permissionDescription}
                  </p>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ActionIcon action="warning" size="sm" color="red" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Consecuencias de eliminar este permiso:
                  </h4>
                  <ul className="text-sm text-red-700 dark:text-red-300 mt-1 list-disc list-inside space-y-1">
                    <li>
                      Se revocará de todos los roles que lo tengan asignado
                    </li>
                    <li>
                      Los usuarios perderán acceso a las funcionalidades
                      relacionadas
                    </li>
                    <li>Esta acción no se puede deshacer fácilmente</li>
                    <li>Puede afectar el funcionamiento del sistema</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Eliminando...
              </>
            ) : (
              <>
                <ActionIcon action="delete" size="sm" />
                Eliminar Permiso
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
