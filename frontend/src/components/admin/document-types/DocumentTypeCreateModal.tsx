import { useState } from "react";
import { useToast } from "../../../hooks/useNotification";
import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";
import { PlusIcon } from "@heroicons/react/24/outline";
import { DocumentTypeService } from "../../../services/knowledge.service";
import type { CreateDocumentTypeDto } from "../../../types/knowledge";

interface DocumentTypeCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Colores predefinidos para los tipos de documento
const DOCUMENT_TYPE_COLORS = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#EAB308", // Yellow
  "#84CC16", // Lime
  "#22C55E", // Green
  "#10B981", // Emerald
  "#14B8A6", // Teal
  "#06B6D4", // Cyan
  "#0EA5E9", // Sky
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#A855F7", // Purple
  "#D946EF", // Fuchsia
  "#EC4899", // Pink
  "#F43F5E", // Rose
  "#6B7280", // Gray
] as const;

// Iconos comunes para tipos de documento
const COMMON_ICONS = [
  "📄",
  "📝",
  "📋",
  "📊",
  "📈",
  "📉",
  "📦",
  "🗂️",
  "📁",
  "📑",
  "📜",
  "📰",
  "📓",
  "📔",
  "📕",
  "📗",
  "📘",
  "📙",
  "📚",
  "🔍",
  "🔧",
  "⚙️",
  "🛠️",
  "📱",
  "💻",
  "🖥️",
  "⚡",
  "🔒",
  "🗝️",
  "🎯",
  "📌",
  "🏷️",
];

export default function DocumentTypeCreateModal({
  isOpen,
  onClose,
  onSuccess,
}: DocumentTypeCreateModalProps) {
  const { success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateDocumentTypeDto>({
    code: "",
    name: "",
    description: "",
    icon: "",
    color: DOCUMENT_TYPE_COLORS[0],
    displayOrder: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = "El código es requerido";
    } else if (formData.code.trim().length < 2) {
      newErrors.code = "El código debe tener al menos 2 caracteres";
    } else if (formData.code.trim().length > 50) {
      newErrors.code = "El código no puede exceder 50 caracteres";
    } else if (!/^[A-Z0-9_-]+$/i.test(formData.code.trim())) {
      newErrors.code =
        "El código solo puede contener letras, números, guiones y guiones bajos";
    }

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "El nombre debe tener al menos 2 caracteres";
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "El nombre no puede exceder 100 caracteres";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "La descripción no puede exceder 500 caracteres";
    }

    if (formData.displayOrder !== undefined && formData.displayOrder < 0) {
      newErrors.displayOrder =
        "El orden de visualización debe ser un número positivo";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await DocumentTypeService.create({
        ...formData,
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
      });

      success("Tipo de documento creado exitosamente");
      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error("Error creating document type:", error);
      showError(error.message || "Error al crear el tipo de documento");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      code: "",
      name: "",
      description: "",
      icon: "",
      color: DOCUMENT_TYPE_COLORS[0],
      displayOrder: 0,
    });
    setErrors({});
    onClose();
  };

  const handleInputChange = (
    field: keyof CreateDocumentTypeDto,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Crear Nuevo Tipo de Documento"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Código */}
        <div>
          <label
            htmlFor="code"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Código *
          </label>
          <input
            type="text"
            id="code"
            value={formData.code}
            onChange={(e) =>
              handleInputChange("code", e.target.value.toUpperCase())
            }
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
              errors.code
                ? "border-red-300 dark:border-red-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
            placeholder="Ej: MANUAL, GUIDE, PROC"
            disabled={isLoading}
            maxLength={50}
          />
          {errors.code && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.code}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {formData.code.length}/50 caracteres. Solo letras, números, guiones
            y guiones bajos.
          </p>
        </div>

        {/* Nombre */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Nombre *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
              errors.name
                ? "border-red-300 dark:border-red-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
            placeholder="Ej: Manual de usuario, Guía técnica"
            disabled={isLoading}
            maxLength={100}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.name}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {formData.name.length}/100 caracteres
          </p>
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
            placeholder="Descripción opcional del tipo de documento"
            disabled={isLoading}
            maxLength={500}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.description}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {(formData.description || "").length}/500 caracteres
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Icono */}
          <div>
            <label
              htmlFor="icon"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Icono
            </label>
            <div className="space-y-2">
              <input
                type="text"
                id="icon"
                value={formData.icon || ""}
                onChange={(e) => handleInputChange("icon", e.target.value)}
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                placeholder="Ej: 📄 o emoji"
                disabled={isLoading}
                maxLength={10}
              />

              {/* Iconos comunes */}
              <div className="border rounded-md p-2 bg-gray-50 dark:bg-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Iconos comunes:
                </p>
                <div className="grid grid-cols-8 gap-1">
                  {COMMON_ICONS.map((icon, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleInputChange("icon", icon)}
                      className="p-1 text-lg hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-center"
                      title={`Seleccionar ${icon}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Color
            </label>
            <div className="space-y-2">
              <div className="grid grid-cols-6 gap-2">
                {DOCUMENT_TYPE_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleInputChange("color", color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color
                        ? "border-gray-900 dark:border-white scale-110"
                        : "border-gray-300 dark:border-gray-600 hover:scale-105"
                    } transition-transform`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: formData.color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Color seleccionado: {formData.color}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Orden de visualización */}
        <div>
          <label
            htmlFor="displayOrder"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Orden de visualización
          </label>
          <input
            type="number"
            id="displayOrder"
            value={formData.displayOrder || 0}
            onChange={(e) =>
              handleInputChange("displayOrder", parseInt(e.target.value) || 0)
            }
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
              errors.displayOrder
                ? "border-red-300 dark:border-red-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
            placeholder="0"
            disabled={isLoading}
            min={0}
            step={1}
          />
          {errors.displayOrder && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.displayOrder}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Orden en que aparecerá en las listas (0 = primero)
          </p>
        </div>

        {/* Vista previa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Vista Previa
          </label>
          <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            {formData.icon && <span className="text-lg">{formData.icon}</span>}
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: formData.color }}
            />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formData.name || "Nombre del tipo de documento"}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({formData.code || "CODIGO"})
            </span>
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
                Creando...
              </>
            ) : (
              <>
                <PlusIcon className="h-4 w-4 mr-2" />
                Crear Tipo de Documento
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
