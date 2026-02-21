import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ActionIcon } from "../components/ui/ActionIcons";
import {
  usePendingReviewDocuments,
  useApproveDocument,
  useRejectDocument,
} from "../hooks/useKnowledge";
import { KnowledgeDocument, ReviewStatus } from "../types/knowledge";
import { useToast } from "../hooks/useNotification";
import { useFeaturePermissions } from "../hooks/usePermissions";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const KnowledgePendingReview: React.FC = () => {
  const { success, error: showError } = useToast();
  const permissions = useFeaturePermissions();

  // State for modals
  const [selectedDocument, setSelectedDocument] =
    useState<KnowledgeDocument | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approveNotes, setApproveNotes] = useState("");
  const [rejectNotes, setRejectNotes] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Fetch pending documents
  const {
    data: pendingData,
    isLoading,
    error,
    refetch,
  } = usePendingReviewDocuments(page, limit);

  // Mutations
  const approveDocumentMutation = useApproveDocument({
    onSuccess: () => {
      success("Documento aprobado y publicado exitosamente");
      setShowApproveModal(false);
      setApproveNotes("");
      setSelectedDocument(null);
      refetch();
    },
    onError: (error: any) => {
      showError(`Error al aprobar documento: ${error.message}`);
    },
  });

  const rejectDocumentMutation = useRejectDocument({
    onSuccess: () => {
      success("Documento rechazado - El autor ha sido notificado");
      setShowRejectModal(false);
      setRejectNotes("");
      setSelectedDocument(null);
      refetch();
    },
    onError: (error: any) => {
      showError(`Error al rechazar documento: ${error.message}`);
    },
  });

  // Check permissions
  const canApprove = permissions?.canApproveKnowledge;

  if (!canApprove) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ActionIcon
            action="shield"
            className="w-16 h-16 mx-auto text-red-500 mb-4"
          />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No tienes permisos para aprobar documentos de la base de
            conocimiento.
          </p>
          <Link
            to="/knowledge"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
          >
            ← Volver a la Base de Conocimiento
          </Link>
        </div>
      </div>
    );
  }

  const handleApprove = (doc: KnowledgeDocument) => {
    setSelectedDocument(doc);
    setShowApproveModal(true);
  };

  const handleReject = (doc: KnowledgeDocument) => {
    setSelectedDocument(doc);
    setShowRejectModal(true);
  };

  const confirmApprove = () => {
    if (selectedDocument) {
      approveDocumentMutation.mutate({
        documentId: selectedDocument.id,
        notes: approveNotes || undefined,
        autoPublish: true,
      });
    }
  };

  const confirmReject = () => {
    if (selectedDocument && rejectNotes.trim()) {
      rejectDocumentMutation.mutate({
        documentId: selectedDocument.id,
        notes: rejectNotes.trim(),
      });
    }
  };

  const getReviewStatusBadge = (status: ReviewStatus) => {
    const statusConfig: Record<ReviewStatus, { color: string; label: string }> =
      {
        draft: { color: "bg-gray-100 text-gray-800", label: "Borrador" },
        pending_review: {
          color: "bg-yellow-100 text-yellow-800",
          label: "Pendiente",
        },
        approved: { color: "bg-green-100 text-green-800", label: "Aprobado" },
        rejected: { color: "bg-red-100 text-red-800", label: "Rechazado" },
        published: { color: "bg-blue-100 text-blue-800", label: "Publicado" },
      };
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const documents = pendingData?.documents || [];
  const total = pendingData?.total || 0;
  const totalPages = pendingData?.totalPages || 1;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/knowledge"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ActionIcon action="back" className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <ActionIcon
                    action="clipboard"
                    className="w-7 h-7 mr-3 text-yellow-500"
                  />
                  Documentos Pendientes de Revisión
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {total} documento{total !== 1 ? "s" : ""} esperando aprobación
                </p>
              </div>
            </div>
            <button
              onClick={() => refetch()}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <ActionIcon action="restore" className="w-4 h-4 mr-2" />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
            <ActionIcon
              action="warning"
              className="w-8 h-8 mx-auto text-red-500 mb-2"
            />
            <p className="text-red-700 dark:text-red-300">
              Error al cargar documentos pendientes
            </p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <ActionIcon
              action="success"
              className="w-16 h-16 mx-auto text-green-500 mb-4"
            />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              ¡Todo al día!
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              No hay documentos pendientes de revisión en este momento.
            </p>
          </div>
        ) : (
          <>
            {/* Documents List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {documents.map((doc: KnowledgeDocument) => (
                  <li
                    key={doc.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <Link
                            to={`/knowledge/${doc.id}`}
                            className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate"
                          >
                            {doc.title}
                          </Link>
                          {getReviewStatusBadge(
                            doc.reviewStatus || "pending_review",
                          )}
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center">
                            <ActionIcon
                              action="user"
                              className="w-4 h-4 mr-1"
                            />
                            {(doc as any).createdByUser?.firstName || "Usuario"}{" "}
                            {(doc as any).createdByUser?.lastName || ""}
                          </span>
                          <span className="flex items-center">
                            <ActionIcon
                              action="time"
                              className="w-4 h-4 mr-1"
                            />
                            Enviado{" "}
                            {formatDistanceToNow(new Date(doc.updatedAt), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                          {doc.priority && (
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                doc.priority === "urgent"
                                  ? "bg-red-100 text-red-800"
                                  : doc.priority === "high"
                                    ? "bg-orange-100 text-orange-800"
                                    : doc.priority === "medium"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-gray-100 text-gray-800"
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
                          )}
                        </div>

                        {doc.content && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                            {doc.content.substring(0, 200)}
                            {doc.content.length > 200 ? "..." : ""}
                          </p>
                        )}

                        {/* Tags */}
                        {doc.tags && doc.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {doc.tags.slice(0, 5).map((tag, index: number) => (
                              <span
                                key={index}
                                className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                              >
                                {tag.tagName}
                              </span>
                            ))}
                            {doc.tags.length > 5 && (
                              <span className="px-2 py-0.5 text-xs text-gray-500">
                                +{doc.tags.length - 5} más
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        <Link
                          to={`/knowledge/${doc.id}`}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Ver documento"
                        >
                          <ActionIcon action="view" className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleApprove(doc)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Aprobar documento"
                        >
                          <ActionIcon action="success" className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleReject(doc)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Rechazar documento"
                        >
                          <ActionIcon action="error" className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Mostrando {(page - 1) * limit + 1} a{" "}
                  {Math.min(page * limit, total)} de {total} documentos
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedDocument && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowApproveModal(false)}
            />
            <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
              <div className="flex items-center mb-4">
                <ActionIcon
                  action="success"
                  className="w-8 h-8 text-green-500 mr-3"
                />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Aprobar Documento
                </h3>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Estás a punto de aprobar y publicar el documento:
              </p>
              <p className="font-medium text-gray-900 dark:text-white mb-4">
                "{selectedDocument.title}"
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notas de aprobación (opcional)
                </label>
                <textarea
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Agregar comentarios sobre la aprobación..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setApproveNotes("");
                    setSelectedDocument(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmApprove}
                  disabled={approveDocumentMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  {approveDocumentMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Aprobando...
                    </>
                  ) : (
                    <>
                      <ActionIcon action="check" className="w-4 h-4 mr-2" />
                      Aprobar y Publicar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedDocument && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowRejectModal(false)}
            />
            <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
              <div className="flex items-center mb-4">
                <ActionIcon
                  action="error"
                  className="w-8 h-8 text-red-500 mr-3"
                />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Rechazar Documento
                </h3>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Estás a punto de rechazar el documento:
              </p>
              <p className="font-medium text-gray-900 dark:text-white mb-4">
                "{selectedDocument.title}"
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Motivo del rechazo <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                  rows={4}
                  placeholder="Explica al autor los motivos del rechazo y qué debe corregir..."
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Este mensaje será visible para el autor del documento.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectNotes("");
                    setSelectedDocument(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmReject}
                  disabled={
                    rejectDocumentMutation.isPending || !rejectNotes.trim()
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
                >
                  {rejectDocumentMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Rechazando...
                    </>
                  ) : (
                    <>
                      <ActionIcon action="close" className="w-4 h-4 mr-2" />
                      Rechazar Documento
                    </>
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

export default KnowledgePendingReview;
