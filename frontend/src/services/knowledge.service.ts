import axios from "axios";
import {
  KnowledgeDocument,
  KnowledgeDocumentListResponse,
  CreateKnowledgeDocumentDto,
  UpdateKnowledgeDocumentDto,
  KnowledgeDocumentQueryDto,
  KnowledgeDocumentVersion,
  DocumentType,
  CreateDocumentTypeDto,
  UpdateDocumentTypeDto,
  DocumentTypeStats,
  KnowledgeDocumentFeedback,
  CreateDocumentFeedbackDto,
  UpdateDocumentFeedbackDto,
  DocumentStats,
} from "../types/knowledge";

const API_BASE_URL = "http://localhost:3000/api";

// Configure axios defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

// Export all services
export const knowledgeApi = {
  documents: KnowledgeDocumentService,
  types: DocumentTypeService,
  feedback: DocumentFeedbackService,
};
