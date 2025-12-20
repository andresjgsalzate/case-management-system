import { KnowledgeDocument } from "./KnowledgeDocument";
export type TagCategory = "priority" | "technical" | "type" | "technology" | "module" | "custom";
export declare class KnowledgeDocumentTag {
    id: string;
    documentId?: string;
    document?: KnowledgeDocument;
    tagName: string;
    description?: string;
    color: string;
    category: TagCategory;
    usageCount: number;
    isActive: boolean;
    createdBy?: string;
    createdAt: Date;
    updatedAt: Date;
}
