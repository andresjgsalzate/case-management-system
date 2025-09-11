import React, { useState, useEffect } from "react";
import { useTodos } from "../hooks/useTodos";
import { useToast } from "../hooks/useNotification";
import { useConfirmationModal } from "../hooks/useConfirmationModal";
import { ConfirmationModal } from "../components/ui/ConfirmationModal";
import { Button } from "../components/ui/Button";
import { TodoCard } from "../components/todos/TodoCard";
import { TodoCreateModal } from "../components/todos/TodoCreateModal";
import { TodoEditModal } from "../components/todos/TodoEditModal";
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
    // reactivateTodo,
    startTimer,
    pauseTimer,
    applyFilters,
    clearFilters,
    totalTodos,
    activeTodos,
    completedTodos,
    overdueTodos,
    fetchTodos,
  } = useTodos();

  const { success, error: showErrorToast } = useToast();
  const { confirmDelete, modalState, modalHandlers } = useConfirmationModal();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [currentFilters, setCurrentFilters] = useState<TodoFilters>({});

  // Refrescar datos cuando se navega al componente (simula React Query invalidation)
  useEffect(() => {
    // Refrescar datos inmediatamente al montar el componente
    // Esto asegura que el estado del timer esté actualizado
    fetchTodos();
  }, []);

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
    const confirmed = await confirmDelete("TODO");
    if (confirmed) {
      await deleteTodo(id);
      success("TODO eliminado exitosamente");
    }
  };

  const handleCompleteTodo = async (id: string) => {
    const result = await completeTodo(id);
    if (result) {
      success("TODO completado exitosamente");
    }
  };

  // const handleReactivateTodo = async (id: string) => {
  //   const result = await reactivateTodo(id);
  //   if (result) {
  //     success("TODO reactivado exitosamente");
  //   }
  // };

  const handleStartTimer = async (id: string) => {
    const result = await startTimer(id);
    if (result) {
      success("Timer iniciado exitosamente");
    } else {
      showErrorToast("Error al iniciar el timer");
    }
  };

  const handlePauseTimer = async (id: string) => {
    const result = await pauseTimer(id);
    if (result) {
      success("Timer pausado exitosamente");
    } else {
      showErrorToast("Error al pausar el timer");
    }
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
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="secondary"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                variant="primary"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nuevo TODO
              </Button>
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
              <Button onClick={handleClearFilters} variant="secondary">
                Limpiar
              </Button>
              <Button onClick={handleApplyFilters} variant="primary">
                Aplicar Filtros
              </Button>
            </div>
          </div>
        )}

        {/* Lista de TODOs */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {todos.length === 0 ? (
            <div className="text-center py-12 bg-white shadow rounded-md">
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
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    variant="primary"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Crear TODO
                  </Button>
                </div>
              )}
            </div>
          ) : (
            todos.map((todo) => (
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
            ))
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

      {/* Modal de confirmación */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={modalHandlers.onClose}
        onConfirm={modalHandlers.onConfirm}
        title={modalState.options?.title || ""}
        message={modalState.options?.message || ""}
        confirmText={modalState.options?.confirmText}
        cancelText={modalState.options?.cancelText}
        type={modalState.options?.type}
      />
    </div>
  );
};

export default TodosPage;
