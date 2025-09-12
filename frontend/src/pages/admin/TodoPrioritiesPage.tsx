import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ShieldExclamationIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "../../hooks/useToast";
// import { usePermissions } from "../../hooks/usePermissions"; // Temporalmente comentado
import todoPriorityService from "../../services/todoPriorityService";
import { TodoPriorityCreateModal } from "../../components/admin/todo-priorities/TodoPriorityCreateModal";
import { TodoPriorityEditModal } from "../../components/admin/todo-priorities/TodoPriorityEditModal";
import { TodoPriorityDeleteModal } from "../../components/admin/todo-priorities/TodoPriorityDeleteModal";
import { Button } from "../../components/ui/Button";

interface TodoPriority {
  id: string;
  name: string;
  description?: string;
  color: string;
  level: number;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
}

export const TodoPrioritiesPage: React.FC = () => {
  const { addToast } = useToast();
  // const { hasPermission } = usePermissions(); // Temporalmente comentado

  // Estados
  const [priorities, setPriorities] = useState<TodoPriority[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    inactive: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para filtros y paginación
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Estados para modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<TodoPriority | null>(
    null
  );

  // Verificar permisos - Temporalmente activado para testing
  const canCreate = true; // hasPermission("admin.todo_priorities.create");
  const canEdit = true; // hasPermission("admin.todo_priorities.update");
  const canDelete = true; // hasPermission("admin.todo_priorities.delete");

  // Cargar datos iniciales
  useEffect(() => {
    loadPriorities();
    loadStats();
  }, [currentPage, searchTerm, filterActive]);

  const loadPriorities = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy: "level",
        sortOrder: "ASC" as const,
        search: searchTerm,
        ...(filterActive !== null && { isActive: filterActive }),
      };

      const response = await todoPriorityService.getAllPriorities(params);

      if (response.success && response.data) {
        setPriorities(response.data.priorities);
        setTotalPages(response.data.totalPages);
      } else {
        throw new Error(response.message || "Error al cargar prioridades");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      addToast({
        type: "error",
        title: "Error",
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await todoPriorityService.getPriorityStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Error al cargar estadísticas:", err);
    }
  };

  // Manejar acciones
  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  const handleEdit = (priority: TodoPriority) => {
    setSelectedPriority(priority);
    setIsEditModalOpen(true);
  };

  const handleDelete = (priority: TodoPriority) => {
    setSelectedPriority(priority);
    setIsDeleteModalOpen(true);
  };

  const handleToggleStatus = async (priority: TodoPriority) => {
    try {
      const response = await todoPriorityService.togglePriorityStatus(
        priority.id
      );

      if (response.success) {
        addToast({
          type: "success",
          title: "Éxito",
          message: `Prioridad ${
            priority.isActive ? "desactivada" : "activada"
          } correctamente`,
        });
        loadPriorities();
        loadStats();
      } else {
        throw new Error(response.message || "Error al cambiar estado");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      addToast({
        type: "error",
        title: "Error",
        message: errorMessage,
      });
    }
  };

  // Funciones de callback para modales
  const onCreateSuccess = () => {
    setIsCreateModalOpen(false);
    loadPriorities();
    loadStats();
  };

  const onEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedPriority(null);
    loadPriorities();
    loadStats();
  };

  const onDeleteSuccess = () => {
    setIsDeleteModalOpen(false);
    setSelectedPriority(null);
    loadPriorities();
    loadStats();
  };

  // Funciones de filtrado
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (isActive: boolean | null) => {
    setFilterActive(isActive);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterActive(null);
    setCurrentPage(1);
  };

  // Paginación
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(
          <span
            key="ellipsis1"
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
          >
            ...
          </span>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border ${
            currentPage === i
              ? "z-10 bg-indigo-50 dark:bg-indigo-900 border-indigo-500 text-indigo-600 dark:text-indigo-200"
              : "text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
          }`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(
          <span
            key="ellipsis2"
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
          >
            ...
          </span>
        );
      }
      buttons.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          {totalPages}
        </button>
      );
    }

    return buttons;
  };

  if (loading && priorities.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {/* Estadísticas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total de Prioridades
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.total}
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
                    Activas
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.active}
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
                <XCircleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Inactivas
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.inactive}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Encabezado */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            Prioridades de Tareas
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestiona las prioridades disponibles para las tareas del sistema
          </p>
        </div>
        {canCreate && (
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Button variant="primary" size="md" onClick={handleCreate}>
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Nueva Prioridad
            </Button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Buscar
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Buscar por nombre o descripción..."
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Estado
              </label>
              <select
                id="status"
                value={filterActive === null ? "" : filterActive.toString()}
                onChange={(e) =>
                  handleFilterChange(
                    e.target.value === "" ? null : e.target.value === "true"
                  )
                }
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex items-end space-x-3">
              <Button variant="ghost" size="md" onClick={clearFilters}>
                <AdjustmentsHorizontalIcon className="-ml-0.5 mr-2 h-4 w-4" />
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 dark:text-red-300" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-200">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {priorities.length === 0 ? (
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No hay prioridades
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || filterActive !== null
                ? "No se encontraron prioridades con los filtros aplicados."
                : "Comienza creando una nueva prioridad."}
            </p>
            {canCreate && !searchTerm && filterActive === null && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleCreate}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Nueva Prioridad
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {priorities.map((priority) => (
                <li key={priority.id} className="bg-white dark:bg-gray-800">
                  <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex items-center min-w-0 flex-1">
                      <div
                        className="h-4 w-4 rounded-full mr-3 flex-shrink-0"
                        style={{ backgroundColor: priority.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {priority.name}
                          </p>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            Nivel {priority.level}
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              priority.isActive
                                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                            }`}
                          >
                            {priority.isActive ? "Activa" : "Inactiva"}
                          </span>
                        </div>
                        {priority.description && (
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">
                            {priority.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleToggleStatus(priority)}
                        className={
                          priority.isActive
                            ? "text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            : "text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        }
                        title={
                          priority.isActive
                            ? "Desactivar prioridad"
                            : "Activar prioridad"
                        }
                      >
                        {priority.isActive ? (
                          <ShieldExclamationIcon className="w-5 h-5" />
                        ) : (
                          <ShieldCheckIcon className="w-5 h-5" />
                        )}
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => handleEdit(priority)}
                          className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                          title="Editar prioridad"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(priority)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Eliminar prioridad"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() =>
                      handlePageChange(Math.max(1, currentPage - 1))
                    }
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() =>
                      handlePageChange(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Mostrando página{" "}
                      <span className="font-medium">{currentPage}</span> de{" "}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() =>
                          handlePageChange(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Anterior</span>
                        <svg
                          className="h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>

                      {renderPaginationButtons()}

                      <button
                        onClick={() =>
                          handlePageChange(
                            Math.min(totalPages, currentPage + 1)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Siguiente</span>
                        <svg
                          className="h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modales */}
      <TodoPriorityCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={onCreateSuccess}
      />

      {selectedPriority && (
        <>
          <TodoPriorityEditModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedPriority(null);
            }}
            onSuccess={onEditSuccess}
            priority={selectedPriority}
          />

          <TodoPriorityDeleteModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedPriority(null);
            }}
            onSuccess={onDeleteSuccess}
            priority={selectedPriority}
          />
        </>
      )}
    </div>
  );
};
