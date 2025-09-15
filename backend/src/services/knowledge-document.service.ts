import { Repository, SelectQueryBuilder, ILike, DataSource } from "typeorm";
import { KnowledgeDocument } from "../entities/KnowledgeDocument";
import { KnowledgeDocumentVersion } from "../entities/KnowledgeDocumentVersion";
import { AppDataSource } from "../config/database";
import { KnowledgeTagService } from "./knowledge-tag.service";
import {
  CreateKnowledgeDocumentDto,
  UpdateKnowledgeDocumentDto,
  KnowledgeDocumentQueryDto,
  PublishKnowledgeDocumentDto,
  ArchiveKnowledgeDocumentDto,
} from "../dto/knowledge-document.dto";

export class KnowledgeDocumentService {
  private knowledgeDocumentRepository: Repository<KnowledgeDocument>;
  private versionRepository: Repository<KnowledgeDocumentVersion>;
  private knowledgeTagService: KnowledgeTagService;

  constructor(dataSource?: DataSource) {
    const ds = dataSource || AppDataSource;
    this.knowledgeDocumentRepository = ds.getRepository(KnowledgeDocument);
    this.versionRepository = ds.getRepository(KnowledgeDocumentVersion);
    this.knowledgeTagService = new KnowledgeTagService(ds);
  }

  async create(
    createDto: CreateKnowledgeDocumentDto,
    userId: string
  ): Promise<KnowledgeDocument> {
    // Crear el documento (sin incluir tags ya que es una relación separada)
    const { tags, associatedCases, ...documentData } = createDto;

    const document = this.knowledgeDocumentRepository.create({
      ...documentData,
      associatedCases: associatedCases || [], // Asignar casos asociados o array vacío
      createdBy: userId,
      lastEditedBy: userId,
    });

    const savedDocument = await this.knowledgeDocumentRepository.save(document);

    // Crear versión inicial
    await this.createVersion(
      savedDocument.id,
      {
        content: createDto.jsonContent,
        title: createDto.title,
        changeSummary: "Versión inicial",
      },
      userId
    );

    // Crear tags si existen
    if (tags && tags.length > 0) {
      await this.updateTags(savedDocument.id, tags, userId);
    }

    const result = await this.findOne(savedDocument.id);
    if (!result) {
      throw new Error(
        `Document with id ${savedDocument.id} not found after creation`
      );
    }
    return result;
  }

  async findAll(query: KnowledgeDocumentQueryDto): Promise<{
    documents: KnowledgeDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.createQueryBuilder();

    this.applyFilters(queryBuilder, query);
    this.applySorting(queryBuilder, query);

    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 50); // Máximo 50 por página
    const offset = (page - 1) * limit;

    const [documents, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    // Cargar las etiquetas para todos los documentos usando el nuevo sistema
    const documentsWithTags = await Promise.all(
      documents.map((doc) => this.loadDocumentTags(doc))
    );

    return {
      documents: documentsWithTags,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<KnowledgeDocument | null> {
    try {
      console.log(`� [FIND ONE] Buscando documento con ID: ${id}`);
      console.log(`�📄 [EDIT MODE] Looking for document with ID: ${id}`);
      const document = await this.knowledgeDocumentRepository
        .createQueryBuilder("doc")
        .leftJoinAndSelect("doc.documentType", "documentType")
        .leftJoinAndSelect("doc.createdByUser", "createdByUser")
        .leftJoinAndSelect("doc.lastEditedByUser", "lastEditedByUser")
        .leftJoinAndSelect("doc.versions", "versions")
        .leftJoinAndSelect("versions.createdByUser", "versionCreatedBy")
        .leftJoinAndSelect("doc.attachments", "attachments")
        .where("doc.id = :id", { id })
        .getOne();

      if (document) {
        console.log(
          `📄 [EDIT MODE] Document found: ${document.title}, attachments: ${
            document.attachments?.length || 0
          }`
        );

        // Resolver relaciones lazy manualmente
        const documentType = await document.documentType;
        const createdByUser = await document.createdByUser;
        const lastEditedByUser = await document.lastEditedByUser;

        // Debug: Verificar relaciones después de resolver
        console.log(`🔍 [DEBUG BACKEND] Document relations resolved:`, {
          hasDocumentType: !!documentType,
          documentTypeName: documentType?.name,
          hasCreatedByUser: !!createdByUser,
          createdByUserName: createdByUser?.fullName,
        });

        // Asignar las relaciones resueltas al documento
        (document as any).documentType = documentType;
        (document as any).createdByUser = createdByUser;
        (document as any).lastEditedByUser = lastEditedByUser;

        // Cargar etiquetas usando el método del nuevo sistema
        const documentWithTags = await this.loadDocumentTags(document);
        console.log(
          `🏷️ [EDIT MODE] Document tags loaded count: ${
            documentWithTags.tags ? documentWithTags.tags.length : 0
          }`
        );

        // Log attachment details for debugging
        if (
          documentWithTags.attachments &&
          documentWithTags.attachments.length > 0
        ) {
          console.log(
            `📎 [EDIT MODE] Document attachments:`,
            documentWithTags.attachments.map((att) => ({
              id: att.id,
              fileName: att.fileName,
              filePath: att.filePath,
              mimeType: att.mimeType,
              fileSize: att.fileSize,
            }))
          );
        }

        // Debug: Log final document before sending to frontend
        console.log(
          "📤 [DEBUG BACKEND] Final document being sent to frontend:",
          {
            id: documentWithTags.id,
            title: documentWithTags.title,
            hasDocumentType: !!(documentWithTags as any).documentType,
            hasCreatedByUser: !!(documentWithTags as any).createdByUser,
            documentTypeValue: (documentWithTags as any).documentType,
            createdByUserValue: (documentWithTags as any).createdByUser,
            allKeys: Object.keys(documentWithTags),
          }
        );

        return documentWithTags;
      } else {
        console.log(`❌ [EDIT MODE] Document with ID ${id} not found`);
      }

      return document;
    } catch (error) {
      console.error("Error finding document:", error);
      throw error;
    }
  }

  async update(
    id: string,
    updateDto: UpdateKnowledgeDocumentDto,
    userId: string
  ): Promise<KnowledgeDocument> {
    const document = await this.findOne(id);

    if (!document) {
      throw new Error(`Document with id ${id} not found`);
    }

    if (document.isArchived) {
      throw new Error("No se puede editar un documento archivado");
    }

    // Si se está actualizando el contenido, crear nueva versión
    if (updateDto.jsonContent) {
      document.version += 1;
      await this.createVersion(
        id,
        {
          content: updateDto.jsonContent,
          title: updateDto.title || document.title,
          changeSummary:
            updateDto.changeSummary || "Actualización de contenido",
        },
        userId
      );
    }

    // Actualizar documento - evitar actualizar relaciones anidadas
    const { tags, changeSummary, associatedCases, ...updateData } = updateDto;

    // Remover las relaciones anidadas para evitar que TypeORM las actualice incorrectamente
    const documentToUpdate = {
      ...updateData,
      ...(associatedCases !== undefined && { associatedCases }), // Solo actualizar si se proporciona
      lastEditedBy: userId,
      id: document.id,
    };

    // Usar update en lugar de save para evitar problemas con relaciones anidadas
    await this.knowledgeDocumentRepository.update(id, documentToUpdate);

    // Actualizar tags si se proporcionaron
    if (tags !== undefined) {
      await this.updateTags(id, tags, userId);
    }

    const result = await this.findOne(id);
    if (!result) {
      throw new Error(`Document with id ${id} not found after update`);
    }
    return result;
  }

  async publish(
    id: string,
    publishDto: PublishKnowledgeDocumentDto,
    userId: string
  ): Promise<KnowledgeDocument> {
    const document = await this.findOne(id);

    if (!document) {
      throw new Error(`Document with id ${id} not found`);
    }

    if (document.isArchived) {
      throw new Error("No se puede publicar un documento archivado");
    }

    document.isPublished = publishDto.isPublished;
    document.publishedAt = publishDto.isPublished ? new Date() : null;
    document.lastEditedBy = userId;

    // Si se está despublicando, crear versión
    if (!publishDto.isPublished) {
      document.version += 1;
      await this.createVersion(
        id,
        {
          content: document.jsonContent,
          title: document.title,
          changeSummary: publishDto.changeSummary || "Documento despublicado",
        },
        userId
      );
    }

    return this.knowledgeDocumentRepository.save(document);
  }

  async archive(
    id: string,
    archiveDto: ArchiveKnowledgeDocumentDto,
    userId: string
  ): Promise<KnowledgeDocument> {
    const document = await this.findOne(id);

    if (!document) {
      throw new Error(`Document with id ${id} not found`);
    }

    document.isArchived = archiveDto.isArchived;
    document.archivedAt = archiveDto.isArchived ? new Date() : null;
    document.archivedBy = archiveDto.isArchived ? userId : null;
    document.replacementDocumentId = archiveDto.replacementDocumentId || null;
    document.lastEditedBy = userId;

    if (archiveDto.isArchived) {
      document.isPublished = false;
      document.publishedAt = null;
    }

    return this.knowledgeDocumentRepository.save(document);
  }

  async remove(id: string): Promise<void> {
    const document = await this.findOne(id);
    if (!document) {
      throw new Error(`Document with id ${id} not found`);
    }
    await this.knowledgeDocumentRepository.remove(document);
  }

  async getVersions(documentId: string): Promise<KnowledgeDocumentVersion[]> {
    return this.versionRepository.find({
      where: { documentId },
      order: { versionNumber: "DESC" },
      relations: ["createdByUser"],
    });
  }

  async getVersion(
    documentId: string,
    versionNumber: number
  ): Promise<KnowledgeDocumentVersion> {
    const version = await this.versionRepository.findOne({
      where: { documentId, versionNumber },
      relations: ["createdByUser"],
    });

    if (!version) {
      throw new Error(
        `Versión ${versionNumber} del documento ${documentId} no encontrada`
      );
    }

    return version;
  }

  async searchContent(
    searchTerm: string,
    limit: number = 10
  ): Promise<KnowledgeDocument[]> {
    return this.knowledgeDocumentRepository
      .createQueryBuilder("doc")
      .where("doc.isPublished = true")
      .andWhere("doc.isArchived = false")
      .andWhere("(doc.title ILIKE :search OR doc.content ILIKE :search)", {
        search: `%${searchTerm}%`,
      })
      .orderBy("doc.viewCount", "DESC")
      .limit(limit)
      .getMany();
  }

  private createQueryBuilder(): SelectQueryBuilder<KnowledgeDocument> {
    return this.knowledgeDocumentRepository
      .createQueryBuilder("doc")
      .leftJoinAndSelect("doc.documentType", "type")
      .leftJoinAndSelect("doc.createdByUser", "creator")
      .leftJoinAndSelect("doc.lastEditedByUser", "editor");
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<KnowledgeDocument>,
    query: KnowledgeDocumentQueryDto
  ): void {
    if (query.search) {
      queryBuilder.andWhere(
        "(doc.title ILIKE :search OR doc.content ILIKE :search)",
        { search: `%${query.search}%` }
      );
    }

    if (query.documentTypeId) {
      queryBuilder.andWhere("doc.documentTypeId = :typeId", {
        typeId: query.documentTypeId,
      });
    }

    if (query.priority) {
      queryBuilder.andWhere("doc.priority = :priority", {
        priority: query.priority,
      });
    }

    if (query.difficultyLevel !== undefined) {
      queryBuilder.andWhere("doc.difficultyLevel = :difficulty", {
        difficulty: query.difficultyLevel,
      });
    }

    if (query.isPublished !== undefined) {
      queryBuilder.andWhere("doc.isPublished = :published", {
        published: query.isPublished,
      });
    }

    if (query.isTemplate !== undefined) {
      queryBuilder.andWhere("doc.isTemplate = :template", {
        template: query.isTemplate,
      });
    }

    if (query.isArchived !== undefined) {
      queryBuilder.andWhere("doc.isArchived = :archived", {
        archived: query.isArchived,
      });
    }

    if (query.tags && query.tags.length > 0) {
      queryBuilder.andWhere("tags.tagName IN (:...tagNames)", {
        tagNames: query.tags,
      });
    }
  }

  private applySorting(
    queryBuilder: SelectQueryBuilder<KnowledgeDocument>,
    query: KnowledgeDocumentQueryDto
  ): void {
    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder || "DESC";

    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "title",
      "viewCount",
      "helpfulCount",
      "publishedAt",
      "priority",
      "difficultyLevel",
    ];

    if (allowedSortFields.includes(sortBy)) {
      queryBuilder.orderBy(`doc.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy("doc.createdAt", "DESC");
    }
  }

  private async updateTags(
    documentId: string,
    tagNames: string[],
    userId?: string
  ): Promise<void> {
    console.log(
      `[updateTags] Updating tags for document ${documentId}:`,
      tagNames
    );
    console.log(`[updateTags] User ID:`, userId);

    // Usar el nuevo sistema de etiquetas
    await this.knowledgeTagService.assignTagsToDocument(
      documentId,
      tagNames,
      userId
    );

    console.log(
      `[updateTags] Tags updated successfully for document ${documentId}`
    );
  }

  /**
   * Cargar las etiquetas de un documento usando el nuevo sistema
   */
  private async loadDocumentTags(
    document: KnowledgeDocument
  ): Promise<KnowledgeDocument> {
    console.log(
      "🔍 [KnowledgeDocumentService] loadDocumentTags - Loading tags for document:",
      document.id
    );

    // Consultar las etiquetas asociadas al documento
    const tags = await this.knowledgeTagService.getDocumentTags(document.id);

    // Asignar las etiquetas al documento (manteniendo compatibilidad con el frontend)
    (document as any).tags = tags.map((tag) => ({
      id: tag.id,
      tagName: tag.tagName,
      color: tag.color,
      category: tag.category,
      description: tag.description,
      isActive: tag.isActive,
      createdBy: tag.createdBy,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
      // Mapear a la estructura que espera el frontend (sistema anterior)
      documentId: document.id,
    }));

    console.log(
      "✅ [KnowledgeDocumentService] loadDocumentTags - Loaded",
      (document as any).tags.length,
      "tags"
    );

    return document;
  }

  private async createVersion(
    documentId: string,
    versionData: { content: object; title: string; changeSummary: string },
    userId: string
  ): Promise<KnowledgeDocumentVersion> {
    // Obtener el último número de versión
    const lastVersion = await this.versionRepository.findOne({
      where: { documentId },
      order: { versionNumber: "DESC" },
    });

    const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    const version = this.versionRepository.create({
      documentId,
      versionNumber,
      content: versionData.content,
      title: versionData.title,
      changeSummary: versionData.changeSummary,
      createdBy: userId,
    });

    return this.versionRepository.save(version);
  }

  // ================================
}
