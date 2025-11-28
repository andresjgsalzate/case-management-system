import { useState } from "react";
import { ActionIcon } from "./ui/ActionIcons";
import { Button } from "./ui/Button";
import { LoadingSpinner } from "./ui/LoadingSpinner";

interface DeleteAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  fileName: string;
  fileSize: string;
  mimeType: string;
}

export default function DeleteAttachmentModal({
  isOpen,
  onClose,
  onConfirm,
  fileName,
  fileSize,
  mimeType,
}: DeleteAttachmentModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } catch (error) {
      // El error se maneja en el componente padre
      console.error("Error in modal:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "view";
    if (mimeType.includes("pdf")) return "download";
    if (mimeType.includes("word") || mimeType.includes("document"))
      return "edit";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return "table";
    if (mimeType.includes("text/")) return "edit";
    return "attachment";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <ActionIcon action="delete" size="md" color="red" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Eliminar Archivo
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Esta acción no se puede deshacer
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              ¿Estás seguro de que quieres eliminar este archivo?
            </p>

            {/* File Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-200 dark:bg-gray-600 rounded-lg">
                  <ActionIcon action={getFileIcon(mimeType)} size="md" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {fileName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {fileSize}
                  </p>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ActionIcon action="warning" size="sm" color="red" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Advertencia
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    Una vez eliminado, el archivo se perderá permanentemente y
                    no se podrá recuperar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Eliminando...
              </>
            ) : (
              <>
                <ActionIcon action="delete" size="sm" />
                Eliminar Archivo
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
