import { DataSource } from "typeorm";
import { KnowledgeDocument } from "../entities/KnowledgeDocument";
import { KnowledgeDocumentVersion } from "../entities/KnowledgeDocumentVersion";
import { CreateKnowledgeDocumentDto, UpdateKnowledgeDocumentDto, KnowledgeDocumentQueryDto, PublishKnowledgeDocumentDto, ArchiveKnowledgeDocumentDto } from "../dto/knowledge-document.dto";
export declare class KnowledgeDocumentService {
    private knowledgeDocumentRepository;
    private versionRepository;
    private knowledgeTagService;
    constructor(dataSource?: DataSource);
    create(createDto: CreateKnowledgeDocumentDto, userId: string): Promise<KnowledgeDocument>;
    findAll(query: KnowledgeDocumentQueryDto, userId?: string, userPermissions?: string[]): Promise<{
        documents: any[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<KnowledgeDocument | null>;
    update(id: string, updateDto: UpdateKnowledgeDocumentDto, userId: string): Promise<KnowledgeDocument>;
    publish(id: string, publishDto: PublishKnowledgeDocumentDto, userId: string): Promise<KnowledgeDocument>;
    archive(id: string, archiveDto: ArchiveKnowledgeDocumentDto, userId: string): Promise<KnowledgeDocument>;
    remove(id: string): Promise<void>;
    getVersions(documentId: string): Promise<KnowledgeDocumentVersion[]>;
    getVersion(documentId: string, versionNumber: number): Promise<KnowledgeDocumentVersion>;
    searchContent(searchTerm: string, limit?: number, userId?: string, userPermissions?: string[]): Promise<KnowledgeDocument[]>;
    getSearchSuggestions(searchTerm: string, limit?: number, userId?: string, userPermissions?: string[]): Promise<{
        documents: Array<{
            id: string;
            title: string;
            matchType: string;
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
    }>;
    private calculateWordRelevance;
    enhancedSearch(query: {
        search?: string;
        tags?: string[];
        caseNumber?: string;
        documentTypeId?: string;
        priority?: string;
        isPublished?: boolean;
        limit?: number;
        page?: number;
    }, userId?: string, userPermissions?: string[]): Promise<{
        documents: Array<KnowledgeDocument & {
            relevanceScore?: number;
            matchedWords?: string[];
            totalSearchWords?: number;
            hasExactPhrase?: boolean;
            matchLocations?: string[];
        }>;
        total: number;
        searchStats: {
            foundInTitle: number;
            foundInContent: number;
            foundInTags: number;
            foundInCases: number;
        };
    }>;
    private createQueryBuilder;
    private applyFilters;
    private applyPermissionFilters;
    private applySorting;
    private updateTags;
    private loadDocumentTags;
    private createVersion;
}
