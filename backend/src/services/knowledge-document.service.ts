import { Repository, SelectQueryBuilder, ILike, DataSource } from "typeorm";
import { KnowledgeDocument } from "../entities/KnowledgeDocument";
import { KnowledgeDocumentTag } from "../entities/KnowledgeDocumentTag";
import { KnowledgeDocumentVersion } from "../entities/KnowledgeDocumentVersion";
import { AppDataSource } from "../config/database";
import {
  CreateKnowledgeDocumentDto,
  UpdateKnowledgeDocumentDto,
  KnowledgeDocumentQueryDto,
  PublishKnowledgeDocumentDto,
  ArchiveKnowledgeDocumentDto,
} from "../dto/knowledge-document.dto";

export class KnowledgeDocumentService {
  private knowledgeDocumentRepository: Repository<KnowledgeDocument>;
  private tagRepository: Repository<KnowledgeDocumentTag>;
  private versionRepository: Repository<KnowledgeDocumentVersion>;

  constructor(dataSource?: DataSource) {
    const ds = dataSource || AppDataSource;
    this.knowledgeDocumentRepository = ds.getRepository(KnowledgeDocument);
    this.tagRepository = ds.getRepository(KnowledgeDocumentTag);
    this.versionRepository = ds.getRepository(KnowledgeDocumentVersion);
  }

  async create(
    createDto: CreateKnowledgeDocumentDto,
    userId: string
  ): Promise<KnowledgeDocument> {
    // Crear el documento (sin incluir tags ya que es una relación separada)
    const { tags, ...documentData } = createDto;

    const document = this.knowledgeDocumentRepository.create({
      ...documentData,
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
      await this.updateTags(savedDocument.id, tags);
    }

    return this.findOne(savedDocument.id);
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

    return {
      documents,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<KnowledgeDocument> {
    const document = await this.knowledgeDocumentRepository.findOne({
      where: { id },
      relations: ["documentType", "tags", "createdByUser", "lastEditedByUser"],
    });

    if (!document) {
      throw new Error(`Documento con ID ${id} no encontrado`);
    }

    // Incrementar contador de visualizaciones
    await this.knowledgeDocumentRepository.increment({ id }, "viewCount", 1);

    return document;
  }

  async update(
    id: string,
    updateDto: UpdateKnowledgeDocumentDto,
    userId: string
  ): Promise<KnowledgeDocument> {
    const document = await this.findOne(id);

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

    // Actualizar documento
    const { tags, changeSummary, ...updateData } = updateDto;
    Object.assign(document, updateData, { lastEditedBy: userId });

    const savedDocument = await this.knowledgeDocumentRepository.save(document);

    // Actualizar tags si se proporcionaron
    if (tags !== undefined) {
      await this.updateTags(id, tags);
    }

    return this.findOne(id);
  }

  async publish(
    id: string,
    publishDto: PublishKnowledgeDocumentDto,
    userId: string
  ): Promise<KnowledgeDocument> {
    const document = await this.findOne(id);

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
      .leftJoinAndSelect("doc.tags", "tags")
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
    tagNames: string[]
  ): Promise<void> {
    // Eliminar tags existentes
    await this.tagRepository.delete({ documentId });

    // Crear nuevos tags
    if (tagNames.length > 0) {
      const tags = tagNames.map((tagName) =>
        this.tagRepository.create({
          documentId,
          tagName: tagName.trim().toLowerCase(),
        })
      );
      await this.tagRepository.save(tags);
    }
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
}
