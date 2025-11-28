import { useState } from "react";
import { ActionIcon } from "../../ui/ActionIcons";
import { Button } from "../../ui/Button";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import type { Team } from "../../../types/teams";
import { teamsApi } from "../../../services/teamsApi";
import { useToast } from "../../../contexts/ToastContext";

interface TeamToggleStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  team: Team | null;
}

export default function TeamToggleStatusModal({
  isOpen,
  onClose,
  onSuccess,
  team,
}: TeamToggleStatusModalProps) {
  const [loading, setLoading] = useState(false);
  const { error: showError, success: showSuccess } = useToast();

  const handleToggleStatus = async () => {
    if (!team) return;

    try {
      setLoading(true);
      await teamsApi.toggleTeamStatus(team.id);

      const action = team.isActive ? "desactivado" : "activado";
      showSuccess(`Equipo ${action} exitosamente`);
      onSuccess();
    } catch (error: any) {
      console.error("Error toggling team status:", error);
      const action = team.isActive ? "desactivar" : "activar";
      showError(error.message || `Error al ${action} el equipo`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !team) return null;

  const action = team.isActive ? "desactivar" : "activar";
  const actionColor = team.isActive ? "yellow" : "green";
  const actionIcon = team.isActive ? "pause" : "play";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
          <div
            className={`p-2 rounded-lg ${
              team.isActive
                ? "bg-yellow-100 dark:bg-yellow-900/30"
                : "bg-green-100 dark:bg-green-900/30"
            }`}
          >
            <ActionIcon action={actionIcon} size="md" color={actionColor} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {team.isActive ? "Desactivar" : "Activar"} Equipo
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Cambiar el estado del equipo
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              ¿Estás seguro de que quieres <strong>{action}</strong> el equipo{" "}
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
                  <p className="text-gray-500 dark:text-gray-400">
                    Estado actual
                  </p>
                  <p
                    className={`font-medium ${
                      team.isActive
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {team.isActive ? "Activo" : "Inactivo"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Miembros</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {team.memberCount || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Action explanation */}
            <div
              className={`rounded-lg p-4 ${
                team.isActive
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700"
                  : "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700"
              }`}
            >
              <div className="flex items-start gap-3">
                <ActionIcon action="info" size="sm" color={actionColor} />
                <div>
                  <h4
                    className={`text-sm font-medium ${
                      team.isActive
                        ? "text-yellow-800 dark:text-yellow-200"
                        : "text-green-800 dark:text-green-200"
                    }`}
                  >
                    {team.isActive ? "Desactivar equipo" : "Activar equipo"}
                  </h4>
                  <p
                    className={`text-sm mt-1 ${
                      team.isActive
                        ? "text-yellow-700 dark:text-yellow-300"
                        : "text-green-700 dark:text-green-300"
                    }`}
                  >
                    {team.isActive
                      ? "El equipo será marcado como inactivo y no aparecerá en las listas principales."
                      : "El equipo será reactivado y volverá a estar disponible para asignaciones."}
                  </p>
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
            variant={team.isActive ? "warning" : "primary"}
            onClick={handleToggleStatus}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                {team.isActive ? "Desactivando..." : "Activando..."}
              </>
            ) : (
              <>
                <ActionIcon action={actionIcon} size="sm" />
                {team.isActive ? "Desactivar" : "Activar"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
