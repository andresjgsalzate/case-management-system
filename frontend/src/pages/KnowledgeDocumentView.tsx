import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  PencilIcon,
  EyeIcon,
  TagIcon,
  FolderIcon,
  ClockIcon,
  UserIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  StarIcon,
  ArchiveBoxIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import {
  useKnowledgeDocument,
  useArchiveKnowledgeDocument,
  useCreateDocumentFeedback,
} from "../hooks/useKnowledge";
import BlockNoteEditor from "../components/knowledge/BlockNoteEditor";

const KnowledgeDocumentView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Queries and mutations
  const { data: document, isLoading, error } = useKnowledgeDocument(id || "");
  const archiveMutation = useArchiveKnowledgeDocument();
  const feedbackMutation = useCreateDocumentFeedback();

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status info
  const getStatusInfo = (doc: any) => {
    if (doc.isArchived) {
      return { text: "Archivado", color: "bg-gray-100 text-gray-800" };
    }
    if (doc.isDeprecated) {
      return { text: "Obsoleto", color: "bg-red-100 text-red-800" };
    }
    if (doc.isPublished) {
      return { text: "Publicado", color: "bg-green-100 text-green-800" };
    }
    return { text: "Borrador", color: "bg-yellow-100 text-yellow-800" };
  };

  // Handle actions
  const handleToggleFavorite = () => {
    // TODO: Implement favorite functionality
    console.log("Toggle favorite not implemented yet");
  };

  const handleArchive = () => {
    if (
      document &&
      confirm("¿Estás seguro de que quieres archivar este documento?")
    ) {
      archiveMutation.mutate({
        id: document.id,
        isArchived: true,
        reason: "Archivado por el usuario",
      });
    }
  };

  const handleFeedback = (isHelpful: boolean) => {
    if (document) {
      feedbackMutation.mutate({
        documentId: document.id,
        isHelpful,
      });
    }
  };

  const handleDuplicate = () => {
    if (document) {
      // Navigate to create form with document data
      navigate("/knowledge/new", {
        state: {
          template: {
            title: `Copia de ${document.title}`,
            content: document.content,
            jsonContent: document.jsonContent,
            documentTypeId: document.documentTypeId,
            priority: document.priority,
            difficultyLevel: document.difficultyLevel,
            tags: document.tags?.map((tag) => tag.tagName) || [],
          },
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            {error ? `Error: ${error.message}` : "Documento no encontrado"}
          </div>
          <Link
            to="/knowledge"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Volver a Base de Conocimiento
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(document);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/knowledge")}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-2">
            {/* View Count */}
            <div className="flex items-center text-sm text-gray-500">
              <EyeIcon className="h-4 w-4 mr-1" />
              {document.viewCount} visualizaciones
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 border-l border-gray-200 pl-4 ml-4">
              <button
                onClick={handleToggleFavorite}
                className="p-2 text-gray-400 hover:text-yellow-500 rounded-md hover:bg-gray-100"
                title="Agregar a favoritos"
              >
                <StarIcon className="h-5 w-5" />
              </button>

              <button
                onClick={handleDuplicate}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                title="Duplicar documento"
              >
                <DocumentDuplicateIcon className="h-5 w-5" />
              </button>

              <Link
                to={`/knowledge/${document.id}/edit`}
                className="p-2 text-gray-400 hover:text-blue-600 rounded-md hover:bg-gray-100"
                title="Editar documento"
              >
                <PencilIcon className="h-5 w-5" />
              </Link>

              {!document.isArchived && (
                <button
                  onClick={handleArchive}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-gray-100"
                  title="Archivar documento"
                >
                  <ArchiveBoxIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Title and Status */}
        <div className="mb-4">
          <div className="flex items-start justify-between">
            <h1 className="text-3xl font-bold text-gray-900 flex-1 mr-4">
              {document.title}
            </h1>
            <span
              className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}
            >
              {statusInfo.text}
            </span>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
          {document.documentType && (
            <div className="flex items-center">
              <FolderIcon className="h-4 w-4 mr-1" />
              {document.documentType.name}
            </div>
          )}

          <div className="flex items-center">
            <UserIcon className="h-4 w-4 mr-1" />
            Creado por Usuario
          </div>

          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-1" />
            Actualizado {formatDate(document.updatedAt)}
          </div>

          {document.tags && document.tags.length > 0 && (
            <div className="flex items-center">
              <TagIcon className="h-4 w-4 mr-1" />
              <div className="flex flex-wrap gap-1">
                {document.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                  >
                    {tag.tagName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Document Info Bar */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div>
                <span className="font-medium">Prioridad:</span>
                <span
                  className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    document.priority === "urgent"
                      ? "bg-red-100 text-red-800"
                      : document.priority === "high"
                      ? "bg-orange-100 text-orange-800"
                      : document.priority === "medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {document.priority === "urgent"
                    ? "Urgente"
                    : document.priority === "high"
                    ? "Alta"
                    : document.priority === "medium"
                    ? "Media"
                    : "Baja"}
                </span>
              </div>

              <div>
                <span className="font-medium">Dificultad:</span>
                <span className="ml-2">
                  {"⭐".repeat(document.difficultyLevel)}
                </span>
              </div>

              {document.isTemplate && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  Plantilla
                </span>
              )}
            </div>

            <div className="text-xs text-gray-500">
              Versión {document.version}
            </div>
          </div>
        </div>

        {/* Document Content */}
        <div className="p-6">
          {document.jsonContent ? (
            <BlockNoteEditor
              content={document.jsonContent}
              editable={false}
              className="prose prose-lg max-w-none"
            />
          ) : document.content ? (
            <div className="prose prose-lg max-w-none">
              <p>{document.content}</p>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              Este documento no tiene contenido.
            </div>
          )}
        </div>
      </div>

      {/* Feedback Section */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ¿Te resultó útil este documento?
        </h3>

        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => handleFeedback(true)}
            disabled={feedbackMutation.isPending}
            className="flex items-center px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
          >
            <HandThumbUpIcon className="h-5 w-5 mr-2" />
            Sí, útil ({document.helpfulCount})
          </button>

          <button
            onClick={() => handleFeedback(false)}
            disabled={feedbackMutation.isPending}
            className="flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
          >
            <HandThumbDownIcon className="h-5 w-5 mr-2" />
            No, no útil ({document.notHelpfulCount})
          </button>
        </div>

        <div className="text-sm text-gray-600">
          {document.helpfulCount + document.notHelpfulCount > 0 && (
            <p>
              {Math.round(
                (document.helpfulCount /
                  (document.helpfulCount + document.notHelpfulCount)) *
                  100
              )}
              % de las personas encontraron este documento útil
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeDocumentView;
