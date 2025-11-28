import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ActionIcon } from "../components/ui/ActionIcons";
import SmartSearch from "../components/search/SmartSearch";
import {
  useKnowledgeDocuments,
  useCreateKnowledgeDocument,
} from "../hooks/useKnowledge";
import { useCases } from "../hooks/useCases";
import { KnowledgeDocument } from "../types/knowledge";
import { Case } from "../services/api";
import { useToast } from "../hooks/useNotification";
import { useFeaturePermissions } from "../hooks/usePermissions";
import { useCrudErrorHandler } from "../hooks/useErrorHandler";
import { knowledgeApi } from "../services/knowledge.service";

interface KnowledgeBaseProps {}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const permissions = useFeaturePermissions();
  const { handleCreateError } = useCrudErrorHandler();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"created_at" | "updated_at" | "title">(
    "updated_at"
  );
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [searchResults, setSearchResults] = useState<
    KnowledgeDocument[] | null
  >(null);
  const [isAdvancedSearch, setIsAdvancedSearch] = useState(false);

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
    documentTypeId: undefined,
    sortBy,
    sortOrder,
    limit: 20,
  });

  const { data: casesData } = useCases(); // Para obtener información de los casos

  // Create document mutation
  const createDocumentMutation = useCreateKnowledgeDocument({
    onSuccess: (newDocument) => {
      setIsModalOpen(false);
      setDocumentTitle("");
      setIsCreating(false);
      success("Documento creado exitosamente");
      // Navigate to the editor with the new document ID
      navigate(`/knowledge/${newDocument.id}/edit`);
    },
    onError: (error) => {
      setIsCreating(false);
      handleCreateError(error as any, "documento de conocimiento");
    },
  });

  // Handle new document creation
  const handleCreateDocument = () => {
    setIsModalOpen(true);
  };

  const handleModalSubmit = () => {
    if (!documentTitle.trim()) {
      showError("El título del documento es requerido");
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

  // Nueva función para manejar búsqueda inteligente
  const handleSmartSearch = async (term: string, filters?: any) => {
    try {
      setIsAdvancedSearch(true);
      const result = await knowledgeApi.documents.enhancedSearch({
        search: term,
        documentTypeId: undefined,
        ...filters,
      });
      setSearchResults(result.documents);
      setSearchQuery(term);
    } catch (error) {
      showError("Error al realizar la búsqueda");
      console.error("Search error:", error);
    }
  };

  // Función para manejar selección de documento desde sugerencias
  const handleSelectDocument = (documentId: string) => {
    navigate(`/knowledge/${documentId}`);
  };

  // Función para limpiar búsqueda
  const clearAdvancedSearch = () => {
    setIsAdvancedSearch(false);
    setSearchResults(null);
    setSearchQuery("");
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

  // Helper para obtener casos asociados
  const getAssociatedCasesInfo = (doc: KnowledgeDocument) => {
    if (!doc.associatedCases || !casesData) return null;

    const associatedCases = casesData.filter((caso: Case) =>
      doc.associatedCases?.includes(caso.id)
    );

    return associatedCases;
  };

  // Helper para obtener todas las etiquetas a mostrar (solo del documento)
  const getDisplayTags = (doc: KnowledgeDocument) => {
    const docTags = doc.tags || [];
    const maxDocTags = 6; // Mostrar más etiquetas ya que no hay relacionadas
    const displayDocTags = docTags.slice(0, maxDocTags);

    return {
      documentTags: displayDocTags,
      relatedTags: [], // Eliminamos etiquetas relacionadas confusas
      totalDocTags: docTags.length,
      showMore: docTags.length > maxDocTags,
    };
  };

  const documents =
    isAdvancedSearch && searchResults
      ? searchResults
      : documentsResponse?.documents || [];

  if (documentsLoading) {
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
              <ActionIcon action="folder" size="lg" color="blue" />
              Base de Conocimiento
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Centraliza y organiza toda la información de tu equipo
            </p>
          </div>

          <div className="flex space-x-3">
            {permissions.canCreateKnowledge && (
              <button
                onClick={handleCreateDocument}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
              >
                <ActionIcon action="add" size="sm" color="primary" />
                Nuevo Documento
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Smart Search */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <SmartSearch
              onSearch={handleSmartSearch}
              onSelectDocument={handleSelectDocument}
              placeholder="Buscar documentos, etiquetas, casos..."
              className="w-full"
            />
          </div>
          {isAdvancedSearch && (
            <button
              onClick={clearAdvancedSearch}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <ActionIcon
                action="close"
                size="sm"
                color="gray"
                className="mr-2"
              />
              Limpiar búsqueda
            </button>
          )}
        </div>

        {/* Tip debajo de la búsqueda avanzada */}
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          💡 Tip: Usa la búsqueda inteligente arriba para mejores resultados
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

      {/* Results Count and Search Info */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {isAdvancedSearch ? (
              <>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 mr-2">
                  <ActionIcon
                    action="search"
                    size="xs"
                    color="blue"
                    className="mr-1"
                  />
                  Búsqueda inteligente
                </span>
                Mostrando {documents.length} resultado(s) para "{searchQuery}"
              </>
            ) : (
              <>
                {documents?.length || 0} documento
                {documents?.length !== 1 ? "s" : ""} encontrado
                {documents?.length !== 1 ? "s" : ""}
              </>
            )}
          </p>

          {!isAdvancedSearch && <div></div>}
        </div>
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
                      <ActionIcon action="document" size="lg" color="blue" />
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

                  {/* Priority and Difficulty */}
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-300 mr-1">
                        Prioridad:
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          doc.priority === "urgent"
                            ? "bg-red-100 text-red-800"
                            : doc.priority === "high"
                            ? "bg-orange-100 text-orange-800"
                            : doc.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {doc.priority === "urgent"
                          ? "Urgente"
                          : doc.priority === "high"
                          ? "Alta"
                          : doc.priority === "medium"
                          ? "Media"
                          : "Baja"}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-300 mr-1">
                        Dificultad:
                      </span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <ActionIcon
                            key={i}
                            action="star"
                            size="sm"
                            color={i < doc.difficultyLevel ? "yellow" : "gray"}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Associated Cases */}
                  {doc.associatedCases &&
                    doc.associatedCases.length > 0 &&
                    (() => {
                      const associatedCases = getAssociatedCasesInfo(doc);
                      return (
                        <div className="flex items-center text-sm mb-3 flex-wrap gap-1">
                          <ActionIcon
                            action="case"
                            size="sm"
                            color="blue"
                            className="mr-1"
                          />
                          <span className="text-gray-600 dark:text-gray-300 mr-1">
                            Casos:
                          </span>
                          {associatedCases && associatedCases.length > 0 ? (
                            <>
                              {associatedCases
                                .slice(0, 2) // Mostrar hasta 2 casos
                                .map((caso, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                    title={`${caso.numeroCaso}: ${caso.descripcion}`}
                                  >
                                    {caso.numeroCaso}
                                  </span>
                                ))}
                              {doc.associatedCases.length > 2 && (
                                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                  +{doc.associatedCases.length - 2}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-blue-600 dark:text-blue-400 font-medium">
                              {doc.associatedCases.length} asociado
                              {doc.associatedCases.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      );
                    })()}

                  {/* Type and Tags */}
                  <div className="space-y-2">
                    {/* Document Type */}
                    {doc.documentType && (
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <ActionIcon action="folder" size="sm" color="gray" />
                        <span className="ml-1">{doc.documentType.name}</span>
                      </div>
                    )}

                    {/* Tags Section */}
                    {(() => {
                      const tagInfo = getDisplayTags(doc);
                      const hasAnyTags = tagInfo.documentTags.length > 0;

                      return hasAnyTags ? (
                        <div className="space-y-1">
                          {/* Document Tags */}
                          <div className="flex items-start flex-wrap gap-1">
                            <ActionIcon
                              action="tag"
                              size="sm"
                              color="gray"
                              className="mt-0.5 mr-1 flex-shrink-0"
                            />
                            {tagInfo.documentTags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                style={{
                                  backgroundColor: tag.color || "#6b7280",
                                }}
                              >
                                {tag.tagName}
                              </span>
                            ))}
                            {tagInfo.showMore && (
                              <span className="text-xs text-gray-500 self-center">
                                +
                                {tagInfo.totalDocTags -
                                  tagInfo.documentTags.length}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center">
                    <ActionIcon action="user" size="sm" color="gray" />
                    <span className="ml-1">
                      {doc.__createdByUser__?.fullName ||
                        doc.__createdByUser__?.email ||
                        "Usuario desconocido"}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <ActionIcon action="time" size="sm" color="gray" />
                    {formatDate(doc.updatedAt)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <ActionIcon action="folder" size="xl" color="gray" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No se encontraron documentos
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {searchQuery
              ? "Prueba con otros términos de búsqueda."
              : permissions.canCreateKnowledge
              ? "Comienza creando tu primer documento de conocimiento."
              : "No tienes permisos para crear documentos. Contacta al administrador para más información."}
          </p>

          {!searchQuery && permissions.canCreateKnowledge && (
            <button
              onClick={handleCreateDocument}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-800"
            >
              <ActionIcon action="add" size="sm" color="primary" />
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
                  <ActionIcon action="close" size="md" color="gray" />
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
