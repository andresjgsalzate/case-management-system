import { KnowledgeDocument } from "./KnowledgeDocument";
import { UserProfile } from "./UserProfile";
export type KnowledgeReviewEventType = "SUBMITTED" | "APPROVED" | "REJECTED" | "PUBLISHED" | "UNPUBLISHED" | "REPUBLISHED" | "RETURNED_TO_DRAFT";
export declare class KnowledgeDocumentReviewEvent {
    id: string;
    documentId: string;
    document: KnowledgeDocument;
    eventType: KnowledgeReviewEventType;
    actorUserId: string | null;
    actorUser: Promise<UserProfile | null>;
    fromStatus: string | null;
    toStatus: string | null;
    comments: string | null;
    createdAt: Date;
}
