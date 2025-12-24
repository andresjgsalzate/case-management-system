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
    documents: any[];
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
      })
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
        "matchType"
      )
      .andWhere(
        `(unaccent(lower(doc.title)) LIKE unaccent(lower(:search))
          OR unaccent(lower(doc.content)) LIKE unaccent(lower(:search))
          OR unaccent(lower(tags."tag_name")) LIKE unaccent(lower(:search)))`,
        { search: `%${searchTerm}%` }
      )
      .andWhere("doc.isArchived = :archived", { archived: false });

    this.applyPermissionFilters(documentSuggestions, userId, userPermissions);

    const documentsRaw = await documentSuggestions
      .orderBy(
        `CASE WHEN unaccent(lower(doc.title)) LIKE unaccent(lower(:search)) THEN 0 ELSE 1 END`,
        "ASC"
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
      require("../entities/KnowledgeTag").KnowledgeTag
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
        [`%${searchTerm}%`, limit]
      );
      console.log(
        `✅ Casos encontrados: ${caseSuggestions.length}`,
        caseSuggestions
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
    }
  ): {
    score: number; // 0-100
    matchedWords: string[];
    totalWords: number;
    hasExactPhrase: boolean;
    matchLocations: ("title" | "content" | "tags")[];
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

    const fullText = `${normalizedTitle} ${normalizedContent} ${normalizedTags}`;

    // Verificar si tiene la frase exacta
    const hasExactPhrase = fullText.includes(normalizedSearch);

    // Contar palabras coincidentes
    const matchedWords: string[] = [];
    const matchLocations: Set<"title" | "content" | "tags"> = new Set();

    for (const word of searchWords) {
      if (fullText.includes(word)) {
        matchedWords.push(word);

        // Determinar dónde coincide
        if (normalizedTitle.includes(word)) matchLocations.add("title");
        if (normalizedContent.includes(word)) matchLocations.add("content");
        if (normalizedTags.includes(word)) matchLocations.add("tags");
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
    userPermissions?: string[]
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
      const searchConditions = [];
      const params: any = {
        search: `%${query.search}%`,
        searchTerm: query.search,
        searchTermJson: JSON.stringify([query.search]),
      };

      // Búsqueda en título (insensible a acentos)
      searchConditions.push(
        "unaccent(lower(doc.title)) LIKE unaccent(lower(:search))"
      );

      // Búsqueda en contenido (insensible a acentos)
      searchConditions.push(
        "unaccent(lower(doc.content)) LIKE unaccent(lower(:search))"
      );

      // Búsqueda en etiquetas (insensible a acentos)
      searchConditions.push(
        'unaccent(lower(tags."tag_name")) LIKE unaccent(lower(:search))'
      );

      // Búsqueda en casos asociados - búsqueda exacta en el array JSONB
      searchConditions.push(
        'doc."associated_cases"::jsonb @> (:searchTermJson)::jsonb'
      );

      // Búsqueda por número de caso en la tabla cases (insensible a acentos)
      searchConditions.push(`EXISTS (
        SELECT 1 FROM cases c 
        WHERE doc."associated_cases"::jsonb ? c.id::text
        AND unaccent(lower(c."numeroCaso")) LIKE unaccent(lower(:search))
      )`);

      queryBuilder.andWhere(`(${searchConditions.join(" OR ")})`, params);

      // Calcular estadísticas de búsqueda (insensible a acentos)
      const titleMatches = await this.knowledgeDocumentRepository
        .createQueryBuilder("doc")
        .andWhere(
          "unaccent(lower(doc.title)) LIKE unaccent(lower(:search))",
          params
        )
        .getCount();
      searchStats.foundInTitle = titleMatches;
    }

    // Aplicar otros filtros
    if (query.tags && query.tags.length > 0) {
      queryBuilder.andWhere('tags."tag_name" IN (:...tagNames)', {
        tagNames: query.tags,
      });
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
        }
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
          `CASE 
          WHEN "doc"."title" ILIKE :titleSearch THEN 3
          WHEN "tags"."tag_name" ILIKE :tagSearch THEN 2  
          WHEN "doc"."content" ILIKE :contentSearch THEN 1
          ELSE 0
        END`,
          "relevance_score"
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

        // Calcular relevancia por palabras si hay término de búsqueda
        if (query.search && query.search.trim()) {
          const relevance = this.calculateWordRelevance(query.search, {
            title: doc.title,
            content: doc.content,
            tags: tags,
          });

          (doc as any).relevanceScore = relevance.score;
          (doc as any).matchedWords = relevance.matchedWords;
          (doc as any).totalSearchWords = relevance.totalWords;
          (doc as any).hasExactPhrase = relevance.hasExactPhrase;
          (doc as any).matchLocations = relevance.matchLocations;
        }

        return doc;
      })
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
    query: KnowledgeDocumentQueryDto
  ): void {
    if (query.search) {
      // Búsqueda insensible a acentos usando unaccent
      queryBuilder.andWhere(
        `(unaccent(lower(doc.title)) LIKE unaccent(lower(:search)) 
          OR unaccent(lower(doc.content)) LIKE unaccent(lower(:search)))`,
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
