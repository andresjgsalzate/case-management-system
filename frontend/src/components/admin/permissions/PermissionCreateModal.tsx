import React, { useState } from "react";
import { Plus } from "lucide-react";
import { CreatePermissionRequest } from "../../../types/permission";
import { permissionService } from "../../../services/permissionService";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { Select } from "../../ui/Select";
import { TextArea } from "../../ui/TextArea";
import { Modal } from "../../ui/Modal";
import { useToast } from "../../../contexts/ToastContext";

interface PermissionCreateModalProps {
  onClose: () => void;
  onSuccess: () => void;
  modules: string[];
  actions: string[];
}

export const PermissionCreateModal: React.FC<PermissionCreateModalProps> = ({
  onClose,
  onSuccess,
  modules,
  actions,
}) => {
  const { success, error: showError } = useToast();
  const [formData, setFormData] = useState<CreatePermissionRequest>({
    name: "",
    module: "",
    action: "",
    scope: "own",
    description: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const scopes = [
    { value: "own", label: "Propio" },
    { value: "team", label: "Equipo" },
    { value: "all", label: "Todos" },
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (!formData.module.trim()) {
      newErrors.module = "El módulo es requerido";
    }

    if (!formData.action.trim()) {
      newErrors.action = "La acción es requerida";
    }

    if (!formData.scope) {
      newErrors.scope = "El scope es requerido";
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
      await permissionService.createPermission(formData);
      success("Permiso creado exitosamente");
      onSuccess();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al crear el permiso";
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof CreatePermissionRequest,
    value: any
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const generatePermissionName = () => {
    if (formData.module && formData.action && formData.scope) {
      const name = `${formData.module}.${formData.action}_${formData.scope}`;
      handleInputChange("name", name);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Crear Nuevo Permiso">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Módulo *
            </label>
            <Select
              value={formData.module}
              onChange={(e) => handleInputChange("module", e.target.value)}
              className={errors.module ? "border-red-500" : ""}
            >
              <option value="">Seleccionar módulo</option>
              {modules.map((module) => (
                <option key={module} value={module}>
                  {module}
                </option>
              ))}
            </Select>
            {errors.module && (
              <p className="text-red-500 text-xs mt-1">{errors.module}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Acción *
            </label>
            <Select
              value={formData.action}
              onChange={(e) => handleInputChange("action", e.target.value)}
              className={errors.action ? "border-red-500" : ""}
            >
              <option value="">Seleccionar acción</option>
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </Select>
            {errors.action && (
              <p className="text-red-500 text-xs mt-1">{errors.action}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Scope *
          </label>
          <Select
            value={formData.scope}
            onChange={(e) => handleInputChange("scope", e.target.value)}
            className={errors.scope ? "border-red-500" : ""}
          >
            {scopes.map((scope) => (
              <option key={scope.value} value={scope.value}>
                {scope.label}
              </option>
            ))}
          </Select>
          {errors.scope && (
            <p className="text-red-500 text-xs mt-1">{errors.scope}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nombre del Permiso *
            </label>
            <Button
              type="button"
              onClick={generatePermissionName}
              size="sm"
              variant="ghost"
              className="text-purple-600 hover:text-purple-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Generar
            </Button>
          </div>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="ej: users.read_all"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descripción
          </label>
          <TextArea
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Descripción del permiso..."
            rows={3}
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => handleInputChange("isActive", e.target.checked)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <label
            htmlFor="isActive"
            className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
          >
            Permiso activo
          </label>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white"
            disabled={loading}
          >
            {loading ? "Creando..." : "Crear Permiso"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
