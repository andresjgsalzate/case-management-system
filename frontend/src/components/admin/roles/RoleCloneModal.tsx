import React, { useState } from "react";
import { useToast } from "../../../contexts/ToastContext";
import { roleService } from "../../../services/roleService";
import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";
import type { Role } from "../../../types/role";

interface RoleCloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role: Role | null;
}

export default function RoleCloneModal({
  isOpen,
  onClose,
  onSuccess,
  role,
}: RoleCloneModalProps) {
  const { success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [errors, setErrors] = useState<{ name?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación
    const newErrors: { name?: string } = {};
    if (!newRoleName.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await roleService.cloneRole(role!.id, newRoleName);
      success("Rol clonado exitosamente");
      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error("Error al clonar rol:", error);
      showError(error.response?.data?.message || "Error al clonar el rol");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNewRoleName("");
    setErrors({});
    onClose();
  };

  if (!role) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Clonar Rol">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Se creará una copia del rol <strong>{role.name}</strong> con todos
            sus permisos.
          </p>

          <div>
            <label
              htmlFor="newRoleName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nuevo nombre del rol
            </label>
            <input
              type="text"
              id="newRoleName"
              value={newRoleName}
              onChange={(e) => {
                setNewRoleName(e.target.value);
                if (errors.name) {
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Ingresa el nombre del nuevo rol"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? "Clonando..." : "Clonar Rol"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
