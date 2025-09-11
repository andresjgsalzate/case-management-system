import React, { useState, useEffect } from "react";
import { PencilIcon } from "@heroicons/react/24/outline";
import { useToast } from "../../../contexts/ToastContext";
import { roleService } from "../../../services/roleService";
import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";
import type { Role, UpdateRoleRequest } from "../../../types/role";

interface RoleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role: Role | null;
}

export default function RoleEditModal({
  isOpen,
  onClose,
  onSuccess,
  role,
}: RoleEditModalProps) {
  const { success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateRoleRequest>({
    name: "",
    description: "",
    isActive: true,
  });

  const [errors, setErrors] = useState<Partial<UpdateRoleRequest>>({});

  // Cargar datos del rol cuando el modal se abre
  useEffect(() => {
    if (isOpen && role) {
      setFormData({
        name: role.name,
        description: role.description || "",
        isActive: role.isActive,
      });
      setErrors({});
    }
  }, [isOpen, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!role) return;

    // Validación básica
    const newErrors: Partial<UpdateRoleRequest> = {};

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await roleService.updateRole(role.id, formData);
      success("Rol actualizado exitosamente");
      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error("Error al actualizar rol:", error);
      showError(error.response?.data?.message || "Error al actualizar el rol");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        name: "",
        description: "",
        isActive: true,
      });
      setErrors({});
      onClose();
    }
  };

  const handleInputChange = (field: keyof UpdateRoleRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (!role) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Editar Rol" size="md">
      {/* Info del rol */}
      <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <strong>ID:</strong> {role.id}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <strong>Creado:</strong>{" "}
          {new Date(role.createdAt).toLocaleDateString()}
        </p>
        {role.updatedAt !== role.createdAt && (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <strong>Actualizado:</strong>{" "}
            {new Date(role.updatedAt).toLocaleDateString()}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre del rol */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Nombre del Rol *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            disabled={isLoading}
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              errors.name
                ? "border-red-300 dark:border-red-600"
                : "border-gray-300 dark:border-gray-600"
            }`}
            placeholder="Ej: Editor, Supervisor, etc."
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.name}
            </p>
          )}
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
            rows={3}
            value={formData.description || ""}
            onChange={(e) => handleInputChange("description", e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Describe las responsabilidades de este rol..."
          />
        </div>

        {/* Estado activo */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => handleInputChange("isActive", e.target.checked)}
            disabled={isLoading}
            className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 dark:bg-gray-700"
          />
          <label
            htmlFor="isActive"
            className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
          >
            Rol activo
          </label>
        </div>

        {/* Advertencia sobre permisos */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>Nota:</strong> Los cambios en el estado del rol pueden
            afectar a los usuarios que lo tienen asignado. Los permisos se
            gestionan por separado.
          </p>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="warning" disabled={isLoading}>
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
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
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <PencilIcon className="h-4 w-4 mr-1" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
