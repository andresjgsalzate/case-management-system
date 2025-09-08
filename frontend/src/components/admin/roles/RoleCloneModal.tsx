import { useState } from "react";
import { DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
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
  const [isLoading, setIsLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!role) return;

    // Validación básica
    if (!newName.trim()) {
      setError("El nombre es requerido");
      return;
    }

    setIsLoading(true);
    try {
      await roleService.cloneRole(role.id, { newName: newName.trim() });
      toast.success("Rol clonado exitosamente");
      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error("Error al clonar rol:", error);
      toast.error(error.response?.data?.message || "Error al clonar el rol");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setNewName("");
      setError("");
      onClose();
    }
  };

  const handleNameChange = (value: string) => {
    setNewName(value);
    if (error) setError("");
  };

  const generateSuggestedName = () => {
    if (role) {
      const baseName = role.name;
      const timestamp = new Date().toLocaleDateString().replace(/\//g, "-");
      return `${baseName} - Copia ${timestamp}`;
    }
    return "";
  };

  if (!role) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Clonar Rol" size="md">
      {/* Información del rol original */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-medium text-indigo-900 dark:text-indigo-300 mb-2">
          Rol a clonar:
        </h4>
        <div className="space-y-1">
          <p className="text-sm text-indigo-700 dark:text-indigo-300">
            <strong>Nombre:</strong> {role.name}
          </p>
          {role.description && (
            <p className="text-sm text-indigo-700 dark:text-indigo-300">
              <strong>Descripción:</strong> {role.description}
            </p>
          )}
          <p className="text-sm text-indigo-700 dark:text-indigo-300">
            <strong>Estado:</strong> {role.isActive ? "Activo" : "Inactivo"}
          </p>
          {role.permissions && (
            <p className="text-sm text-indigo-700 dark:text-indigo-300">
              <strong>Permisos:</strong> {role.permissions.length} asignados
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre del nuevo rol */}
        <div>
          <label
            htmlFor="newName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Nombre del nuevo rol *
          </label>
          <input
            type="text"
            id="newName"
            value={newName}
            onChange={(e) => handleNameChange(e.target.value)}
            disabled={isLoading}
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              error
                ? "border-red-300 dark:border-red-600"
                : "border-gray-300 dark:border-gray-600"
            }`}
            placeholder="Ingresa el nombre para el rol clonado"
          />
          {error && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          {/* Sugerencia de nombre */}
          <button
            type="button"
            onClick={() => handleNameChange(generateSuggestedName())}
            disabled={isLoading}
            className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 disabled:opacity-50"
          >
            📋 Usar nombre sugerido: "{generateSuggestedName()}"
          </button>
        </div>

        {/* Información sobre la clonación */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <h5 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
            ¿Qué se clonará?
          </h5>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>✅ Configuración del rol</li>
            <li>✅ Todos los permisos asignados</li>
            <li>✅ Descripción del rol</li>
            <li>✅ Estado activo/inactivo</li>
            <li>❌ Usuarios asignados (el nuevo rol estará vacío)</li>
            <li>❌ Historial de cambios</li>
          </ul>
        </div>

        {/* Nota importante */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>Nota:</strong> El nuevo rol se creará con el mismo estado y
            permisos, pero podrás modificarlos después de la clonación.
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
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !newName.trim()}
          >
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
                Clonando...
              </>
            ) : (
              <>
                <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                Clonar Rol
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
