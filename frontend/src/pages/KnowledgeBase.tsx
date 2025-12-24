import React, { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ActionIcon } from "../components/ui/ActionIcons";
import SmartSearch from "../components/search/SmartSearch";
import ActiveFiltersBar, {
  ActiveFilter,
} from "../components/search/ActiveFiltersBar";
import RelevanceIndicator from "../components/search/RelevanceIndicator";
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
import { containsNormalized } from "../utils/searchUtils";
import {
  DOCUMENTATION_TEMPLATE,
  EMPTY_DOCUMENT_CONTENT,
} from "../constants/documentationTemplate";

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

  // Estados para filtrado en cascada (Fase 2)
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [resultHistory, setResultHistory] = useState<KnowledgeDocument[][]>([]);
  const [isRefiningSearch, setIsRefiningSearch] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [documentTitle, setDocumentTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [useDocTemplate, setUseDocTemplate] = useState(false);

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
      setUseDocTemplate(false);
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

    // Usar plantilla de documentación si está activado
    const jsonContent = useDocTemplate
      ? DOCUMENTATION_TEMPLATE
      : EMPTY_DOCUMENT_CONTENT;

    createDocumentMutation.mutate({
      title: documentTitle.trim(),
      content: "",
      jsonContent,
      priority: "medium",
      isTemplate: false,
    });
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setDocumentTitle("");
    setIsCreating(false);
    setUseDocTemplate(false);
  };

  // Nueva función para manejar búsqueda inteligente
  const handleSmartSearch = async (term: string, filters?: any) => {
    try {
      setIsAdvancedSearch(true);
      setIsRefiningSearch(false);

      // Siempre buscar el término en todos los campos (título, contenido, tags, casos)
      const result = await knowledgeApi.documents.enhancedSearch({
        search: term,
        documentTypeId: undefined,
      });
      setSearchResults(result.documents);
      setSearchQuery(term);

      // Determinar el tipo de filtro para mostrar el icono correcto
      let filterType: "search" | "tag" | "case" = "search";
      if (filters?.filterType === "tag") {
        filterType = "tag";
      } else if (filters?.filterType === "case") {
        filterType = "case";
      }

      // Inicializar filtros activos con la búsqueda inicial
      setActiveFilters([
        {
          id: `${filterType}-${Date.now()}`,
          term: term,
          type: filterType,
          timestamp: Date.now(),
        },
      ]);
      setResultHistory([]); // Limpiar historial al hacer nueva búsqueda
    } catch (error) {
      showError("Error al realizar la búsqueda");
      console.error("Search error:", error);
    }
  };

  // Función para refinar búsqueda sobre resultados existentes
  const handleRefineSearch = useCallback(
    (newTerm: string) => {
      if (!searchResults || !newTerm.trim()) return;

      // Guardar estado actual en historial
      setResultHistory((prev) => [...prev, searchResults]);

      // Crear mapa de casos para búsqueda eficiente
      const casesMap = new Map(casesData?.map((c) => [c.id, c]) || []);

      // Filtrar resultados actuales usando normalización de acentos
      // Busca en: título, contenido, tags y casos asociados (igual que búsqueda inicial)
      const filtered = searchResults.filter((doc) => {
        // Buscar en título y contenido
        if (
          containsNormalized(doc.title, newTerm) ||
          containsNormalized(doc.content || "", newTerm)
        ) {
          return true;
        }

        // Buscar en tags
        if (doc.tags?.some((tag) => containsNormalized(tag.tagName, newTerm))) {
          return true;
        }

        // Buscar en casos asociados (por ID, buscar info del caso)
        if (doc.associatedCases?.length) {
          return doc.associatedCases.some((caseId) => {
            const caseInfo = casesMap.get(caseId);
            if (caseInfo) {
              return (
                containsNormalized(caseInfo.numeroCaso || "", newTerm) ||
                containsNormalized(caseInfo.descripcion || "", newTerm)
              );
            }
            return false;
          });
        }

        return false;
      });

      setSearchResults(filtered);
      setActiveFilters((prev) => [
        ...prev,
        {
          id: `refine-${Date.now()}`,
          term: newTerm.trim(),
          type: "refine",
          timestamp: Date.now(),
        },
      ]);
      setIsRefiningSearch(true);
    },
    [searchResults, casesData]
  );

  // Función para eliminar un filtro específico
  const handleRemoveFilter = useCallback(
    (filterId: string) => {
      const filterIndex = activeFilters.findIndex((f) => f.id === filterId);

      if (filterIndex === -1) return;

      // Si es el primer filtro (búsqueda original), limpiar todo
      if (filterIndex === 0) {
        clearAdvancedSearch();
        return;
      }

      // Restaurar resultados desde el historial
      const newFilters = activeFilters.slice(0, filterIndex);
      const targetResults = resultHistory[filterIndex - 1] || [];

      setSearchResults(targetResults);
      setActiveFilters(newFilters);
      setResultHistory((prev) => prev.slice(0, filterIndex - 1));

      if (newFilters.length <= 1) {
        setIsRefiningSearch(false);
      }
    },
    [activeFilters, resultHistory]
  );

  // Función para deshacer último filtro
  const handleUndoLastFilter = useCallback(() => {
    if (resultHistory.length === 0 || activeFilters.length <= 1) return;

    const previousResults = resultHistory[resultHistory.length - 1];
    setSearchResults(previousResults);
    setResultHistory((prev) => prev.slice(0, -1));
    setActiveFilters((prev) => prev.slice(0, -1));

    if (resultHistory.length === 1) {
      setIsRefiningSearch(false);
    }
  }, [resultHistory, activeFilters]);

  // Función para manejar selección de documento desde sugerencias
  const handleSelectDocument = (documentId: string) => {
    navigate(`/knowledge/${documentId}`);
  };

  // Función para limpiar búsqueda
  const clearAdvancedSearch = () => {
    setIsAdvancedSearch(false);
    setIsRefiningSearch(false);
    setSearchResults(null);
    setSearchQuery("");
    setActiveFilters([]);
    setResultHistory([]);
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
              onRefineSearch={isAdvancedSearch ? handleRefineSearch : undefined}
              onSelectDocument={handleSelectDocument}
              placeholder={
                isRefiningSearch
                  ? "Refinar búsqueda dentro de los resultados..."
                  : "Buscar documentos, etiquetas, casos..."
              }
              className="w-full"
              isRefining={isRefiningSearch}
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

        {/* Barra de filtros activos */}
        {isAdvancedSearch && activeFilters.length > 0 && (
          <div className="mt-3">
            <ActiveFiltersBar
              filters={activeFilters}
              onRemoveFilter={handleRemoveFilter}
              onUndoLastFilter={handleUndoLastFilter}
              onClearAll={clearAdvancedSearch}
              resultCount={searchResults?.length}
              canUndo={resultHistory.length > 0}
            />
          </div>
        )}

        {/* Tip debajo de la búsqueda avanzada */}
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          {isRefiningSearch ? (
            <>
              🔍 <strong>Modo refinamiento:</strong> Escribe para filtrar dentro
              de los {searchResults?.length || 0} resultados actuales
            </>
          ) : (
            <>
              💡 Tip: Usa la búsqueda inteligente arriba para mejores resultados
              {isAdvancedSearch && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  • Puedes refinar la búsqueda escribiendo más términos
                </span>
              )}
            </>
          )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {documents.map((doc: KnowledgeDocument) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
            >
              <div className="p-4 md:p-5">
                {/* Header: Estado */}
                <div className="flex items-center mb-3">
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

                {/* Título */}
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2">
                  <Link
                    to={`/knowledge/${doc.id}`}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {doc.title}
                  </Link>
                </h3>

                {/* Casos Asociados */}
                {doc.associatedCases && doc.associatedCases.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <ActionIcon
                        action="case"
                        size="xs"
                        color="blue"
                        className="flex-shrink-0"
                      />
                      <span>Caso:</span>
                    </div>
                    {(() => {
                      const associatedCases = getAssociatedCasesInfo(doc);
                      return associatedCases && associatedCases.length > 0 ? (
                        <>
                          {associatedCases.slice(0, 3).map((caso, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                              title={`${caso.numeroCaso}: ${caso.descripcion}`}
                            >
                              {caso.numeroCaso}
                            </span>
                          ))}
                          {doc.associatedCases.length > 3 && (
                            <span className="text-xs text-blue-600 dark:text-blue-400">
                              +{doc.associatedCases.length - 3}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          {doc.associatedCases.length} caso
                          {doc.associatedCases.length !== 1 ? "s" : ""}
                        </span>
                      );
                    })()}
                  </div>
                )}

                {/* Etiquetas */}
                {(() => {
                  const tagInfo = getDisplayTags(doc);
                  return tagInfo.documentTags.length > 0 ? (
                    <div className="flex items-center flex-wrap gap-1.5">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <ActionIcon
                          action="tag"
                          size="xs"
                          color="gray"
                          className="flex-shrink-0"
                        />
                        <span>Tags:</span>
                      </div>
                      {tagInfo.documentTags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: tag.color || "#6b7280" }}
                          title={tag.tagName}
                        >
                          {tag.tagName}
                        </span>
                      ))}
                      {tagInfo.showMore && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{tagInfo.totalDocTags - tagInfo.documentTags.length}
                        </span>
                      )}
                    </div>
                  ) : null;
                })()}

                {/* Footer: Tipo de documento y Autor */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                  {/* Tipo de documento */}
                  <div className="flex items-center gap-1 truncate">
                    <ActionIcon
                      action="folder"
                      size="xs"
                      color="gray"
                      className="flex-shrink-0"
                    />
                    <span className="truncate">
                      {doc.documentType?.name || "Sin tipo"}
                    </span>
                  </div>
                  {/* Autor */}
                  <div className="flex items-center gap-1 truncate">
                    <ActionIcon
                      action="user"
                      size="xs"
                      color="gray"
                      className="flex-shrink-0"
                    />
                    <span
                      className="truncate max-w-[100px]"
                      title={
                        doc.__createdByUser__?.fullName ||
                        doc.__createdByUser__?.email ||
                        "Desconocido"
                      }
                    >
                      {doc.__createdByUser__?.fullName ||
                        doc.__createdByUser__?.email ||
                        "Desconocido"}
                    </span>
                  </div>
                </div>

                {/* Indicador de relevancia (solo en búsqueda) */}
                {isAdvancedSearch && doc.relevanceScore !== undefined && (
                  <RelevanceIndicator
                    score={doc.relevanceScore}
                    matchedWords={doc.matchedWords}
                    totalWords={doc.totalSearchWords}
                    hasExactPhrase={doc.hasExactPhrase}
                    matchLocations={doc.matchLocations}
                  />
                )}
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

                {/* Opción de usar plantilla de documentación */}
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useDocTemplate}
                      onChange={(e) => setUseDocTemplate(e.target.checked)}
                      className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Usar plantilla de documentación
                      </span>
                      <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                        Incluye estructura con las 4 secciones: Descripción del
                        Problema, Diagnóstico, Solución Aplicada y Notas.
                      </p>
                    </div>
                  </label>
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
