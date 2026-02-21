import { Repository, SelectQueryBuilder, ILike, DataSource, In } from "typeorm";
import { KnowledgeDocument } from "../entities/KnowledgeDocument";
import { KnowledgeDocumentVersion } from "../entities/KnowledgeDocumentVersion";
import { Case } from "../entities/Case";
import { TeamMember } from "../entities/TeamMember";
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
  private caseRepository: Repository<Case>;
  private teamMemberRepository: Repository<TeamMember>;
  private knowledgeTagService: KnowledgeTagService;

  constructor(dataSource?: DataSource) {
    const ds = dataSource || AppDataSource;
    this.knowledgeDocumentRepository = ds.getRepository(KnowledgeDocument);
    this.versionRepository = ds.getRepository(KnowledgeDocumentVersion);
    this.caseRepository = ds.getRepository(Case);
    this.teamMemberRepository = ds.getRepository(TeamMember);
    this.knowledgeTagService = new KnowledgeTagService(ds);
  }

  /**
   * Obtiene los IDs de equipos a los que pertenece un usuario
   */
  private async getUserTeamIds(userId: string): Promise<string[]> {
    try {
      const memberships = await this.teamMemberRepository.find({
        where: {
          userId: userId,
          isActive: true,
        },
        select: ["teamId"],
      });
      return memberships.map((m) => m.teamId);
    } catch (error) {
      console.error(`Error obteniendo equipos del usuario ${userId}:`, error);
      return [];
    }
  }

  async create(
    createDto: CreateKnowledgeDocumentDto,
    userId: string,
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
      userId,
    );

    // Crear tags si existen
    if (tags && tags.length > 0) {
      await this.updateTags(savedDocument.id, tags, userId);
    }

    const result = await this.findOne(savedDocument.id);
    if (!result) {
      throw new Error(
        `Document with id ${savedDocument.id} not found after creation`,
      );
    }
    return result;
  }

  async findAll(
    query: KnowledgeDocumentQueryDto,
    userId?: string,
    userPermissions?: string[],
  ): Promise<{
    documents: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.createQueryBuilder();

    // Obtener equipos del usuario para filtros de visibilidad
    const userTeamIds = userId ? await this.getUserTeamIds(userId) : [];

    this.applyFilters(queryBuilder, query);
    this.applyPermissionAndVisibilityFilters(
      queryBuilder,
      userId,
      userPermissions,
      userTeamIds,
    );
    this.applySorting(queryBuilder, query);

    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 50); // Máximo 50 por página
    const offset = (page - 1) * limit;

    const [documents, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    // Las etiquetas ya están cargadas por el join en createQueryBuilder
    // Mapear las etiquetas y resolver relaciones lazy
    const documentsWithTags = await Promise.all(
      documents.map(async (doc) => {
        // Resolver relaciones lazy
        const createdByUser = await doc.createdByUser;
        const documentType = await doc.documentType;

        // Mapear tags
        const tags =
          doc.tagRelations && doc.tagRelations.length > 0
            ? doc.tagRelations.map((relation) => ({
                id: relation.tag.id,
                tagName: relation.tag.tagName,
                color: relation.tag.color,
                category: relation.tag.category,
                description: relation.tag.description,
                isActive: relation.tag.isActive,
                createdBy: relation.tag.createdBy,
                createdAt: relation.tag.createdAt,
                updatedAt: relation.tag.updatedAt,
                documentId: doc.id,
              }))
            : [];

        // Crear objeto plano para asegurar serialización correcta
        return {
          ...doc,
          documentType: documentType
            ? {
                id: documentType.id,
                code: documentType.code,
                name: documentType.name,
                description: documentType.description,
                icon: documentType.icon,
                color: documentType.color,
                isActive: documentType.isActive,
                displayOrder: documentType.displayOrder,
              }
            : null,
          createdByUser: createdByUser
            ? {
                id: createdByUser.id,
                email: createdByUser.email,
                fullName: createdByUser.fullName,
                roleName: createdByUser.roleName,
              }
            : null,
          tags,
          tagRelations: undefined, // Remover tagRelations del response
        };
      }),
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
          }`,
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
        // Usar ambos formatos para compatibilidad con frontend
        (document as any).documentType = documentType;
        (document as any).__documentType__ = documentType;
        (document as any).createdByUser = createdByUser;
        (document as any).__createdByUser__ = createdByUser;
        (document as any).lastEditedByUser = lastEditedByUser;
        (document as any).__lastEditedByUser__ = lastEditedByUser;

        // Cargar etiquetas usando el método del nuevo sistema
        const documentWithTags = await this.loadDocumentTags(document);
        console.log(
          `🏷️ [EDIT MODE] Document tags loaded count: ${
            documentWithTags.tags ? documentWithTags.tags.length : 0
          }`,
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
            })),
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
          },
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
    userId: string,
  ): Promise<KnowledgeDocument> {
    const document = await this.findOne(id);

    if (!document) {
      throw new Error(`Document with id ${id} not found`);
    }

    if (document.isArchived) {
      throw new Error("No se puede editar un documento archivado");
    }

    // Detectar si hay cambios significativos en el contenido
    const hasContentChanges =
      updateDto.jsonContent || updateDto.title || updateDto.content;

    // Si el documento estaba publicado y hay cambios de contenido, volver a borrador
    const wasPublished =
      document.isPublished ||
      (document as any).reviewStatus === "published" ||
      (document as any).reviewStatus === "approved";

    let revertToDraft = false;
    if (wasPublished && hasContentChanges) {
      revertToDraft = true;
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
            updateDto.changeSummary ||
            (revertToDraft
              ? "Documento modificado - requiere nueva aprobación"
              : "Actualización de contenido"),
        },
        userId,
      );
    }

    // Actualizar documento - evitar actualizar relaciones anidadas
    const { tags, changeSummary, associatedCases, ...updateData } = updateDto;

    // Remover las relaciones anidadas para evitar que TypeORM las actualice incorrectamente
    const documentToUpdate: any = {
      ...updateData,
      ...(associatedCases !== undefined && { associatedCases }), // Solo actualizar si se proporciona
      lastEditedBy: userId,
      id: document.id,
    };

    // Si hay que volver a borrador, resetear estado de publicación y revisión
    if (revertToDraft) {
      documentToUpdate.isPublished = false;
      documentToUpdate.publishedAt = null;
      documentToUpdate.reviewStatus = "draft";
      documentToUpdate.reviewedBy = null;
      documentToUpdate.reviewedAt = null;
      documentToUpdate.reviewNotes = null;
    }

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
    userId: string,
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
        userId,
      );
    }

    return this.knowledgeDocumentRepository.save(document);
  }

  async archive(
    id: string,
    archiveDto: ArchiveKnowledgeDocumentDto,
    userId: string,
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
    versionNumber: number,
  ): Promise<KnowledgeDocumentVersion> {
    const version = await this.versionRepository.findOne({
      where: { documentId, versionNumber },
      relations: ["createdByUser"],
    });

    if (!version) {
      throw new Error(
        `Versión ${versionNumber} del documento ${documentId} no encontrada`,
      );
    }

    return version;
  }

  async searchContent(
    searchTerm: string,
    limit: number = 10,
    userId?: string,
    userPermissions?: string[],
  ): Promise<KnowledgeDocument[]> {
    // Obtener equipos del usuario para filtros de visibilidad
    const userTeamIds = userId ? await this.getUserTeamIds(userId) : [];

    const queryBuilder = this.knowledgeDocumentRepository
      .createQueryBuilder("doc")
      .leftJoinAndSelect("doc.tags", "tags")
      .leftJoinAndSelect("doc.documentType", "type")
      .leftJoinAndSelect("doc.createdByUser", "creator")
      .andWhere(
        `(
        unaccent(lower(doc.title)) LIKE unaccent(lower(:search))
        OR unaccent(lower(doc.content)) LIKE unaccent(lower(:search))
        OR unaccent(lower(tags."tag_name")) LIKE unaccent(lower(:search))
        OR doc."associated_cases"::jsonb @> (:searchTermJson)::jsonb
        OR EXISTS (
          SELECT 1 FROM cases c 
          WHERE doc."associated_cases"::jsonb ? c.id::text
          AND unaccent(lower(c."numeroCaso")) LIKE unaccent(lower(:search))
        )
      )`,
        {
          search: `%${searchTerm}%`,
          searchTermJson: JSON.stringify([searchTerm]),
        },
      );

    // Aplicar filtros de permisos y visibilidad
    this.applyPermissionAndVisibilityFilters(
      queryBuilder,
      userId,
      userPermissions,
      userTeamIds,
    );

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
    userPermissions?: string[],
  ): Promise<{
    documents: Array<{
      id: string;
      title: string;
      matchType: string;
      type: "document";
    }>;
    tags: Array<{ name: string; type: "tag" }>;
    cases: Array<{ id: string; caseNumber: string; type: "case" }>;
  }> {
    if (!searchTerm || searchTerm.length < 2) {
      return { documents: [], tags: [], cases: [] };
    }

    // Sugerencias de documentos - buscar en título, contenido y tags (insensible a acentos)
    const documentSuggestions = this.knowledgeDocumentRepository
      .createQueryBuilder("doc")
      .leftJoin("doc.tagRelations", "tagRelations")
      .leftJoin("tagRelations.tag", "tags")
      .select(["doc.id", "doc.title"])
      .addSelect(
        `CASE 
          WHEN unaccent(lower(doc.title)) LIKE unaccent(lower(:search)) THEN 'title'
          WHEN unaccent(lower(tags."tag_name")) LIKE unaccent(lower(:search)) THEN 'tag'
          WHEN unaccent(lower(doc.content)) LIKE unaccent(lower(:search)) THEN 'content'
          ELSE 'other'
        END`,
        "matchType",
      )
      .andWhere(
        `(unaccent(lower(doc.title)) LIKE unaccent(lower(:search))
          OR unaccent(lower(doc.content)) LIKE unaccent(lower(:search))
          OR unaccent(lower(tags."tag_name")) LIKE unaccent(lower(:search)))`,
        { search: `%${searchTerm}%` },
      )
      .andWhere("doc.isArchived = :archived", { archived: false });

    // Obtener equipos del usuario para filtros de visibilidad
    const userTeamIds = userId ? await this.getUserTeamIds(userId) : [];
    this.applyPermissionAndVisibilityFilters(
      documentSuggestions,
      userId,
      userPermissions,
      userTeamIds,
    );

    const documentsRaw = await documentSuggestions
      .orderBy(
        `CASE WHEN unaccent(lower(doc.title)) LIKE unaccent(lower(:search)) THEN 0 ELSE 1 END`,
        "ASC",
      )
      .addOrderBy("doc.viewCount", "DESC")
      .setParameter("search", `%${searchTerm}%`)
      .limit(limit)
      .getRawAndEntities();

    // Combinar resultados raw con entities para obtener matchType
    const documents = documentsRaw.entities.map((doc, index) => ({
      ...doc,
      matchType: documentsRaw.raw[index]?.matchType || "title",
    }));

    // Sugerencias de etiquetas (insensible a acentos) - Usando KnowledgeTag (tabla correcta)
    const tagSuggestions = await AppDataSource.getRepository(
      require("../entities/KnowledgeTag").KnowledgeTag,
    )
      .createQueryBuilder("tag")
      .select(["tag.tagName"])
      .andWhere("unaccent(lower(tag.tagName)) LIKE unaccent(lower(:search))", {
        search: `%${searchTerm}%`,
      })
      .andWhere("tag.isActive = :active", { active: true })
      .groupBy("tag.tagName")
      .orderBy("COUNT(tag.tagName)", "DESC")
      .limit(limit)
      .getRawMany();

    // Sugerencias de casos (si existe la tabla cases) - insensible a acentos
    let caseSuggestions: any[] = [];
    try {
      console.log(`🔍 Buscando casos con término: "${searchTerm}"`);
      caseSuggestions = await AppDataSource.query(
        `
        SELECT c.id, c."numeroCaso"
        FROM cases c 
        WHERE unaccent(lower(c."numeroCaso")) LIKE unaccent(lower($1))
        ORDER BY c."createdAt" DESC 
        LIMIT $2
      `,
        [`%${searchTerm}%`, limit],
      );
      console.log(
        `✅ Casos encontrados: ${caseSuggestions.length}`,
        caseSuggestions,
      );
    } catch (error: any) {
      // Si la tabla cases no existe o hay otro error, loguearlo
      console.log("❌ Error buscando casos:", error?.message || error);
    }

    return {
      documents: documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        matchType: doc.matchType,
        type: "document" as const,
      })),
      tags: tagSuggestions.map((tag) => ({
        name: tag.tagName,
        type: "tag" as const,
      })),
      cases: caseSuggestions.map((case_) => ({
        id: case_.id,
        caseNumber: case_.numeroCaso,
        type: "case" as const,
      })),
    };
  }

  /**
   * Calcula la relevancia de un documento basado en coincidencia de palabras
   * Similar a como funcionan los motores de búsqueda
   */
  private calculateWordRelevance(
    searchPhrase: string,
    document: {
      title: string;
      content: string | null;
      tags?: Array<{ tagName: string }>;
      cases?: Array<{ numeroCaso: string }>;
    },
  ): {
    score: number; // 0-100
    matchedWords: string[];
    totalWords: number;
    hasExactPhrase: boolean;
    matchLocations: ("title" | "content" | "tags" | "cases")[];
  } {
    // Normalizar texto removiendo acentos y convirtiendo a minúsculas
    const normalizeText = (text: string): string => {
      return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remover acentos
        .replace(/[^\w\s]/g, " ") // Remover caracteres especiales
        .replace(/\s+/g, " ")
        .trim();
    };

    const normalizedSearch = normalizeText(searchPhrase);
    const searchWords = normalizedSearch
      .split(" ")
      .filter((w) => w.length >= 2);

    if (searchWords.length === 0) {
      return {
        score: 0,
        matchedWords: [],
        totalWords: 0,
        hasExactPhrase: false,
        matchLocations: [],
      };
    }

    const normalizedTitle = normalizeText(document.title || "");
    const normalizedContent = normalizeText(document.content || "");
    const normalizedTags = (document.tags || [])
      .map((t) => normalizeText(t.tagName))
      .join(" ");
    const normalizedCases = (document.cases || [])
      .map((c) => normalizeText(c.numeroCaso))
      .join(" ");

    const fullText = `${normalizedTitle} ${normalizedContent} ${normalizedTags} ${normalizedCases}`;

    // Verificar si tiene la frase exacta
    const hasExactPhrase = fullText.includes(normalizedSearch);

    // Contar palabras coincidentes
    const matchedWords: string[] = [];
    const matchLocations: Set<"title" | "content" | "tags" | "cases"> =
      new Set();

    for (const word of searchWords) {
      if (fullText.includes(word)) {
        matchedWords.push(word);

        // Determinar dónde coincide
        if (normalizedTitle.includes(word)) matchLocations.add("title");
        if (normalizedContent.includes(word)) matchLocations.add("content");
        if (normalizedTags.includes(word)) matchLocations.add("tags");
        if (normalizedCases.includes(word)) matchLocations.add("cases");
      }
    }

    // Calcular score base (porcentaje de palabras encontradas)
    let score = (matchedWords.length / searchWords.length) * 100;

    // Bonus por frase exacta (+20%)
    if (hasExactPhrase) {
      score = Math.min(100, score + 20);
    }

    // Bonus por coincidencia en título (+10%)
    if (matchLocations.has("title")) {
      score = Math.min(100, score + 10);
    }

    // Penalización leve si solo coincide en contenido (-5%)
    if (matchLocations.size === 1 && matchLocations.has("content")) {
      score = Math.max(0, score - 5);
    }

    return {
      score: Math.round(score),
      matchedWords,
      totalWords: searchWords.length,
      hasExactPhrase,
      matchLocations: Array.from(matchLocations),
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
    userPermissions?: string[],
  ): Promise<{
    documents: Array<
      KnowledgeDocument & {
        relevanceScore?: number;
        matchedWords?: string[];
        totalSearchWords?: number;
        hasExactPhrase?: boolean;
        matchLocations?: string[];
      }
    >;
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

    // Las etiquetas ya están cargadas por el join en createQueryBuilder

    if (query.search) {
      // Dividir el término de búsqueda en palabras individuales
      const searchWords = query.search
        .trim()
        .split(/\s+/)
        .filter((word) => word.length >= 2); // Ignorar palabras muy cortas

      if (searchWords.length === 0) {
        searchWords.push(query.search.trim());
      }

      // Crear condiciones para cada palabra (OR entre palabras)
      const wordConditions: string[] = [];
      const params: any = {};

      searchWords.forEach((word, index) => {
        const paramName = `search${index}`;
        const paramNameJson = `searchJson${index}`;
        params[paramName] = `%${word}%`;
        params[paramNameJson] = JSON.stringify([word]);

        // Cada palabra puede coincidir en título, contenido, etiquetas o casos
        const wordSearchConditions = [
          // Búsqueda en título
          `unaccent(lower(doc.title)) LIKE unaccent(lower(:${paramName}))`,
          // Búsqueda en contenido
          `unaccent(lower(doc.content)) LIKE unaccent(lower(:${paramName}))`,
          // Búsqueda en etiquetas
          `EXISTS (
            SELECT 1 FROM knowledge_document_tag_relations kdtr
            INNER JOIN knowledge_tags kt ON kdtr.tag_id = kt.id
            WHERE kdtr.document_id = doc.id
            AND unaccent(lower(kt.tag_name)) LIKE unaccent(lower(:${paramName}))
          )`,
          // Búsqueda en casos asociados
          `EXISTS (
            SELECT 1 FROM cases c 
            WHERE doc."associated_cases"::jsonb ? c.id::text
            AND unaccent(lower(c."numeroCaso")) LIKE unaccent(lower(:${paramName}))
          )`,
        ];

        wordConditions.push(`(${wordSearchConditions.join(" OR ")})`);
      });

      // Unir todas las condiciones de palabras con OR (documento coincide si tiene al menos una palabra)
      queryBuilder.andWhere(`(${wordConditions.join(" OR ")})`, params);

      // Calcular estadísticas de búsqueda
      const titleMatches = await this.knowledgeDocumentRepository
        .createQueryBuilder("doc")
        .andWhere(`unaccent(lower(doc.title)) LIKE unaccent(lower(:search))`, {
          search: `%${query.search}%`,
        })
        .getCount();
      searchStats.foundInTitle = titleMatches;
    }

    // Aplicar otros filtros
    if (query.tags && query.tags.length > 0) {
      // Búsqueda case-insensitive de etiquetas usando EXISTS para no filtrar las etiquetas cargadas
      const tagConditions = query.tags
        .map(
          (_, index) => `EXISTS (
          SELECT 1 FROM knowledge_document_tag_relations kdtr
          INNER JOIN knowledge_tags kt ON kdtr.tag_id = kt.id
          WHERE kdtr.document_id = doc.id
          AND LOWER(kt.tag_name) = LOWER(:tagName${index})
        )`,
        )
        .join(" OR ");
      const tagParams = query.tags.reduce(
        (acc, tag, index) => {
          acc[`tagName${index}`] = tag;
          return acc;
        },
        {} as Record<string, string>,
      );
      queryBuilder.andWhere(`(${tagConditions})`, tagParams);
    }

    if (query.caseNumber) {
      queryBuilder.andWhere(
        `(
          doc."associated_cases"::jsonb @> (:caseNumberJson)::jsonb
          OR EXISTS (
            SELECT 1 FROM cases c 
            WHERE doc."associated_cases"::jsonb ? c.id::text
            AND unaccent(lower(c."numeroCaso")) LIKE unaccent(lower(:caseSearch))
          )
        )`,
        {
          caseNumberJson: JSON.stringify([query.caseNumber]),
          caseSearch: `%${query.caseNumber}%`,
        },
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

    // Aplicar filtros de permisos y visibilidad
    const userTeamIds = userId ? await this.getUserTeamIds(userId) : [];
    this.applyPermissionAndVisibilityFilters(
      queryBuilder,
      userId,
      userPermissions,
      userTeamIds,
    );

    // Paginación
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 50);
    const offset = (page - 1) * limit;

    // Ordenamiento inteligente: relevancia + popularidad
    if (query.search) {
      queryBuilder
        .addSelect(
          `CASE 
          WHEN "doc"."title" ILIKE :titleSearch THEN 3
          WHEN "tags"."tag_name" ILIKE :tagSearch THEN 2  
          WHEN "doc"."content" ILIKE :contentSearch THEN 1
          ELSE 0
        END`,
          "relevance_score",
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

    // Obtener todos los IDs de casos asociados únicos para cargarlos de una vez
    const allCaseIds = new Set<string>();
    documents.forEach((doc) => {
      if (doc.associatedCases && Array.isArray(doc.associatedCases)) {
        doc.associatedCases.forEach((caseId) => allCaseIds.add(caseId));
      }
    });

    // Cargar todos los casos de una vez (más eficiente)
    let casesMap = new Map<string, { numeroCaso: string }>();
    if (allCaseIds.size > 0) {
      const cases = await this.caseRepository.find({
        where: { id: In(Array.from(allCaseIds)) },
        select: ["id", "numeroCaso"],
      });
      cases.forEach((c) => casesMap.set(c.id, { numeroCaso: c.numeroCaso }));
    }

    // Las etiquetas ya están cargadas por el join en createQueryBuilder
    // Mapear las etiquetas y resolver relaciones lazy
    const documentsWithTags = await Promise.all(
      documents.map(async (doc) => {
        // Resolver relaciones lazy y asignar con formato __nombre__
        const createdByUser = await doc.createdByUser;
        const documentType = await doc.documentType;
        (doc as any).__createdByUser__ = createdByUser;
        (doc as any).__documentType__ = documentType;
        (doc as any).documentType = documentType; // Asignar directamente para el frontend

        // Extraer tags
        const tags =
          doc.tagRelations && doc.tagRelations.length > 0
            ? doc.tagRelations.map((relation) => ({
                id: relation.tag.id,
                tagName: relation.tag.tagName,
                color: relation.tag.color,
                category: relation.tag.category,
                description: relation.tag.description,
                isActive: relation.tag.isActive,
                createdBy: relation.tag.createdBy,
                createdAt: relation.tag.createdAt,
                updatedAt: relation.tag.updatedAt,
                documentId: doc.id,
              }))
            : [];

        (doc as any).tags = tags;

        // Obtener los casos asociados con sus números
        const associatedCases =
          doc.associatedCases && Array.isArray(doc.associatedCases)
            ? doc.associatedCases
                .map((caseId) => casesMap.get(caseId))
                .filter((c): c is { numeroCaso: string } => !!c)
            : [];

        // Calcular relevancia por palabras si hay término de búsqueda
        if (query.search && query.search.trim()) {
          const relevance = this.calculateWordRelevance(query.search, {
            title: doc.title,
            content: doc.content,
            tags: tags,
            cases: associatedCases,
          });

          (doc as any).relevanceScore = relevance.score;
          (doc as any).matchedWords = relevance.matchedWords;
          (doc as any).totalSearchWords = relevance.totalWords;
          (doc as any).hasExactPhrase = relevance.hasExactPhrase;
          (doc as any).matchLocations = relevance.matchLocations;
        }

        return doc;
      }),
    );

    // Si hay búsqueda, reordenar por relevancia de palabras
    if (query.search && query.search.trim()) {
      documentsWithTags.sort((a, b) => {
        const scoreA = (a as any).relevanceScore || 0;
        const scoreB = (b as any).relevanceScore || 0;

        // Primero por score de relevancia
        if (scoreB !== scoreA) return scoreB - scoreA;

        // Luego por frase exacta
        const exactA = (a as any).hasExactPhrase ? 1 : 0;
        const exactB = (b as any).hasExactPhrase ? 1 : 0;
        if (exactB !== exactA) return exactB - exactA;

        // Finalmente por vistas
        return (b.viewCount || 0) - (a.viewCount || 0);
      });
    }

    return {
      documents: documentsWithTags,
      total,
      searchStats,
    };
  }

  private createQueryBuilder(): SelectQueryBuilder<KnowledgeDocument> {
    return this.knowledgeDocumentRepository
      .createQueryBuilder("doc")
      .leftJoinAndSelect("doc.documentType", "type")
      .leftJoinAndSelect("doc.createdByUser", "createdByUser")
      .leftJoinAndSelect("doc.tagRelations", "tagRelations")
      .leftJoinAndSelect("tagRelations.tag", "tags");
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<KnowledgeDocument>,
    query: KnowledgeDocumentQueryDto,
  ): void {
    if (query.search) {
      // Dividir el término de búsqueda en palabras individuales
      const searchWords = query.search
        .trim()
        .split(/\s+/)
        .filter((word) => word.length >= 2);

      if (searchWords.length === 0) {
        searchWords.push(query.search.trim());
      }

      // Crear condiciones para cada palabra
      const wordConditions: string[] = [];
      const params: any = {};

      searchWords.forEach((word, index) => {
        const paramName = `search${index}`;
        params[paramName] = `%${word}%`;

        const wordSearchConditions = [
          `unaccent(lower(doc.title)) LIKE unaccent(lower(:${paramName}))`,
          `unaccent(lower(doc.content)) LIKE unaccent(lower(:${paramName}))`,
          `EXISTS (
            SELECT 1 FROM knowledge_document_tag_relations kdtr
            INNER JOIN knowledge_tags kt ON kdtr.tag_id = kt.id
            WHERE kdtr.document_id = doc.id
            AND unaccent(lower(kt.tag_name)) LIKE unaccent(lower(:${paramName}))
          )`,
          `EXISTS (
            SELECT 1 FROM cases c 
            WHERE doc."associated_cases"::jsonb ? c.id::text
            AND unaccent(lower(c."numeroCaso")) LIKE unaccent(lower(:${paramName}))
          )`,
        ];

        wordConditions.push(`(${wordSearchConditions.join(" OR ")})`);
      });

      queryBuilder.andWhere(`(${wordConditions.join(" OR ")})`, params);
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
      // Búsqueda case-insensitive de etiquetas usando EXISTS para no filtrar las etiquetas cargadas
      const tagConditions = query.tags
        .map(
          (_, index) => `EXISTS (
          SELECT 1 FROM knowledge_document_tag_relations kdtr
          INNER JOIN knowledge_tags kt ON kdtr.tag_id = kt.id
          WHERE kdtr.document_id = doc.id
          AND LOWER(kt.tag_name) = LOWER(:tagName${index})
        )`,
        )
        .join(" OR ");
      const tagParams = query.tags.reduce(
        (acc, tag, index) => {
          acc[`tagName${index}`] = tag;
          return acc;
        },
        {} as Record<string, string>,
      );
      queryBuilder.andWhere(`(${tagConditions})`, tagParams);
    }
  }

  private applyPermissionAndVisibilityFilters(
    queryBuilder: SelectQueryBuilder<KnowledgeDocument>,
    userId?: string,
    userPermissions?: string[],
    userTeamIds: string[] = [],
  ): void {
    if (!userId || !userPermissions) {
      // Si no hay información de usuario, mostrar solo documentos publicados y públicos
      queryBuilder.andWhere("doc.isPublished = :published", {
        published: true,
      });
      queryBuilder.andWhere("doc.isArchived = :archived", { archived: false });
      queryBuilder.andWhere(
        "(doc.visibility = :publicVisibility OR doc.visibility IS NULL)",
        {
          publicVisibility: "public",
        },
      );
      return;
    }

    // Determinar el nivel de permisos del usuario
    // CLAVE: Solo usuarios con permisos de EDICIÓN pueden ver documentos no publicados de otros
    const hasAllEditPermissions = userPermissions.some(
      (p) =>
        p.includes("knowledge.update.all") ||
        p.includes("knowledge.delete.all"),
    );

    const hasTeamEditPermissions = userPermissions.some(
      (p) =>
        p.includes("knowledge.update.team") ||
        p.includes("knowledge.delete.team"),
    );

    const hasOwnEditPermissions = userPermissions.some(
      (p) =>
        p.includes("knowledge.update.own") ||
        p.includes("knowledge.delete.own"),
    );

    // También verificar permisos de lectura para determinar el alcance
    const hasAllReadPermissions = userPermissions.some((p) =>
      p.includes("knowledge.read.all"),
    );
    const hasTeamReadPermissions = userPermissions.some((p) =>
      p.includes("knowledge.read.team"),
    );
    const hasOwnReadPermissions = userPermissions.some((p) =>
      p.includes("knowledge.read.own"),
    );

    // Siempre excluir documentos archivados
    queryBuilder.andWhere("doc.isArchived = :archived", { archived: false });

    // Construir la condición de visibilidad
    // visibility = 'public': visible para todos
    // visibility = 'private': solo visible para el autor
    // visibility = 'team': visible para miembros del mismo equipo que el autor
    // visibility = 'custom': visible para usuarios/equipos específicos en visibleToUsers/visibleToTeams
    const visibilityConditions: string[] = [];
    const visibilityParams: any = {};

    // 1. Documentos públicos siempre visibles
    visibilityConditions.push(
      "(doc.visibility = 'public' OR doc.visibility IS NULL)",
    );

    // 2. Documentos propios siempre visibles
    visibilityConditions.push("doc.createdBy = :visUserId");
    visibilityParams.visUserId = userId;

    // 3. Documentos con visibilidad 'team' - visible si el usuario está en los mismos equipos que el autor
    if (userTeamIds.length > 0) {
      // Verificar si el autor del documento está en alguno de los equipos del usuario
      visibilityConditions.push(`(
        doc.visibility = 'team' AND EXISTS (
          SELECT 1 FROM team_members tm_author
          WHERE tm_author.user_id = doc.created_by
          AND tm_author.is_active = true
          AND tm_author.team_id IN (:...userTeamIdsVis)
        )
      )`);
      visibilityParams.userTeamIdsVis = userTeamIds;
    }

    // 4. Documentos con visibilidad 'custom' - visible si el usuario o sus equipos están en las listas
    visibilityConditions.push(`(
      doc.visibility = 'custom' AND (
        doc.visible_to_users::jsonb ? :visUserIdJson
        ${userTeamIds.length > 0 ? "OR doc.visible_to_teams::jsonb ?| :userTeamIdsJson" : ""}
      )
    )`);
    visibilityParams.visUserIdJson = userId;
    if (userTeamIds.length > 0) {
      visibilityParams.userTeamIdsJson = userTeamIds;
    }

    // Combinar condiciones de visibilidad
    const visibilityFilter = `(${visibilityConditions.join(" OR ")})`;

    if (hasAllEditPermissions) {
      // Usuario con permisos de EDICIÓN ALL: puede ver todos los documentos (publicados y no publicados)
      // pero aún respeta la visibilidad del documento
      console.log(
        `🔓 Usuario ${userId} tiene permisos de EDICIÓN ALL - puede ver todos los documentos respetando visibilidad`,
      );
      queryBuilder.andWhere(visibilityFilter, visibilityParams);
    } else if (hasTeamEditPermissions) {
      // Usuario con permisos de EDICIÓN TEAM: puede ver documentos del team completos + documentos publicados de otros
      console.log(
        `👥 Usuario ${userId} tiene permisos de EDICIÓN TEAM - aplicando filtros apropiados`,
      );
      queryBuilder.andWhere(
        `(doc.createdBy = :userId OR doc.isPublished = :published) AND ${visibilityFilter}`,
        { userId, published: true, ...visibilityParams },
      );
    } else if (hasOwnEditPermissions || hasOwnReadPermissions) {
      // Usuario con permisos OWN (edición o solo lectura): puede ver sus documentos completos + documentos publicados de otros
      console.log(
        `👤 Usuario ${userId} tiene permisos OWN - puede ver sus documentos + documentos publicados de otros`,
      );
      queryBuilder.andWhere(
        `(doc.createdBy = :userId OR doc.isPublished = :published) AND ${visibilityFilter}`,
        { userId, published: true, ...visibilityParams },
      );
    } else if (hasAllReadPermissions || hasTeamReadPermissions) {
      // Usuario con solo permisos de LECTURA (sin edición): solo documentos publicados + sus propios documentos
      console.log(
        `📖 Usuario ${userId} tiene solo permisos de LECTURA - solo documentos publicados + propios`,
      );
      queryBuilder.andWhere(
        `(doc.createdBy = :userId OR doc.isPublished = :published) AND ${visibilityFilter}`,
        { userId, published: true, ...visibilityParams },
      );
    } else {
      // Usuario sin permisos específicos: solo documentos publicados
      console.log(
        `🔒 Usuario ${userId} sin permisos específicos - solo documentos publicados`,
      );
      queryBuilder.andWhere(
        `doc.isPublished = :published AND ${visibilityFilter}`,
        { published: true, ...visibilityParams },
      );
    }
  }

  private applySorting(
    queryBuilder: SelectQueryBuilder<KnowledgeDocument>,
    query: KnowledgeDocumentQueryDto,
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
    userId?: string,
  ): Promise<void> {
    console.log(
      `[updateTags] Updating tags for document ${documentId}:`,
      tagNames,
    );
    console.log(`[updateTags] User ID:`, userId);

    // Usar el nuevo sistema de etiquetas
    await this.knowledgeTagService.assignTagsToDocument(
      documentId,
      tagNames,
      userId,
    );

    console.log(
      `[updateTags] Tags updated successfully for document ${documentId}`,
    );
  }

  /**
   * Cargar las etiquetas de un documento usando el nuevo sistema
   */
  private async loadDocumentTags(
    document: KnowledgeDocument,
  ): Promise<KnowledgeDocument> {
    console.log(
      "🔍 [KnowledgeDocumentService] loadDocumentTags - Loading tags for document:",
      document.id,
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
      "tags",
    );

    return document;
  }

  private async createVersion(
    documentId: string,
    versionData: { content: object; title: string; changeSummary: string },
    userId: string,
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
  // REVIEW WORKFLOW METHODS
  // ================================

  /**
   * Submit a document for review
   */
  async submitForReview(
    documentId: string,
    userId: string,
  ): Promise<KnowledgeDocument> {
    const document = await this.findOne(documentId);

    if (!document) {
      throw new Error(`Documento con ID ${documentId} no encontrado`);
    }

    if (document.isArchived) {
      throw new Error("No se puede enviar a revisión un documento archivado");
    }

    if ((document as any).reviewStatus === "pending_review") {
      throw new Error("Este documento ya está pendiente de revisión");
    }

    if (document.isPublished) {
      throw new Error("Este documento ya está publicado");
    }

    // Validar que el documento tenga contenido mínimo
    if (!document.title.trim()) {
      throw new Error("El documento debe tener un título");
    }

    // Actualizar estado de revisión
    await this.knowledgeDocumentRepository.update(documentId, {
      reviewStatus: "pending_review",
      lastEditedBy: userId,
    } as any);

    // Crear versión de revisión
    await this.createVersion(
      documentId,
      {
        content: document.jsonContent,
        title: document.title,
        changeSummary: "Enviado a revisión",
      },
      userId,
    );

    const result = await this.findOne(documentId);
    if (!result) {
      throw new Error(
        `Documento ${documentId} no encontrado después de actualización`,
      );
    }
    return result;
  }

  /**
   * Approve a document (publishes it by default)
   */
  async approveDocument(
    documentId: string,
    reviewerId: string,
    notes?: string,
    autoPublish: boolean = true,
  ): Promise<KnowledgeDocument> {
    const document = await this.findOne(documentId);

    if (!document) {
      throw new Error(`Documento con ID ${documentId} no encontrado`);
    }

    if ((document as any).reviewStatus !== "pending_review") {
      throw new Error("Este documento no está pendiente de revisión");
    }

    const now = new Date();
    const updateData: any = {
      reviewStatus: autoPublish ? "published" : "approved",
      reviewedBy: reviewerId,
      reviewedAt: now,
      reviewNotes: notes || null,
      lastEditedBy: reviewerId,
    };

    if (autoPublish) {
      updateData.isPublished = true;
      updateData.publishedAt = now;
    }

    await this.knowledgeDocumentRepository.update(documentId, updateData);

    // Crear versión de aprobación
    await this.createVersion(
      documentId,
      {
        content: document.jsonContent,
        title: document.title,
        changeSummary: autoPublish
          ? "Documento aprobado y publicado"
          : "Documento aprobado",
      },
      reviewerId,
    );

    const result = await this.findOne(documentId);
    if (!result) {
      throw new Error(
        `Documento ${documentId} no encontrado después de aprobación`,
      );
    }
    return result;
  }

  /**
   * Reject a document (returns to draft)
   */
  async rejectDocument(
    documentId: string,
    reviewerId: string,
    notes: string,
  ): Promise<KnowledgeDocument> {
    const document = await this.findOne(documentId);

    if (!document) {
      throw new Error(`Documento con ID ${documentId} no encontrado`);
    }

    if ((document as any).reviewStatus !== "pending_review") {
      throw new Error("Este documento no está pendiente de revisión");
    }

    const now = new Date();
    await this.knowledgeDocumentRepository.update(documentId, {
      reviewStatus: "rejected",
      reviewedBy: reviewerId,
      reviewedAt: now,
      reviewNotes: notes,
      lastEditedBy: reviewerId,
    } as any);

    // Crear versión de rechazo
    await this.createVersion(
      documentId,
      {
        content: document.jsonContent,
        title: document.title,
        changeSummary: `Documento rechazado: ${notes}`,
      },
      reviewerId,
    );

    const result = await this.findOne(documentId);
    if (!result) {
      throw new Error(
        `Documento ${documentId} no encontrado después de rechazo`,
      );
    }
    return result;
  }

  /**
   * Get documents pending review
   */
  async getPendingReviewDocuments(
    userId: string,
    userPermissions: string[],
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    documents: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.createQueryBuilder();

    // Solo documentos pendientes de revisión
    queryBuilder.andWhere("doc.reviewStatus = :reviewStatus", {
      reviewStatus: "pending_review",
    });

    // No mostrar documentos archivados
    queryBuilder.andWhere("doc.isArchived = false");

    // Aplicar filtros de permisos para revisores
    const hasApproveAllPermission = userPermissions.some((p) =>
      p.includes("knowledge.approve.all"),
    );

    if (!hasApproveAllPermission) {
      // Para permisos de equipo, filtrar por creador en el mismo equipo
      // Por ahora, mostrar solo documentos del creador actual o de su equipo
      console.log(`Filtrando documentos pendientes para usuario ${userId}`);
    }

    const offset = (page - 1) * limit;

    const [documents, total] = await queryBuilder
      .orderBy("doc.updatedAt", "DESC")
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    // Mapear documentos con información del autor
    const documentsWithInfo = await Promise.all(
      documents.map(async (doc) => {
        const createdByUser = await doc.createdByUser;
        const documentType = await doc.documentType;

        const tags =
          doc.tagRelations && doc.tagRelations.length > 0
            ? doc.tagRelations.map((relation) => ({
                id: relation.tag.id,
                tagName: relation.tag.tagName,
                color: relation.tag.color,
                category: relation.tag.category,
              }))
            : [];

        return {
          ...doc,
          documentType: documentType
            ? {
                id: documentType.id,
                name: documentType.name,
                color: documentType.color,
              }
            : null,
          __createdByUser__: createdByUser
            ? {
                id: createdByUser.id,
                email: createdByUser.email,
                fullName: createdByUser.fullName,
              }
            : null,
          tags,
          tagRelations: undefined,
        };
      }),
    );

    return {
      documents: documentsWithInfo,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
