import { UserProfile } from "./UserProfile";
import { KnowledgeDocument } from "./KnowledgeDocument";
export type FileType = "image" | "document" | "spreadsheet" | "other";
export declare class KnowledgeDocumentAttachment {
    id: string;
    documentId: string;
    document: KnowledgeDocument;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    fileType: FileType | null;
    fileHash: string | null;
    thumbnailPath: string | null;
    processedPath: string | null;
    isEmbedded: boolean;
    uploadSessionId: string | null;
    uploadedBy: string;
    uploadedByUser: Promise<UserProfile>;
    createdAt: Date;
    updatedAt: Date;
}
