import React, { useState } from "react";
import { UpdateTodoData, Todo, TodoPriority } from "../../types/todo.types";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

interface TodoEditModalProps {
  todo: Todo;
  priorities: TodoPriority[];
  onClose: () => void;
  onSubmit: (data: UpdateTodoData) => void;
}

export const TodoEditModal: React.FC<TodoEditModalProps> = ({
  todo,
  priorities,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<UpdateTodoData>({
    title: todo.title,
    description: todo.description || "",
    priorityId: todo.priority?.id || "",
    dueDate: todo.dueDate
      ? new Date(todo.dueDate).toISOString().slice(0, 16)
      : undefined,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.title.trim()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error updating TODO:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Editar TODO" size="lg">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Título *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="Ingresa el título del TODO"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="Descripción opcional del TODO"
            />
          </div>

          <div>
            <label
              htmlFor="priorityId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Prioridad
            </label>
            <select
              id="priorityId"
              name="priorityId"
              value={formData.priorityId}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Seleccionar prioridad</option>
              {priorities.map((priority) => (
                <option key={priority.id} value={priority.id}>
                  {priority.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="dueDate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Fecha de vencimiento
            </label>
            <input
              type="datetime-local"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Información del TODO actual */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Información actual
            </h4>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>Estado: {todo.isCompleted ? "Completado" : "Activo"}</p>
              <p>Creado: {new Date(todo.createdAt).toLocaleString()}</p>
              {todo.completedAt && (
                <p>Completado: {new Date(todo.completedAt).toLocaleString()}</p>
              )}
              {todo.control?.totalTimeMinutes && (
                <p>Tiempo total: {todo.control.totalTimeMinutes} minutos</p>
              )}
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !formData.title || !formData.title.trim()}
          >
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
