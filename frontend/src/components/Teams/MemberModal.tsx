import React, { useState, useEffect } from "react";
import { ActionIcon } from "../ui/ActionIcons";
import { Team, TeamMember, TeamRole } from "../../types/teams";
import { teamsApi } from "../../services/teamsApi";

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMembersUpdated: () => void;
  team: Team | null;
}

interface User {
  id: string;
  fullName: string;
  email: string;
  role?: {
    id: string;
    name: string;
  };
}

const MemberModal: React.FC<MemberModalProps> = ({
  isOpen,
  onClose,
  onMembersUpdated,
  team,
}) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<TeamRole>(TeamRole.MEMBER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && team) {
      loadMembers();
      loadAvailableUsers();
    }
  }, [isOpen, team]);

  const loadMembers = async () => {
    if (!team) return;

    try {
      const teamMembers = await teamsApi.getTeamMembers(team.id);
      setMembers(teamMembers);
    } catch (error) {
      console.error("Error loading members:", error);
      setError("Error al cargar los miembros del equipo");
    }
  };

  const loadAvailableUsers = async () => {
    // Este sería un endpoint para obtener usuarios disponibles
    // Por ahora simulamos algunos usuarios
    try {
      // Aquí iría la llamada real a la API para obtener usuarios
      // const users = await usersApi.getAvailableUsers();
      const mockUsers: User[] = [
        {
          id: "1",
          fullName: "Juan Pérez",
          email: "juan.perez@example.com",
          role: { id: "1", name: "Administrador" },
        },
        {
          id: "2",
          fullName: "María García",
          email: "maria.garcia@example.com",
          role: { id: "2", name: "Analista de Aplicaciones" },
        },
        {
          id: "3",
          fullName: "Carlos López",
          email: "carlos.lopez@example.com",
          role: { id: "3", name: "Usuario" },
        },
      ];
      setAvailableUsers(mockUsers);
    } catch (error) {
      console.error("Error loading available users:", error);
    }
  };

  const handleAddMember = async () => {
    if (!team || !selectedUserId) return;

    try {
      setLoading(true);
      await teamsApi.addTeamMember(team.id, {
        userId: selectedUserId,
        role: selectedRole,
      });

      setSelectedUserId("");
      setSelectedRole(TeamRole.MEMBER);
      await loadMembers();
      onMembersUpdated();
    } catch (error: any) {
      setError(error.message || "Error al agregar miembro");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (member: TeamMember, newRole: TeamRole) => {
    if (!team) return;

    try {
      setLoading(true);
      await teamsApi.updateMemberRole(team.id, member.userId, newRole);
      await loadMembers();
      onMembersUpdated();
    } catch (error: any) {
      setError(error.message || "Error al actualizar el rol");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (member: TeamMember) => {
    if (
      !team ||
      !confirm("¿Estás seguro de que deseas remover este miembro del equipo?")
    ) {
      return;
    }

    try {
      setLoading(true);
      await teamsApi.removeTeamMember(team.id, member.userId);
      await loadMembers();
      onMembersUpdated();
    } catch (error: any) {
      setError(error.message || "Error al remover miembro");
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: TeamRole) => {
    switch (role) {
      case TeamRole.MANAGER:
        return "bg-red-100 text-red-800";
      case TeamRole.LEAD:
        return "bg-blue-100 text-blue-800";
      case TeamRole.SENIOR:
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredUsers = availableUsers.filter(
    (user) =>
      !members.some((member) => member.userId === user.id) &&
      (user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Gestionar Miembros - {team?.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ActionIcon action="close" size="md" />
          </button>
        </div>

        <div className="flex flex-col max-h-[calc(90vh-80px)]">
          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 flex items-center">
                <ActionIcon action="error" size="sm" className="mr-2" />
                {error}
              </p>
            </div>
          )}

          {/* Add Member Section */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Agregar Nuevo Miembro
            </h3>

            <div className="space-y-4">
              {/* Search Users */}
              <div className="relative">
                <ActionIcon
                  action="search"
                  size="sm"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-3">
                {/* User Selection */}
                <div className="flex-1">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar usuario...</option>
                    {filteredUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} - {user.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Role Selection */}
                <div className="w-32">
                  <select
                    value={selectedRole}
                    onChange={(e) =>
                      setSelectedRole(e.target.value as TeamRole)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={TeamRole.MEMBER}>Miembro</option>
                    <option value={TeamRole.SENIOR}>Senior</option>
                    <option value={TeamRole.LEAD}>Líder</option>
                    <option value={TeamRole.MANAGER}>Manager</option>
                  </select>
                </div>

                {/* Add Button */}
                <button
                  onClick={handleAddMember}
                  disabled={!selectedUserId || loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                >
                  <ActionIcon action="add" size="sm" className="mr-2" />
                  Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Members List */}
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Miembros del Equipo ({members.length})
            </h3>

            {members.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ActionIcon
                  action="users"
                  size="xl"
                  className="mx-auto mb-4 text-gray-300"
                />
                <p>No hay miembros en este equipo</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {member.user.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <div>
                        <p className="font-medium text-gray-900">
                          {member.user.fullName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {member.user.email}
                        </p>
                        {member.user.role && (
                          <p className="text-xs text-gray-500">
                            Rol del sistema: {member.user.role.name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Role Selector */}
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleUpdateRole(member, e.target.value as TeamRole)
                        }
                        disabled={loading}
                        className={`px-2 py-1 text-sm rounded-full border-0 font-medium ${getRoleColor(
                          member.role
                        )}`}
                      >
                        <option value={TeamRole.MEMBER}>Miembro</option>
                        <option value={TeamRole.SENIOR}>Senior</option>
                        <option value={TeamRole.LEAD}>Líder</option>
                        <option value={TeamRole.MANAGER}>Manager</option>
                      </select>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveMember(member)}
                        disabled={loading}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remover del equipo"
                      >
                        <ActionIcon action="delete" size="sm" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberModal;
