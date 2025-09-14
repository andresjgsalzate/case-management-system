import { useState, useEffect } from "react";
import { useToast } from "../../../hooks/useNotification";
import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";
import { ActionIcon } from "../../ui/ActionIcons";
import { DocumentTypeService } from "../../../services/knowledge.service";
import type { DocumentType, DocumentTypeStats } from "../../../types/knowledge";

interface DocumentTypeDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  documentType: DocumentType | null;
}

export default function DocumentTypeDeleteModal({
  isOpen,
  onClose,
  onSuccess,
  documentType,
}: DocumentTypeDeleteModalProps) {
  const { success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [updatedDocumentType, setUpdatedDocumentType] =
    useState<DocumentType | null>(null);
  const [stats, setStats] = useState<DocumentTypeStats | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Cargar datos actualizados del tipo de documento cuando se abre el modal
  useEffect(() => {
    const loadDocumentTypeData = async () => {
      if (!isOpen || !documentType?.id) {
        setUpdatedDocumentType(null);
        setStats(null);
        return;
      }

      setIsLoadingData(true);
      try {
        // Cargar datos actualizados del tipo de documento
        const docTypeResponse = await DocumentTypeService.findOne(
          documentType.id
        );
        setUpdatedDocumentType(docTypeResponse);

        // Cargar estadísticas de uso
        const statsResponse = await DocumentTypeService.getStats(
          documentType.id
        );
        setStats(statsResponse);
      } catch (error) {
        console.error("Error loading document type data:", error);
        setUpdatedDocumentType(documentType); // Fallback al tipo original si hay error
        setStats(null);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadDocumentTypeData();
  }, [isOpen, documentType]);

  const handleConfirm = async () => {
    if (!documentType) return;

    setIsLoading(true);
    try {
      await DocumentTypeService.remove(documentType.id);
      success("Tipo de documento eliminado exitosamente");
      onClose();
      onSuccess();
    } catch (error: any) {
      console.error("Error deleting document type:", error);
      showError(error.message || "Error al eliminar el tipo de documento");
    } finally {
      setIsLoading(false);
    }
  };

  if (!documentType) return null;

  // Usar el tipo de documento actualizado si está disponible, sino usar el original
  const displayDocumentType = updatedDocumentType || documentType;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Eliminar Tipo de Documento">
      <div className="space-y-6">
        {/* Warning Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full">
          <ActionIcon action="warning" size="md" color="red" />
        </div>

        {/* Confirmation Message */}
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            ¿Estás seguro de eliminar este tipo de documento?
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Esta acción no se puede deshacer.
          </p>
        </div>

        {/* Document Type Information */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Información del tipo de documento:
          </h4>

          {isLoadingData ? (
            <div className="flex items-center justify-center py-4">
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
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                Cargando información...
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Información básica */}
              <div className="flex items-center space-x-2">
                {displayDocumentType.icon && (
                  <span className="text-lg">{displayDocumentType.icon}</span>
                )}
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: displayDocumentType.color }}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {displayDocumentType.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({displayDocumentType.code})
                </span>
                {!displayDocumentType.isActive && (
                  <span className="px-2 py-1 rounded-full text-xs bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200">
                    Inactivo
                  </span>
                )}
              </div>

              {/* Description */}
              {displayDocumentType.description && (
                <div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Descripción:{" "}
                  </span>
                  <span className="text-xs text-gray-900 dark:text-white">
                    {displayDocumentType.description}
                  </span>
                </div>
              )}

              {/* Usage Statistics */}
              {stats && (
                <div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Documentos asociados:{" "}
                  </span>
                  <span className="text-xs text-gray-900 dark:text-white font-medium">
                    {stats.totalDocuments} total
                    {stats.totalDocuments > 0 && (
                      <>
                        {" "}
                        ({stats.publishedDocuments} publicados,{" "}
                        {stats.archivedDocuments} archivados
                        {stats.templateDocuments > 0 &&
                          `, ${stats.templateDocuments} plantillas`}
                        )
                      </>
                    )}
                  </span>
                </div>
              )}

              {/* Creation Date */}
              <div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Creado:{" "}
                </span>
                <span className="text-xs text-gray-900 dark:text-white">
                  {new Date(displayDocumentType.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Display Order */}
              <div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Orden de visualización:{" "}
                </span>
                <span className="text-xs text-gray-900 dark:text-white">
                  {displayDocumentType.displayOrder}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Warning Message */}
        {!isLoadingData && stats && stats.totalDocuments > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-4">
            <div className="flex">
              <ActionIcon action="warning" size="sm" color="yellow" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Advertencia
                </h4>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  Este tipo de documento está siendo utilizado por{" "}
                  <strong>{stats.totalDocuments}</strong>
                  {stats.totalDocuments === 1 ? " documento" : " documentos"}.
                  Al eliminarlo, estos documentos quedarán sin tipo de documento
                  asignado.
                </p>
                {stats.publishedDocuments > 0 && (
                  <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                    <strong>Nota:</strong> Hay {stats.publishedDocuments}{" "}
                    documentos publicados que usan este tipo.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Success Message for safe deletion */}
        {!isLoadingData && stats && stats.totalDocuments === 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md p-4">
            <div className="flex">
              <svg
                className="h-5 w-5 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Eliminación segura
                </h4>
                <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                  Este tipo de documento no tiene documentos asociados y puede
                  eliminarse de forma segura.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex items-center"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                Eliminando...
              </>
            ) : (
              "Eliminar Tipo de Documento"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
