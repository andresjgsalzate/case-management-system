import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpenIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  DocumentTextIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  useKnowledgeDocuments,
  useDocumentTypes,
  useCreateKnowledgeDocument,
} from "../hooks/useKnowledge";
import { KnowledgeDocument } from "../types/knowledge";
import { toast } from "react-hot-toast";

interface KnowledgeBaseProps {}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"created_at" | "updated_at" | "title">(
    "updated_at"
  );
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [documentTitle, setDocumentTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Fetch data
  const {
    data: documentsResponse,
    isLoading: documentsLoading,
    error: documentsError,
  } = useKnowledgeDocuments({
    search: searchQuery,
    documentTypeId: selectedType || undefined,
    sortBy,
    sortOrder,
    limit: 20,
  });

  const { data: documentTypes, isLoading: typesLoading } = useDocumentTypes();

  // Create document mutation
  const createDocumentMutation = useCreateKnowledgeDocument({
    onSuccess: (newDocument) => {
      setIsModalOpen(false);
      setDocumentTitle("");
      setIsCreating(false);
      toast.success("Documento creado exitosamente");
      // Navigate to the editor with the new document ID
      navigate(`/knowledge/${newDocument.id}/edit`);
    },
    onError: (error) => {
      setIsCreating(false);
      toast.error(`Error al crear documento: ${error.message}`);
    },
  });

  // Handle new document creation
  const handleCreateDocument = () => {
    setIsModalOpen(true);
  };

  const handleModalSubmit = () => {
    if (!documentTitle.trim()) {
      toast.error("El título del documento es requerido");
      return;
    }

    setIsCreating(true);

    createDocumentMutation.mutate({
      title: documentTitle.trim(),
      content: "",
      jsonContent: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [],
          },
        ],
      }, // Estructura inicial válida para BlockNote
      priority: "medium",
      isTemplate: false,
    });
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setDocumentTitle("");
    setIsCreating(false);
  };

  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Filter by type
  const handleTypeFilter = (typeId: string | null) => {
    setSelectedType(typeId);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status color
  const getStatusColor = (
    isPublished: boolean,
    isArchived: boolean,
    isDeprecated: boolean
  ) => {
    if (isArchived)
      return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
    if (isDeprecated)
      return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400";
    if (isPublished)
      return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400";
    return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400"; // Draft
  };

  const getStatusText = (
    isPublished: boolean,
    isArchived: boolean,
    isDeprecated: boolean
  ) => {
    if (isArchived) return "Archivado";
    if (isDeprecated) return "Obsoleto";
    if (isPublished) return "Publicado";
    return "Borrador";
  };

  const documents = documentsResponse?.documents || [];

  if (documentsLoading || typesLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (documentsError) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 dark:text-red-400 mb-4">
          Error al cargar los documentos: {documentsError.message}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <BookOpenIcon className="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
              Base de Conocimiento
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Centraliza y organiza toda la información de tu equipo
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleCreateDocument}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Nuevo Documento
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="md:col-span-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              placeholder="Buscar documentos..."
            />
          </div>
        </div>

        {/* Type Filter */}
        <div>
          <select
            value={selectedType || ""}
            onChange={(e) => handleTypeFilter(e.target.value || null)}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
          >
            <option value="">Todos los tipos</option>
            {documentTypes?.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sort Options */}
      <div className="mb-6 flex items-center space-x-4">
        <span className="text-sm text-gray-600 dark:text-gray-300">
          Ordenar por:
        </span>
        <select
          value={`${sortBy}_${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split("_");
            setSortBy(field as "created_at" | "updated_at" | "title");
            setSortOrder(order as "ASC" | "DESC");
          }}
          className="text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
        >
          <option value="updated_at_DESC">Última actualización</option>
          <option value="created_at_DESC">Más reciente</option>
          <option value="title_ASC">Título (A-Z)</option>
          <option value="title_DESC">Título (Z-A)</option>
        </select>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {documents?.length || 0} documento{documents?.length !== 1 ? "s" : ""}{" "}
          encontrado{documents?.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Documents Grid */}
      {documents && documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc: KnowledgeDocument) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DocumentTextIcon className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            doc.isPublished,
                            doc.isArchived,
                            doc.isDeprecated
                          )}`}
                        >
                          {getStatusText(
                            doc.isPublished,
                            doc.isArchived,
                            doc.isDeprecated
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    <Link
                      to={`/knowledge/${doc.id}`}
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {doc.title}
                    </Link>
                  </h3>

                  {doc.content && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-3">
                      {doc.content.substring(0, 150)}...
                    </p>
                  )}

                  {/* Type and Tags */}
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    {doc.documentType && (
                      <div className="flex items-center">
                        <FolderIcon className="h-4 w-4 mr-1" />
                        {doc.documentType.name}
                      </div>
                    )}

                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex items-center">
                        <TagIcon className="h-4 w-4 mr-1" />
                        {doc.tags
                          .slice(0, 2)
                          .map((tag) => tag.tagName)
                          .join(", ")}
                        {doc.tags.length > 2 && ` +${doc.tags.length - 2}`}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-1" />
                    Autor
                  </div>

                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {formatDate(doc.updatedAt)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No se encontraron documentos
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {searchQuery || selectedType
              ? "Prueba con otros términos de búsqueda o filtros."
              : "Comienza creando tu primer documento de conocimiento."}
          </p>

          {!searchQuery && !selectedType && (
            <button
              onClick={handleCreateDocument}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-800"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Crear Primer Documento
            </button>
          )}
        </div>
      )}

      {/* Create Document Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800 dark:border-gray-600">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Crear Nuevo Documento
                </h3>
                <button
                  onClick={handleModalCancel}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="py-3">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Ingresa el título del documento. Una vez creado, podrás
                  editarlo y agregar archivos.
                </p>

                <div>
                  <label
                    htmlFor="document-title"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                  >
                    Título del Documento *
                  </label>
                  <input
                    id="document-title"
                    type="text"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ej: Guía de procedimientos..."
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !isCreating) {
                        handleModalSubmit();
                      }
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end pt-3 border-t border-gray-200 dark:border-gray-600 space-x-3">
                <button
                  onClick={handleModalCancel}
                  disabled={isCreating}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleModalSubmit}
                  disabled={isCreating || !documentTitle.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creando...
                    </>
                  ) : (
                    "Crear Documento"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
