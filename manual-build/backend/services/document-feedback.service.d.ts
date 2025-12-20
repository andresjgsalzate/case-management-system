import { DataSource } from "typeorm";
import { KnowledgeDocumentFeedback } from "../entities/KnowledgeDocumentFeedback";
import { CreateDocumentFeedbackDto, UpdateDocumentFeedbackDto } from "../dto/document-feedback.dto";
export declare class DocumentFeedbackService {
    private feedbackRepository;
    private documentRepository;
    constructor(dataSource?: DataSource);
    create(createDto: CreateDocumentFeedbackDto, userId: string): Promise<KnowledgeDocumentFeedback>;
    findOne(id: string): Promise<KnowledgeDocumentFeedback>;
    findByDocument(documentId: string): Promise<KnowledgeDocumentFeedback[]>;
    findUserFeedback(documentId: string, userId: string): Promise<KnowledgeDocumentFeedback | null>;
    findByUser(userId: string): Promise<KnowledgeDocumentFeedback[]>;
    update(id: string, updateDto: UpdateDocumentFeedbackDto, userId: string): Promise<KnowledgeDocumentFeedback>;
    remove(id: string, userId: string): Promise<void>;
    getUserFeedbackForDocument(documentId: string, userId: string): Promise<KnowledgeDocumentFeedback | null>;
    getDocumentStats(documentId: string): Promise<{
        totalFeedback: number;
        helpfulCount: number;
        notHelpfulCount: number;
        helpfulPercentage: number;
        recentComments: KnowledgeDocumentFeedback[];
    }>;
    private updateDocumentCounters;
}
