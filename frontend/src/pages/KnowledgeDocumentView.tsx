import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ActionIcon } from "../components/ui/ActionIcons";
import {
  useKnowledgeDocument,
  useArchiveKnowledgeDocument,
  useDeleteKnowledgeDocument,
  useCreateDocumentFeedback,
  useCheckUserFeedback,
  useCheckFavorite,
  useToggleFavorite,
  useSubmitForReview,
  useApproveDocument,
  useRejectDocument,
  knowledgeKeys,
} from "../hooks/useKnowledge";
import { useFeaturePermissions } from "../hooks/usePermissions";
import { useCases } from "../hooks/useCases";
import { Case } from "../services/api";
import { useQueryClient } from "@tanstack/react-query";
import BlockNoteEditor from "../components/knowledge/BlockNoteEditor";
import AttachmentsList from "../components/AttachmentsList";
import { ConfirmationModal } from "../components/ui/ConfirmationModal";
import { useToast } from "../hooks/useNotification";
import { securityService } from "../services/security.service";
import type { KnowledgeDocumentPDF } from "../types/pdf";

const KnowledgeDocumentView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Ref para el contenedor principal
  const viewContainerRef = useRef<HTMLDivElement>(null);

  // Modal states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [approveNotes, setApproveNotes] = useState("");

  // Permisos y autenticación
  const permissions = useFeaturePermissions();

  // Notificaciones
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  // Queries and mutations
  const {
    data: document,
    isLoading,
    error,
    refetch,
  } = useKnowledgeDocument(id || "");
  const archiveMutation = useArchiveKnowledgeDocument();
  const deleteMutation = useDeleteKnowledgeDocument();
  const feedbackMutation = useCreateDocumentFeedback();

  // Favorite hooks
  const { data: favoriteData } = useCheckFavorite(id || "");
  const toggleFavoriteMutation = useToggleFavorite({
    onSuccess: (data) => {
      success(
        data.isFavorite ? "Añadido a favoritos" : "Eliminado de favoritos",
      );
    },
    onError: (error: any) => {
      showError(`Error al actualizar favoritos: ${error.message}`);
    },
  });

  // Review hooks
  const submitForReviewMutation = useSubmitForReview({
    onSuccess: () => {
      success("Documento enviado a revisión");
    },
    onError: (error: any) => {
      showError(`Error al enviar a revisión: ${error.message}`);
    },
  });

  const approveDocumentMutation = useApproveDocument({
    onSuccess: () => {
      success("Documento aprobado y publicado");
      setShowReviewModal(false);
      setApproveNotes("");
    },
    onError: (error: any) => {
      showError(`Error al aprobar documento: ${error.message}`);
    },
  });

  const rejectDocumentMutation = useRejectDocument({
    onSuccess: () => {
      success("Documento rechazado");
      setShowRejectModal(false);
      setRejectNotes("");
    },
    onError: (error: any) => {
      showError(`Error al rechazar documento: ${error.message}`);
    },
  });

  // Check if user has already provided feedback
  const { data: feedbackCheck } = useCheckUserFeedback(id || "");

  // Get cases for displaying case numbers
  const { data: casesData } = useCases();

  // Force fresh data when viewing document
  React.useEffect(() => {
    if (id) {
      // Invalidate specific document cache to force fresh data
      queryClient.invalidateQueries({
        queryKey: knowledgeKeys.document(id),
      });
      // Also refetch immediately
      refetch();
    }
  }, [id, refetch, queryClient]);

  // ✅ TRACKING DE ACTIVIDAD: Detectar interacción del usuario mientras lee el documento
  // Esto mantiene la sesión activa mientras el usuario está leyendo
  useEffect(() => {
    const container = viewContainerRef.current;
    if (!container) return;

    // Throttle para evitar demasiadas llamadas
    let lastActivityTime = 0;
    const THROTTLE_MS = 3000; // Notificar máximo cada 3 segundos

    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastActivityTime >= THROTTLE_MS) {
        lastActivityTime = now;
        securityService.notifyActivity();
      }
    };

    // Eventos a monitorear
    const events: (keyof HTMLElementEventMap)[] = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    // Añadir listeners
    events.forEach((event) => {
      container.addEventListener(event, handleUserActivity, {
        capture: true,
        passive: true,
      });
    });

    // Cleanup
    return () => {
      events.forEach((event) => {
        container.removeEventListener(event, handleUserActivity, {
          capture: true,
        });
      });
    };
  }, [viewContainerRef.current]);

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

  // Get review status info
  const getReviewStatusInfo = (reviewStatus?: string) => {
    switch (reviewStatus) {
      case "pending_review":
        return {
          text: "En Revisión",
          color:
            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
          icon: "🔍",
        };
      case "approved":
        return {
          text: "Aprobado",
          color:
            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
          icon: "✓",
        };
      case "rejected":
        return {
          text: "Rechazado",
          color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
          icon: "✗",
        };
      case "published":
        return {
          text: "Publicado",
          color:
            "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
          icon: "📢",
        };
      case "draft":
      default:
        return null; // Don't show badge for draft (it's the default)
    }
  };

  // Helper para obtener información de casos asociados
  const getAssociatedCasesInfo = () => {
    if (!document?.associatedCases || !casesData) return [];

    const associatedCases = casesData.filter((caso: Case) =>
      document.associatedCases?.includes(caso.id),
    );

    return associatedCases;
  };

  // Handle actions
  const handleToggleFavorite = () => {
    if (id) {
      toggleFavoriteMutation.mutate(id);
    }
  };

  const handleSubmitForReview = () => {
    if (id) {
      submitForReviewMutation.mutate(id);
    }
  };

  const handleApproveDocument = () => {
    if (id) {
      approveDocumentMutation.mutate({
        documentId: id,
        notes: approveNotes || undefined,
        autoPublish: true,
      });
    }
  };

  const handleRejectDocument = () => {
    if (id && rejectNotes.trim()) {
      rejectDocumentMutation.mutate({
        documentId: id,
        notes: rejectNotes.trim(),
      });
    }
  };

  const handleArchive = () => {
    setShowArchiveConfirm(true);
  };

  const confirmArchive = () => {
    if (document) {
      archiveMutation.mutate(
        {
          id: document.id,
          isArchived: true,
          reason: "Archivado por el usuario",
        },
        {
          onSuccess: () => {
            success("Documento archivado exitosamente");
          },
          onError: (error: any) => {
            showError(`Error al archivar documento: ${error.message}`);
          },
        },
      );
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (document) {
      deleteMutation.mutate(document.id, {
        onSuccess: () => {
          success("Documento eliminado exitosamente");
          navigate("/knowledge");
        },
        onError: (error: any) => {
          showError(`Error al eliminar documento: ${error.message}`);
        },
      });
    }
  };

  const handleUnarchive = () => {
    if (document) {
      archiveMutation.mutate(
        {
          id: document.id,
          isArchived: false,
          reason: "Documento restaurado",
        },
        {
          onSuccess: () => {
            success("Documento restaurado exitosamente");
          },
          onError: (error: any) => {
            showError(`Error al restaurar documento: ${error.message}`);
          },
        },
      );
    }
  };

  const handleFeedback = (isHelpful: boolean) => {
    // Check if user has already provided feedback
    if (feedbackCheck?.hasFeedback) {
      showError(
        "Ya has proporcionado feedback para este documento. Solo se permite un feedback por documento.",
      );
      return;
    }

    if (document) {
      const feedbackData = {
        documentId: document.id,
        isHelpful,
      };
      feedbackMutation.mutate(feedbackData, {
        onSuccess: () => {
          success("Feedback enviado exitosamente");
          // Invalidate the feedback check query to update the UI
          queryClient.invalidateQueries({
            queryKey: ["feedback", "check", document.id],
          });
        },
        onError: (error: any) => {
          // Handle specific error when feedback already exists
          if (
            error.response?.status === 400 &&
            error.response?.data?.message?.includes(
              "Ya has proporcionado feedback",
            )
          ) {
            showError(
              "Ya has proporcionado feedback para este documento. Solo se permite un feedback por documento.",
            );
          } else {
            showError(
              `Error al enviar feedback: ${
                error.message || "Error desconocido"
              }`,
            );
          }
        },
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

  // Función para convertir documento al formato PDF
  const convertToPDFFormat = (doc: any): KnowledgeDocumentPDF => {
    // Usar las propiedades correctas que envía el backend
    const documentType = doc.__documentType__ || doc.documentType;
    const createdByUser = doc.__createdByUser__ || doc.createdByUser;

    // Obtener los números de casos asociados
    const associatedCasesNumbers =
      doc.associatedCases && casesData
        ? casesData
            .filter((caso: Case) => doc.associatedCases.includes(caso.id))
            .map((caso: Case) => caso.numeroCaso)
        : undefined;

    return {
      id: doc.id,
      title: doc.title || "Documento Sin Título",
      content: doc.jsonContent || [],
      document_type: documentType
        ? {
            name: documentType.name,
            code: documentType.code || documentType.name.toLowerCase(),
          }
        : undefined,
      priority: doc.priority,
      difficulty_level: doc.difficultyLevel,
      is_published: doc.isPublished,
      view_count: doc.viewCount,
      version: doc.version || 1,
      associated_cases: associatedCasesNumbers,
      tags:
        doc.tags?.map((tag: any) => ({
          id: tag.id || `tag-${Math.random()}`,
          tag_name: tag.tagName || tag.name || tag.tag_name,
          color: tag.color || "#6B7280",
        })) || [],
      attachments:
        doc.attachments?.map((attachment: any) => ({
          id: attachment.id,
          file_name:
            attachment.fileName || attachment.file_name || attachment.name,
          file_path:
            attachment.filePath || attachment.file_path || attachment.path,
          file_type: attachment.fileType || attachment.file_type || "document",
          mime_type:
            attachment.mimeType ||
            attachment.mime_type ||
            "application/octet-stream",
          file_size:
            attachment.fileSize || attachment.file_size || attachment.size || 0,
          is_embedded: attachment.isEmbedded || attachment.is_embedded || false,
          created_at:
            attachment.createdAt ||
            attachment.created_at ||
            new Date().toISOString(),
        })) || [],
      created_at: doc.createdAt,
      updated_at: doc.updatedAt,
      createdByUser: createdByUser
        ? {
            fullName: createdByUser.fullName,
            email: createdByUser.email,
          }
        : undefined,
    };
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
            <ActionIcon action="back" size="sm" color="gray" />
            Volver a Base de Conocimiento
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(document);

  return (
    <div
      ref={viewContainerRef}
      className="max-w-full mx-auto px-6 sm:px-8 lg:px-12 py-6"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/knowledge")}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
          >
            <ActionIcon action="back" size="sm" color="gray" />
          </button>

          <div className="flex items-center space-x-2">
            {/* View Count */}
            <div className="flex items-center text-sm text-gray-500">
              <ActionIcon action="view" size="sm" color="gray" />
              {document.viewCount} visualizaciones
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 border-l border-gray-200 pl-4 ml-4">
              <button
                onClick={handleToggleFavorite}
                disabled={toggleFavoriteMutation.isPending}
                className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${
                  favoriteData?.isFavorite
                    ? "text-yellow-500 hover:text-yellow-600"
                    : "text-gray-400 hover:text-yellow-500"
                }`}
                title={
                  favoriteData?.isFavorite
                    ? "Quitar de favoritos"
                    : "Agregar a favoritos"
                }
              >
                {favoriteData?.isFavorite ? (
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                )}
              </button>
              {favoriteData?.favoriteCount !== undefined &&
                favoriteData.favoriteCount > 0 && (
                  <span className="text-xs text-gray-500">
                    {favoriteData.favoriteCount}
                  </span>
                )}

              {/* Review Workflow Actions */}
              {!document.isPublished &&
                !document.isArchived &&
                (document as any).reviewStatus !== "pending_review" && (
                  <button
                    onClick={handleSubmitForReview}
                    disabled={submitForReviewMutation.isPending}
                    className="p-2 text-gray-400 hover:text-purple-600 rounded-md hover:bg-gray-100"
                    title="Enviar a revisión"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                  </button>
                )}

              {/* Approve/Reject buttons for reviewers */}
              {(document as any).reviewStatus === "pending_review" &&
                permissions.canApproveKnowledge && (
                  <>
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="p-2 text-gray-400 hover:text-green-600 rounded-md hover:bg-gray-100"
                      title="Aprobar documento"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-gray-100"
                      title="Rechazar documento"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </>
                )}

              {permissions.canDuplicateKnowledge && (
                <button
                  onClick={handleDuplicate}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                  title="Duplicar documento"
                >
                  <ActionIcon action="duplicate" size="sm" color="gray" />
                </button>
              )}

              {/* Botón Exportar PDF */}
              {permissions.canExportKnowledge && (
                <button
                  onClick={() => {
                    const pdfDocument = convertToPDFFormat(document);
                    // Aquí llamaremos directamente al servicio de PDF
                    import("../services/pdfExportService").then(
                      ({ downloadPDF }) => {
                        downloadPDF(pdfDocument, {
                          fileName: `${document.title || "documento"}.pdf`,
                        });
                      },
                    );
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-gray-100"
                  title="Exportar a PDF"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </button>
              )}

              {permissions.canEditKnowledge && (
                <Link
                  to={`/knowledge/${document.id}/edit`}
                  className="p-2 text-gray-400 hover:text-blue-600 rounded-md hover:bg-gray-100"
                  title="Editar documento"
                >
                  <ActionIcon action="edit" size="sm" color="blue" />
                </Link>
              )}

              {permissions.canArchiveKnowledge &&
                (!document.isArchived ? (
                  <button
                    onClick={handleArchive}
                    className="p-2 text-gray-400 hover:text-orange-600 rounded-md hover:bg-gray-100"
                    title="Archivar documento"
                  >
                    <ActionIcon action="archive" size="sm" color="orange" />
                  </button>
                ) : (
                  <button
                    onClick={handleUnarchive}
                    className="p-2 text-gray-400 hover:text-green-600 rounded-md hover:bg-gray-100"
                    title="Restaurar documento"
                  >
                    <ActionIcon action="archive" size="sm" color="green" />
                  </button>
                ))}

              {permissions.canDeleteKnowledge && (
                <button
                  onClick={handleDelete}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Eliminar documento permanentemente"
                >
                  <ActionIcon action="delete" size="sm" color="red" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Title and Status */}
        <div className="mb-4">
          <div className="flex items-start justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex-1 mr-4">
              {document.title}
            </h1>
            <div className="flex items-center gap-2">
              {/* Review Status Badge */}
              {getReviewStatusInfo(document.reviewStatus) && (
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getReviewStatusInfo(document.reviewStatus)?.color}`}
                >
                  {getReviewStatusInfo(document.reviewStatus)?.icon}
                  {getReviewStatusInfo(document.reviewStatus)?.text}
                </span>
              )}
              {/* Publication Status Badge */}
              <span
                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}
              >
                {statusInfo.text}
              </span>
            </div>
          </div>

          {/* Review Notes (if rejected) */}
          {document.reviewStatus === "rejected" && document.reviewNotes && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-red-500 dark:text-red-400 mt-0.5">
                  ⚠️
                </span>
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Motivo del rechazo:
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {document.reviewNotes}
                  </p>
                  {document.reviewedAt && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                      Rechazado el {formatDate(document.reviewedAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
          {document.__documentType__ && (
            <div className="flex items-center">
              <ActionIcon action="folder" size="sm" color="gray" />
              {document.__documentType__.name}
            </div>
          )}

          <div className="flex items-center">
            <ActionIcon action="user" size="sm" color="gray" />
            Creado por{" "}
            {document.__createdByUser__?.fullName ||
              document.__createdByUser__?.email ||
              "Usuario desconocido"}
          </div>

          <div className="flex items-center">
            <ActionIcon action="time" size="sm" color="gray" />
            Actualizado {formatDate(document.updatedAt)}
          </div>

          {document.tags && document.tags.length > 0 && (
            <div className="flex items-center">
              <ActionIcon action="tag" size="sm" color="gray" />
              <div className="flex flex-wrap gap-1">
                {document.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: tag.color || "#6b7280" }}
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
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

              {/* Associated Cases */}
              {document.associatedCases &&
                document.associatedCases.length > 0 && (
                  <div className="flex items-center">
                    <span className="font-medium">Casos Asociados:</span>
                    <div className="ml-2 flex flex-wrap gap-1">
                      {(() => {
                        const associatedCases = getAssociatedCasesInfo();
                        return associatedCases.length > 0 ? (
                          associatedCases.map((caso, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                              title={`${caso.numeroCaso}: ${caso.descripcion}`}
                            >
                              {caso.numeroCaso}
                            </span>
                          ))
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            {document.associatedCases.length} caso
                            {document.associatedCases.length !== 1
                              ? "s"
                              : ""}{" "}
                            (cargando...)
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                )}

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
          {document.jsonContent &&
          Array.isArray(document.jsonContent) &&
          document.jsonContent.length > 0 ? (
            <div className="w-full max-w-none">
              <BlockNoteEditor
                content={document.jsonContent}
                editable={false}
                className="prose prose-lg max-w-none w-full"
              />
            </div>
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
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          ¿Te resultó útil este documento?
        </h3>

        <div className="flex items-center space-x-4 mb-4">
          {feedbackCheck?.hasFeedback ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-md">
                {feedbackCheck.feedback?.isHelpful ? (
                  <>
                    <ActionIcon action="thumbUp" size="sm" color="green" />
                    Tu feedback: Útil
                  </>
                ) : (
                  <>
                    <ActionIcon action="thumbDown" size="sm" color="red" />
                    Tu feedback: No útil
                  </>
                )}
              </div>
              <span className="text-sm text-gray-500">
                Ya has proporcionado feedback para este documento
              </span>
            </div>
          ) : (
            <>
              <button
                onClick={() => handleFeedback(true)}
                disabled={feedbackMutation.isPending}
                className="flex items-center px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ActionIcon action="thumbUp" size="sm" color="gray" />
                Sí, útil ({document.helpfulCount})
              </button>

              <button
                onClick={() => handleFeedback(false)}
                disabled={feedbackMutation.isPending}
                className="flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ActionIcon action="thumbDown" size="sm" color="gray" />
                No, no útil ({document.notHelpfulCount})
              </button>
            </>
          )}
        </div>

        <div className="text-sm text-gray-600">
          {document.helpfulCount + document.notHelpfulCount > 0 && (
            <p>
              {Math.round(
                (document.helpfulCount /
                  (document.helpfulCount + document.notHelpfulCount)) *
                  100,
              )}
              % de las personas encontraron este documento útil
            </p>
          )}
        </div>
      </div>

      {/* Archivos adjuntos */}
      {id && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <ActionIcon action="attachment" size="sm" color="gray" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Archivos adjuntos
              </h3>
            </div>
            <AttachmentsList documentId={id} className="" readOnly={true} />
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Eliminar Documento"
        message="¿Estás seguro de que quieres ELIMINAR PERMANENTEMENTE este documento? Esta acción no se puede deshacer. Si solo quieres ocultarlo temporalmente, considera usar la opción 'Archivar' en su lugar."
        confirmText="Eliminar Permanentemente"
        cancelText="Cancelar"
        type="danger"
      />

      <ConfirmationModal
        isOpen={showArchiveConfirm}
        onClose={() => setShowArchiveConfirm(false)}
        onConfirm={confirmArchive}
        title="Archivar Documento"
        message="¿Estás seguro de que quieres archivar este documento? El documento será movido al archivo y no aparecerá en las búsquedas, pero podrás restaurarlo más tarde."
        confirmText="Archivar"
        cancelText="Cancelar"
        type="danger"
      />

      {/* Approve Document Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800 dark:border-gray-600">
            <div className="mt-3">
              <div className="flex items-center justify-between pb-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Aprobar Documento
                </h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="py-3">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Al aprobar este documento, será publicado automáticamente y
                  estará disponible para todos los usuarios.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Notas de aprobación (opcional)
                  </label>
                  <textarea
                    value={approveNotes}
                    onChange={(e) => setApproveNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-400 dark:focus:border-green-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Notas para el autor del documento..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-gray-200 dark:border-gray-600 space-x-3">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApproveDocument}
                  disabled={approveDocumentMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm disabled:opacity-50"
                >
                  {approveDocumentMutation.isPending
                    ? "Aprobando..."
                    : "Aprobar y Publicar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Document Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800 dark:border-gray-600">
            <div className="mt-3">
              <div className="flex items-center justify-between pb-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Rechazar Documento
                </h3>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="py-3">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Por favor, indica el motivo del rechazo para que el autor
                  pueda mejorar el documento.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Motivo del rechazo *
                  </label>
                  <textarea
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-400 dark:focus:border-red-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Explica qué debe mejorarse o corregirse..."
                    rows={4}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-gray-200 dark:border-gray-600 space-x-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRejectDocument}
                  disabled={
                    rejectDocumentMutation.isPending || !rejectNotes.trim()
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm disabled:opacity-50"
                >
                  {rejectDocumentMutation.isPending
                    ? "Rechazando..."
                    : "Rechazar Documento"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeDocumentView;
