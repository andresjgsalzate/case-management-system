import { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { XMarkIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { roleService } from "../../../services/roleService";
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
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 flex items-center"
                  >
                    <DocumentDuplicateIcon className="h-5 w-5 mr-2 text-indigo-600" />
                    Clonar Rol
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    disabled={isLoading}
                    className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Información del rol original */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-indigo-900 mb-2">
                    Rol a clonar:
                  </h4>
                  <div className="space-y-1">
                    <p className="text-sm text-indigo-700">
                      <strong>Nombre:</strong> {role.name}
                    </p>
                    {role.description && (
                      <p className="text-sm text-indigo-700">
                        <strong>Descripción:</strong> {role.description}
                      </p>
                    )}
                    <p className="text-sm text-indigo-700">
                      <strong>Estado:</strong>{" "}
                      {role.isActive ? "Activo" : "Inactivo"}
                    </p>
                    {role.permissions && (
                      <p className="text-sm text-indigo-700">
                        <strong>Permisos:</strong> {role.permissions.length}{" "}
                        asignados
                      </p>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Nombre del nuevo rol */}
                  <div>
                    <label
                      htmlFor="newName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Nombre del nuevo rol *
                    </label>
                    <input
                      type="text"
                      id="newName"
                      value={newName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      disabled={isLoading}
                      className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                        error ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="Ingresa el nombre para el rol clonado"
                    />
                    {error && (
                      <p className="mt-1 text-sm text-red-600">{error}</p>
                    )}

                    {/* Sugerencia de nombre */}
                    <button
                      type="button"
                      onClick={() => handleNameChange(generateSuggestedName())}
                      disabled={isLoading}
                      className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                    >
                      📋 Usar nombre sugerido: "{generateSuggestedName()}"
                    </button>
                  </div>

                  {/* Información sobre la clonación */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-blue-900 mb-2">
                      ¿Qué se clonará?
                    </h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>✅ Configuración del rol</li>
                      <li>✅ Todos los permisos asignados</li>
                      <li>✅ Descripción del rol</li>
                      <li>✅ Estado activo/inactivo</li>
                      <li>❌ Usuarios asignados (el nuevo rol estará vacío)</li>
                      <li>❌ Historial de cambios</li>
                    </ul>
                  </div>

                  {/* Nota importante */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-700">
                      <strong>Nota:</strong> El nuevo rol se creará con el mismo
                      estado y permisos, pero podrás modificarlos después de la
                      clonación.
                    </p>
                  </div>

                  {/* Botones */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isLoading}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !newName.trim()}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                      {isLoading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
