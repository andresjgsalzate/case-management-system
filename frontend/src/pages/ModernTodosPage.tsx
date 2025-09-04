import React, { useState } from "react";
import { useTodos } from "../hooks/useTodos";
import { TodoCard, TodoCreateModal, TodoEditModal } from "../components/todos";
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
  DocumentChartBarIcon,
} from "@heroicons/react/24/outline";

const ModernTodosPage: React.FC = () => {
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
    startTimer,
    pauseTimer,
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
    await deleteTodo(id);
  };

  const handleCompleteTodo = async (id: string) => {
    await completeTodo(id);
  };

  const handleStartTimer = async (id: string) => {
    await startTimer(id);
  };

  const handlePauseTimer = async (id: string) => {
    await pauseTimer(id);
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

  const generateReport = () => {
    // TODO: Implement report generation
    console.log("Generating TODO report...");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Cargando TODOs...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Gestión de TODOs
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Sistema avanzado de gestión de tareas con control de tiempo
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={generateReport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <DocumentChartBarIcon className="h-4 w-4 mr-2" />
                Reporte
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filtros
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nuevo TODO
              </button>
            </div>
          </div>

          {/* Métricas */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-4">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Total TODOs
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        {totalTodos}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Activos
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        {activeTodos}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Completados
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
                        {completedTodos}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Vencidos
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-white">
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
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Todos</option>
                  <option value="false">Activos</option>
                  <option value="true">Completados</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
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

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* TODOs Grid */}
        {todos.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No hay TODOs
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {todos.map((todo) => (
              <TodoCard
                key={todo.id}
                todo={todo}
                onStartTimer={handleStartTimer}
                onPauseTimer={handlePauseTimer}
                onComplete={handleCompleteTodo}
                onEdit={setEditingTodo}
                onDelete={handleDeleteTodo}
                showActions={true}
              />
            ))}
          </div>
        )}
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
          onSubmit={(data: UpdateTodoData) =>
            handleUpdateTodo(editingTodo.id, data)
          }
        />
      )}
    </div>
  );
};

export default ModernTodosPage;
