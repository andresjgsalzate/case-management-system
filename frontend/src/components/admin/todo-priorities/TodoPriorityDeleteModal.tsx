import React, { useState } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import todoPriorityService, {
  TodoPriority,
} from "../../../services/todoPriorityService";
import { useToast } from "../../../hooks/useToast";
import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";

interface TodoPriorityDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  priority: TodoPriority;
}

export const TodoPriorityDeleteModal: React.FC<
  TodoPriorityDeleteModalProps
> = ({ isOpen, onClose, onSuccess, priority }) => {
  const { addToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await todoPriorityService.deletePriority(priority.id);

      if (response.success) {
        addToast({
          type: "success",
          title: "Éxito",
          message: "Prioridad eliminada correctamente",
        });
        onSuccess();
        onClose();
      } else {
        throw new Error(response.message || "Error al eliminar la prioridad");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      addToast({
        type: "error",
        title: "Error",
        message: errorMessage,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !priority) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Eliminar Prioridad"
      size="sm"
    >
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              ¿Eliminar prioridad?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Esta acción no se puede deshacer.
            </p>
          </div>
        </div>

        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
          <div className="flex items-center space-x-2">
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: priority.color }}
            />
            <span className="font-medium text-gray-900 dark:text-white">
              {priority.name}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              (Nivel {priority.level})
            </span>
          </div>
          {priority.description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {priority.description}
            </p>
          )}
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
          ¿Estás seguro de que deseas eliminar esta prioridad? Esta acción no se
          puede deshacer y podría afectar las tareas que la utilicen.
        </p>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
