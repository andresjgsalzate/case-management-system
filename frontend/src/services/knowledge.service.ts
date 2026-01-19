import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  KnowledgeDocument,
  KnowledgeDocumentListResponse,
  CreateKnowledgeDocumentDto,
  UpdateKnowledgeDocumentDto,
  KnowledgeDocumentQueryDto,
  KnowledgeDocumentVersion,
  KnowledgeDocumentTag,
  DocumentType,
  CreateDocumentTypeDto,
  UpdateDocumentTypeDto,
  DocumentTypeStats,
  KnowledgeDocumentFeedback,
  CreateDocumentFeedbackDto,
  UpdateDocumentFeedbackDto,
  DocumentStats,
} from "../types/knowledge";
import { config } from "../config/config";
import { securityService } from "./security.service";
import { authService } from "./auth.service";

const API_BASE_URL = config.api.baseUrl;

// Flag para evitar bucles infinitos de refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Configure axios defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const tokens = securityService.getValidTokens();

  if (tokens?.token) {
    config.headers.Authorization = `Bearer ${tokens.token}`;
  }
  return config;
});

// Add response interceptor to handle errors with better error messages AND token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Si es un error 401 y no es un retry, intentar refrescar el token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Si ya estamos refrescando, encolar esta petición
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const tokens = securityService.getValidTokens();

      if (tokens?.refreshToken) {
        try {
          console.log("🔄 [Knowledge] Intentando refrescar token...");
          const refreshResponse = await authService.refreshToken(
            tokens.refreshToken,
          );

          if (refreshResponse.success && refreshResponse.data) {
            const newToken = refreshResponse.data.token;
            const newRefreshToken =
              (refreshResponse.data as { token: string; refreshToken?: string })
                .refreshToken || tokens.refreshToken;

            // Actualizar tokens en SecurityService
            securityService.updateTokens(newToken, newRefreshToken);

            console.log("✅ [Knowledge] Token refrescado exitosamente");

            // Procesar la cola de peticiones pendientes
            processQueue(null, newToken);

            // Reintentar la petición original
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error(
            "❌ [Knowledge] Error al refrescar token:",
            refreshError,
          );
          processQueue(refreshError as Error, null);
          securityService.clearSession();
          // Redirigir al login
          window.location.href = "/login";
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        console.warn("⚠️ [Knowledge] No hay refresh token disponible");
        securityService.clearSession();
        window.location.href = "/login";
      }
    }

    console.error("🚨 API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    // Enhance error with more informative messages
    const enhancedError = error as AxiosError & {
      userMessage?: string;
      technicalDetails?: string;
    };

    if (error.response) {
      const status = error.response.status;
      const url = error.config?.url || "unknown";

      switch (status) {
        case 401:
          enhancedError.userMessage =
            "Sesión expirada. Por favor, inicia sesión nuevamente.";
          enhancedError.technicalDetails = `Error 401 en ${url}: Token de autenticación inválido o expirado`;
          break;
        case 403:
          enhancedError.userMessage =
            "No tienes permisos para acceder a este recurso.";
          enhancedError.technicalDetails = `Error 403 en ${url}: Permisos insuficientes`;
          break;
        case 404:
          enhancedError.userMessage =
            "El recurso solicitado no fue encontrado.";
          enhancedError.technicalDetails = `Error 404 en ${url}: Recurso no encontrado`;
          break;
        case 500:
          enhancedError.userMessage =
            "Error interno del servidor. Por favor, contacta al administrador.";
          enhancedError.technicalDetails = `Error 500 en ${url}: Error interno del servidor`;
          break;
        case 502:
          enhancedError.userMessage =
            "Error de conexión con el servidor. Inténtalo más tarde.";
          enhancedError.technicalDetails = `Error 502 en ${url}: Bad Gateway`;
          break;
        case 503:
          enhancedError.userMessage =
            "El servicio no está disponible temporalmente.";
          enhancedError.technicalDetails = `Error 503 en ${url}: Service Unavailable`;
          break;
        default:
          enhancedError.userMessage = `Error ${status}: ${
            (error.response?.data as { message?: string })?.message ||
            "Error desconocido"
          }`;
          enhancedError.technicalDetails = `Error ${status} en ${url}`;
      }
    } else if (error.request) {
      enhancedError.userMessage =
        "Error de conexión. Verifica tu conexión a internet.";
      enhancedError.technicalDetails = "No se recibió respuesta del servidor";
    } else {
      enhancedError.userMessage =
        "Error inesperado. Por favor, inténtalo nuevamente.";
      enhancedError.technicalDetails = error.message;
    }

    return Promise.reject(enhancedError);
  },
);

// Knowledge Documents Service
export class KnowledgeDocumentService {
  static async findAll(
    query?: KnowledgeDocumentQueryDto,
  ): Promise<KnowledgeDocumentListResponse> {
    const { data } = await api.get("/knowledge", { params: query });
    return data;
  }

  static async findOne(id: string): Promise<KnowledgeDocument> {
    const { data } = await api.get(`/knowledge/${id}`);
    return data;
  }

  static async create(
    dto: CreateKnowledgeDocumentDto,
  ): Promise<KnowledgeDocument> {
    const { data } = await api.post("/knowledge", dto);
    return data;
  }

  static async update(
    id: string,
    dto: UpdateKnowledgeDocumentDto,
  ): Promise<KnowledgeDocument> {
    const { data } = await api.put(`/knowledge/${id}`, dto);
    return data;
  }

  static async publish(
    id: string,
    isPublished: boolean,
    changeSummary?: string,
  ): Promise<KnowledgeDocument> {
    const { data } = await api.put(`/knowledge/${id}/publish`, {
      isPublished,
      changeSummary,
    });
    return data;
  }

  static async archive(
    id: string,
    isArchived: boolean,
    reason?: string,
    replacementDocumentId?: string,
  ): Promise<KnowledgeDocument> {
    const { data } = await api.put(`/knowledge/${id}/archive`, {
      isArchived,
      reason,
      replacementDocumentId,
    });
    return data;
  }

  static async remove(id: string): Promise<void> {
    await api.delete(`/knowledge/${id}`);
  }

  static async getVersions(id: string): Promise<KnowledgeDocumentVersion[]> {
    const { data } = await api.get(`/knowledge/${id}/versions`);
    return data;
  }

  static async getVersion(
    id: string,
    versionNumber: number,
  ): Promise<KnowledgeDocumentVersion> {
    const { data } = await api.get(
      `/knowledge/${id}/versions/${versionNumber}`,
    );
    return data;
  }

  static async search(
    query: string,
    limit?: number,
  ): Promise<KnowledgeDocument[]> {
    const { data } = await api.get("/knowledge/search", {
      params: { q: query, limit },
    });
    return data;
  }

  // Nuevo: Búsqueda con sugerencias
  static async getSearchSuggestions(
    query: string,
    limit?: number,
  ): Promise<{
    documents: Array<{ id: string; title: string; type: "document" }>;
    tags: Array<{ name: string; type: "tag" }>;
    cases: Array<{ id: string; caseNumber: string; type: "case" }>;
  }> {
    const { data } = await api.get("/knowledge/search/suggestions", {
      params: { q: query, limit },
    });
    return data;
  }

  // Nuevo: Búsqueda avanzada
  static async enhancedSearch(searchParams: {
    search?: string;
    tags?: string[];
    caseNumber?: string;
    documentTypeId?: string;
    priority?: string;
    isPublished?: boolean;
    limit?: number;
    page?: number;
  }): Promise<{
    documents: KnowledgeDocument[];
    total: number;
    page: number;
    totalPages: number;
    searchStats?: {
      foundInTitle: number;
      foundInContent: number;
      foundInTags: number;
      foundInCases: number;
    };
  }> {
    const { data } = await api.post("/knowledge/search/advanced", searchParams);
    return data;
  }

  static async getStats(id: string): Promise<DocumentStats> {
    const { data } = await api.get(`/knowledge/${id}/stats`);
    return data;
  }

  static async getFeedback(id: string): Promise<KnowledgeDocumentFeedback[]> {
    const { data } = await api.get(`/knowledge/${id}/feedback`);
    return data;
  }
}

// Document Types Service
export class DocumentTypeService {
  static async findAll(activeOnly?: boolean): Promise<DocumentType[]> {
    const { data } = await api.get("/document-types", {
      params: activeOnly ? { active: true } : undefined,
    });
    return data;
  }

  static async findOne(id: string): Promise<DocumentType> {
    const { data } = await api.get(`/document-types/${id}`);
    return data;
  }

  static async create(dto: CreateDocumentTypeDto): Promise<DocumentType> {
    const { data } = await api.post("/document-types", dto);
    return data;
  }

  static async update(
    id: string,
    dto: UpdateDocumentTypeDto,
  ): Promise<DocumentType> {
    const { data } = await api.put(`/document-types/${id}`, dto);
    return data;
  }

  static async toggleActive(id: string): Promise<DocumentType> {
    const { data } = await api.put(`/document-types/${id}/toggle`);
    return data;
  }

  static async remove(id: string): Promise<void> {
    await api.delete(`/document-types/${id}`);
  }

  static async getStats(id: string): Promise<DocumentTypeStats> {
    const { data } = await api.get(`/document-types/${id}/stats`);
    return data;
  }
}

// Document Feedback Service
export class DocumentFeedbackService {
  static async create(
    dto: CreateDocumentFeedbackDto,
  ): Promise<KnowledgeDocumentFeedback> {
    const { data } = await api.post("/feedback", dto);
    return data;
  }

  static async checkUserFeedback(documentId: string): Promise<{
    hasFeedback: boolean;
    feedback: KnowledgeDocumentFeedback | null;
  }> {
    const { data } = await api.get(`/feedback/check/${documentId}`);
    return data;
  }

  static async update(
    id: string,
    dto: UpdateDocumentFeedbackDto,
  ): Promise<KnowledgeDocumentFeedback> {
    const { data } = await api.put(`/feedback/${id}`, dto);
    return data;
  }

  static async remove(id: string): Promise<void> {
    await api.delete(`/feedback/${id}`);
  }

  static async getMyFeedback(): Promise<KnowledgeDocumentFeedback[]> {
    const { data } = await api.get("/feedback/my");
    return data;
  }
}

// Knowledge Document Tags Service
export class KnowledgeDocumentTagService {
  static async createTag(
    tagName: string,
    options?: {
      description?: string;
      color?: string;
      category?: string;
    },
  ): Promise<KnowledgeDocumentTag> {
    const { data } = await api.post("/knowledge/tags", {
      tagName,
      ...options,
    });
    return data;
  }

  static async findByName(
    tagName: string,
  ): Promise<KnowledgeDocumentTag | null> {
    try {
      const { data } = await api.get(
        `/knowledge/tags/${encodeURIComponent(tagName)}`,
      );
      return data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  static async getAllTags(): Promise<KnowledgeDocumentTag[]> {
    const { data } = await api.get("/knowledge/tags");
    return data;
  }

  static async getTagById(id: string): Promise<KnowledgeDocumentTag> {
    const { data } = await api.get(`/knowledge/tags/details/${id}`);
    return data;
  }

  static async deleteTag(id: string): Promise<void> {
    await api.delete(`/knowledge/tags/${id}`);
  }

  static async getPopularTags(limit?: number): Promise<KnowledgeDocumentTag[]> {
    const { data } = await api.get("/knowledge/tags/popular", {
      params: { limit },
    });
    return data;
  }
}

// Export all services
export const knowledgeApi = {
  documents: KnowledgeDocumentService,
  types: DocumentTypeService,
  feedback: DocumentFeedbackService,
  tags: KnowledgeDocumentTagService,
};
