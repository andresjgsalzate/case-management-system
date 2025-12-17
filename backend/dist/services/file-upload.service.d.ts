import multer from "multer";
import { KnowledgeDocumentAttachment } from "../entities/KnowledgeDocumentAttachment";
export declare const uploadConfig: multer.Multer;
export declare class FileUploadService {
    private attachmentRepository;
    private userRepository;
    processUploadedFile(file: Express.Multer.File, knowledgeDocumentId: string, userId: string): Promise<KnowledgeDocumentAttachment>;
    deleteFile(attachmentId: string, userId: string): Promise<boolean>;
    getDocumentAttachments(knowledgeDocumentId: string): Promise<KnowledgeDocumentAttachment[]>;
    getFileForDownload(fileName: string): Promise<{
        filePath: string;
        originalName: string;
        mimeType: string;
    }>;
    private getFileType;
    private generateThumbnail;
}
export declare const fileUploadService: FileUploadService;
