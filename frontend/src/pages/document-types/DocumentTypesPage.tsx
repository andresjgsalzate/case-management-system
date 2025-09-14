import { useState, useEffect, useMemo } from "react";
import { ActionIcon } from "../../components/ui/ActionIcons";
import { useToast } from "../../hooks/useNotification";
import { Button } from "../../components/ui/Button";
import { DocumentTypeService } from "../../services/knowledge.service";
import type { DocumentType } from "../../types/knowledge";
import DocumentTypeCreateModal from "../../components/admin/document-types/DocumentTypeCreateModal";
import DocumentTypeEditModal from "../../components/admin/document-types/DocumentTypeEditModal";
import DocumentTypeDeleteModal from "../../components/admin/document-types/DocumentTypeDeleteModal";

interface DocumentTypeFilters {
  isActive?: boolean;
  search?: string;
}

export default function DocumentTypesPage() {
  const { success, error: showError } = useToast();
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DocumentTypeFilters>({});
  const [sortBy, setSortBy] = useState<
    "name" | "code" | "displayOrder" | "createdAt"
  >("displayOrder");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] =
    useState<DocumentType | null>(null);

  const loadDocumentTypes = async () => {
    try {
      setLoading(true);
      const data = await DocumentTypeService.findAll(filters.isActive);
      setDocumentTypes(data || []);
    } catch (error: any) {
      console.error("Error loading document types:", error);
      showError(error.message || "Error al cargar los tipos de documento");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocumentTypes();
  }, [filters.isActive]);

  const filteredAndSortedTypes = useMemo(() => {
    let filtered = [...documentTypes];

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (type) =>
          type.name.toLowerCase().includes(searchLower) ||
          type.code.toLowerCase().includes(searchLower) ||
          type.description?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortBy) {
        case "name":
          aVal = a.name;
          bVal = b.name;
          break;
        case "code":
          aVal = a.code;
          bVal = b.code;
          break;
        case "displayOrder":
          aVal = a.displayOrder;
          bVal = b.displayOrder;
          break;
        case "createdAt":
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [documentTypes, filters, sortBy, sortOrder]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleCreateSuccess = () => {
    loadDocumentTypes();
    success("Tipo de documento creado exitosamente");
  };

  const handleEditClick = (documentType: DocumentType) => {
    setSelectedDocumentType(documentType);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    loadDocumentTypes();
    success("Tipo de documento actualizado exitosamente");
  };

  const handleDeleteClick = (documentType: DocumentType) => {
    setSelectedDocumentType(documentType);
    setShowDeleteModal(true);
  };

  const handleDeleteSuccess = () => {
    loadDocumentTypes();
    success("Tipo de documento eliminado exitosamente");
  };

  const handleToggleStatus = async (documentType: DocumentType) => {
    try {
      await DocumentTypeService.toggleActive(documentType.id);
      loadDocumentTypes();
      success(
        `Tipo de documento ${
          documentType.isActive ? "desactivado" : "activado"
        } exitosamente`
      );
    } catch (error: any) {
      console.error("Error toggling document type status:", error);
      showError(
        error.message || "Error al cambiar el estado del tipo de documento"
      );
    }
  };

  const getSortIcon = (field: typeof sortBy) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? (
      <ActionIcon action="chevronUp" size="sm" />
    ) : (
      <ActionIcon action="dropdown" size="sm" />
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tipos de Documento
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona los tipos de documentos del sistema
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center"
        >
          <ActionIcon action="add" size="sm" className="mr-2" />
          Nuevo Tipo
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={filters.search || ""}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              placeholder="Buscar por nombre, código o descripción..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <select
              value={
                filters.isActive === undefined
                  ? "all"
                  : filters.isActive
                  ? "active"
                  : "inactive"
              }
              onChange={(e) => {
                const value = e.target.value;
                setFilters({
                  ...filters,
                  isActive:
                    value === "all"
                      ? undefined
                      : value === "active"
                      ? true
                      : false,
                });
              }}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ordenar por
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            >
              <option value="displayOrder">Orden de visualización</option>
              <option value="name">Nombre</option>
              <option value="code">Código</option>
              <option value="createdAt">Fecha de creación</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {documentTypes.length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Activos
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {documentTypes.filter((t) => t.isActive).length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Inactivos
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {documentTypes.filter((t) => !t.isActive).length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Filtrados
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {filteredAndSortedTypes.length}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort("code")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Código</span>
                    {getSortIcon("code")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Nombre</span>
                    {getSortIcon("name")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Descripción
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Color
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort("displayOrder")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Orden</span>
                    {getSortIcon("displayOrder")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Estado
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort("createdAt")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Creado</span>
                    {getSortIcon("createdAt")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin h-5 w-5 text-gray-500 dark:text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span className="ml-2 text-gray-500 dark:text-gray-400">
                        Cargando tipos de documento...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredAndSortedTypes.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    No se encontraron tipos de documento
                  </td>
                </tr>
              ) : (
                filteredAndSortedTypes.map((documentType) => {
                  return (
                    <tr
                      key={documentType.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {documentType.code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {documentType.icon && (
                            <span className="text-lg">{documentType.icon}</span>
                          )}
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {documentType.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                          {documentType.description || "Sin descripción"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: documentType.color }}
                          />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {documentType.color}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {documentType.displayOrder}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            documentType.isActive
                              ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                              : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200"
                          }`}
                        >
                          {documentType.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(
                            documentType.createdAt
                          ).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleToggleStatus(documentType)}
                            className={
                              documentType.isActive
                                ? "text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                : "text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            }
                            title={
                              documentType.isActive
                                ? "Desactivar tipo de documento"
                                : "Activar tipo de documento"
                            }
                          >
                            {documentType.isActive ? (
                              <ActionIcon action="deactivate" size="sm" />
                            ) : (
                              <ActionIcon action="activate" size="sm" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEditClick(documentType)}
                            className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                            title="Editar tipo de documento"
                          >
                            <ActionIcon action="edit" size="sm" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(documentType)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Eliminar tipo de documento"
                          >
                            <ActionIcon action="delete" size="sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      <DocumentTypeCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <DocumentTypeEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedDocumentType(null);
        }}
        onSuccess={handleEditSuccess}
        documentType={selectedDocumentType}
      />

      <DocumentTypeDeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedDocumentType(null);
        }}
        onSuccess={handleDeleteSuccess}
        documentType={selectedDocumentType}
      />
    </div>
  );
}
