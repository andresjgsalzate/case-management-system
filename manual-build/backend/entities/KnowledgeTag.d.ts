import { KnowledgeDocumentTagRelation } from "./KnowledgeDocumentTagRelation";
export declare enum TagCategory {
    PRIORITY = "priority",
    TECHNICAL = "technical",
    TYPE = "type",
    TECHNOLOGY = "technology",
    MODULE = "module",
    CUSTOM = "custom"
}
export declare class KnowledgeTag {
    id: string;
    tagName: string;
    description?: string;
    color: string;
    category: TagCategory;
    isActive: boolean;
    createdBy?: string;
    createdAt: Date;
    updatedAt: Date;
    documentRelations: KnowledgeDocumentTagRelation[];
    usageCount?: number;
}
