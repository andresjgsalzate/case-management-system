import React, { useState, useEffect } from "react";
import {
  useDocumentAttachments,
  useDeleteFile,
  formatFileSize,
  getFileIcon,
  getDownloadUrl,
  isImageFile,
} from "../hooks/useFileUpload";
import DeleteAttachmentModal from "./DeleteAttachmentModal";
import { useToast } from "../contexts/ToastContext";
import { securityService } from "../services/security.service";

interface AttachmentsListProps {
  documentId: string;
  className?: string;
  readOnly?: boolean; // Nuevo prop para modo solo lectura
}

const AttachmentsList: React.FC<AttachmentsListProps> = ({
  documentId,
  className,
  readOnly = false, // Por defecto es false para mantener compatibilidad
}) => {
  const {
    data: attachments,
    isLoading,
    error,
  } = useDocumentAttachments(documentId);
  const deleteFile = useDeleteFile();
  const { error: showError } = useToast();
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [attachmentToDelete, setAttachmentToDelete] = useState<any | null>(
    null
  );

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    console.log("🧹 [AttachmentsList] useEffect cleanup configurado:", {
      previewFile: previewFile,
      isBlob: previewFile && previewFile.startsWith("blob:"),
    });

    return () => {
      if (previewFile && previewFile.startsWith("blob:")) {
        console.log("🧹 [AttachmentsList] Limpiando blob URL:", previewFile);
        URL.revokeObjectURL(previewFile);
      }
    };
  }, [previewFile]);

  // Interceptor de red para detectar requests duplicados
  useEffect(() => {
    // Interceptor de Fetch API
    const originalFetch = window.fetch;

    window.fetch = function (...args) {
      const url = args[0] as string;
      const options = args[1] as RequestInit;

      if (url && url.includes("/api/files/knowledge/view/")) {
        console.log("🌐 [FETCH INTERCEPTOR] Request detectado:", {
          url: url,
          method: options?.method || "GET",
          headers: options?.headers || {},
          hasAuth: !!(options?.headers as any)?.Authorization,
          timestamp: new Date().toISOString(),
          stackTrace: new Error().stack?.split("\n").slice(1, 5), // Primeras 4 líneas del stack
        });
      }

      return originalFetch.apply(this, args);
    };

    // Interceptor de XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      async?: boolean,
      username?: string | null,
      password?: string | null
    ) {
      (this as any)._method = method;
      (this as any)._url = url.toString();

      if (url.toString().includes("/api/files/knowledge/view/")) {
        console.log("🌐 [XHR INTERCEPTOR] Request abierto:", {
          method: method,
          url: url.toString(),
          timestamp: new Date().toISOString(),
          stackTrace: new Error().stack?.split("\n").slice(1, 5),
        });
      }

      return originalXHROpen.call(
        this,
        method,
        url,
        async ?? true,
        username,
        password
      );
    };

    XMLHttpRequest.prototype.send = function (
      body?: Document | XMLHttpRequestBodyInit | null
    ) {
      if (
        (this as any)._url &&
        (this as any)._url.includes("/api/files/knowledge/view/")
      ) {
        console.log("🌐 [XHR INTERCEPTOR] Request enviado:", {
          method: (this as any)._method,
          url: (this as any)._url,
          timestamp: new Date().toISOString(),
        });
      }

      return originalXHRSend.call(this, body);
    };

    return () => {
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalXHROpen;
      XMLHttpRequest.prototype.send = originalXHRSend;
    };
  }, []);

  // Log de mounting/unmounting del componente
  useEffect(() => {
    console.log("🏁 [AttachmentsList] Componente montado:", {
      documentId: documentId,
      attachmentsCount: attachments?.length || 0,
      isReadOnly: readOnly,
    });

    return () => {
      console.log("🔚 [AttachmentsList] Componente desmontado:", {
        documentId: documentId,
      });
    };
  }, []);

  // Log de cambios en attachments
  useEffect(() => {
    console.log("📎 [AttachmentsList] Attachments actualizados:", {
      documentId: documentId,
      attachmentsCount: attachments?.length || 0,
      attachmentFiles:
        attachments?.map((a) => ({
          id: a.id,
          fileName: a.fileName,
          mimeType: a.mimeType,
        })) || [],
    });
  }, [attachments]);

  const handleDeleteClick = (attachment: any) => {
    setAttachmentToDelete(attachment);
  };

  const handleConfirmDelete = async () => {
    if (!attachmentToDelete) return;

    setDeletingFile(attachmentToDelete.id);
    try {
      await deleteFile.mutateAsync(attachmentToDelete.id);
      setAttachmentToDelete(null);
    } catch (error) {
      console.error("Error eliminando archivo:", error);
      showError("Error eliminando el archivo. Inténtalo de nuevo.");
    } finally {
      setDeletingFile(null);
    }
  };

  const handleCancelDelete = () => {
    setAttachmentToDelete(null);
  };

  const handlePreviewFile = async (attachment: any) => {
    console.log("🖼️ [AttachmentsList] handlePreviewFile iniciado:", {
      attachmentId: attachment.id,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      downloadUrl: attachment.downloadUrl,
      isImage: isImageFile(attachment.mimeType),
      timestamp: new Date().toISOString(),
    });

    if (isImageFile(attachment.mimeType)) {
      try {
        // Paso 1: Validar token de autenticación
        console.log(
          "🔐 [AttachmentsList] Obteniendo tokens de autenticación..."
        );
        const tokens = securityService.getValidTokens();

        console.log("🔐 [AttachmentsList] Tokens obtenidos:", {
          hasTokens: !!tokens,
          hasToken: !!tokens?.token,
          tokenLength: tokens?.token ? tokens.token.length : 0,
          hasRefreshToken: !!tokens?.refreshToken,
          currentTime: new Date().toISOString(),
        });

        if (!tokens?.token) {
          console.warn(
            "⚠️ [AttachmentsList] No hay token válido disponible para vista previa"
          );
          showError("Sesión expirada. Por favor, inicia sesión nuevamente.");
          return;
        }

        // Paso 2: Construir URLs
        console.log("🔗 [AttachmentsList] Construyendo URLs...");
        const downloadUrl = getDownloadUrl(attachment.downloadUrl);
        const urlParts = downloadUrl.split("/");
        const physicalFileName = urlParts[urlParts.length - 1];

        const viewUrl = `${
          window.location.origin
        }/api/files/knowledge/view/${physicalFileName}?token=${encodeURIComponent(
          tokens.token
        )}`;

        console.log("🔗 [AttachmentsList] URLs construidas:", {
          originalDownloadUrl: attachment.downloadUrl,
          processedDownloadUrl: downloadUrl,
          physicalFileName: physicalFileName,
          finalViewUrl: viewUrl,
          urlParts: urlParts,
          tokenInQuery: viewUrl.includes("token="),
        });

        // Paso 3: Preparar headers de la petición
        const fetchHeaders = {
          Authorization: `Bearer ${tokens.token}`,
          "Content-Type": "application/json",
          Accept: "image/*,*/*",
        };

        console.log("📡 [AttachmentsList] Preparando petición fetch:", {
          url: viewUrl,
          method: "GET",
          headers: {
            ...fetchHeaders,
            Authorization: `Bearer ${tokens.token.substring(0, 20)}...`, // Log solo inicio del token
          },
          cache: "no-cache",
        });

        // Paso 4: Realizar petición fetch
        console.log("📡 [AttachmentsList] Realizando petición fetch...");
        const fetchStartTime = performance.now();

        const response = await fetch(viewUrl, {
          method: "GET",
          headers: fetchHeaders,
          cache: "no-cache",
          credentials: "include",
        });

        const fetchEndTime = performance.now();

        console.log("📡 [AttachmentsList] Respuesta fetch recibida:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
          type: response.type,
          url: response.url,
          redirected: response.redirected,
          fetchDuration: `${(fetchEndTime - fetchStartTime).toFixed(2)}ms`,
        });

        if (!response.ok) {
          const errorText = await response
            .text()
            .catch(() => "No error text available");
          console.error(
            "❌ [AttachmentsList] Respuesta de error del servidor:",
            {
              status: response.status,
              statusText: response.statusText,
              errorText: errorText,
              headers: Object.fromEntries(response.headers.entries()),
            }
          );
          throw new Error(
            `Error ${response.status}: ${response.statusText} - ${errorText}`
          );
        }

        // Paso 5: Crear blob desde la respuesta
        console.log("💾 [AttachmentsList] Creando blob desde respuesta...");
        const blob = await response.blob();

        console.log("💾 [AttachmentsList] Blob creado:", {
          size: blob.size,
          type: blob.type,
          hasSize: blob.size > 0,
        });

        // Paso 6: Crear blob URL
        console.log("🔗 [AttachmentsList] Creando blob URL...");
        const blobUrl = URL.createObjectURL(blob);

        console.log("✅ [AttachmentsList] Blob URL creada exitosamente:", {
          blobUrl: blobUrl,
          blobSize: blob.size,
          blobType: blob.type,
        });

        setPreviewFile(blobUrl);

        console.log(
          "✅ [AttachmentsList] Vista previa configurada exitosamente"
        );
      } catch (error) {
        console.error("❌ [AttachmentsList] Error completo en vista previa:", {
          error: error,
          errorMessage:
            error instanceof Error ? error.message : "Error desconocido",
          errorStack: error instanceof Error ? error.stack : undefined,
          attachmentId: attachment.id,
          fileName: attachment.fileName,
        });
        showError(
          `Error al cargar la imagen para vista previa: ${
            error instanceof Error ? error.message : "Error desconocido"
          }`
        );
      }
    } else {
      console.log(
        "📄 [AttachmentsList] Archivo no es imagen, abriendo descarga directa"
      );
      // Para archivos que no son imágenes, descargar directamente
      window.open(getDownloadUrl(attachment.downloadUrl), "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-12 bg-gray-100 dark:bg-gray-700 rounded"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} text-red-600 dark:text-red-400`}>
        <p>
          Error cargando archivos adjuntos:{" "}
          {error instanceof Error ? error.message : "Error desconocido"}
        </p>
      </div>
    );
  }

  if (!attachments || attachments.length === 0) {
    return (
      <div className={`${className} text-gray-500 dark:text-gray-400`}>
        <p>No hay archivos adjuntos</p>
      </div>
    );
  }

  return (
    <>
      <div className={className}>
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Archivos adjuntos ({attachments.length})
        </h3>

        <div className="space-y-3">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="text-2xl">
                  {getFileIcon(attachment.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {attachment.fileName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(attachment.fileSize)} •{" "}
                    {new Date(attachment.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                {/* Botón de vista previa/descarga */}
                <button
                  type="button"
                  onClick={() => handlePreviewFile(attachment)}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                  title={
                    isImageFile(attachment.mimeType)
                      ? "Vista previa"
                      : "Descargar"
                  }
                >
                  {isImageFile(attachment.mimeType) ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
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
                  )}
                </button>

                {/* Botón de descarga directa */}
                <a
                  href={getDownloadUrl(attachment.downloadUrl)}
                  download={attachment.fileName}
                  className="p-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-full transition-colors"
                  title="Descargar"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </a>

                {/* Botón de eliminar - Solo mostrar si no está en modo readOnly */}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteClick(attachment);
                    }}
                    disabled={deletingFile === attachment.id}
                    className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Eliminar archivo"
                  >
                    {deletingFile === attachment.id ? (
                      <svg
                        className="w-5 h-5 animate-spin"
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
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de vista previa de imágenes */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => {
            console.log(
              "🖼️ [AttachmentsList] Cerrando modal de preview (click overlay):",
              {
                previewFile: previewFile,
                isBlob: previewFile.startsWith("blob:"),
              }
            );
            // Limpiar blob URL si es una blob URL
            if (previewFile.startsWith("blob:")) {
              URL.revokeObjectURL(previewFile);
            }
            setPreviewFile(null);
          }}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={previewFile}
              alt="Vista previa"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
              onLoad={() => {
                console.log("🖼️ [AttachmentsList] Imagen cargada en modal:", {
                  src: previewFile,
                  isBlob: previewFile.startsWith("blob:"),
                });
              }}
              onError={(e) => {
                console.error(
                  "❌ [AttachmentsList] Error cargando imagen en modal:",
                  {
                    src: previewFile,
                    error: e,
                    isBlob: previewFile.startsWith("blob:"),
                  }
                );
              }}
            />
            <button
              type="button"
              onClick={() => {
                console.log(
                  "🖼️ [AttachmentsList] Cerrando modal de preview (botón cerrar):",
                  {
                    previewFile: previewFile,
                    isBlob: previewFile.startsWith("blob:"),
                  }
                );
                // Limpiar blob URL si es una blob URL
                if (previewFile.startsWith("blob:")) {
                  URL.revokeObjectURL(previewFile);
                }
                setPreviewFile(null);
              }}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-2 transition-all"
            >
              <svg
                className="w-6 h-6"
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
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {attachmentToDelete && (
        <DeleteAttachmentModal
          isOpen={!!attachmentToDelete}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          fileName={attachmentToDelete.fileName}
          fileSize={formatFileSize(attachmentToDelete.fileSize)}
          mimeType={attachmentToDelete.mimeType}
        />
      )}
    </>
  );
};

export default AttachmentsList;
