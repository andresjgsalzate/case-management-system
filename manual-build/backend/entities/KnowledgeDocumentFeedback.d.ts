import { UserProfile } from "./UserProfile";
import { KnowledgeDocument } from "./KnowledgeDocument";
export declare class KnowledgeDocumentFeedback {
    id: string;
    documentId: string;
    document: KnowledgeDocument;
    userId: string;
    user: UserProfile;
    isHelpful: boolean;
    comment: string | null;
    createdAt: Date;
    updatedAt: Date;
}
