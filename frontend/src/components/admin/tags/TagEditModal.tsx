import React, { useState, useEffect } from "react";
import { PencilIcon } from "@heroicons/react/24/outline";
import { useToast } from "../../../contexts/ToastContext";
import { tagService } from "../../../services/tagService";
import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";
import type { Tag, UpdateTagRequest, TagCategory } from "../../../types/tag";
import { TAG_CATEGORIES, TAG_COLORS } from "../../../types/tag";

interface TagEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tag: Tag | null;
}

export default function TagEditModal({
  isOpen,
  onClose,
  onSuccess,
  tag,
}: TagEditModalProps) {
  const { success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateTagRequest>({
    tagName: "",
    description: "",
    color: TAG_COLORS[0],
    category: "custom",
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos del tag cuando el modal se abre
  useEffect(() => {
    if (isOpen && tag) {
      setFormData({
        tagName: tag.tagName,
        description: tag.description || "",
        color: tag.color,
        category: tag.category,
        isActive: tag.isActive,
      });
      setErrors({});
    }
  }, [isOpen, tag]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.tagName?.trim()) {
      newErrors.tagName = "El nombre de la etiqueta es requerido";
    } else if (formData.tagName.trim().length < 2) {
      newErrors.tagName = "El nombre debe tener al menos 2 caracteres";
    } else if (formData.tagName.trim().length > 50) {
      newErrors.tagName = "El nombre no puede exceder 50 caracteres";
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = "La descripción no puede exceder 200 caracteres";
    }

    if (!formData.category) {
      newErrors.category = "La categoría es requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tag || !validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await tagService.updateTag(tag.id, {
        ...formData,
        tagName: formData.tagName?.trim(),
        description: formData.description?.trim() || undefined,
      });

      success("Etiqueta actualizada exitosamente");
      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error("Error updating tag:", error);
      showError(error.message || "Error al actualizar la etiqueta");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      tagName: "",
      description: "",
      color: TAG_COLORS[0],
      category: "custom",
      isActive: true,
    });
    setErrors({});
    onClose();
  };

  const handleInputChange = (
    field: keyof UpdateTagRequest,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field as string]) {
      const newErrors = { ...errors };
      delete newErrors[field as string];
      setErrors(newErrors);
    }
  };

  const getCategoryColor = (category: TagCategory) => {
    const categoryInfo = TAG_CATEGORIES.find((cat) => cat.value === category);
    return categoryInfo?.color || TAG_COLORS[0];
  };

  if (!tag) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Editar Etiqueta">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nombre de la etiqueta */}
        <div>
          <label
            htmlFor="tagName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Nombre de la Etiqueta *
          </label>
          <input
            type="text"
            id="tagName"
            value={formData.tagName || ""}
            onChange={(e) => handleInputChange("tagName", e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
              errors.tagName
                ? "border-red-300 dark:border-red-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
            placeholder="Ingresa el nombre de la etiqueta"
            disabled={isLoading}
            maxLength={50}
          />
          {errors.tagName && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.tagName}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {(formData.tagName || "").length}/50 caracteres
          </p>
        </div>

        {/* Categoría */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Categoría *
          </label>
          <select
            id="category"
            value={formData.category || "custom"}
            onChange={(e) => {
              const category = e.target.value as TagCategory;
              handleInputChange("category", category);
              // Auto-assign color based on category
              setFormData((prev) => ({
                ...prev,
                category,
                color: getCategoryColor(category),
              }));
            }}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
              errors.category
                ? "border-red-300 dark:border-red-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
            disabled={isLoading}
          >
            {TAG_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label} - {category.description}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.category}
            </p>
          )}
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Color
          </label>
          <div className="grid grid-cols-6 gap-2">
            {TAG_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleInputChange("color", color)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  formData.color === color
                    ? "border-gray-900 dark:border-gray-100 scale-110"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400"
                }`}
                style={{ backgroundColor: color }}
                disabled={isLoading}
                title={color}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
              style={{ backgroundColor: formData.color }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Color seleccionado: {formData.color}
            </span>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Descripción
          </label>
          <textarea
            id="description"
            value={formData.description || ""}
            onChange={(e) => handleInputChange("description", e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
              errors.description
                ? "border-red-300 dark:border-red-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
            placeholder="Descripción opcional de la etiqueta"
            disabled={isLoading}
            maxLength={200}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.description}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {(formData.description || "").length}/200 caracteres
          </p>
        </div>

        {/* Estado */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive || false}
              onChange={(e) => handleInputChange("isActive", e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800"
              disabled={isLoading}
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Etiqueta activa
            </span>
          </label>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Las etiquetas inactivas no aparecerán como opciones en los
            formularios
          </p>
        </div>

        {/* Vista previa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Vista Previa
          </label>
          <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: formData.color }}
            />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formData.tagName || "Nombre de la etiqueta"}
            </span>
            <span
              className="px-2 py-1 rounded-full text-xs text-white"
              style={{
                backgroundColor: getCategoryColor(
                  formData.category as TagCategory
                ),
              }}
            >
              {
                TAG_CATEGORIES.find((cat) => cat.value === formData.category)
                  ?.label
              }
            </span>
            {!formData.isActive && (
              <span className="px-2 py-1 rounded-full text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                Inactiva
              </span>
            )}
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md p-4">
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Información de la etiqueta:</p>
            <ul className="space-y-1">
              <li>• Creada: {new Date(tag.createdAt).toLocaleDateString()}</li>
              <li>
                • Última actualización:{" "}
                {new Date(tag.updatedAt).toLocaleDateString()}
              </li>
              <li>
                • Uso actual: {tag.usageCount} documento
                {tag.usageCount !== 1 ? "s" : ""}
              </li>
            </ul>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="flex items-center"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Actualizando...
              </>
            ) : (
              <>
                <PencilIcon className="h-4 w-4 mr-2" />
                Actualizar Etiqueta
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
