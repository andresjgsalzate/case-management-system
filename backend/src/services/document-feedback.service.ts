import { Repository, DataSource } from "typeorm";
import { KnowledgeDocumentFeedback } from "../entities/KnowledgeDocumentFeedback";
import { KnowledgeDocument } from "../entities/KnowledgeDocument";
import { AppDataSource } from "../config/database";
import {
  CreateDocumentFeedbackDto,
  UpdateDocumentFeedbackDto,
} from "../dto/document-feedback.dto";

export class DocumentFeedbackService {
  private feedbackRepository: Repository<KnowledgeDocumentFeedback>;
  private documentRepository: Repository<KnowledgeDocument>;

  constructor(dataSource?: DataSource) {
    const ds = dataSource || AppDataSource;
    this.feedbackRepository = ds.getRepository(KnowledgeDocumentFeedback);
    this.documentRepository = ds.getRepository(KnowledgeDocument);
  }

  async create(
    createDto: CreateDocumentFeedbackDto,
    userId: string
  ): Promise<KnowledgeDocumentFeedback> {
    // Verificar que el documento existe
    const document = await this.documentRepository.findOne({
      where: { id: createDto.documentId },
    });

    if (!document) {
      throw new Error(`Documento con ID ${createDto.documentId} no encontrado`);
    }

    // Verificar si ya existe feedback del usuario para este documento
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

    // Actualizar contadores en el documento
    await this.updateDocumentCounters(createDto.documentId);

    return this.findOne(savedFeedback.id);
  }

  async findOne(id: string): Promise<KnowledgeDocumentFeedback> {
    const feedback = await this.feedbackRepository.findOne({
      where: { id },
      relations: ["document", "user"],
    });

    if (!feedback) {
      throw new Error(`Feedback con ID ${id} no encontrado`);
    }

    return feedback;
  }

  async findByDocument(
    documentId: string
  ): Promise<KnowledgeDocumentFeedback[]> {
    return this.feedbackRepository.find({
      where: { documentId },
      relations: ["user"],
      order: { createdAt: "DESC" },
    });
  }

  async findUserFeedback(
    documentId: string,
    userId: string
  ): Promise<KnowledgeDocumentFeedback | null> {
    return this.feedbackRepository.findOne({
      where: {
        documentId,
        userId,
      },
      relations: ["document", "user"],
    });
  }

  async findByUser(userId: string): Promise<KnowledgeDocumentFeedback[]> {
    return this.feedbackRepository.find({
      where: { userId },
      relations: ["document"],
      order: { createdAt: "DESC" },
    });
  }

  async update(
    id: string,
    updateDto: UpdateDocumentFeedbackDto,
    userId: string
  ): Promise<KnowledgeDocumentFeedback> {
    const feedback = await this.feedbackRepository.findOne({
      where: { id, userId }, // Solo el usuario puede editar su propio feedback
    });

    if (!feedback) {
      throw new Error(
        "Feedback no encontrado o no tienes permisos para editarlo"
      );
    }

    const oldIsHelpful = feedback.isHelpful;
    Object.assign(feedback, updateDto);

    const savedFeedback = await this.feedbackRepository.save(feedback);

    // Si cambió la valoración, actualizar contadores
    if (
      updateDto.isHelpful !== undefined &&
      updateDto.isHelpful !== oldIsHelpful
    ) {
      await this.updateDocumentCounters(feedback.documentId);
    }

    return this.findOne(savedFeedback.id);
  }

  async remove(id: string, userId: string): Promise<void> {
    const feedback = await this.feedbackRepository.findOne({
      where: { id, userId }, // Solo el usuario puede eliminar su propio feedback
    });

    if (!feedback) {
      throw new Error(
        "Feedback no encontrado o no tienes permisos para eliminarlo"
      );
    }

    const documentId = feedback.documentId;
    await this.feedbackRepository.remove(feedback);

    // Actualizar contadores en el documento
    await this.updateDocumentCounters(documentId);
  }

  async getUserFeedbackForDocument(
    documentId: string,
    userId: string
  ): Promise<KnowledgeDocumentFeedback | null> {
    return this.feedbackRepository.findOne({
      where: {
        documentId,
        userId,
      },
    });
  }

  async getDocumentStats(documentId: string): Promise<{
    totalFeedback: number;
    helpfulCount: number;
    notHelpfulCount: number;
    helpfulPercentage: number;
    recentComments: KnowledgeDocumentFeedback[];
  }> {
    const totalFeedback = await this.feedbackRepository.count({
      where: { documentId },
    });

    const helpfulCount = await this.feedbackRepository.count({
      where: { documentId, isHelpful: true },
    });

    const notHelpfulCount = totalFeedback - helpfulCount;
    const helpfulPercentage =
      totalFeedback > 0 ? Math.round((helpfulCount / totalFeedback) * 100) : 0;

    const recentComments = await this.feedbackRepository.find({
      where: {
        documentId,
      },
      relations: ["user"],
      order: { createdAt: "DESC" },
      take: 5,
    });

    // Filtrar solo los que tienen comentarios
    const commentsWithText = recentComments.filter(
      (comment) => comment.comment && comment.comment.trim().length > 0
    );

    return {
      totalFeedback,
      helpfulCount,
      notHelpfulCount,
      helpfulPercentage,
      recentComments: commentsWithText,
    };
  }

  private async updateDocumentCounters(documentId: string): Promise<void> {
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
