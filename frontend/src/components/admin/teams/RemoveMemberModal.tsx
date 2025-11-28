import { useState } from "react";
import { ActionIcon } from "../../ui/ActionIcons";
import { Button } from "../../ui/Button";
import { LoadingSpinner } from "../../ui/LoadingSpinner";

interface RemoveMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  memberName: string;
  memberRole: string;
  teamName: string;
}

export default function RemoveMemberModal({
  isOpen,
  onClose,
  onConfirm,
  memberName,
  memberRole,
  teamName,
}: RemoveMemberModalProps) {
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
              Remover Miembro del Equipo
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Esta acción afectará los permisos del usuario
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              ¿Estás seguro de que quieres remover a{" "}
              <strong>{memberName}</strong> del equipo?
            </p>

            {/* Member Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <ActionIcon action="user" size="md" color="blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {memberName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Rol: {memberRole}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Equipo: {teamName}
                  </p>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ActionIcon action="warning" size="sm" color="yellow" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Consecuencias de remover este miembro:
                  </h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 list-disc list-inside space-y-1">
                    <li>Perderá acceso a los recursos del equipo</li>
                    <li>Se actualizarán sus permisos automáticamente</li>
                    <li>
                      Puede ser re-agregado posteriormente si es necesario
                    </li>
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
                Removiendo...
              </>
            ) : (
              <>
                <ActionIcon action="delete" size="sm" />
                Remover del Equipo
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
