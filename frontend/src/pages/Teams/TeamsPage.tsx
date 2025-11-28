import React, { useState, useEffect } from "react";
import { ActionIcon } from "../../components/ui/ActionIcons";
import { Team, TeamQueryParams } from "../../types/teams";
import { teamsApi } from "../../services/teamsApi";
import TeamsTable from "../../components/admin/teams/TeamsTable";
import TeamCreateModal from "../../components/admin/teams/TeamCreateModal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { useToast } from "../../contexts/ToastContext";

const TeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TeamQueryParams>({
    page: 1,
    limit: 10,
  });

  // Estados de modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { success: showToast } = useToast();

  // Permisos (temporal hasta implementar el hook completo)
  const canCreate = true; // hasPermission("teams.create.all");

  useEffect(() => {
    loadTeams();
  }, [filters]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await teamsApi.getTeams(filters);

      setTeams(response || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar equipos");
      setTeams([]); // Asegurar que siempre sea un array en caso de error
      console.error("❌ Error loading teams:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  };

  const handleFilterChange = (key: keyof TeamQueryParams, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleCreateTeam = () => {
    setShowCreateModal(true);
  };

  const handleTeamCreated = () => {
    setShowCreateModal(false);
    loadTeams();
    showToast("Equipo creado exitosamente");
  };

  const handleRefresh = () => {
    loadTeams();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ActionIcon action="users" size="lg" />
            Gestión de Equipos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administra los equipos de trabajo y sus miembros
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canCreate && (
            <Button
              onClick={handleCreateTeam}
              className="flex items-center gap-2"
            >
              <ActionIcon action="add" size="sm" />
              Nuevo Equipo
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <ActionIcon
                action="search"
                size="sm"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <Input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={filters.search || ""}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtro por estado */}
          <div className="w-full sm:w-48">
            <Select
              value={filters.isActive?.toString() || ""}
              onChange={(e) =>
                handleFilterChange(
                  "isActive",
                  e.target.value ? e.target.value === "true" : undefined
                )
              }
            >
              <option value="">Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </Select>
          </div>

          {/* Límite por página */}
          <div className="w-full sm:w-32">
            <Select
              value={filters.limit?.toString() || "10"}
              onChange={(e) =>
                handleFilterChange("limit", parseInt(e.target.value))
              }
            >
              <option value="10">10 por página</option>
              <option value="20">20 por página</option>
              <option value="50">50 por página</option>
            </Select>
          </div>

          {/* Botón de actualizar */}
          <Button
            variant="secondary"
            className="flex items-center gap-2 whitespace-nowrap"
            onClick={handleRefresh}
          >
            <ActionIcon action="filter" size="sm" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Tabla de equipos */}
      {!loading && (
        <TeamsTable
          teams={teams}
          isLoading={loading}
          onRefresh={handleRefresh}
        />
      )}

      {/* Modales */}
      {showCreateModal && (
        <TeamCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleTeamCreated}
        />
      )}
    </div>
  );
};

export default TeamsPage;
