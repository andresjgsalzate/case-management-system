import { KnowledgeDocument } from "../entities/KnowledgeDocument";
export declare enum Priority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
export declare class CreateKnowledgeDocumentDto {
    title: string;
    content?: string;
    jsonContent: object;
    documentTypeId?: string;
    priority?: Priority;
    difficultyLevel?: number;
    isTemplate?: boolean;
    tags?: string[];
    associatedCases?: string[];
}
export declare class UpdateKnowledgeDocumentDto {
    title?: string;
    content?: string;
    jsonContent?: object;
    documentTypeId?: string;
    priority?: Priority;
    difficultyLevel?: number;
    isTemplate?: boolean;
    isPublished?: boolean;
    tags?: string[];
    associatedCases?: string[];
    changeSummary?: string;
}
export declare class PublishKnowledgeDocumentDto {
    isPublished: boolean;
    changeSummary?: string;
}
export declare class ArchiveKnowledgeDocumentDto {
    isArchived: boolean;
    reason?: string;
    replacementDocumentId?: string;
}
export declare class KnowledgeDocumentQueryDto {
    search?: string;
    documentTypeId?: string;
    tags?: string[];
    caseNumber?: string;
    priority?: Priority;
    difficultyLevel?: number;
    isPublished?: boolean;
    isTemplate?: boolean;
    isArchived?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    includeStats?: boolean;
}
export declare class SearchSuggestionsDto {
    search: string;
    limit?: number;
}
export declare class EnhancedSearchResponseDto {
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
    suggestions?: {
        documents: Array<{
            id: string;
            title: string;
            type: "document";
        }>;
        tags: Array<{
            name: string;
            type: "tag";
        }>;
        cases: Array<{
            id: string;
            caseNumber: string;
            type: "case";
        }>;
    };
}
