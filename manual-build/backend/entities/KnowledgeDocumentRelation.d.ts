import { UserProfile } from "./UserProfile";
import { KnowledgeDocument } from "./KnowledgeDocument";
export type RelationType = "related" | "replaces" | "prerequisite" | "follows";
export declare class KnowledgeDocumentRelation {
    id: string;
    parentDocumentId: string;
    parentDocument: KnowledgeDocument;
    childDocumentId: string;
    childDocument: KnowledgeDocument;
    relationType: RelationType;
    createdBy: string;
    createdByUser: Promise<UserProfile>;
    createdAt: Date;
}
