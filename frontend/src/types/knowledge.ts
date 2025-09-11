// Types for Knowledge Base module

export type Priority = "low" | "medium" | "high" | "urgent";

export type RelationType = "related" | "replaces" | "prerequisite" | "follows";

export type FileType = "image" | "document" | "spreadsheet" | "other";

export interface DocumentType {
  id: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  isActive: boolean;
  displayOrder: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  content?: string; // Text content for search
  jsonContent: any; // BlockNote JSON content
  documentTypeId?: string;
  documentType?: DocumentType;

  // Metadata
  priority: Priority;
  difficultyLevel: number;

  // States
  isPublished: boolean;
  isTemplate: boolean;
  isDeprecated: boolean;
  isArchived: boolean;

  // Metrics
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  version: number;

  // Dates
  publishedAt?: string;
  deprecatedAt?: string;
  archivedAt?: string;

  // Audit
  createdBy: string;
  lastEditedBy?: string;
  archivedBy?: string;
  replacementDocumentId?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  tags: KnowledgeDocumentTag[];
  versions?: KnowledgeDocumentVersion[];
  attachments?: KnowledgeDocumentAttachment[];
  feedback?: KnowledgeDocumentFeedback[];
}

export type TagCategory =
  | "priority"
  | "technical"
  | "type"
  | "technology"
  | "module"
  | "custom";

export interface KnowledgeDocumentTag {
  id: string;
  documentId?: string;
  tagName: string;
  description?: string;
  color: string;
  category: TagCategory;
  usageCount: number;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTagDto {
  tagName: string;
  description?: string;
  color?: string;
  category?: TagCategory;
}

export interface KnowledgeDocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  content: any; // BlockNote JSON
  title: string;
  changeSummary?: string;
  createdBy: string;
  createdAt: string;
}

export interface KnowledgeDocumentAttachment {
  id: string;
  documentId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileType?: FileType;
  fileHash?: string;
  thumbnailPath?: string;
  processedPath?: string;
  isEmbedded: boolean;
  uploadSessionId?: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDocumentRelation {
  id: string;
  parentDocumentId: string;
  childDocumentId: string;
  relationType: RelationType;
  createdBy: string;
  createdAt: string;
}

export interface KnowledgeDocumentFeedback {
  id: string;
  documentId: string;
  userId: string;
  isHelpful: boolean;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

// DTOs for API requests
export interface CreateKnowledgeDocumentDto {
  title: string;
  content?: string;
  jsonContent: any;
  documentTypeId?: string;
  priority?: Priority;
  difficultyLevel?: number;
  isTemplate?: boolean;
  tags?: string[];
}

export interface UpdateKnowledgeDocumentDto {
  title?: string;
  content?: string;
  jsonContent?: any;
  documentTypeId?: string;
  priority?: Priority;
  difficultyLevel?: number;
  isTemplate?: boolean;
  isPublished?: boolean;
  tags?: string[];
  changeSummary?: string;
}

export interface KnowledgeDocumentQueryDto {
  search?: string;
  documentTypeId?: string;
  tags?: string[];
  priority?: Priority;
  difficultyLevel?: number;
  isPublished?: boolean;
  isTemplate?: boolean;
  isArchived?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface KnowledgeDocumentListResponse {
  documents: KnowledgeDocument[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateDocumentTypeDto {
  code: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  displayOrder?: number;
}

export interface UpdateDocumentTypeDto {
  code?: string;
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface CreateDocumentFeedbackDto {
  documentId: string;
  isHelpful: boolean;
  comment?: string;
}

export interface UpdateDocumentFeedbackDto {
  isHelpful?: boolean;
  comment?: string;
}

export interface DocumentStats {
  totalFeedback: number;
  helpfulCount: number;
  notHelpfulCount: number;
  helpfulPercentage: number;
  recentComments: KnowledgeDocumentFeedback[];
}

export interface DocumentTypeStats {
  totalDocuments: number;
  publishedDocuments: number;
  archivedDocuments: number;
  templateDocuments: number;
}
