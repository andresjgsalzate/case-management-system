import axios from "axios";
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

const API_BASE_URL = config.api.baseUrl;

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

// Add response interceptor to handle errors with better error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("🚨 API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    // Enhance error with more informative messages
    if (error.response) {
      const status = error.response.status;
      const url = error.config?.url || "unknown";

      switch (status) {
        case 401:
          error.userMessage =
            "Sesión expirada. Por favor, inicia sesión nuevamente.";
          error.technicalDetails = `Error 401 en ${url}: Token de autenticación inválido o expirado`;
          break;
        case 403:
          error.userMessage = "No tienes permisos para acceder a este recurso.";
          error.technicalDetails = `Error 403 en ${url}: Permisos insuficientes`;
          break;
        case 404:
          error.userMessage = "El recurso solicitado no fue encontrado.";
          error.technicalDetails = `Error 404 en ${url}: Recurso no encontrado`;
          break;
        case 500:
          error.userMessage =
            "Error interno del servidor. Por favor, contacta al administrador.";
          error.technicalDetails = `Error 500 en ${url}: Error interno del servidor`;
          break;
        case 502:
          error.userMessage =
            "Error de conexión con el servidor. Inténtalo más tarde.";
          error.technicalDetails = `Error 502 en ${url}: Bad Gateway`;
          break;
        case 503:
          error.userMessage = "El servicio no está disponible temporalmente.";
          error.technicalDetails = `Error 503 en ${url}: Service Unavailable`;
          break;
        default:
          error.userMessage = `Error ${status}: ${
            error.response?.data?.message || "Error desconocido"
          }`;
          error.technicalDetails = `Error ${status} en ${url}`;
      }
    } else if (error.request) {
      error.userMessage = "Error de conexión. Verifica tu conexión a internet.";
      error.technicalDetails = "No se recibió respuesta del servidor";
    } else {
      error.userMessage = "Error inesperado. Por favor, inténtalo nuevamente.";
      error.technicalDetails = error.message;
    }

    return Promise.reject(error);
  }
);

// Knowledge Documents Service
export class KnowledgeDocumentService {
  static async findAll(
    query?: KnowledgeDocumentQueryDto
  ): Promise<KnowledgeDocumentListResponse> {
    const { data } = await api.get("/knowledge", { params: query });
    return data;
  }

  static async findOne(id: string): Promise<KnowledgeDocument> {
    const { data } = await api.get(`/knowledge/${id}`);
    return data;
  }

  static async create(
    dto: CreateKnowledgeDocumentDto
  ): Promise<KnowledgeDocument> {
    const { data } = await api.post("/knowledge", dto);
    return data;
  }

  static async update(
    id: string,
    dto: UpdateKnowledgeDocumentDto
  ): Promise<KnowledgeDocument> {
    const { data } = await api.put(`/knowledge/${id}`, dto);
    return data;
  }

  static async publish(
    id: string,
    isPublished: boolean,
    changeSummary?: string
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
    replacementDocumentId?: string
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
    versionNumber: number
  ): Promise<KnowledgeDocumentVersion> {
    const { data } = await api.get(
      `/knowledge/${id}/versions/${versionNumber}`
    );
    return data;
  }

  static async search(
    query: string,
    limit?: number
  ): Promise<KnowledgeDocument[]> {
    const { data } = await api.get("/knowledge/search", {
      params: { q: query, limit },
    });
    return data;
  }

  // Nuevo: Búsqueda con sugerencias
  static async getSearchSuggestions(
    query: string,
    limit?: number
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
    dto: UpdateDocumentTypeDto
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
    dto: CreateDocumentFeedbackDto
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
    dto: UpdateDocumentFeedbackDto
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
    }
  ): Promise<KnowledgeDocumentTag> {
    const { data } = await api.post("/knowledge/tags", {
      tagName,
      ...options,
    });
    return data;
  }

  static async findByName(
    tagName: string
  ): Promise<KnowledgeDocumentTag | null> {
    try {
      const { data } = await api.get(
        `/knowledge/tags/${encodeURIComponent(tagName)}`
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
