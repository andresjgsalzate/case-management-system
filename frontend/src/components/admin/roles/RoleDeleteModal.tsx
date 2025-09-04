import { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import {
  XMarkIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { roleService } from "../../../services/roleService";
import type { Role } from "../../../types/role";

interface RoleDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role: Role | null;
}

export default function RoleDeleteModal({
  isOpen,
  onClose,
  onSuccess,
  role,
}: RoleDeleteModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!role) return;

    setIsLoading(true);
    try {
      await roleService.deleteRole(role.id);
      toast.success("Rol eliminado exitosamente");
      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error("Error al eliminar rol:", error);
      toast.error(error.response?.data?.message || "Error al eliminar el rol");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
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
                    <TrashIcon className="h-5 w-5 mr-2 text-red-600" />
                    Eliminar Rol
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    disabled={isLoading}
                    className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Icono de advertencia */}
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                  <ExclamationTriangleIcon
                    className="h-6 w-6 text-red-600"
                    aria-hidden="true"
                  />
                </div>

                {/* Información del rol */}
                <div className="text-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    ¿Estás seguro de eliminar este rol?
                  </h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Nombre:</strong> {role.name}
                    </p>
                    {role.description && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Descripción:</strong> {role.description}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Estado:</strong>{" "}
                      {role.isActive ? "Activo" : "Inactivo"}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Creado:</strong>{" "}
                      {new Date(role.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Advertencias */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-red-700">
                      <p className="font-medium mb-1">
                        Esta acción no se puede deshacer
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Se eliminará el rol permanentemente</li>
                        <li>Se removerán todos los permisos asociados</li>
                        <li>Los usuarios con este rol perderán sus permisos</li>
                        <li>Los datos históricos se mantendrán</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Confirmación adicional */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
                  <p className="text-sm text-amber-700">
                    <strong>Recomendación:</strong> Considera desactivar el rol
                    en lugar de eliminarlo si hay usuarios que podrían
                    necesitarlo en el futuro.
                  </p>
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
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
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Sí, Eliminar
                      </>
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
