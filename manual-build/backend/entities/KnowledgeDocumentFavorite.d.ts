import { UserProfile } from "./UserProfile";
import { KnowledgeDocument } from "./KnowledgeDocument";
export declare class KnowledgeDocumentFavorite {
    id: string;
    documentId: string;
    document: KnowledgeDocument;
    userId: string;
    user: UserProfile;
    createdAt: Date;
}
