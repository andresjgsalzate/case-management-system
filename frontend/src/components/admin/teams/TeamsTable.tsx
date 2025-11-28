import { useState } from "react";
import { ActionIcon } from "../../ui/ActionIcons";
import type { Team } from "../../../types/teams";
import { teamsApi } from "../../../services/teamsApi";
import { useToast } from "../../../contexts/ToastContext";
import TeamEditModal from "./TeamEditModal";
import TeamDeleteModal from "./TeamDeleteModal";
import TeamMembersModal from "./TeamMembersModal";

interface TeamsTableProps {
  teams: Team[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function TeamsTable({
  teams,
  isLoading,
  onRefresh,
}: TeamsTableProps) {
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    team: Team | null;
  }>({
    isOpen: false,
    team: null,
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    team: Team | null;
  }>({
    isOpen: false,
    team: null,
  });

  const [membersModal, setMembersModal] = useState<{
    isOpen: boolean;
    team: Team | null;
  }>({
    isOpen: false,
    team: null,
  });

  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const { success: showSuccess, error: showError } = useToast();

  const handleEdit = (team: Team) => {
    setEditModal({ isOpen: true, team });
  };

  const handleDelete = (team: Team) => {
    setDeleteModal({ isOpen: true, team });
  };

  const handleManageMembers = (team: Team) => {
    setMembersModal({ isOpen: true, team });
  };

  const handleToggleStatus = async (team: Team) => {
    const action = team.isActive ? "desactivar" : "activar";
    const confirmMessage = `¿Estás seguro de que quieres ${action} el equipo "${team.name}"?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setToggleLoading(team.id);
      await teamsApi.toggleTeamStatus(team.id);
      showSuccess(
        `Equipo ${team.isActive ? "desactivado" : "activado"} exitosamente`
      );
      onRefresh();
    } catch (error: any) {
      console.error("Error toggling team status:", error);
      showError(error.message || `Error al ${action} el equipo`);
    } finally {
      setToggleLoading(null);
    }
  };

  const closeModals = () => {
    setEditModal({ isOpen: false, team: null });
    setDeleteModal({ isOpen: false, team: null });
    setMembersModal({ isOpen: false, team: null });
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

  if (teams?.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-12 text-center">
          <ActionIcon
            action="users"
            size="xl"
            className="mx-auto mb-4"
            color="neutral"
          />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay equipos
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No se encontraron equipos que coincidan con los filtros aplicados.
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
                  Equipo
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Manager
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Miembros
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
              {teams?.map((team) => (
                <tr
                  key={team.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className={`p-2 rounded-lg mr-3 ${
                          team.isActive
                            ? "bg-blue-100 dark:bg-blue-900"
                            : "bg-gray-100 dark:bg-gray-700"
                        }`}
                      >
                        <ActionIcon
                          action="users"
                          size="sm"
                          color={team.isActive ? "blue" : "neutral"}
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {team.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Código: {team.code}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white max-w-xs">
                      {team.description ? (
                        <span title={team.description}>
                          {team.description.length > 50
                            ? `${team.description.slice(0, 50)}...`
                            : team.description}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 italic">
                          Sin descripción
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-1 bg-green-100 dark:bg-green-900 rounded-full mr-2">
                        <ActionIcon action="shield" size="xs" color="success" />
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {team.manager?.fullName || "Sin asignar"}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        team.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {team.isActive ? (
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
                      {team.memberCount || 0}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(team.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleToggleStatus(team)}
                        disabled={toggleLoading === team.id}
                        className={`transition-colors p-1 rounded ${
                          toggleLoading === team.id
                            ? "text-gray-400 cursor-not-allowed"
                            : team.isActive
                            ? "text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            : "text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        }`}
                        title={
                          toggleLoading === team.id
                            ? "Procesando..."
                            : team.isActive
                            ? "Desactivar equipo"
                            : "Activar equipo"
                        }
                      >
                        {toggleLoading === team.id ? (
                          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                        ) : team.isActive ? (
                          <ActionIcon action="warning" size="sm" />
                        ) : (
                          <ActionIcon action="view" size="sm" />
                        )}
                      </button>

                      <button
                        onClick={() => handleManageMembers(team)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-1 rounded"
                        title="Gestionar miembros"
                      >
                        <ActionIcon action="users" size="sm" />
                      </button>

                      <button
                        onClick={() => handleEdit(team)}
                        className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 transition-colors p-1 rounded"
                        title="Editar equipo"
                      >
                        <ActionIcon action="edit" size="sm" />
                      </button>

                      <button
                        onClick={() => handleDelete(team)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded"
                        title="Eliminar equipo"
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

      {/* Modales - placeholder por ahora */}
      {editModal.isOpen && (
        <TeamEditModal
          isOpen={editModal.isOpen}
          onClose={closeModals}
          onSuccess={() => {
            closeModals();
            onRefresh();
          }}
          team={editModal.team}
        />
      )}

      {deleteModal.isOpen && (
        <TeamDeleteModal
          isOpen={deleteModal.isOpen}
          onClose={closeModals}
          onSuccess={() => {
            closeModals();
            onRefresh();
          }}
          team={deleteModal.team}
        />
      )}

      {membersModal.isOpen && (
        <TeamMembersModal
          isOpen={membersModal.isOpen}
          onClose={closeModals}
          onSuccess={() => {
            closeModals();
            onRefresh();
          }}
          team={membersModal.team}
        />
      )}
    </>
  );
}
