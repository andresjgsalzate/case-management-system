import { UserProfile } from "./UserProfile";
import { KnowledgeDocument } from "./KnowledgeDocument";
export declare class DocumentType {
    id: string;
    code: string;
    name: string;
    description: string | null;
    icon: string | null;
    color: string;
    isActive: boolean;
    displayOrder: number;
    createdBy: string;
    createdByUser: Promise<UserProfile>;
    documents: KnowledgeDocument[];
    createdAt: Date;
    updatedAt: Date;
}
