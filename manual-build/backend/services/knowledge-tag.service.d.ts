import { DataSource } from "typeorm";
import { KnowledgeTag, TagCategory } from "../entities/KnowledgeTag";
export interface CreateKnowledgeTagDto {
    tagName: string;
    description?: string;
    color?: string;
    category?: TagCategory;
}
export interface KnowledgeTagWithUsage extends KnowledgeTag {
    usageCount: number;
}
export declare class KnowledgeTagService {
    private tagRepository;
    private relationRepository;
    private documentRepository;
    constructor(dataSource?: DataSource);
    createTag(createDto: CreateKnowledgeTagDto, userId?: string): Promise<KnowledgeTag>;
    findOrCreateTag(tagName: string, userId?: string): Promise<KnowledgeTag>;
    findTagByName(tagName: string): Promise<KnowledgeTagWithUsage | null>;
    getAllTagsWithUsage(): Promise<KnowledgeTagWithUsage[]>;
    getPopularTags(limit?: number): Promise<KnowledgeTagWithUsage[]>;
    getTagById(id: string): Promise<KnowledgeTagWithUsage | null>;
    assignTagsToDocument(documentId: string, tagNames: string[], userId?: string): Promise<void>;
    private updateDocumentTagsJson;
    getDocumentTags(documentId: string): Promise<KnowledgeTag[]>;
    deleteTag(tagId: string): Promise<void>;
    updateTag(tagId: string, updateData: Partial<CreateKnowledgeTagDto>): Promise<KnowledgeTag>;
}
