import React from "react";
import { ActionIcon } from "../ui/ActionIcons";
import { Team } from "../../types/teams";

interface TeamCardProps {
  team: Team;
  onEdit: (team: Team) => void;
  onDelete: (teamId: string) => void;
  onManageMembers: (team: Team) => void;
}

const TeamCard: React.FC<TeamCardProps> = ({
  team,
  onEdit,
  onDelete,
  onManageMembers,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  // Calcular el número de miembros desde múltiples fuentes
  const memberCount = React.useMemo(() => {
    const fromStats = team.stats?.activeMembers;
    const fromMemberCount = team.memberCount;
    const fromMembersArray = team.members?.filter((m) => m.isActive)?.length;

    const finalCount = fromStats || fromMemberCount || fromMembersArray || 0;

    console.log(
      `🔍 TeamCard "${team.name}" - Sources: stats=${fromStats}, memberCount=${fromMemberCount}, membersArray=${fromMembersArray}, final=${finalCount}`
    );

    return finalCount;
  }, [team]);

  // Debug temporal - logging de memberCount
  React.useEffect(() => {
    console.log(
      `🔍 Team "${team.name}" - Rendering with ${memberCount} miembros`
    );
  }, [team, memberCount]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {team.name}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2">
            {team.description}
          </p>
        </div>

        <div className="relative">
          <ActionIcon
            action="settings"
            onClick={() => setShowMenu(!showMenu)}
            size="sm"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          />

          {showMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
              <div className="py-1">
                <button
                  onClick={() => {
                    onEdit(team);
                    setShowMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <ActionIcon action="edit" size="sm" className="mr-2" />
                  Editar equipo
                </button>
                <button
                  onClick={() => {
                    onManageMembers(team);
                    setShowMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <ActionIcon action="users" size="sm" className="mr-2" />
                  Gestionar miembros
                </button>
                <button
                  onClick={() => {
                    onDelete(team.id);
                    setShowMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                >
                  <ActionIcon action="delete" size="sm" className="mr-2" />
                  Eliminar equipo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {/* Información del equipo */}
        <div className="flex items-center text-sm text-gray-600">
          <ActionIcon action="users" size="sm" className="mr-2" />
          <span>{memberCount} miembros</span>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <ActionIcon action="calendar" size="sm" className="mr-2" />
          <span>Creado el {formatDate(team.createdAt)}</span>
        </div>

        {/* Estado del equipo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                team.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {team.isActive ? "Activo" : "Inactivo"}
            </span>
          </div>

          {/* Mostrar algunos miembros si están disponibles */}
          {team.members && team.members.length > 0 && (
            <div className="flex -space-x-2">
              {team.members.slice(0, 3).map((member) => (
                <div
                  key={member.id}
                  className="relative inline-flex items-center justify-center w-8 h-8 bg-gray-300 rounded-full border-2 border-white"
                  title={`${member.user.fullName} (${member.role})`}
                >
                  <span className="text-xs font-medium text-gray-700">
                    {member.user.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
              ))}
              {team.members.length > 3 && (
                <div className="relative inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full border-2 border-white">
                  <span className="text-xs font-medium text-gray-600">
                    +{team.members.length - 3}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Click overlay to close menu when clicking outside */}
      {showMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setShowMenu(false)} />
      )}
    </div>
  );
};

export default TeamCard;
