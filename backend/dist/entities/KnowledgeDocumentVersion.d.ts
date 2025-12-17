import { UserProfile } from "./UserProfile";
import { KnowledgeDocument } from "./KnowledgeDocument";
export declare class KnowledgeDocumentVersion {
    id: string;
    documentId: string;
    document: KnowledgeDocument;
    versionNumber: number;
    content: object;
    title: string;
    changeSummary: string | null;
    createdBy: string;
    createdByUser: Promise<UserProfile>;
    createdAt: Date;
}
