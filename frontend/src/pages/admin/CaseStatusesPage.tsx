import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../contexts/ToastContext";
import {
  caseStatusService,
  type CaseStatus,
  type CaseStatusFilters,
  type CaseStatusStats,
} from "../../services/caseStatusService";

const CaseStatusesPage: React.FC = () => {
  const [statuses, setStatuses] = useState<CaseStatus[]>([]);
  const [stats, setStats] = useState<CaseStatusStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<CaseStatusFilters>({
    page: 1,
    limit: 10,
    sortBy: "displayOrder",
    sortOrder: "ASC",
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
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Estado para formularios
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
    isActive: true,
  });

  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
    isActive: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { error: showError, success: showSuccess } = useToast();

  // Cargar datos
  const loadStatuses = async () => {
    try {
      setLoading(true);
      const response = await caseStatusService.getAllStatuses(filters);

      if (response.success && response.data) {
        setStatuses(response.data.statuses || []);
        setPagination({
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 0,
          currentPage: response.data.page || 1,
        });
      } else {
        showError(response.message || "Error al cargar estados");
        setStatuses([]);
      }
    } catch (error) {
      showError("Error al cargar estados");
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await caseStatusService.getStatusStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  useEffect(() => {
    loadStatuses();
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
    setSelectedStatus(null);
    setShowCreateModal(true);
  };

  const handleEdit = (status: CaseStatus) => {
    handleEditWithForm(status);
  };

  const handleView = (status: CaseStatus) => {
    setSelectedStatus(status);
    setShowViewModal(true);
  };

  // Manejadores para cerrar modales
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedStatus(null);
    setEditForm({
      name: "",
      description: "",
      color: "#3B82F6",
      isActive: true,
    });
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedStatus(null);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateForm({
      name: "",
      description: "",
      color: "#3B82F6",
      isActive: true,
    });
  };

  // Actualizar handleEdit para inicializar el formulario
  const handleEditWithForm = (status: CaseStatus) => {
    setSelectedStatus(status);
    setEditForm({
      name: status.name,
      description: status.description || "",
      color: status.color || "#3B82F6",
      isActive: status.isActive,
    });
    setShowEditModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedStatus || !editForm.name.trim()) return;

    setIsSubmitting(true);
    try {
      await caseStatusService.updateStatus(selectedStatus.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        color: editForm.color,
        isActive: editForm.isActive,
      });

      handleCloseEditModal();
      loadStatuses();
      showSuccess("Estado actualizado correctamente");
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      showError("Error al actualizar estado");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateStatus = async () => {
    if (!createForm.name.trim()) return;

    setIsSubmitting(true);
    try {
      await caseStatusService.createStatus({
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        color: createForm.color,
        isActive: createForm.isActive,
      });

      handleCloseCreateModal();
      loadStatuses();
      showSuccess("Estado creado correctamente");
    } catch (error) {
      console.error("Error al crear estado:", error);
      showError("Error al crear estado");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const canDeleteResponse = await caseStatusService.checkCanDeleteStatus(
        id
      );

      if (!canDeleteResponse.success || !canDeleteResponse.data?.canDelete) {
        showError(
          canDeleteResponse.data?.reason || "No se puede eliminar este estado"
        );
        return;
      }

      const response = await caseStatusService.deleteStatus(id);

      if (response.success) {
        showSuccess("Estado eliminado correctamente");
        loadStatuses();
        loadStats();
      } else {
        showError(response.message || "Error al eliminar estado");
      }
    } catch (error) {
      showError("Error al eliminar estado");
    } finally {
      setDeleteConfirm(null);
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

  if (loading && statuses.length === 0) {
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
            Gestión de Estados de Control
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administra los estados de casos del sistema
          </p>
        </div>
        <Button
          onClick={handleCreate}
          variant="primary"
          className="inline-flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nuevo Estado
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Estados
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalStatuses}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Activos
            </div>
            <div className="text-2xl font-bold text-green-600">
              {stats.activeStatuses}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Inactivos
            </div>
            <div className="text-2xl font-bold text-red-600">
              {stats.inactiveStatuses}
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
              placeholder="Buscar estados..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filters.isActive?.toString() || "all"}
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
                  onClick={() => handleSort("displayOrder")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <div className="flex items-center space-x-1">
                    <Bars3Icon className="w-4 h-4" />
                    <span>Orden</span>
                    {getSortIcon("displayOrder")}
                  </div>
                </th>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Color
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
              {(statuses || []).map((status) => (
                <tr
                  key={status.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Bars3Icon className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {status.displayOrder}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {status.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {status.description || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: status.color || "#6B7280" }}
                      ></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                        {status.color || "Sin color"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        status.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                      }`}
                    >
                      {status.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {new Date(status.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleView(status)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Ver detalles"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(status)}
                        className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                        title="Editar"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(status.id)}
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
              ¿Estás seguro de que deseas eliminar este estado? Esta acción no
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

      {/* Modal de Ver Estado */}
      <Modal
        isOpen={showViewModal}
        onClose={handleCloseViewModal}
        title="Detalles del Estado"
        size="lg"
      >
        {selectedStatus && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ID
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2">
                  {selectedStatus.id}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <div>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedStatus.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedStatus.isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2">
                {selectedStatus.name}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2 min-h-[60px]">
                {selectedStatus.description || "Sin descripción"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex items-center space-x-3">
                  <div
                    className="w-8 h-8 rounded border border-gray-300"
                    style={{
                      backgroundColor: selectedStatus.color || "#3B82F6",
                    }}
                  ></div>
                  <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2 font-mono">
                    {selectedStatus.color || "#3B82F6"}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Orden de Visualización
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2">
                  {selectedStatus.displayOrder}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Creación
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2">
                  {new Date(selectedStatus.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Última Actualización
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2">
                  {new Date(selectedStatus.updatedAt).toLocaleString()}
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
                  handleEdit(selectedStatus);
                }}
              >
                Editar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Editar Estado */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title="Editar Estado"
        size="lg"
      >
        {selectedStatus && (
          <div className="space-y-6">
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Ingrese el nombre del estado"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Ingrese una descripción (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={editForm.color}
                    onChange={(e) =>
                      setEditForm({ ...editForm, color: e.target.value })
                    }
                    className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editForm.color}
                    onChange={(e) =>
                      setEditForm({ ...editForm, color: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editActive"
                  checked={editForm.isActive}
                  onChange={(e) =>
                    setEditForm({ ...editForm, isActive: e.target.checked })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="editActive"
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
                onClick={handleUpdateStatus}
                disabled={
                  isSubmitting ||
                  !editForm.name.trim() ||
                  (editForm.name === selectedStatus.name &&
                    editForm.description ===
                      (selectedStatus.description || "") &&
                    editForm.color === (selectedStatus.color || "#3B82F6") &&
                    editForm.isActive === selectedStatus.isActive)
                }
              >
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Crear Estado */}
      <Modal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        title="Crear Nuevo Estado"
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
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Ingrese el nombre del estado"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm({ ...createForm, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Ingrese una descripción (opcional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={createForm.color}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, color: e.target.value })
                  }
                  className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={createForm.color}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, color: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono"
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="createActive"
                checked={createForm.isActive}
                onChange={(e) =>
                  setCreateForm({ ...createForm, isActive: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="createActive"
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
              onClick={handleCreateStatus}
              disabled={isSubmitting || !createForm.name.trim()}
            >
              {isSubmitting ? "Creando..." : "Crear Estado"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CaseStatusesPage;
