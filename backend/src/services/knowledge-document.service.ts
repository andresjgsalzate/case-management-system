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

  async findAll(
    query: KnowledgeDocumentQueryDto,
    userId?: string,
    userPermissions?: string[]
  ): Promise<{
    documents: KnowledgeDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.createQueryBuilder();

    this.applyFilters(queryBuilder, query);
    this.applyPermissionFilters(queryBuilder, userId, userPermissions);
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
    limit: number = 10,
    userId?: string,
    userPermissions?: string[]
  ): Promise<KnowledgeDocument[]> {
    const queryBuilder = this.knowledgeDocumentRepository
      .createQueryBuilder("doc")
      .leftJoinAndSelect("doc.tags", "tags")
      .leftJoinAndSelect("doc.documentType", "type")
      .leftJoinAndSelect("doc.createdByUser", "creator")
      .andWhere(
        `(
        doc.title ILIKE :search 
        OR doc.content ILIKE :search 
        OR tags.tagName ILIKE :search
        OR :searchTerm = ANY(doc.associatedCases)
        OR EXISTS (
          SELECT 1 FROM cases c 
          WHERE c.id = ANY(doc.associatedCases) 
          AND c.caseNumber ILIKE :search
        )
      )`,
        {
          search: `%${searchTerm}%`,
          searchTerm: searchTerm,
        }
      );

    // Aplicar filtros de permisos
    this.applyPermissionFilters(queryBuilder, userId, userPermissions);

    return queryBuilder
      .orderBy("doc.viewCount", "DESC")
      .addOrderBy("doc.updatedAt", "DESC")
      .limit(limit)
      .getMany();
  }

  // Nuevo método para sugerencias de búsqueda
  async getSearchSuggestions(
    searchTerm: string,
    limit: number = 5,
    userId?: string,
    userPermissions?: string[]
  ): Promise<{
    documents: Array<{ id: string; title: string; type: "document" }>;
    tags: Array<{ name: string; type: "tag" }>;
    cases: Array<{ id: string; caseNumber: string; type: "case" }>;
  }> {
    if (!searchTerm || searchTerm.length < 2) {
      return { documents: [], tags: [], cases: [] };
    }

    // Sugerencias de documentos
    const documentSuggestions = await this.knowledgeDocumentRepository
      .createQueryBuilder("doc")
      .select(["doc.id", "doc.title"])
      .andWhere("doc.title ILIKE :search", { search: `%${searchTerm}%` })
      .andWhere("doc.isArchived = :archived", { archived: false });

    this.applyPermissionFilters(documentSuggestions, userId, userPermissions);

    const documents = await documentSuggestions
      .orderBy("doc.viewCount", "DESC")
      .limit(limit)
      .getMany();

    // Sugerencias de etiquetas
    const tagSuggestions = await AppDataSource.getRepository(
      require("../entities/KnowledgeDocumentTag").KnowledgeDocumentTag
    )
      .createQueryBuilder("tag")
      .select(["tag.tagName"])
      .andWhere("tag.tagName ILIKE :search", { search: `%${searchTerm}%` })
      .andWhere("tag.isActive = :active", { active: true })
      .groupBy("tag.tagName")
      .orderBy("COUNT(tag.tagName)", "DESC")
      .limit(limit)
      .getRawMany();

    // Sugerencias de casos (si existe la tabla cases)
    let caseSuggestions: any[] = [];
    try {
      caseSuggestions = await AppDataSource.query(
        `
        SELECT DISTINCT c.id, c."caseNumber" 
        FROM cases c 
        WHERE c."caseNumber" ILIKE $1 
        AND c."isArchived" = false
        ORDER BY c."createdAt" DESC 
        LIMIT $2
      `,
        [`%${searchTerm}%`, limit]
      );
    } catch (error) {
      // Si la tabla cases no existe, ignorar
      console.log("Cases table not found, skipping case suggestions");
    }

    return {
      documents: documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        type: "document" as const,
      })),
      tags: tagSuggestions.map((tag) => ({
        name: tag.tagName,
        type: "tag" as const,
      })),
      cases: caseSuggestions.map((case_) => ({
        id: case_.id,
        caseNumber: case_.caseNumber,
        type: "case" as const,
      })),
    };
  }

  // Método mejorado para búsqueda avanzada
  async enhancedSearch(
    query: {
      search?: string;
      tags?: string[];
      caseNumber?: string;
      documentTypeId?: string;
      priority?: string;
      isPublished?: boolean;
      limit?: number;
      page?: number;
    },
    userId?: string,
    userPermissions?: string[]
  ): Promise<{
    documents: KnowledgeDocument[];
    total: number;
    searchStats: {
      foundInTitle: number;
      foundInContent: number;
      foundInTags: number;
      foundInCases: number;
    };
  }> {
    const queryBuilder = this.createQueryBuilder();
    let searchStats = {
      foundInTitle: 0,
      foundInContent: 0,
      foundInTags: 0,
      foundInCases: 0,
    };

    // Agregar join para tags
    queryBuilder.leftJoinAndSelect("doc.tags", "tags");

    if (query.search) {
      const searchConditions = [];
      const params: any = {
        search: `%${query.search}%`,
        searchTerm: query.search,
      };

      // Búsqueda en título
      searchConditions.push("doc.title ILIKE :search");

      // Búsqueda en contenido
      searchConditions.push("doc.content ILIKE :search");

      // Búsqueda en etiquetas
      searchConditions.push("tags.tagName ILIKE :search");

      // Búsqueda en casos asociados
      searchConditions.push(":searchTerm = ANY(doc.associatedCases)");

      // Búsqueda por número de caso
      searchConditions.push(`EXISTS (
        SELECT 1 FROM cases c 
        WHERE c.id = ANY(doc.associatedCases) 
        AND c.caseNumber ILIKE :search
      )`);

      queryBuilder.andWhere(`(${searchConditions.join(" OR ")})`, params);

      // Calcular estadísticas de búsqueda
      const titleMatches = await this.knowledgeDocumentRepository
        .createQueryBuilder("doc")
        .andWhere("doc.title ILIKE :search", params)
        .getCount();
      searchStats.foundInTitle = titleMatches;
    }

    // Aplicar otros filtros
    if (query.tags && query.tags.length > 0) {
      queryBuilder.andWhere("tags.tagName IN (:...tagNames)", {
        tagNames: query.tags,
      });
    }

    if (query.caseNumber) {
      queryBuilder.andWhere(
        "EXISTS (SELECT 1 FROM cases c WHERE c.id = ANY(doc.associatedCases) AND c.caseNumber ILIKE :caseSearch)",
        { caseSearch: `%${query.caseNumber}%` }
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

    if (query.isPublished !== undefined) {
      queryBuilder.andWhere("doc.isPublished = :published", {
        published: query.isPublished,
      });
    }

    // Aplicar filtros de permisos
    this.applyPermissionFilters(queryBuilder, userId, userPermissions);

    // Paginación
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 50);
    const offset = (page - 1) * limit;

    // Ordenamiento inteligente: relevancia + popularidad
    if (query.search) {
      queryBuilder
        .addSelect(
          `
        CASE 
          WHEN doc.title ILIKE :titleSearch THEN 3
          WHEN tags.tagName ILIKE :tagSearch THEN 2  
          WHEN doc.content ILIKE :contentSearch THEN 1
          ELSE 0
        END as relevance_score
      `
        )
        .setParameter("titleSearch", `%${query.search}%`)
        .setParameter("tagSearch", `%${query.search}%`)
        .setParameter("contentSearch", `%${query.search}%`)
        .orderBy("relevance_score", "DESC")
        .addOrderBy("doc.viewCount", "DESC");
    } else {
      queryBuilder.orderBy("doc.updatedAt", "DESC");
    }

    const [documents, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      documents,
      total,
      searchStats,
    };
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

  private applyPermissionFilters(
    queryBuilder: SelectQueryBuilder<KnowledgeDocument>,
    userId?: string,
    userPermissions?: string[]
  ): void {
    if (!userId || !userPermissions) {
      // Si no hay información de usuario, mostrar solo documentos publicados
      queryBuilder.andWhere("doc.isPublished = :published", {
        published: true,
      });
      queryBuilder.andWhere("doc.isArchived = :archived", { archived: false });
      return;
    }

    // Determinar el nivel de permisos del usuario
    // CLAVE: Solo usuarios con permisos de EDICIÓN pueden ver documentos no publicados de otros
    const hasAllEditPermissions = userPermissions.some(
      (p) =>
        p.includes("knowledge.update.all") || p.includes("knowledge.delete.all")
    );

    const hasTeamEditPermissions = userPermissions.some(
      (p) =>
        p.includes("knowledge.update.team") ||
        p.includes("knowledge.delete.team")
    );

    const hasOwnEditPermissions = userPermissions.some(
      (p) =>
        p.includes("knowledge.update.own") || p.includes("knowledge.delete.own")
    );

    // También verificar permisos de lectura para determinar el alcance
    const hasAllReadPermissions = userPermissions.some((p) =>
      p.includes("knowledge.read.all")
    );
    const hasTeamReadPermissions = userPermissions.some((p) =>
      p.includes("knowledge.read.team")
    );
    const hasOwnReadPermissions = userPermissions.some((p) =>
      p.includes("knowledge.read.own")
    );

    // Siempre excluir documentos archivados
    queryBuilder.andWhere("doc.isArchived = :archived", { archived: false });

    if (hasAllEditPermissions) {
      // Usuario con permisos de EDICIÓN ALL: puede ver todos los documentos (publicados y no publicados)
      console.log(
        `🔓 Usuario ${userId} tiene permisos de EDICIÓN ALL - puede ver todos los documentos`
      );
      // No agregar filtros adicionales
    } else if (hasTeamEditPermissions) {
      // Usuario con permisos de EDICIÓN TEAM: puede ver documentos del team completos + documentos publicados de otros
      console.log(
        `👥 Usuario ${userId} tiene permisos de EDICIÓN TEAM - aplicando filtros apropiados`
      );
      queryBuilder.andWhere(
        "(doc.createdBy = :userId OR doc.isPublished = :published)",
        { userId, published: true }
      );
    } else if (hasOwnEditPermissions || hasOwnReadPermissions) {
      // Usuario con permisos OWN (edición o solo lectura): puede ver sus documentos completos + documentos publicados de otros
      console.log(
        `👤 Usuario ${userId} tiene permisos OWN - puede ver sus documentos + documentos publicados de otros`
      );
      queryBuilder.andWhere(
        "(doc.createdBy = :userId OR doc.isPublished = :published)",
        { userId, published: true }
      );
    } else if (hasAllReadPermissions || hasTeamReadPermissions) {
      // Usuario con solo permisos de LECTURA (sin edición): solo documentos publicados + sus propios documentos
      console.log(
        `📖 Usuario ${userId} tiene solo permisos de LECTURA - solo documentos publicados + propios`
      );
      queryBuilder.andWhere(
        "(doc.createdBy = :userId OR doc.isPublished = :published)",
        { userId, published: true }
      );
    } else {
      // Usuario sin permisos específicos: solo documentos publicados
      console.log(
        `🔒 Usuario ${userId} sin permisos específicos - solo documentos publicados`
      );
      queryBuilder.andWhere("doc.isPublished = :published", {
        published: true,
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
