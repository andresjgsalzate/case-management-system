import { KnowledgeDocumentAttachment } from "../entities/KnowledgeDocumentAttachment";
export declare const initializeUploadDirectories: () => Promise<void>;
export declare const uploadConfig: any;
export declare class FileUploadService {
    private attachmentRepository;
    private userRepository;
    constructor();
    private getAttachmentRepository;
    private getUserRepository;
    static initialize(): Promise<void>;
    static createDocumentDirectories(noteId: string): Promise<string>;
    processUploadedFile(file: Express.Multer.File, knowledgeDocumentId: string, userId: string): Promise<any>;
    deleteFile(attachmentId: string, userId: string): Promise<boolean>;
    getDocumentAttachments(knowledgeDocumentId: string): Promise<KnowledgeDocumentAttachment[]>;
    getFileForDownload(fileName: string): Promise<{
        filePath: string;
        originalName: string;
        mimeType: string;
    }>;
    private getFileType;
}
export declare const fileUploadService: FileUploadService;
