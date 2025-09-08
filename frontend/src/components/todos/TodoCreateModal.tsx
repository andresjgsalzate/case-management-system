import React, { useState, useEffect } from "react";
import { CreateTodoData, TodoPriority } from "../../types/todo.types";
import { User } from "../../types/user";
import { userService } from "../../services/userService";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

interface TodoCreateModalProps {
  priorities: TodoPriority[];
  onClose: () => void;
  onSubmit: (data: CreateTodoData) => void;
}

export const TodoCreateModal: React.FC<TodoCreateModalProps> = ({
  priorities,
  onClose,
  onSubmit,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<CreateTodoData>({
    title: "",
    description: "",
    priorityId: "",
    assignedUserId: "",
    estimatedMinutes: undefined,
    dueDate: undefined,
  });

  // Cargar usuarios cuando se abre el modal
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await userService.getUsers();
      // Filtrar solo usuarios activos
      const activeUsers = response.users.filter((user) => user.isActive);
      setUsers(activeUsers);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error creating TODO:", error);
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
      [name]:
        name === "estimatedMinutes"
          ? value
            ? parseInt(value, 10)
            : undefined
          : value,
    }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      dueDate: value ? `${value}T23:59:59` : undefined,
    }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priorityId: "",
      assignedUserId: "",
      estimatedMinutes: undefined,
      dueDate: undefined,
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      title="Crear Nuevo TODO"
      size="xl"
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Título */}
          <div className="md:col-span-2">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
              placeholder="Ingrese el título del TODO"
            />
          </div>

          {/* Descripción */}
          <div className="md:col-span-2">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all resize-none"
              placeholder="Ingrese una descripción detallada del TODO"
            />
          </div>

          {/* Prioridad */}
          <div>
            <label
              htmlFor="priorityId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Prioridad <span className="text-red-500">*</span>
            </label>
            <select
              id="priorityId"
              name="priorityId"
              value={formData.priorityId}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
            >
              <option value="">Seleccione una prioridad</option>
              {priorities
                .sort((a, b) => a.level - b.level)
                .map((priority) => (
                  <option key={priority.id} value={priority.id}>
                    {priority.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Usuario Asignado */}
          <div>
            <label
              htmlFor="assignedUserId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Asignar a <span className="text-red-500">*</span>
            </label>
            <select
              id="assignedUserId"
              name="assignedUserId"
              value={formData.assignedUserId}
              onChange={handleInputChange}
              required
              disabled={usersLoading}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {usersLoading
                  ? "Cargando usuarios..."
                  : "Seleccione un usuario"}
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName || user.email}
                </option>
              ))}
            </select>
          </div>

          {/* Tiempo Estimado */}
          <div>
            <label
              htmlFor="estimatedMinutes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Tiempo Estimado (minutos)
            </label>
            <input
              type="number"
              id="estimatedMinutes"
              name="estimatedMinutes"
              value={formData.estimatedMinutes || ""}
              onChange={handleInputChange}
              min="1"
              step="1"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
              placeholder="Ej: 60"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Tiempo estimado para completar esta tarea
            </p>
          </div>

          {/* Fecha de Vencimiento */}
          <div>
            <label
              htmlFor="dueDate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Fecha de Vencimiento
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate ? formData.dueDate.split("T")[0] : ""}
              onChange={handleDateChange}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Fecha límite para completar el TODO
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={
              loading ||
              !formData.title.trim() ||
              !formData.priorityId ||
              !formData.assignedUserId
            }
          >
            {loading ? "Creando..." : "Crear TODO"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
