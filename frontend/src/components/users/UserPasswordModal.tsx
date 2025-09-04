import React, { useState } from "react";
import { Key, Eye, EyeOff, Shield } from "lucide-react";
import { User } from "../../types/user";
import { userService } from "../../services/userService";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { LoadingSpinner } from "../ui/LoadingSpinner";

interface UserPasswordModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export const UserPasswordModal: React.FC<UserPasswordModalProps> = ({
  user,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    newPassword: false,
    confirmPassword: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

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

      await userService.updatePassword(user.id, {
        newPassword: formData.newPassword,
      });

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cambiar contraseña"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const togglePasswordVisibility = (
    field: "newPassword" | "confirmPassword"
  ) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
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
    <Modal
      isOpen
      onClose={onClose}
      title={`Cambiar Contraseña: ${user.fullName}`}
      size="md"
    >
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
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Cambio de contraseña de seguridad
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Usuario: {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Nueva contraseña */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Key className="w-4 h-4 inline mr-2" />
            Nueva Contraseña
          </label>
          <div className="relative">
            <Input
              type={showPasswords.newPassword ? "text" : "password"}
              value={formData.newPassword}
              onChange={(e) => handleInputChange("newPassword", e.target.value)}
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
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
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
            <Key className="w-4 h-4 inline mr-2" />
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
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
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
            <Key className="w-4 h-4" />
            Cambiar Contraseña
          </Button>
        </div>
      </form>
    </Modal>
  );
};
