"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentFeedbackService = void 0;
const KnowledgeDocumentFeedback_1 = require("../entities/KnowledgeDocumentFeedback");
const KnowledgeDocument_1 = require("../entities/KnowledgeDocument");
const database_1 = require("../config/database");
class DocumentFeedbackService {
    constructor(dataSource) {
        const ds = dataSource || database_1.AppDataSource;
        this.feedbackRepository = ds.getRepository(KnowledgeDocumentFeedback_1.KnowledgeDocumentFeedback);
        this.documentRepository = ds.getRepository(KnowledgeDocument_1.KnowledgeDocument);
    }
    async create(createDto, userId) {
        const document = await this.documentRepository.findOne({
            where: { id: createDto.documentId },
        });
        if (!document) {
            throw new Error(`Documento con ID ${createDto.documentId} no encontrado`);
        }
        const existingFeedback = await this.feedbackRepository.findOne({
            where: {
                documentId: createDto.documentId,
                userId: userId,
            },
        });
        if (existingFeedback) {
            throw new Error("Ya has proporcionado feedback para este documento");
        }
        const feedback = this.feedbackRepository.create({
            ...createDto,
            userId,
        });
        const savedFeedback = await this.feedbackRepository.save(feedback);
        await this.updateDocumentCounters(createDto.documentId);
        return this.findOne(savedFeedback.id);
    }
    async findOne(id) {
        const feedback = await this.feedbackRepository.findOne({
            where: { id },
            relations: ["document", "user"],
        });
        if (!feedback) {
            throw new Error(`Feedback con ID ${id} no encontrado`);
        }
        return feedback;
    }
    async findByDocument(documentId) {
        return this.feedbackRepository.find({
            where: { documentId },
            relations: ["user"],
            order: { createdAt: "DESC" },
        });
    }
    async findUserFeedback(documentId, userId) {
        return this.feedbackRepository.findOne({
            where: {
                documentId,
                userId,
            },
            relations: ["document", "user"],
        });
    }
    async findByUser(userId) {
        return this.feedbackRepository.find({
            where: { userId },
            relations: ["document"],
            order: { createdAt: "DESC" },
        });
    }
    async update(id, updateDto, userId) {
        const feedback = await this.feedbackRepository.findOne({
            where: { id, userId },
        });
        if (!feedback) {
            throw new Error("Feedback no encontrado o no tienes permisos para editarlo");
        }
        const oldIsHelpful = feedback.isHelpful;
        Object.assign(feedback, updateDto);
        const savedFeedback = await this.feedbackRepository.save(feedback);
        if (updateDto.isHelpful !== undefined &&
            updateDto.isHelpful !== oldIsHelpful) {
            await this.updateDocumentCounters(feedback.documentId);
        }
        return this.findOne(savedFeedback.id);
    }
    async remove(id, userId) {
        const feedback = await this.feedbackRepository.findOne({
            where: { id, userId },
        });
        if (!feedback) {
            throw new Error("Feedback no encontrado o no tienes permisos para eliminarlo");
        }
        const documentId = feedback.documentId;
        await this.feedbackRepository.remove(feedback);
        await this.updateDocumentCounters(documentId);
    }
    async getUserFeedbackForDocument(documentId, userId) {
        return this.feedbackRepository.findOne({
            where: {
                documentId,
                userId,
            },
        });
    }
    async getDocumentStats(documentId) {
        const totalFeedback = await this.feedbackRepository.count({
            where: { documentId },
        });
        const helpfulCount = await this.feedbackRepository.count({
            where: { documentId, isHelpful: true },
        });
        const notHelpfulCount = totalFeedback - helpfulCount;
        const helpfulPercentage = totalFeedback > 0 ? Math.round((helpfulCount / totalFeedback) * 100) : 0;
        const recentComments = await this.feedbackRepository.find({
            where: {
                documentId,
            },
            relations: ["user"],
            order: { createdAt: "DESC" },
            take: 5,
        });
        const commentsWithText = recentComments.filter((comment) => comment.comment && comment.comment.trim().length > 0);
        return {
            totalFeedback,
            helpfulCount,
            notHelpfulCount,
            helpfulPercentage,
            recentComments: commentsWithText,
        };
    }
    async updateDocumentCounters(documentId) {
        const helpfulCount = await this.feedbackRepository.count({
            where: { documentId, isHelpful: true },
        });
        const notHelpfulCount = await this.feedbackRepository.count({
            where: { documentId, isHelpful: false },
        });
        await this.documentRepository.update(documentId, {
            helpfulCount,
            notHelpfulCount,
        });
    }
}
exports.DocumentFeedbackService = DocumentFeedbackService;
