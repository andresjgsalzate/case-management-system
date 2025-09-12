import React, { useState } from "react";
import todoPriorityService, {
  CreateTodoPriorityRequest,
} from "../../../services/todoPriorityService";
import { useToast } from "../../../hooks/useToast";
import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { TextArea } from "../../ui/TextArea";

interface TodoPriorityCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_COLORS = [
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#eab308", // yellow-500
  "#22c55e", // green-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#6b7280", // gray-500
];

export const TodoPriorityCreateModal: React.FC<
  TodoPriorityCreateModalProps
> = ({ isOpen, onClose, onSuccess }) => {
  const { addToast } = useToast();

  const [formData, setFormData] = useState<CreateTodoPriorityRequest>({
    name: "",
    description: "",
    color: DEFAULT_COLORS[0],
    level: 1,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (formData.level < 1 || formData.level > 10) {
      newErrors.level = "El nivel debe estar entre 1 y 10";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await todoPriorityService.createPriority({
        ...formData,
        description: formData.description?.trim() || undefined,
      });

      if (response.success) {
        addToast({
          type: "success",
          title: "Éxito",
          message: "Prioridad creada correctamente",
        });
        onSuccess();
        handleClose();
      } else {
        throw new Error(response.message || "Error al crear la prioridad");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      addToast({
        type: "error",
        title: "Error",
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      color: DEFAULT_COLORS[0],
      level: 1,
    });
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  const handleInputChange = (
    field: keyof CreateTodoPriorityRequest,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nueva Prioridad"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Ingrese el nombre de la prioridad"
              className={errors.name ? "border-red-300" : ""}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción
            </label>
            <TextArea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Descripción opcional de la prioridad"
              rows={3}
            />
          </div>

          {/* Nivel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nivel (1-10) *
            </label>
            <Input
              type="number"
              min="1"
              max="10"
              value={formData.level}
              onChange={(e) =>
                handleInputChange("level", parseInt(e.target.value) || 1)
              }
              className={errors.level ? "border-red-300" : ""}
            />
            {errors.level && (
              <p className="mt-1 text-sm text-red-600">{errors.level}</p>
            )}
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Color
            </label>
            <div className="flex space-x-2 mt-2">
              {DEFAULT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleInputChange("color", color)}
                  className={`w-8 h-8 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    formData.color === color
                      ? "border-gray-900 dark:border-white"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Creando..." : "Crear Prioridad"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
