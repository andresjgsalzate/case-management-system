import { useState, useEffect } from "react";
import { ActionIcon } from "../../ui/ActionIcons";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { Select } from "../../ui/Select";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import type { Team, UpdateTeamData } from "../../../types/teams";
import { teamsApi } from "../../../services/teamsApi";
import { userService } from "../../../services/userService";
import { useToast } from "../../../contexts/ToastContext";

interface TeamEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  team: Team | null;
}

interface User {
  id: string;
  fullName: string;
  email: string;
}

const teamColors = [
  { value: "#3B82F6", label: "Azul", bg: "bg-blue-500" },
  { value: "#10B981", label: "Verde", bg: "bg-green-500" },
  { value: "#F59E0B", label: "Amarillo", bg: "bg-yellow-500" },
  { value: "#EF4444", label: "Rojo", bg: "bg-red-500" },
  { value: "#8B5CF6", label: "Púrpura", bg: "bg-purple-500" },
  { value: "#06B6D4", label: "Cian", bg: "bg-cyan-500" },
  { value: "#F97316", label: "Naranja", bg: "bg-orange-500" },
  { value: "#84CC16", label: "Lima", bg: "bg-lime-500" },
];

export default function TeamEditModal({
  isOpen,
  onClose,
  onSuccess,
  team,
}: TeamEditModalProps) {
  const [formData, setFormData] = useState<UpdateTeamData>({});
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { error: showError } = useToast();

  useEffect(() => {
    if (isOpen && team) {
      loadUsers();
      // Initialize form with team data
      setFormData({
        name: team.name,
        code: team.code,
        description: team.description,
        color: team.color,
        managerId: team.manager?.id,
      });
      setErrors({});
    }
  }, [isOpen, team]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await userService.getUsers({
        isActive: true,
        limit: 100,
      });
      setUsers(response.users || []);
    } catch (error) {
      console.error("Error loading users:", error);
      showError("Error al cargar usuarios");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async () => {
    if (!team) return;

    try {
      setLoading(true);
      setErrors({});

      // Validaciones básicas
      const newErrors: Record<string, string> = {};
      if (!formData.name?.trim()) {
        newErrors.name = "El nombre es requerido";
      }
      if (!formData.code?.trim()) {
        newErrors.code = "El código es requerido";
      }
      if (
        formData.code &&
        (formData.code.length < 2 || formData.code.length > 10)
      ) {
        newErrors.code = "El código debe tener entre 2 y 10 caracteres";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      await teamsApi.updateTeam(team.id, formData);
      onSuccess();
    } catch (error: any) {
      console.error("Error updating team:", error);
      if (error.message?.includes("código ya existe")) {
        setErrors({ code: "Este código ya está en uso por otro equipo" });
      } else {
        showError(error.message || "Error al actualizar el equipo");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !team) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: team.color + "20" }}
            >
              <ActionIcon action="edit" size="sm" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Editar Equipo
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {team.name} ({team.code})
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ActionIcon action="close" size="sm" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre del Equipo *
            </label>
            <Input
              type="text"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Ej: Equipo de Desarrollo"
              error={errors.name}
              disabled={loading}
            />
          </div>

          {/* Código */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Código del Equipo *
            </label>
            <Input
              type="text"
              value={formData.code || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  code: e.target.value.toUpperCase(),
                }))
              }
              placeholder="Ej: DEV001"
              error={errors.code}
              disabled={loading}
              maxLength={10}
            />
            <p className="text-xs text-gray-500 mt-1">
              Código único para identificar el equipo (2-10 caracteres)
            </p>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Descripción del equipo y sus responsabilidades..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color del Equipo
            </label>
            <div className="grid grid-cols-4 gap-2">
              {teamColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, color: color.value }))
                  }
                  className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all ${
                    formData.color === color.value
                      ? "border-gray-900 dark:border-white ring-2 ring-blue-500"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                  }`}
                  disabled={loading}
                >
                  <div className={`w-6 h-6 rounded-full ${color.bg}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Manager */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Manager
            </label>
            {loadingUsers ? (
              <div className="flex items-center justify-center p-4">
                <LoadingSpinner size="sm" />
                <span className="ml-2 text-sm text-gray-500">
                  Cargando usuarios...
                </span>
              </div>
            ) : (
              <Select
                value={formData.managerId || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    managerId: e.target.value || undefined,
                  }))
                }
                disabled={loading}
              >
                <option value="">Sin manager asignado</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} ({user.email})
                  </option>
                ))}
              </Select>
            )}
          </div>

          {/* Estado actual */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estado Actual
            </h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Estado:</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  team.isActive
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}
              >
                {team.isActive ? "Activo" : "Inactivo"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-600 dark:text-gray-400">
                Miembros:
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {team.memberCount || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              loading || !formData.name?.trim() || !formData.code?.trim()
            }
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Guardando...
              </>
            ) : (
              <>
                <ActionIcon action="save" size="sm" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
