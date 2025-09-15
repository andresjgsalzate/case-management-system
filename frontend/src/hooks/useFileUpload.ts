import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { config } from "../config/config";
import { securityService } from "../services/security.service";

// Configure axios for file uploads
const api = axios.create({
  baseURL: config.api.baseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests usando securityService
api.interceptors.request.use((config) => {
  const tokens = securityService.getValidTokens();
  if (tokens?.token) {
    config.headers.Authorization = `Bearer ${tokens.token}`;
  }
  return config;
});

// Interceptor de respuesta para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("🔐 Token expirado o inválido en useFileUpload");
    }
    return Promise.reject(error);
  }
);

export interface FileAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileType: "image" | "document" | "spreadsheet" | "other";
  createdAt: string;
  uploadedBy: string;
  downloadUrl: string;
}

export interface UploadResponse {
  message: string;
  uploaded: FileAttachment[];
  errors: Array<{
    fileName: string;
    error: string;
  }>;
  totalUploaded: number;
  totalErrors: number;
}

// Hook para subir archivos
export const useUploadFiles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      files,
    }: {
      documentId: string;
      files: FileList;
    }) => {
      const formData = new FormData();

      // Agregar todos los archivos al FormData
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const response = await api.post<UploadResponse>(
        `/files/knowledge/upload/${documentId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          // Opcional: callback para progreso de carga
          onUploadProgress: (_progressEvent: any) => {
            // TODO: Implementar indicador de progreso
          },
        }
      );

      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidar la cache de attachments para este documento
      queryClient.invalidateQueries({
        queryKey: ["attachments", variables.documentId],
      });

      if (data.errors.length > 0) {
        console.warn("Errores en algunos archivos:", data.errors);
      }
    },
    onError: (error) => {
      console.error("Error subiendo archivos:", error);
    },
  });
};

// Hook para obtener archivos adjuntos de un documento
export const useDocumentAttachments = (documentId: string) => {
  return useQuery({
    queryKey: ["attachments", documentId],
    queryFn: async () => {
      const response = await api.get<{ attachments: FileAttachment[] }>(
        `/files/knowledge/attachments/${documentId}`
      );
      return response.data.attachments;
    },
    enabled: !!documentId,
    staleTime: 30 * 1000, // 30 segundos
  });
};

// Hook para eliminar un archivo
export const useDeleteFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attachmentId: string) => {
      const response = await api.delete(`/files/knowledge/${attachmentId}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidar todas las queries de attachments
      queryClient.invalidateQueries({
        queryKey: ["attachments"],
      });
    },
    onError: (error) => {
      console.error("Error eliminando archivo:", error);
    },
  });
};

// Utilidades para manejo de archivos
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const getFileIcon = (fileType: string): string => {
  switch (fileType) {
    case "image":
      return "🖼️";
    case "document":
      return "📄";
    case "spreadsheet":
      return "📊";
    case "other":
    default:
      return "📁";
  }
};

export const isImageFile = (mimeType: string): boolean => {
  return mimeType.startsWith("image/");
};

export const getDownloadUrl = (downloadUrl: string): string => {
  // Asegurar que la URL sea completa
  if (downloadUrl.startsWith("/")) {
    return `${window.location.origin}${downloadUrl}`;
  }
  return downloadUrl;
};

export const getViewUrl = (downloadUrl: string): string => {
  // Convertir URL de descarga a URL de visualización
  return downloadUrl.replace("/download/", "/view/");
};
