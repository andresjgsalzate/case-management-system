import { useState, useEffect } from "react";
import { ActionIcon } from "../../ui/ActionIcons";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { Select } from "../../ui/Select";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import type { Team, TeamMember } from "../../../types/teams";
import { TeamRole } from "../../../types/teams";
import { teamsApi } from "../../../services/teamsApi";
import { userService } from "../../../services/userService";
import { useToast } from "../../../contexts/ToastContext";
import { useTeamRoles } from "../../../hooks/useTeamRoles";

interface TeamMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  team: Team | null;
}

interface User {
  id: string;
  fullName: string;
  email: string;
  role?: {
    name: string;
  };
}

export default function TeamMembersModal({
  isOpen,
  onClose,
  onSuccess,
  team,
}: TeamMembersModalProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<TeamRole>(TeamRole.MEMBER);
  const [showAddMember, setShowAddMember] = useState(false);
  const { error: showError, success: showSuccess } = useToast();
  const { roles } = useTeamRoles();

  useEffect(() => {
    if (isOpen && team) {
      loadMembers();
      loadAvailableUsers();
    }
  }, [isOpen, team]);

  const loadMembers = async () => {
    if (!team) return;

    try {
      setLoadingMembers(true);
      console.log(
        `🔄 Cargando miembros para el equipo: ${team.id} - ${team.name}`
      );
      const teamMembers = await teamsApi.getTeamMembers(team.id);
      console.log(`✅ Miembros cargados exitosamente:`, {
        teamId: team.id,
        membersCount: Array.isArray(teamMembers) ? teamMembers.length : 0,
        members: teamMembers,
      });
      setMembers(Array.isArray(teamMembers) ? teamMembers : []);
    } catch (error) {
      console.error("❌ Error loading members:", {
        teamId: team.id,
        teamName: team.name,
        error,
      });
      showError("Error al cargar los miembros del equipo");
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await userService.getUsers();
      setAvailableUsers(Array.isArray(response.users) ? response.users : []);
    } catch (error) {
      console.error("Error loading users:", error);
      showError("Error al cargar usuarios");
      setAvailableUsers([]);
    }
  };

  const handleAddMember = async () => {
    if (!team || !selectedUserId || loading) return;

    const memberData = {
      userId: selectedUserId,
      role: selectedRole,
    };

    try {
      setLoading(true);
      const result = await teamsApi.addTeamMember(team.id, memberData);

      console.log("✅ Miembro agregado exitosamente:", result);
      showSuccess("Miembro agregado exitosamente");
      setSelectedUserId("");
      setSelectedRole(TeamRole.MEMBER);
      setShowAddMember(false);
      await loadMembers();
    } catch (error: any) {
      console.error("❌ Error detallado al agregar miembro:", {
        error,
        message: error.message,
        team: team.id,
        memberData,
      });

      // Mostrar un mensaje más específico según el tipo de error
      let errorMessage = "Error al agregar miembro";

      if (error.message) {
        if (error.message.includes("ya es miembro activo")) {
          errorMessage = "Este usuario ya es miembro activo del equipo";
        } else if (error.message.includes("no existe o no está activo")) {
          errorMessage = "El usuario seleccionado no está disponible";
        } else if (error.message.includes("ya tiene un manager activo")) {
          errorMessage =
            "El equipo ya tiene un manager. Solo puede haber uno por equipo.";
        } else {
          errorMessage = error.message;
        }
      }

      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!team || loading) return;

    if (
      !confirm("¿Estás seguro de que quieres quitar este miembro del equipo?")
    ) {
      return;
    }

    try {
      setLoading(true);
      await teamsApi.removeTeamMember(team.id, userId);
      showSuccess("Miembro removido del equipo");
      await loadMembers();
    } catch (error: any) {
      console.error("Error removing member:", error);
      showError(error.message || "Error al remover miembro");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: TeamRole) => {
    if (!team || loading) return;

    try {
      setLoading(true);
      await teamsApi.updateMemberRole(team.id, userId, newRole);
      showSuccess("Rol actualizado exitosamente");
      await loadMembers();
    } catch (error: any) {
      console.error("Error changing role:", error);
      showError(error.message || "Error al cambiar rol");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !team) return null;

  // Filter users that are not already members
  const memberUserIds = new Set(
    Array.isArray(members) ? members.map((m) => m.userId) : []
  );
  const usersToAdd = (
    Array.isArray(availableUsers) ? availableUsers : []
  ).filter(
    (user) =>
      !memberUserIds.has(user.id) &&
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Debug logging para entender el filtrado
  console.log("🔍 Debug filtrado de usuarios:", {
    totalAvailableUsers: availableUsers.length,
    currentMembers: members.length,
    memberUserIds: Array.from(memberUserIds),
    usersToAdd: usersToAdd.length,
    searchTerm,
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: team.color + "20" }}
            >
              <ActionIcon action="users" size="md" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Gestionar Miembros
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {team.name} - {Array.isArray(members) ? members.length : 0}{" "}
                miembro(s)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadMembers}
              disabled={loadingMembers}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              title="Recargar miembros"
            >
              <ActionIcon action="view" size="sm" />
              {loadingMembers ? "Cargando..." : "Actualizar"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAddMember(!showAddMember)}
              className="flex items-center gap-2"
            >
              <ActionIcon action="add" size="sm" />
              Agregar Miembro
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ActionIcon action="close" size="sm" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col h-[calc(90vh-80px)]">
          {/* Add Member Section */}
          {showAddMember && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                Agregar Nuevo Miembro
              </h4>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Buscar Usuario
                  </label>
                  <Input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="w-48">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Usuario
                  </label>
                  <Select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Seleccionar usuario...</option>
                    {usersToAdd.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rol
                  </label>
                  <Select
                    value={selectedRole}
                    onChange={(e) =>
                      setSelectedRole(e.target.value as TeamRole)
                    }
                    disabled={loading}
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  onClick={handleAddMember}
                  disabled={!selectedUserId || loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <ActionIcon action="add" size="sm" />
                  )}
                  Agregar
                </Button>
              </div>
            </div>
          )}

          {/* Members List */}
          <div className="flex-1 overflow-y-auto">
            {loadingMembers ? (
              <div className="flex items-center justify-center p-8">
                <LoadingSpinner size="lg" />
                <span className="ml-3 text-gray-500">Cargando miembros...</span>
              </div>
            ) : !Array.isArray(members) || members.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <ActionIcon
                  action="users"
                  size="xl"
                  className="text-gray-400 mb-4"
                />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Sin miembros asignados
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Este equipo no tiene miembros asignados todavía.
                </p>
                <Button
                  onClick={() => setShowAddMember(true)}
                  className="flex items-center gap-2"
                >
                  <ActionIcon action="add" size="sm" />
                  Agregar Primer Miembro
                </Button>
              </div>
            ) : (
              <div className="p-6">
                <div className="space-y-4">
                  {Array.isArray(members) &&
                    members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                            <ActionIcon action="user" size="sm" color="blue" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {member.user.fullName}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {member.user.email}
                            </p>
                            {member.user.role && (
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                Rol del sistema: {member.user.role.name}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Rol:
                            </span>
                            <Select
                              value={member.role}
                              onChange={(e) =>
                                handleChangeRole(
                                  member.userId,
                                  e.target.value as TeamRole
                                )
                              }
                              disabled={loading}
                              className="w-32"
                            >
                              {roles.map((role) => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </Select>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              Desde:{" "}
                              {new Date(member.joinedAt).toLocaleDateString()}
                            </span>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.userId)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <ActionIcon action="delete" size="sm" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={onSuccess} className="flex items-center gap-2">
            <ActionIcon action="save" size="sm" />
            Finalizar
          </Button>
        </div>
      </div>
    </div>
  );
}
