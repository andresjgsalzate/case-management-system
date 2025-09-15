import React, { useState } from "react";
import { useTodos } from "../hooks/useTodos";
import { TodoCard, TodoCreateModal, TodoEditModal } from "../components/todos";
import { Button } from "../components/ui/Button";
import { todoAPI } from "../services/todoAPI";
import {
  CreateTodoData,
  UpdateTodoData,
  Todo,
  TodoFilters,
} from "../types/todo.types";
import { ActionIcon } from "../components/ui/ActionIcons";

const ModernTodosPage: React.FC = () => {
  const {
    todos,
    priorities,
    loading,
    error,
    filters,
    fetchTodos,
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

  const handleArchiveTodo = async (todo: Todo) => {
    try {
      await todoAPI.archiveTodo(todo.id);
      // Refrescar la lista de TODOs
      await fetchTodos();
    } catch (error) {
      console.error("Error archiving todo:", error);
      // Aquí podrías mostrar un toast de error si tienes el contexto disponible
    }
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
              <Button onClick={generateReport} variant="secondary">
                <ActionIcon action="analytics" size="sm" color="secondary" />
                Reporte
              </Button>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="secondary"
              >
                <ActionIcon action="filter" size="sm" color="secondary" />
                Filtros
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                variant="primary"
              >
                <ActionIcon action="add" size="sm" color="neutral" />
                Nuevo TODO
              </Button>
            </div>
          </div>

          {/* Métricas */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-4">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ActionIcon action="check" size="lg" color="gray" />
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
                    <ActionIcon action="time" size="lg" color="blue" />
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
                    <ActionIcon action="check" size="lg" color="green" />
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
                    <ActionIcon action="warning" size="lg" color="red" />
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
              <Button onClick={handleClearFilters} variant="secondary">
                Limpiar
              </Button>
              <Button onClick={handleApplyFilters} variant="primary">
                Aplicar Filtros
              </Button>
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
            <ActionIcon action="check" size="xl" color="gray" />
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
                <Button
                  onClick={() => setShowCreateModal(true)}
                  variant="primary"
                >
                  <ActionIcon action="add" size="sm" color="neutral" />
                  Crear TODO
                </Button>
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
                onArchive={handleArchiveTodo}
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
