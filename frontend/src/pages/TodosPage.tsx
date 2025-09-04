import React, { useState } from "react";
import { useTodos } from "../hooks/useTodos";
import {
  CreateTodoData,
  UpdateTodoData,
  Todo,
  TodoFilters,
} from "../types/todo.types";
import {
  PlusIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const TodosPage: React.FC = () => {
  const {
    todos,
    priorities,
    loading,
    error,
    filters,
    createTodo,
    updateTodo,
    deleteTodo,
    completeTodo,
    reactivateTodo,
    applyFilters,
    clearFilters,
    totalTodos,
    activeTodos,
    completedTodos,
    overdueTodos,
  } = useTodos();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [currentFilters, setCurrentFilters] = useState<TodoFilters>({});

  const handleCreateTodo = async (todoData: CreateTodoData) => {
    const newTodo = await createTodo(todoData);
    if (newTodo) {
      setShowCreateModal(false);
    }
  };

  const handleUpdateTodo = async (id: string, todoData: UpdateTodoData) => {
    const updatedTodo = await updateTodo(id, todoData);
    if (updatedTodo) {
      setEditingTodo(null);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este TODO?")) {
      await deleteTodo(id);
    }
  };

  const handleCompleteTodo = async (id: string) => {
    await completeTodo(id);
  };

  const handleReactivateTodo = async (id: string) => {
    await reactivateTodo(id);
  };

  const handleApplyFilters = () => {
    applyFilters(currentFilters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setCurrentFilters({});
    clearFilters();
    setShowFilters(false);
  };

  const getPriorityColor = (priorityLevel: number): string => {
    switch (priorityLevel) {
      case 1:
        return "bg-green-100 text-green-800";
      case 2:
        return "bg-blue-100 text-blue-800";
      case 3:
        return "bg-yellow-100 text-yellow-800";
      case 4:
        return "bg-red-100 text-red-800";
      case 5:
        return "bg-red-200 text-red-900";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isOverdue = (dueDate?: string): boolean => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando TODOs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">TODOs</h1>
              <p className="mt-2 text-gray-600">
                Gestiona tus tareas y proyectos
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filtros
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nuevo TODO
              </button>
            </div>
          </div>

          {/* Métricas */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total TODOs
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {totalTodos}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Activos
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {activeTodos}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Completados
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {completedTodos}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Vencidos
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {overdueTodos}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Prioridad
                </label>
                <select
                  value={currentFilters.priorityId || ""}
                  onChange={(e) =>
                    setCurrentFilters({
                      ...currentFilters,
                      priorityId: e.target.value || undefined,
                    })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Todas las prioridades</option>
                  {priorities.map((priority) => (
                    <option key={priority.id} value={priority.id}>
                      {priority.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Estado
                </label>
                <select
                  value={currentFilters.showCompleted?.toString() || ""}
                  onChange={(e) =>
                    setCurrentFilters({
                      ...currentFilters,
                      showCompleted:
                        e.target.value === ""
                          ? undefined
                          : e.target.value === "true",
                    })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Todos</option>
                  <option value="false">Activos</option>
                  <option value="true">Completados</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Búsqueda
                </label>
                <input
                  type="text"
                  value={currentFilters.search || ""}
                  onChange={(e) =>
                    setCurrentFilters({
                      ...currentFilters,
                      search: e.target.value || undefined,
                    })
                  }
                  placeholder="Buscar en título o descripción..."
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Limpiar
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        )}

        {/* Lista de TODOs */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {todos.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay TODOs
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {Object.keys(filters).length > 0
                  ? "No se encontraron TODOs con los filtros aplicados."
                  : "Comienza creando tu primer TODO."}
              </p>
              {Object.keys(filters).length === 0 && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Crear TODO
                  </button>
                </div>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {todos.map((todo) => (
                <li key={todo.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={todo.isCompleted}
                        onChange={() =>
                          todo.isCompleted
                            ? handleReactivateTodo(todo.id)
                            : handleCompleteTodo(todo.id)
                        }
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <div className="ml-4">
                        <div className="flex items-center">
                          <h3
                            className={`text-sm font-medium ${
                              todo.isCompleted
                                ? "line-through text-gray-500"
                                : "text-gray-900"
                            }`}
                          >
                            {todo.title}
                          </h3>
                          {todo.priority && (
                            <span
                              className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                                todo.priority.level
                              )}`}
                            >
                              {todo.priority.name}
                            </span>
                          )}
                          {todo.dueDate &&
                            isOverdue(todo.dueDate) &&
                            !todo.isCompleted && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Vencido
                              </span>
                            )}
                        </div>
                        {todo.description && (
                          <p
                            className={`mt-1 text-sm ${
                              todo.isCompleted
                                ? "text-gray-400"
                                : "text-gray-600"
                            }`}
                          >
                            {todo.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                          {todo.dueDate && (
                            <span>
                              Vence:{" "}
                              {new Date(todo.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          {todo.assignedUser && (
                            <span>
                              Asignado a:{" "}
                              {todo.assignedUser.fullName ||
                                todo.assignedUser.email}
                            </span>
                          )}
                          {todo.estimatedMinutes > 0 && (
                            <span>Estimado: {todo.estimatedMinutes} min</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingTodo(todo)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modales */}
      {showCreateModal && (
        <TodoCreateModal
          priorities={priorities}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTodo}
        />
      )}

      {editingTodo && (
        <TodoEditModal
          todo={editingTodo}
          priorities={priorities}
          onClose={() => setEditingTodo(null)}
          onSubmit={(data) => handleUpdateTodo(editingTodo.id, data)}
        />
      )}
    </div>
  );
};

// Componente de modal para crear TODO (placeholder)
const TodoCreateModal: React.FC<{
  priorities: any[];
  onClose: () => void;
  onSubmit: (data: CreateTodoData) => void;
}> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Crear nuevo TODO
        </h3>
        {/* Formulario aquí */}
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente de modal para editar TODO (placeholder)
const TodoEditModal: React.FC<{
  todo: Todo;
  priorities: any[];
  onClose: () => void;
  onSubmit: (data: UpdateTodoData) => void;
}> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Editar TODO</h3>
        {/* Formulario aquí */}
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodosPage;
