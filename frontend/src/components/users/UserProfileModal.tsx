import React, { useState } from "react";
import { ActionIcon } from "../ui/ActionIcons";
import { useAuth } from "../../contexts/AuthContext";
import { userService } from "../../services/userService";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Badge } from "../ui/Badge";

interface UserProfileModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

interface ProfileFormData {
  fullName: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: user?.fullName || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  if (!user) {
    return null;
  }

  const validateBasicInfo = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "El nombre completo es requerido";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "El nombre debe tener al menos 2 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordChange = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "La contraseña actual es requerida";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "La nueva contraseña es requerida";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "La contraseña debe tener al menos 8 caracteres";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword =
        "La contraseña debe contener al menos una mayúscula, una minúscula y un número";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirme la nueva contraseña";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    if (
      formData.currentPassword &&
      formData.newPassword &&
      formData.currentPassword === formData.newPassword
    ) {
      newErrors.newPassword =
        "La nueva contraseña debe ser diferente a la actual";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const togglePasswordVisibility = (
    field: "currentPassword" | "newPassword" | "confirmPassword"
  ) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleUpdateBasicInfo = async () => {
    if (!validateBasicInfo()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Solo actualizar si el nombre ha cambiado
      if (formData.fullName.trim() !== user.fullName) {
        await userService.updateUser(user.id, {
          fullName: formData.fullName.trim(),
        });

        // Actualizar el contexto de usuario
        if (updateUser) {
          updateUser({ ...user, fullName: formData.fullName.trim() });
        }
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al actualizar el perfil"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePasswordChange()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await userService.changePassword(user.id, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      // Limpiar campos de contraseña
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setIsChangingPassword(false);

      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cambiar la contraseña"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isChangingPassword) {
      await handleChangePassword();
    } else {
      await handleUpdateBasicInfo();
    }
  };

  const getPasswordStrength = (
    password: string
  ): { strength: number; text: string; color: string } => {
    let strength = 0;

    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^a-zA-Z\d]/.test(password)) strength += 1;

    const levels = [
      { text: "Muy débil", color: "text-red-600" },
      { text: "Débil", color: "text-red-500" },
      { text: "Regular", color: "text-yellow-500" },
      { text: "Buena", color: "text-blue-500" },
      { text: "Muy fuerte", color: "text-green-500" },
    ];

    return { strength, ...levels[Math.min(strength, 4)] };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <Modal isOpen onClose={onClose} title="Mi Perfil" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error general */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Información del usuario */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 dark:bg-blue-800 rounded-full p-2">
              <ActionIcon action="user" size="sm" color="primary" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Información de la cuenta
              </h4>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {user.email}
                </p>
                <Badge variant="secondary" size="sm">
                  {user.roleName}
                </Badge>
              </div>
            </div>
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
            value={formData.fullName}
            onChange={(e) => handleInputChange("fullName", e.target.value)}
            placeholder="Ingrese su nombre completo"
            error={errors.fullName}
            required
          />
        </div>

        {/* Sección de cambio de contraseña */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Cambiar Contraseña
            </h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsChangingPassword(!isChangingPassword);
                if (isChangingPassword) {
                  // Limpiar campos de contraseña si se cancela
                  setFormData((prev) => ({
                    ...prev,
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  }));
                  setErrors({});
                }
              }}
            >
              {isChangingPassword ? "Cancelar" : "Cambiar Contraseña"}
            </Button>
          </div>

          {isChangingPassword && (
            <div className="space-y-4">
              {/* Contraseña actual */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <ActionIcon action="lock" size="sm" className="inline mr-2" />
                  Contraseña Actual
                </label>
                <div className="relative">
                  <Input
                    type={showPasswords.currentPassword ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) =>
                      handleInputChange("currentPassword", e.target.value)
                    }
                    placeholder="Ingrese su contraseña actual"
                    error={errors.currentPassword}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => togglePasswordVisibility("currentPassword")}
                  >
                    {showPasswords.currentPassword ? (
                      <ActionIcon action="hide" size="sm" color="neutral" />
                    ) : (
                      <ActionIcon action="view" size="sm" color="neutral" />
                    )}
                  </button>
                </div>
              </div>

              {/* Nueva contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <ActionIcon
                    action="changePassword"
                    size="sm"
                    className="inline mr-2"
                  />
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Input
                    type={showPasswords.newPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) =>
                      handleInputChange("newPassword", e.target.value)
                    }
                    placeholder="Ingrese la nueva contraseña"
                    error={errors.newPassword}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => togglePasswordVisibility("newPassword")}
                  >
                    {showPasswords.newPassword ? (
                      <ActionIcon action="hide" size="sm" color="neutral" />
                    ) : (
                      <ActionIcon action="view" size="sm" color="neutral" />
                    )}
                  </button>
                </div>

                {/* Indicador de fortaleza de contraseña */}
                {formData.newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength.strength <= 1
                              ? "bg-red-500"
                              : passwordStrength.strength <= 2
                              ? "bg-yellow-500"
                              : passwordStrength.strength <= 3
                              ? "bg-blue-500"
                              : "bg-green-500"
                          }`}
                          style={{
                            width: `${(passwordStrength.strength / 5) * 100}%`,
                          }}
                        />
                      </div>
                      <span
                        className={`text-xs font-medium ${passwordStrength.color}`}
                      >
                        {passwordStrength.text}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <ActionIcon
                    action="changePassword"
                    size="sm"
                    className="inline mr-2"
                  />
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <Input
                    type={showPasswords.confirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    placeholder="Confirme la nueva contraseña"
                    error={errors.confirmPassword}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => togglePasswordVisibility("confirmPassword")}
                  >
                    {showPasswords.confirmPassword ? (
                      <ActionIcon action="hide" size="sm" color="neutral" />
                    ) : (
                      <ActionIcon action="view" size="sm" color="neutral" />
                    )}
                  </button>
                </div>
              </div>

              {/* Requisitos de contraseña */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Requisitos de contraseña:
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li
                    className={`flex items-center ${
                      formData.newPassword.length >= 8
                        ? "text-green-600 dark:text-green-400"
                        : ""
                    }`}
                  >
                    <span className="mr-2">
                      {formData.newPassword.length >= 8 ? "✓" : "•"}
                    </span>
                    Al menos 8 caracteres
                  </li>
                  <li
                    className={`flex items-center ${
                      /[a-z]/.test(formData.newPassword)
                        ? "text-green-600 dark:text-green-400"
                        : ""
                    }`}
                  >
                    <span className="mr-2">
                      {/[a-z]/.test(formData.newPassword) ? "✓" : "•"}
                    </span>
                    Al menos una letra minúscula
                  </li>
                  <li
                    className={`flex items-center ${
                      /[A-Z]/.test(formData.newPassword)
                        ? "text-green-600 dark:text-green-400"
                        : ""
                    }`}
                  >
                    <span className="mr-2">
                      {/[A-Z]/.test(formData.newPassword) ? "✓" : "•"}
                    </span>
                    Al menos una letra mayúscula
                  </li>
                  <li
                    className={`flex items-center ${
                      /\d/.test(formData.newPassword)
                        ? "text-green-600 dark:text-green-400"
                        : ""
                    }`}
                  >
                    <span className="mr-2">
                      {/\d/.test(formData.newPassword) ? "✓" : "•"}
                    </span>
                    Al menos un número
                  </li>
                </ul>
              </div>
            </div>
          )}
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
            <ActionIcon
              action={isChangingPassword ? "changePassword" : "edit"}
              size="sm"
            />
            {isChangingPassword ? "Cambiar Contraseña" : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
