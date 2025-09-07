import React, { useState, useMemo } from "react";
import {
  ArchiveBoxIcon,
  ArrowPathIcon,
  EyeIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
  TrashIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useArchiveData, useArchiveManager } from "../../hooks/useArchive";
import {
  ArchiveFilters,
  ArchivedItem,
  ARCHIVE_TYPE_OPTIONS,
  CLASSIFICATION_OPTIONS,
  PRIORITY_OPTIONS,
} from "../../types/archive.types";
import { archiveApi } from "../../services/archiveApi";
import { useConfirmationModal } from "../../hooks/useConfirmationModal";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { toast } from "react-hot-toast";

export const ArchivePage: React.FC = () => {
  const [filters, setFilters] = useState<ArchiveFilters>({
    type: "all",
    showRestored: false,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Estados para modales
  const [selectedItem, setSelectedItem] = useState<ArchivedItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Hooks
  const { stats, items, isLoading, isError, error, refetch } =
    useArchiveData(filters);
  const archiveManager = useArchiveManager();
  const { showConfirmation, modalState, modalHandlers } =
    useConfirmationModal();

  // Debug logs para la página de archivo
  console.log("🔍 ArchivePage Debug:", {
    filters,
    stats,
    items,
    isLoading,
    isError,
    error: error?.message,
    itemsLength: items?.length,
  });

  // Debug logs para el modal
  console.log("🔍 ArchivePage Modal State:", {
    showDetailsModal,
    selectedItem: selectedItem?.title || null,
    selectedItemId: selectedItem?.id || null,
  });

  // Filtros combinados con búsqueda
  const finalFilters = useMemo(
    () => ({
      ...filters,
      search: searchTerm,
    }),
    [filters, searchTerm]
  );

  // Elementos filtrados
  const filteredItems = useMemo(() => {
    if (!items) return [];

    let filtered = [...items];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower) ||
          item.caseNumber?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [items, searchTerm]);

  // Handlers
  const handleFilterChange = (key: keyof ArchiveFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleViewDetails = (item: ArchivedItem) => {
    console.log("🔍 handleViewDetails called with item:", item);
    setSelectedItem(item);
    setShowDetailsModal(true);
    console.log("🔍 showDetailsModal should be true now");
  };

  const handleRestoreRequest = async (item: ArchivedItem) => {
    const confirmed = await showConfirmation({
      title: "Restaurar Elemento",
      message: `¿Estás seguro de que quieres restaurar "${item.title}"? Esto recreará el elemento en su ubicación original con todos sus datos y relaciones.`,
      confirmText: "Restaurar",
      cancelText: "Cancelar",
      type: "success",
    });

    if (confirmed) {
      try {
        toast.loading("Restaurando elemento...", { id: "restore" });

        if (item.itemType === "case") {
          await archiveManager.restoreCase({
            id: item.id,
            restoreData: { reason: "Restaurado desde la interfaz de archivo" },
          });
        } else {
          await archiveManager.restoreTodo({
            id: item.id,
            restoreData: { reason: "Restaurado desde la interfaz de archivo" },
          });
        }

        toast.success("Elemento restaurado exitosamente", { id: "restore" });
        refetch();
      } catch (error) {
        console.error("Error restoring item:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Error al restaurar elemento";
        toast.error(errorMessage, { id: "restore" });
      }
    }
  };

  const handleDeleteRequest = async (item: ArchivedItem) => {
    const confirmed = await showConfirmation({
      title: "Eliminar Permanentemente",
      message: `¿Estás seguro de que quieres eliminar permanentemente "${item.title}"? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      type: "danger",
    });

    if (confirmed) {
      try {
        toast.loading("Eliminando elemento...", { id: "delete" });

        if (item.itemType === "case") {
          await archiveManager.deleteCase({
            id: item.id,
            deleteData: { reason: "Eliminado desde la interfaz de archivo" },
          });
        } else {
          await archiveManager.deleteTodo({
            id: item.id,
            deleteData: { reason: "Eliminado desde la interfaz de archivo" },
          });
        }

        toast.success("Elemento eliminado exitosamente", { id: "delete" });
        refetch();
      } catch (error) {
        console.error("Error deleting item:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Error al eliminar elemento";
        toast.error(errorMessage, { id: "delete" });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Cargando archivo...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            Error al cargar el archivo: {error?.message}
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Archivo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestión de casos y TODOs archivados
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <FunnelIcon className="w-4 h-4" />
            <span>Filtros</span>
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <ArchiveBoxIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalArchivedCases}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Casos archivados
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <DocumentArrowDownIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalArchivedTodos}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  TODOs archivados
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <CalendarIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {archiveApi.formatTime(stats.totalArchivedTimeMinutes)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tiempo total
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <ArchiveBoxIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.archivedThisMonth}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Este mes
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <ArrowPathIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.restoredThisMonth}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Restaurados
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        {/* Búsqueda */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar en archivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Filtros expandibles */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {ARCHIVE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado
              </label>
              <select
                value={filters.showRestored ? "restored" : "active"}
                onChange={(e) =>
                  handleFilterChange(
                    "showRestored",
                    e.target.value === "restored"
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="active">Archivados</option>
                <option value="restored">Restaurados</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Clasificación
              </label>
              <select
                value={filters.classification || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "classification",
                    e.target.value || undefined
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todas</option>
                {CLASSIFICATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prioridad
              </label>
              <select
                value={filters.priority || ""}
                onChange={(e) =>
                  handleFilterChange("priority", e.target.value || undefined)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todas</option>
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Lista de elementos archivados */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tiempo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Archivado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    No se encontraron elementos archivados
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={`${item.itemType}-${item.id}`}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className={`p-2 rounded-full ${
                            item.itemType === "case"
                              ? "bg-blue-100 dark:bg-blue-900"
                              : "bg-green-100 dark:bg-green-900"
                          }`}
                        >
                          {item.itemType === "case" ? (
                            <DocumentArrowDownIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <ArchiveBoxIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                          )}
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                          {item.itemType === "case" ? "Caso" : "TODO"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.itemType === "case"
                          ? item.caseNumber
                          : item.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {item.description || "Sin descripción"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {archiveApi.formatTime(item.totalTimeMinutes)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {archiveApi.formatDate(item.archivedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${archiveApi.getStatusColor(
                          item.isRestored
                        )}`}
                      >
                        {item.isRestored ? "Restaurado" : "Archivado"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            console.log("🔍 Button clicked! Item:", item.title);
                            handleViewDetails(item);
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                          title="Ver detalles"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        {!item.isRestored && (
                          <button
                            onClick={() => handleRestoreRequest(item)}
                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                            title="Restaurar"
                          >
                            <ArrowPathIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteRequest(item)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                          title="Eliminar permanentemente"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detalles del elemento archivado */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => {
                console.log("🔍 Backdrop clicked, closing modal");
                setShowDetailsModal(false);
              }}
            />

            {/* Modal Content */}
            <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden z-[10000]">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Detalles del Elemento Archivado
                </h2>
                <button
                  onClick={() => {
                    console.log("🔍 Close button clicked");
                    setShowDetailsModal(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {selectedItem && (
                  <div className="space-y-6">
                    {/* Header con tipo de elemento */}
                    <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                      <div
                        className={`p-3 rounded-full ${
                          selectedItem.itemType === "case"
                            ? "bg-blue-100 dark:bg-blue-900"
                            : "bg-green-100 dark:bg-green-900"
                        }`}
                      >
                        {selectedItem.itemType === "case" ? (
                          <DocumentArrowDownIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <ClipboardDocumentListIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {selectedItem.itemType === "case" ? "Caso" : "TODO"}:{" "}
                          {selectedItem.title}
                        </h3>
                        {selectedItem.caseNumber && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Número de caso: {selectedItem.caseNumber}
                          </p>
                        )}
                      </div>
                      <div className="ml-auto">
                        {selectedItem.isRestored && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Restaurado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Información básica */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                            Información General
                          </h4>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                            {selectedItem.description && (
                              <div>
                                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Descripción
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                  {selectedItem.description}
                                </dd>
                              </div>
                            )}

                            {selectedItem.itemType === "case" &&
                              selectedItem.status && (
                                <div>
                                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Estado
                                  </dt>
                                  <dd className="mt-1">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                      {selectedItem.status}
                                    </span>
                                  </dd>
                                </div>
                              )}

                            {selectedItem.itemType === "case" &&
                              selectedItem.classification && (
                                <div>
                                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Clasificación
                                  </dt>
                                  <dd className="mt-1">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                      {selectedItem.classification}
                                    </span>
                                  </dd>
                                </div>
                              )}

                            {selectedItem.itemType === "todo" &&
                              selectedItem.priority && (
                                <div>
                                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Prioridad
                                  </dt>
                                  <dd className="mt-1">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                      {selectedItem.priority}
                                    </span>
                                  </dd>
                                </div>
                              )}

                            {selectedItem.itemType === "todo" &&
                              selectedItem.category && (
                                <div>
                                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Categoría
                                  </dt>
                                  <dd className="mt-1">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                      {selectedItem.category}
                                    </span>
                                  </dd>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                            Información de Archivo
                          </h4>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                            <div>
                              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Fecha de Archivo
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                                <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                                {new Date(
                                  selectedItem.archivedAt
                                ).toLocaleString("es-ES", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </dd>
                            </div>

                            <div>
                              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Archivado por
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                                <UserIcon className="w-4 h-4 mr-2 text-gray-400" />
                                {selectedItem.archivedByUser?.displayName ||
                                  selectedItem.archivedByUser?.fullName ||
                                  selectedItem.archivedByUser?.email ||
                                  selectedItem.archivedBy}
                              </dd>
                            </div>

                            <div>
                              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Tiempo Total Registrado
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                <div className="flex items-center mb-2">
                                  <ClockIcon className="w-4 h-4 mr-2 text-gray-400" />
                                  <span className="font-medium">
                                    {selectedItem.totalTimeMinutes
                                      ? `${Math.floor(
                                          selectedItem.totalTimeMinutes / 60
                                        )}h ${
                                          selectedItem.totalTimeMinutes % 60
                                        }m`
                                      : "0 minutos"}
                                  </span>
                                </div>
                                {/* Desglose del tiempo */}
                                {(selectedItem.timerTimeMinutes ||
                                  selectedItem.manualTimeMinutes) && (
                                  <div className="ml-6 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                    {selectedItem.timerTimeMinutes > 0 && (
                                      <div className="flex items-center">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                        <span>
                                          Cronómetro:{" "}
                                          {Math.floor(
                                            selectedItem.timerTimeMinutes / 60
                                          )}
                                          h {selectedItem.timerTimeMinutes % 60}
                                          m
                                        </span>
                                      </div>
                                    )}
                                    {selectedItem.manualTimeMinutes > 0 && (
                                      <div className="flex items-center">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                        <span>
                                          Manual:{" "}
                                          {Math.floor(
                                            selectedItem.manualTimeMinutes / 60
                                          )}
                                          h{" "}
                                          {selectedItem.manualTimeMinutes % 60}m
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </dd>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ID del elemento */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                        ID del elemento: {selectedItem.id}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
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
