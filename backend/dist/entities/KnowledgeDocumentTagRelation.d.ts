import { KnowledgeDocument } from "./KnowledgeDocument";
import { KnowledgeTag } from "./KnowledgeTag";
export declare class KnowledgeDocumentTagRelation {
    id: string;
    documentId: string;
    tagId: string;
    createdAt: Date;
    document: KnowledgeDocument;
    tag: KnowledgeTag;
}
