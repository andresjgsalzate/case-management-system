import React, { useState, useEffect } from "react";
import { ActionIcon } from "../ui/ActionIcons";
import { Team, CreateTeamData, UpdateTeamData } from "../../types/teams";

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (teamData: CreateTeamData | UpdateTeamData) => void;
  team?: Team | null;
  isEditing: boolean;
}

const TeamModal: React.FC<TeamModalProps> = ({
  isOpen,
  onClose,
  onSave,
  team,
  isEditing,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    color: "#3B82F6",
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && team) {
        setFormData({
          name: team.name || "",
          code: team.code || "",
          description: team.description || "",
          color: team.color || "#3B82F6",
          isActive: team.isActive ?? true,
        });
      } else {
        setFormData({
          name: "",
          code: "",
          description: "",
          color: "#3B82F6",
          isActive: true,
        });
      }
      setErrors({});
    }
  }, [isOpen, isEditing, team]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre del equipo es obligatorio";
    } else if (formData.name.length < 2) {
      newErrors.name = "El nombre debe tener al menos 2 caracteres";
    }

    if (!formData.code.trim()) {
      newErrors.code = "El código del equipo es obligatorio";
    } else if (formData.code.length < 2) {
      newErrors.code = "El código debe tener al menos 2 caracteres";
    } else if (!/^[A-Z0-9_-]+$/i.test(formData.code)) {
      newErrors.code =
        "El código solo puede contener letras, números, guiones y guiones bajos";
    }

    if (!formData.description.trim()) {
      newErrors.description = "La descripción es obligatoria";
    } else if (formData.description.length < 10) {
      newErrors.description =
        "La descripción debe tener al menos 10 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await onSave(formData);
    } catch (error) {
      console.error("Error saving team:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (!isOpen) return null;

  const colorOptions = [
    { name: "Azul", value: "#3B82F6" },
    { name: "Verde", value: "#10B981" },
    { name: "Púrpura", value: "#8B5CF6" },
    { name: "Rosa", value: "#EC4899" },
    { name: "Amarillo", value: "#F59E0B" },
    { name: "Rojo", value: "#EF4444" },
    { name: "Índigo", value: "#6366F1" },
    { name: "Teal", value: "#14B8A6" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Editar Equipo" : "Crear Nuevo Equipo"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ActionIcon action="close" size="md" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre del equipo */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nombre del Equipo *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ej: Desarrollo Frontend"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <ActionIcon action="error" size="sm" className="mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Código del equipo */}
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Código del Equipo *
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.code ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ej: FRONTEND"
              style={{ textTransform: "uppercase" }}
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <ActionIcon action="error" size="sm" className="mr-1" />
                {errors.code}
              </p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Descripción *
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Describe las responsabilidades y objetivos del equipo..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <ActionIcon action="error" size="sm" className="mr-1" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Color del equipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color del Equipo
            </label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, color: color.value }))
                  }
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color.value
                      ? "border-gray-900 scale-110"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Estado activo */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="isActive"
              className="ml-2 block text-sm text-gray-900"
            >
              Equipo activo
            </label>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
            >
              <ActionIcon action="save" size="sm" className="mr-2" />
              {loading ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamModal;
