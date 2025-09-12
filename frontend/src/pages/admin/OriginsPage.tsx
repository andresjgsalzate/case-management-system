import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "../../contexts/ToastContext";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import {
  originService,
  type Origin,
  type OriginFilters,
  type OriginStats,
} from "../../services/originService";

const OriginsPage: React.FC = () => {
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [stats, setStats] = useState<OriginStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<OriginFilters>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "DESC",
  });
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
  });

  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState<Origin | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Estado para el formulario de edición
  const [editForm, setEditForm] = useState({
    nombre: "",
    descripcion: "",
    activo: true,
  });

  // Estado para el formulario de creación
  const [createForm, setCreateForm] = useState({
    nombre: "",
    descripcion: "",
    activo: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { error: showError, success: showSuccess } = useToast();

  // Cargar datos
  const loadOrigins = async () => {
    try {
      setLoading(true);
      const response = await originService.getAllOrigins(filters);

      if (response.success && response.data) {
        setOrigins(response.data.origins || []);
        setPagination({
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 0,
          currentPage: response.data.page || 1,
        });
      } else {
        showError(response.message || "Error al cargar orígenes");
        setOrigins([]);
      }
    } catch (error) {
      showError("Error al cargar orígenes");
      setOrigins([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await originService.getOriginStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  useEffect(() => {
    loadOrigins();
    loadStats();
  }, [filters]);

  // Handlers
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters((prev) => ({
      ...prev,
      search: value || undefined,
      page: 1,
    }));
  };

  const handleSort = (field: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder:
        prev.sortBy === field && prev.sortOrder === "ASC" ? "DESC" : "ASC",
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleCreate = () => {
    setSelectedOrigin(null);
    setShowCreateModal(true);
  };

  const handleEdit = (origin: Origin) => {
    setSelectedOrigin(origin);
    setEditForm({
      nombre: origin.nombre,
      descripcion: origin.descripcion || "",
      activo: origin.activo,
    });
    setShowEditModal(true);
  };

  const handleView = (origin: Origin) => {
    setSelectedOrigin(origin);
    setShowViewModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const canDeleteResponse = await originService.checkCanDeleteOrigin(id);

      if (!canDeleteResponse.success || !canDeleteResponse.data?.canDelete) {
        showError(
          canDeleteResponse.data?.reason || "No se puede eliminar este origen"
        );
        return;
      }

      const response = await originService.deleteOrigin(id);

      if (response.success) {
        showSuccess("Origen eliminado correctamente");
        loadOrigins();
        loadStats();
      } else {
        showError(response.message || "Error al eliminar origen");
      }
    } catch (error) {
      showError("Error al eliminar origen");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleUpdateOrigin = async () => {
    if (!selectedOrigin) return;

    try {
      setIsSubmitting(true);

      const response = await originService.updateOrigin(selectedOrigin.id, {
        nombre: editForm.nombre.trim(),
        descripcion: editForm.descripcion.trim() || undefined,
        activo: editForm.activo,
      });

      if (response.success) {
        showSuccess("Origen actualizado correctamente");
        setShowEditModal(false);
        setSelectedOrigin(null);
        loadOrigins();
        loadStats();
      } else {
        showError(response.message || "Error al actualizar origen");
      }
    } catch (error) {
      showError("Error al actualizar origen");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedOrigin(null);
    setEditForm({
      nombre: "",
      descripcion: "",
      activo: true,
    });
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedOrigin(null);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateForm({ nombre: "", descripcion: "", activo: true });
  };

  const handleCreateOrigin = async () => {
    if (!createForm.nombre.trim()) return;

    setIsSubmitting(true);
    try {
      await originService.createOrigin({
        nombre: createForm.nombre.trim(),
        descripcion: createForm.descripcion.trim() || undefined,
        activo: createForm.activo,
      });

      handleCloseCreateModal();
      loadOrigins();
    } catch (error) {
      console.error("Error al crear origen:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSortIcon = (field: string) => {
    if (filters.sortBy !== field) return null;
    return filters.sortOrder === "ASC" ? (
      <ArrowUpIcon className="w-4 h-4" />
    ) : (
      <ArrowDownIcon className="w-4 h-4" />
    );
  };

  if (loading && origins.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión de Orígenes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administra los orígenes de casos del sistema
          </p>
        </div>
        <Button
          onClick={handleCreate}
          variant="primary"
          className="inline-flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nuevo Origen
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Orígenes
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalOrigins}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Activos
            </div>
            <div className="text-2xl font-bold text-green-600">
              {stats.activeOrigins}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Inactivos
            </div>
            <div className="text-2xl font-bold text-red-600">
              {stats.inactiveOrigins}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Casos Asociados
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.casesCount}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Creados Recientemente
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {stats.recentlyCreated}
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar orígenes..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filters.activo?.toString() || "all"}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  isActive:
                    e.target.value === "all"
                      ? undefined
                      : e.target.value === "true",
                  page: 1,
                }))
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  onClick={() => handleSort("nombre")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <div className="flex items-center space-x-1">
                    <span>Nombre</span>
                    {getSortIcon("nombre")}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Descripción
                </th>
                <th
                  onClick={() => handleSort("isActive")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <div className="flex items-center space-x-1">
                    <span>Estado</span>
                    {getSortIcon("isActive")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("createdAt")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <div className="flex items-center space-x-1">
                    <span>Creado</span>
                    {getSortIcon("createdAt")}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {(origins || []).map((origin) => (
                <tr
                  key={origin.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {origin.nombre}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {origin.descripcion || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        origin.activo
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                      }`}
                    >
                      {origin.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {new Date(origin.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleView(origin)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Ver detalles"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(origin)}
                        className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                        title="Editar"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(origin.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Eliminar"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-400">
                    Mostrando{" "}
                    <span className="font-medium">
                      {(pagination.currentPage - 1) * filters.limit! + 1}
                    </span>{" "}
                    a{" "}
                    <span className="font-medium">
                      {Math.min(
                        pagination.currentPage * filters.limit!,
                        pagination.total
                      )}
                    </span>{" "}
                    de <span className="font-medium">{pagination.total}</span>{" "}
                    resultados
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    {Array.from(
                      { length: pagination.totalPages },
                      (_, i) => i + 1
                    ).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pagination.currentPage
                            ? "z-10 bg-orange-50 border-orange-500 text-orange-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Confirmar eliminación
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              ¿Estás seguro de que deseas eliminar este origen? Esta acción no
              se puede deshacer.
            </p>
            <div className="flex justify-end space-x-4">
              <Button
                variant="secondary"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(deleteConfirm)}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ver Origen */}
      <Modal
        isOpen={showViewModal}
        onClose={handleCloseViewModal}
        title="Detalles del Origen"
        size="lg"
      >
        {selectedOrigin && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ID
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2">
                  {selectedOrigin.id}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <div>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedOrigin.activo
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedOrigin.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2">
                {selectedOrigin.nombre}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2 min-h-[60px]">
                {selectedOrigin.descripcion || "Sin descripción"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Creación
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2">
                  {new Date(selectedOrigin.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Última Actualización
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2">
                  {new Date(selectedOrigin.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="secondary" onClick={handleCloseViewModal}>
                Cerrar
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  handleCloseViewModal();
                  handleEdit(selectedOrigin);
                }}
              >
                Editar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Editar Origen */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title="Editar Origen"
        size="lg"
      >
        {selectedOrigin && (
          <div className="space-y-6">
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={editForm.nombre}
                  onChange={(e) =>
                    setEditForm({ ...editForm, nombre: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Ingrese el nombre del origen"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={editForm.descripcion}
                  onChange={(e) =>
                    setEditForm({ ...editForm, descripcion: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Ingrese una descripción (opcional)"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="activo"
                  checked={editForm.activo}
                  onChange={(e) =>
                    setEditForm({ ...editForm, activo: e.target.checked })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="activo"
                  className="ml-2 block text-sm text-gray-900 dark:text-gray-100"
                >
                  Estado activo
                </label>
              </div>
            </form>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                onClick={handleCloseEditModal}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateOrigin}
                disabled={
                  isSubmitting ||
                  !editForm.nombre.trim() ||
                  (editForm.nombre === selectedOrigin.nombre &&
                    editForm.descripcion ===
                      (selectedOrigin.descripcion || "") &&
                    editForm.activo === selectedOrigin.activo)
                }
              >
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Crear Origen */}
      <Modal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        title="Crear Nuevo Origen"
        size="lg"
      >
        <div className="space-y-6">
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                value={createForm.nombre}
                onChange={(e) =>
                  setCreateForm({ ...createForm, nombre: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Ingrese el nombre del origen"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                value={createForm.descripcion}
                onChange={(e) =>
                  setCreateForm({ ...createForm, descripcion: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Ingrese una descripción (opcional)"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="createActivo"
                checked={createForm.activo}
                onChange={(e) =>
                  setCreateForm({ ...createForm, activo: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="createActivo"
                className="ml-2 block text-sm text-gray-900 dark:text-gray-100"
              >
                Estado activo
              </label>
            </div>
          </form>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={handleCloseCreateModal}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateOrigin}
              disabled={isSubmitting || !createForm.nombre.trim()}
            >
              {isSubmitting ? "Creando..." : "Crear Origen"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OriginsPage;
