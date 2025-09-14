import { useState, useEffect } from "react";
import { ActionIcon } from "../../ui/ActionIcons";
import { useToast } from "../../../contexts/ToastContext";
import { tagService } from "../../../services/tagService";
import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";
import type { Tag } from "../../../types/tag";
import { TAG_CATEGORIES } from "../../../types/tag";

interface TagDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tag: Tag | null;
}

export default function TagDeleteModal({
  isOpen,
  onClose,
  onSuccess,
  tag,
}: TagDeleteModalProps) {
  const { success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [updatedTag, setUpdatedTag] = useState<Tag | null>(null);
  const [isLoadingTagData, setIsLoadingTagData] = useState(false);

  // Cargar datos actualizados de la etiqueta cuando se abre el modal
  useEffect(() => {
    const loadTagData = async () => {
      if (!isOpen || !tag?.id) {
        setUpdatedTag(null);
        return;
      }

      setIsLoadingTagData(true);
      try {
        const response = await tagService.getTagById(tag.id);
        if (response.success && response.data) {
          setUpdatedTag(response.data);
        } else {
          setUpdatedTag(tag); // Fallback al tag original si hay error
        }
      } catch (error) {
        console.error("Error loading tag data:", error);
        setUpdatedTag(tag); // Fallback al tag original si hay error
      } finally {
        setIsLoadingTagData(false);
      }
    };

    loadTagData();
  }, [isOpen, tag]);

  const handleConfirm = async () => {
    if (!tag) return;

    setIsLoading(true);
    try {
      await tagService.deleteTag(tag.id);
      success("Etiqueta eliminada exitosamente");
      onClose();
      onSuccess();
    } catch (error: any) {
      console.error("Error deleting tag:", error);
      showError(error.message || "Error al eliminar la etiqueta");
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryInfo = (category: string) => {
    return (
      TAG_CATEGORIES.find((cat) => cat.value === category) || TAG_CATEGORIES[5]
    ); // default to custom
  };

  if (!tag) return null;

  // Usar la etiqueta actualizada si está disponible, sino usar la original
  const displayTag = updatedTag || tag;
  const categoryInfo = getCategoryInfo(displayTag.category);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Eliminar Etiqueta">
      <div className="space-y-6">
        {/* Warning Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full">
          <ActionIcon
            action="warning"
            size="md"
            color="danger"
            aria-hidden="true"
          />
        </div>

        {/* Confirmation Message */}
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            ¿Estás seguro de eliminar esta etiqueta?
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Esta acción no se puede deshacer.
          </p>
        </div>

        {/* Tag Information */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Información de la etiqueta:
          </h4>

          {isLoadingTagData ? (
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
            <div className="space-y-2">
              {/* Tag Preview */}
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: displayTag.color }}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {displayTag.tagName}
                </span>
                <span
                  className="px-2 py-1 rounded-full text-xs text-white"
                  style={{ backgroundColor: categoryInfo.color }}
                >
                  {categoryInfo.label}
                </span>
                {!displayTag.isActive && (
                  <span className="px-2 py-1 rounded-full text-xs bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200">
                    Inactiva
                  </span>
                )}
              </div>

              {/* Description */}
              {displayTag.description && (
                <div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Descripción:{" "}
                  </span>
                  <span className="text-xs text-gray-900 dark:text-white">
                    {displayTag.description}
                  </span>
                </div>
              )}

              {/* Usage Count */}
              <div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Uso actual:{" "}
                </span>
                <span className="text-xs text-gray-900 dark:text-white font-medium">
                  {displayTag.usageCount} documento
                  {displayTag.usageCount !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Creation Date */}
              <div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Creada:{" "}
                </span>
                <span className="text-xs text-gray-900 dark:text-white">
                  {new Date(displayTag.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Warning Message */}
        {!isLoadingTagData && displayTag.usageCount > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-4">
            <div className="flex">
              <ActionIcon action="warning" size="sm" color="warning" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Advertencia
                </h4>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  Esta etiqueta está siendo utilizada por{" "}
                  <strong>{displayTag.usageCount}</strong>
                  {displayTag.usageCount === 1 ? " documento" : " documentos"}.
                  Al eliminarla, se removerá automáticamente de todos los
                  documentos que la utilicen.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Message for unused tags */}
        {!isLoadingTagData && displayTag.usageCount === 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md p-4">
            <div className="flex">
              <svg
                className="h-5 w-5 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Etiqueta sin uso
                </h4>
                <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                  Esta etiqueta no está siendo utilizada por ningún documento.
                  Es seguro eliminarla.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading || isLoadingTagData}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirm}
            disabled={isLoading || isLoadingTagData}
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
            ) : isLoadingTagData ? (
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
                Cargando...
              </>
            ) : (
              <>
                <ActionIcon action="delete" size="sm" className="mr-2" />
                Eliminar Etiqueta
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
