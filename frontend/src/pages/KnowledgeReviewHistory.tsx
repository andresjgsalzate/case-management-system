import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { ActionIcon } from "../components/ui/ActionIcons";
import {
  useDocumentReviewHistory,
  useKnowledgeDocuments,
  reviewKeys,
} from "../hooks/useKnowledge";
import { KnowledgeDocument } from "../types/knowledge";
import { KnowledgeDocumentReviewService } from "../services/knowledge.service";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const eventTypeLabel: Record<string, string> = {
  SUBMITTED: "Enviado a revisión",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  PUBLISHED: "Publicado",
  UNPUBLISHED: "Despublicado",
  REPUBLISHED: "Republicado",
  RETURNED_TO_DRAFT: "Devuelto a borrador",
};

const statusLabel: Record<string, string> = {
  draft: "Borrador",
  pending_review: "Pendiente de revisión",
  approved: "Aprobado",
  rejected: "Rechazado",
  published: "Publicado",
};

const getReviewStatusBadgeClass = (status?: string) => {
  switch (status) {
    case "pending_review":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
    case "approved":
      return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
    case "rejected":
      return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
    case "published":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

const ReviewLogsPanel: React.FC<{
  document: Pick<KnowledgeDocument, "id" | "title">;
}> = ({ document }) => {
  const { data, isLoading, error } = useDocumentReviewHistory(
    document.id,
    true,
  );

  if (isLoading) {
    return (
      <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700/40 rounded-lg text-sm text-gray-500 dark:text-gray-300">
        Cargando historial de revisión...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-300">
        No fue posible cargar el historial de revisión.
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/40 rounded-lg border border-gray-200 dark:border-gray-600">
      <div className="mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Historial de revisión
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Documento: {document.title}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs mb-4">
        <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          Envíos: {data?.summary.submittedCount || 0}
        </span>
        <span className="px-2 py-1 rounded bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          Rechazos: {data?.summary.rejectedCount || 0}
        </span>
        <span className="px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          Aprobados: {data?.summary.approvedCount || 0}
        </span>
        <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          Publicados: {data?.summary.publishedCount || 0}
        </span>
        <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
          Republicados: {data?.summary.republishedCount || 0}
        </span>
        <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
          Total eventos: {data?.summary.totalEvents || 0}
        </span>
      </div>

      {data?.events?.length ? (
        <ul className="space-y-3">
          {data.events.map((event) => (
            <li
              key={event.id}
              className="p-3 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {eventTypeLabel[event.eventType] || event.eventType}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(event.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </span>
              </div>

              <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Fecha: {new Date(event.createdAt).toLocaleString("es-CO")}
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-300 mt-2">
                {event.fromStatus && event.toStatus ? (
                  <span>
                    Estado: {statusLabel[event.fromStatus] || event.fromStatus}{" "}
                    → {statusLabel[event.toStatus] || event.toStatus}
                  </span>
                ) : (
                  <span>Estado: Sin transición registrada</span>
                )}
                {event.actorUser && (
                  <span>
                    • {event.actorUser.fullName || event.actorUser.email}
                  </span>
                )}
              </div>

              {event.comments && (
                <p className="text-xs text-gray-700 dark:text-gray-200 mt-1">
                  Comentario: {event.comments}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Este documento aún no tiene eventos de revisión registrados.
        </p>
      )}
    </div>
  );
};

const KnowledgeReviewHistory: React.FC = () => {
  const [expandedDocumentIds, setExpandedDocumentIds] = useState<string[]>([]);
  const [titleFilter, setTitleFilter] = useState("");

  const {
    data: documentsData,
    isLoading,
    error,
  } = useKnowledgeDocuments({
    page: 1,
    limit: 100,
    sortBy: "updatedAt",
    sortOrder: "DESC",
  });

  const documents = documentsData?.documents || [];

  const historyQueries = useQueries({
    queries: documents.map((doc) => ({
      queryKey: reviewKeys.history(doc.id),
      queryFn: () => KnowledgeDocumentReviewService.getReviewHistory(doc.id),
      enabled: documents.length > 0,
      staleTime: 30 * 1000,
    })),
  });

  const hasHistoryLoading = historyQueries.some((query) => query.isLoading);
  const documentsWithHistory = documents.filter((_doc, index) => {
    const historyData = historyQueries[index]?.data;
    return (historyData?.summary?.totalEvents || 0) > 0;
  });
  const normalizedFilter = titleFilter.trim().toLowerCase();
  const filteredDocuments = documentsWithHistory.filter((doc) =>
    doc.title.toLowerCase().includes(normalizedFilter),
  );

  const toggleDocument = (documentId: string) => {
    setExpandedDocumentIds((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId],
    );
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-5 lg:p-6">
        <div className="flex items-start sm:items-center space-x-4 mb-4">
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
                className="w-7 h-7 mr-3 text-blue-500"
              />
              Historial de Revisiones
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Consulta el historial de envíos, aprobaciones, rechazos y
              publicaciones.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-4">
            <input
              type="text"
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              placeholder="Filtrar por título..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {isLoading ? (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-lg text-sm text-gray-500 dark:text-gray-300">
              Cargando documentos...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-300">
              No fue posible cargar el listado de documentos.
            </div>
          ) : documents.length === 0 ? (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-lg text-sm text-gray-500 dark:text-gray-300">
              No hay documentos para mostrar.
            </div>
          ) : hasHistoryLoading ? (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-lg text-sm text-gray-500 dark:text-gray-300">
              Cargando historial de documentos...
            </div>
          ) : documentsWithHistory.length === 0 ? (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-lg text-sm text-gray-500 dark:text-gray-300">
              No hay documentos con historial de revisión registrado.
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-lg text-sm text-gray-500 dark:text-gray-300">
              No se encontraron documentos con ese título.
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredDocuments.map((doc) => {
                const isExpanded = expandedDocumentIds.includes(doc.id);
                const reviewStatus = doc.reviewStatus || "draft";

                return (
                  <li
                    key={doc.id}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/20 p-3"
                  >
                    <button
                      onClick={() => toggleDocument(doc.id)}
                      className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {doc.title}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span
                            className={`px-2 py-0.5 rounded ${getReviewStatusBadgeClass(reviewStatus)}`}
                          >
                            {statusLabel[reviewStatus] || reviewStatus}
                          </span>
                          <span>
                            Actualizado{" "}
                            {formatDistanceToNow(new Date(doc.updatedAt), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400 shrink-0">
                        {isExpanded ? "Ocultar" : "Ver historial"}
                      </span>
                    </button>

                    {isExpanded && (
                      <ReviewLogsPanel
                        document={{
                          id: doc.id,
                          title: doc.title,
                        }}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeReviewHistory;
