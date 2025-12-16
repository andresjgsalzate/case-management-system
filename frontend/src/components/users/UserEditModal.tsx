import React, { useState, useEffect } from "react";
import { ActionIcon } from "../ui/ActionIcons";
import { User, UpdateUserRequest, Role } from "../../types/user";
import { userService } from "../../services/userService";
import { useAuth } from "../../contexts/AuthContext";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { LoadingSpinner } from "../ui/LoadingSpinner";

interface UserEditModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  user,
  onClose,
  onSuccess,
}) => {
  const {
    user: currentUser,
    updateUser: updateAuthUser,
    refreshPermissions,
  } = useAuth();
  const [formData, setFormData] = useState<UpdateUserRequest>({
    email: user.email,
    fullName: user.fullName,
    roleName: user.roleName,
    isActive: user.isActive,
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      const rolesData = await userService.getRoles();

      // Asegurar que rolesData sea un array
      if (Array.isArray(rolesData)) {
        setRoles(rolesData);
      } else {
        console.warn("Roles data is not an array:", rolesData);
        setError("Error al cargar los roles. Formato de datos inválido.");
        setRoles([]);
      }
    } catch (err) {
      console.error("Error loading roles:", err);
      setError("Error al cargar los roles. Por favor, recarga la página.");
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  };
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email?.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El email no es válido";
    }

    if (!formData.fullName?.trim()) {
      newErrors.fullName = "El nombre completo es requerido";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "El nombre debe tener al menos 2 caracteres";
    }

    if (!formData.roleName) {
      newErrors.roleName = "El rol es requerido";
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
      setError(null);

      // Guardamos el rol anterior para comparar
      const previousRole = user.roleName;
      const isCurrentUser = currentUser && user.id === currentUser.id;

      await userService.updateUser(user.id, formData);

      // Si el usuario editado es el usuario actual y cambió su rol,
      // actualizamos su información en el contexto de auth y refrescamos permisos
      if (
        isCurrentUser &&
        formData.roleName &&
        formData.roleName !== previousRole
      ) {
        updateAuthUser({
          roleName: formData.roleName,
        });

        // Recargar los permisos del usuario con el nuevo rol
        try {
          await refreshPermissions();
          console.log(
            "Permisos del usuario actual actualizados correctamente."
          );
        } catch (refreshError) {
          console.error("Error al actualizar permisos:", refreshError);
        }
      }

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al actualizar usuario"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UpdateUserRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Editar Usuario: ${user.fullName}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error general */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Información del usuario */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Información actual
          </h4>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>ID: {user.id}</p>
            <p>
              Creado: {new Date(user.createdAt).toLocaleDateString("es-ES")}
            </p>
            <p>
              Último acceso:{" "}
              {user.lastLoginAt
                ? new Date(user.lastLoginAt).toLocaleDateString("es-ES")
                : "Nunca"}
            </p>
          </div>
        </div>

        {/* Nombre completo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <ActionIcon action="user" size="sm" className="inline mr-2" />
            Nombre Completo
          </label>
          <Input
            type="text"
            value={formData.fullName || ""}
            onChange={(e) => handleInputChange("fullName", e.target.value)}
            placeholder="Ingrese el nombre completo"
            error={errors.fullName}
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <ActionIcon action="email" size="sm" className="inline mr-2" />
            Email
          </label>
          <Input
            type="email"
            value={formData.email || ""}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="usuario@ejemplo.com"
            error={errors.email}
            required
          />
        </div>

        {/* Rol */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <ActionIcon action="shield" size="sm" className="inline mr-2" />
            Rol
          </label>
          {loadingRoles ? (
            <div className="flex items-center justify-center py-2">
              <LoadingSpinner size="sm" />
            </div>
          ) : (
            <Select
              value={formData.roleName || ""}
              onChange={(e) => handleInputChange("roleName", e.target.value)}
              error={errors.roleName}
              required
            >
              <option value="">Seleccione un rol</option>
              {Array.isArray(roles) &&
                roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name}
                    {role.description && ` - ${role.description}`}
                  </option>
                ))}
            </Select>
          )}
        </div>

        {/* Estado activo */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => handleInputChange("isActive", e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label
            htmlFor="isActive"
            className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
          >
            Usuario activo
          </label>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading && <LoadingSpinner size="sm" />}
            Actualizar Usuario
          </Button>
        </div>
      </form>
    </Modal>
  );
};
