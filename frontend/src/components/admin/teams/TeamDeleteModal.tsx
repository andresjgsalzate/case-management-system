import { useState } from "react";
import { ActionIcon } from "../../ui/ActionIcons";
import { Button } from "../../ui/Button";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import type { Team } from "../../../types/teams";
import { teamsApi } from "../../../services/teamsApi";
import { useToast } from "../../../contexts/ToastContext";

interface TeamDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  team: Team | null;
}

export default function TeamDeleteModal({
  isOpen,
  onClose,
  onSuccess,
  team,
}: TeamDeleteModalProps) {
  const [loading, setLoading] = useState(false);
  const { error: showError, success: showSuccess } = useToast();

  const handleDelete = async () => {
    if (!team) return;

    try {
      setLoading(true);
      await teamsApi.deleteTeam(team.id);
      showSuccess("Equipo eliminado exitosamente");
      onSuccess();
    } catch (error: any) {
      console.error("Error deleting team:", error);
      showError(error.message || "Error al eliminar el equipo");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !team) return null;

  const hasMembers = team.memberCount && team.memberCount > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <ActionIcon action="warning" size="md" color="red" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Eliminar Equipo
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Esta acción no se puede deshacer
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              ¿Estás seguro de que quieres eliminar el equipo{" "}
              <strong>"{team.name}"</strong>?
            </p>

            {/* Team Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: team.color }}
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {team.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Código: {team.code}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Miembros:
                  </span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-white">
                    {team.memberCount || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Manager:
                  </span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-white">
                    {team.manager?.fullName || "Sin asignar"}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning for teams with members */}
            {hasMembers && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <ActionIcon action="warning" size="sm" color="yellow" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      ¡Atención!
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Este equipo tiene{" "}
                      <strong>{team.memberCount} miembro(s)</strong>{" "}
                      asignado(s). Al eliminarlo, todos los miembros perderán su
                      asignación al equipo.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ActionIcon action="error" size="sm" color="red" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Consecuencias de eliminar este equipo:
                  </h4>
                  <ul className="text-sm text-red-700 dark:text-red-300 mt-1 list-disc list-inside space-y-1">
                    <li>Se eliminará permanentemente del sistema</li>
                    <li>Todos los miembros serán desasignados</li>
                    <li>Se perderá el historial del equipo</li>
                    <li>Esta acción no se puede deshacer</li>
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
            onClick={handleDelete}
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
                Eliminar Equipo
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
