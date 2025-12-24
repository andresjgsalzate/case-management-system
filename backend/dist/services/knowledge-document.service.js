"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeDocumentService = void 0;
const KnowledgeDocument_1 = require("../entities/KnowledgeDocument");
const KnowledgeDocumentVersion_1 = require("../entities/KnowledgeDocumentVersion");
const database_1 = require("../config/database");
const knowledge_tag_service_1 = require("./knowledge-tag.service");
class KnowledgeDocumentService {
    constructor(dataSource) {
        const ds = dataSource || database_1.AppDataSource;
        this.knowledgeDocumentRepository = ds.getRepository(KnowledgeDocument_1.KnowledgeDocument);
        this.versionRepository = ds.getRepository(KnowledgeDocumentVersion_1.KnowledgeDocumentVersion);
        this.knowledgeTagService = new knowledge_tag_service_1.KnowledgeTagService(ds);
    }
    async create(createDto, userId) {
        const { tags, associatedCases, ...documentData } = createDto;
        const document = this.knowledgeDocumentRepository.create({
            ...documentData,
            associatedCases: associatedCases || [],
            createdBy: userId,
            lastEditedBy: userId,
        });
        const savedDocument = await this.knowledgeDocumentRepository.save(document);
        await this.createVersion(savedDocument.id, {
            content: createDto.jsonContent,
            title: createDto.title,
            changeSummary: "Versión inicial",
        }, userId);
        if (tags && tags.length > 0) {
            await this.updateTags(savedDocument.id, tags, userId);
        }
        const result = await this.findOne(savedDocument.id);
        if (!result) {
            throw new Error(`Document with id ${savedDocument.id} not found after creation`);
        }
        return result;
    }
    async findAll(query, userId, userPermissions) {
        const queryBuilder = this.createQueryBuilder();
        this.applyFilters(queryBuilder, query);
        this.applyPermissionFilters(queryBuilder, userId, userPermissions);
        this.applySorting(queryBuilder, query);
        const page = query.page || 1;
        const limit = Math.min(query.limit || 10, 50);
        const offset = (page - 1) * limit;
        const [documents, total] = await queryBuilder
            .skip(offset)
            .take(limit)
            .getManyAndCount();
        const documentsWithTags = await Promise.all(documents.map(async (doc) => {
            const createdByUser = await doc.createdByUser;
            const documentType = await doc.documentType;
            const tags = doc.tagRelations && doc.tagRelations.length > 0
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
                tagRelations: undefined,
            };
        }));
        return {
            documents: documentsWithTags,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id) {
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
                console.log(`📄 [EDIT MODE] Document found: ${document.title}, attachments: ${document.attachments?.length || 0}`);
                const documentType = await document.documentType;
                const createdByUser = await document.createdByUser;
                const lastEditedByUser = await document.lastEditedByUser;
                console.log(`🔍 [DEBUG BACKEND] Document relations resolved:`, {
                    hasDocumentType: !!documentType,
                    documentTypeName: documentType?.name,
                    hasCreatedByUser: !!createdByUser,
                    createdByUserName: createdByUser?.fullName,
                });
                document.documentType = documentType;
                document.__documentType__ = documentType;
                document.createdByUser = createdByUser;
                document.__createdByUser__ = createdByUser;
                document.lastEditedByUser = lastEditedByUser;
                document.__lastEditedByUser__ = lastEditedByUser;
                const documentWithTags = await this.loadDocumentTags(document);
                console.log(`🏷️ [EDIT MODE] Document tags loaded count: ${documentWithTags.tags ? documentWithTags.tags.length : 0}`);
                if (documentWithTags.attachments &&
                    documentWithTags.attachments.length > 0) {
                    console.log(`📎 [EDIT MODE] Document attachments:`, documentWithTags.attachments.map((att) => ({
                        id: att.id,
                        fileName: att.fileName,
                        filePath: att.filePath,
                        mimeType: att.mimeType,
                        fileSize: att.fileSize,
                    })));
                }
                console.log("📤 [DEBUG BACKEND] Final document being sent to frontend:", {
                    id: documentWithTags.id,
                    title: documentWithTags.title,
                    hasDocumentType: !!documentWithTags.documentType,
                    hasCreatedByUser: !!documentWithTags.createdByUser,
                    documentTypeValue: documentWithTags.documentType,
                    createdByUserValue: documentWithTags.createdByUser,
                    allKeys: Object.keys(documentWithTags),
                });
                return documentWithTags;
            }
            else {
                console.log(`❌ [EDIT MODE] Document with ID ${id} not found`);
            }
            return document;
        }
        catch (error) {
            console.error("Error finding document:", error);
            throw error;
        }
    }
    async update(id, updateDto, userId) {
        const document = await this.findOne(id);
        if (!document) {
            throw new Error(`Document with id ${id} not found`);
        }
        if (document.isArchived) {
            throw new Error("No se puede editar un documento archivado");
        }
        if (updateDto.jsonContent) {
            document.version += 1;
            await this.createVersion(id, {
                content: updateDto.jsonContent,
                title: updateDto.title || document.title,
                changeSummary: updateDto.changeSummary || "Actualización de contenido",
            }, userId);
        }
        const { tags, changeSummary, associatedCases, ...updateData } = updateDto;
        const documentToUpdate = {
            ...updateData,
            ...(associatedCases !== undefined && { associatedCases }),
            lastEditedBy: userId,
            id: document.id,
        };
        await this.knowledgeDocumentRepository.update(id, documentToUpdate);
        if (tags !== undefined) {
            await this.updateTags(id, tags, userId);
        }
        const result = await this.findOne(id);
        if (!result) {
            throw new Error(`Document with id ${id} not found after update`);
        }
        return result;
    }
    async publish(id, publishDto, userId) {
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
        if (!publishDto.isPublished) {
            document.version += 1;
            await this.createVersion(id, {
                content: document.jsonContent,
                title: document.title,
                changeSummary: publishDto.changeSummary || "Documento despublicado",
            }, userId);
        }
        return this.knowledgeDocumentRepository.save(document);
    }
    async archive(id, archiveDto, userId) {
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
    async remove(id) {
        const document = await this.findOne(id);
        if (!document) {
            throw new Error(`Document with id ${id} not found`);
        }
        await this.knowledgeDocumentRepository.remove(document);
    }
    async getVersions(documentId) {
        return this.versionRepository.find({
            where: { documentId },
            order: { versionNumber: "DESC" },
            relations: ["createdByUser"],
        });
    }
    async getVersion(documentId, versionNumber) {
        const version = await this.versionRepository.findOne({
            where: { documentId, versionNumber },
            relations: ["createdByUser"],
        });
        if (!version) {
            throw new Error(`Versión ${versionNumber} del documento ${documentId} no encontrada`);
        }
        return version;
    }
    async searchContent(searchTerm, limit = 10, userId, userPermissions) {
        const queryBuilder = this.knowledgeDocumentRepository
            .createQueryBuilder("doc")
            .leftJoinAndSelect("doc.tags", "tags")
            .leftJoinAndSelect("doc.documentType", "type")
            .leftJoinAndSelect("doc.createdByUser", "creator")
            .andWhere(`(
        unaccent(lower(doc.title)) LIKE unaccent(lower(:search))
        OR unaccent(lower(doc.content)) LIKE unaccent(lower(:search))
        OR unaccent(lower(tags."tag_name")) LIKE unaccent(lower(:search))
        OR doc."associated_cases"::jsonb @> (:searchTermJson)::jsonb
        OR EXISTS (
          SELECT 1 FROM cases c 
          WHERE doc."associated_cases"::jsonb ? c.id::text
          AND unaccent(lower(c."numeroCaso")) LIKE unaccent(lower(:search))
        )
      )`, {
            search: `%${searchTerm}%`,
            searchTermJson: JSON.stringify([searchTerm]),
        });
        this.applyPermissionFilters(queryBuilder, userId, userPermissions);
        return queryBuilder
            .orderBy("doc.viewCount", "DESC")
            .addOrderBy("doc.updatedAt", "DESC")
            .limit(limit)
            .getMany();
    }
    async getSearchSuggestions(searchTerm, limit = 5, userId, userPermissions) {
        if (!searchTerm || searchTerm.length < 2) {
            return { documents: [], tags: [], cases: [] };
        }
        const documentSuggestions = this.knowledgeDocumentRepository
            .createQueryBuilder("doc")
            .leftJoin("doc.tagRelations", "tagRelations")
            .leftJoin("tagRelations.tag", "tags")
            .select(["doc.id", "doc.title"])
            .addSelect(`CASE 
          WHEN unaccent(lower(doc.title)) LIKE unaccent(lower(:search)) THEN 'title'
          WHEN unaccent(lower(tags."tag_name")) LIKE unaccent(lower(:search)) THEN 'tag'
          WHEN unaccent(lower(doc.content)) LIKE unaccent(lower(:search)) THEN 'content'
          ELSE 'other'
        END`, "matchType")
            .andWhere(`(unaccent(lower(doc.title)) LIKE unaccent(lower(:search))
          OR unaccent(lower(doc.content)) LIKE unaccent(lower(:search))
          OR unaccent(lower(tags."tag_name")) LIKE unaccent(lower(:search)))`, { search: `%${searchTerm}%` })
            .andWhere("doc.isArchived = :archived", { archived: false });
        this.applyPermissionFilters(documentSuggestions, userId, userPermissions);
        const documentsRaw = await documentSuggestions
            .orderBy(`CASE WHEN unaccent(lower(doc.title)) LIKE unaccent(lower(:search)) THEN 0 ELSE 1 END`, "ASC")
            .addOrderBy("doc.viewCount", "DESC")
            .setParameter("search", `%${searchTerm}%`)
            .limit(limit)
            .getRawAndEntities();
        const documents = documentsRaw.entities.map((doc, index) => ({
            ...doc,
            matchType: documentsRaw.raw[index]?.matchType || "title",
        }));
        const tagSuggestions = await database_1.AppDataSource.getRepository(require("../entities/KnowledgeTag").KnowledgeTag)
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
        let caseSuggestions = [];
        try {
            console.log(`🔍 Buscando casos con término: "${searchTerm}"`);
            caseSuggestions = await database_1.AppDataSource.query(`
        SELECT c.id, c."numeroCaso"
        FROM cases c 
        WHERE unaccent(lower(c."numeroCaso")) LIKE unaccent(lower($1))
        ORDER BY c."createdAt" DESC 
        LIMIT $2
      `, [`%${searchTerm}%`, limit]);
            console.log(`✅ Casos encontrados: ${caseSuggestions.length}`, caseSuggestions);
        }
        catch (error) {
            console.log("❌ Error buscando casos:", error?.message || error);
        }
        return {
            documents: documents.map((doc) => ({
                id: doc.id,
                title: doc.title,
                matchType: doc.matchType,
                type: "document",
            })),
            tags: tagSuggestions.map((tag) => ({
                name: tag.tagName,
                type: "tag",
            })),
            cases: caseSuggestions.map((case_) => ({
                id: case_.id,
                caseNumber: case_.numeroCaso,
                type: "case",
            })),
        };
    }
    calculateWordRelevance(searchPhrase, document) {
        const normalizeText = (text) => {
            return text
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^\w\s]/g, " ")
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
        const hasExactPhrase = fullText.includes(normalizedSearch);
        const matchedWords = [];
        const matchLocations = new Set();
        for (const word of searchWords) {
            if (fullText.includes(word)) {
                matchedWords.push(word);
                if (normalizedTitle.includes(word))
                    matchLocations.add("title");
                if (normalizedContent.includes(word))
                    matchLocations.add("content");
                if (normalizedTags.includes(word))
                    matchLocations.add("tags");
            }
        }
        let score = (matchedWords.length / searchWords.length) * 100;
        if (hasExactPhrase) {
            score = Math.min(100, score + 20);
        }
        if (matchLocations.has("title")) {
            score = Math.min(100, score + 10);
        }
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
    async enhancedSearch(query, userId, userPermissions) {
        const queryBuilder = this.createQueryBuilder();
        let searchStats = {
            foundInTitle: 0,
            foundInContent: 0,
            foundInTags: 0,
            foundInCases: 0,
        };
        if (query.search) {
            const searchConditions = [];
            const params = {
                search: `%${query.search}%`,
                searchTerm: query.search,
                searchTermJson: JSON.stringify([query.search]),
            };
            searchConditions.push("unaccent(lower(doc.title)) LIKE unaccent(lower(:search))");
            searchConditions.push("unaccent(lower(doc.content)) LIKE unaccent(lower(:search))");
            searchConditions.push('unaccent(lower(tags."tag_name")) LIKE unaccent(lower(:search))');
            searchConditions.push('doc."associated_cases"::jsonb @> (:searchTermJson)::jsonb');
            searchConditions.push(`EXISTS (
        SELECT 1 FROM cases c 
        WHERE doc."associated_cases"::jsonb ? c.id::text
        AND unaccent(lower(c."numeroCaso")) LIKE unaccent(lower(:search))
      )`);
            queryBuilder.andWhere(`(${searchConditions.join(" OR ")})`, params);
            const titleMatches = await this.knowledgeDocumentRepository
                .createQueryBuilder("doc")
                .andWhere("unaccent(lower(doc.title)) LIKE unaccent(lower(:search))", params)
                .getCount();
            searchStats.foundInTitle = titleMatches;
        }
        if (query.tags && query.tags.length > 0) {
            queryBuilder.andWhere('tags."tag_name" IN (:...tagNames)', {
                tagNames: query.tags,
            });
        }
        if (query.caseNumber) {
            queryBuilder.andWhere(`(
          doc."associated_cases"::jsonb @> (:caseNumberJson)::jsonb
          OR EXISTS (
            SELECT 1 FROM cases c 
            WHERE doc."associated_cases"::jsonb ? c.id::text
            AND unaccent(lower(c."numeroCaso")) LIKE unaccent(lower(:caseSearch))
          )
        )`, {
                caseNumberJson: JSON.stringify([query.caseNumber]),
                caseSearch: `%${query.caseNumber}%`,
            });
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
        this.applyPermissionFilters(queryBuilder, userId, userPermissions);
        const page = query.page || 1;
        const limit = Math.min(query.limit || 10, 50);
        const offset = (page - 1) * limit;
        if (query.search) {
            queryBuilder
                .addSelect(`CASE 
          WHEN "doc"."title" ILIKE :titleSearch THEN 3
          WHEN "tags"."tag_name" ILIKE :tagSearch THEN 2  
          WHEN "doc"."content" ILIKE :contentSearch THEN 1
          ELSE 0
        END`, "relevance_score")
                .setParameter("titleSearch", `%${query.search}%`)
                .setParameter("tagSearch", `%${query.search}%`)
                .setParameter("contentSearch", `%${query.search}%`)
                .orderBy("relevance_score", "DESC")
                .addOrderBy("doc.viewCount", "DESC");
        }
        else {
            queryBuilder.orderBy("doc.updatedAt", "DESC");
        }
        const [documents, total] = await queryBuilder
            .skip(offset)
            .take(limit)
            .getManyAndCount();
        const documentsWithTags = await Promise.all(documents.map(async (doc) => {
            const createdByUser = await doc.createdByUser;
            const documentType = await doc.documentType;
            doc.__createdByUser__ = createdByUser;
            doc.__documentType__ = documentType;
            doc.documentType = documentType;
            const tags = doc.tagRelations && doc.tagRelations.length > 0
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
            doc.tags = tags;
            if (query.search && query.search.trim()) {
                const relevance = this.calculateWordRelevance(query.search, {
                    title: doc.title,
                    content: doc.content,
                    tags: tags,
                });
                doc.relevanceScore = relevance.score;
                doc.matchedWords = relevance.matchedWords;
                doc.totalSearchWords = relevance.totalWords;
                doc.hasExactPhrase = relevance.hasExactPhrase;
                doc.matchLocations = relevance.matchLocations;
            }
            return doc;
        }));
        if (query.search && query.search.trim()) {
            documentsWithTags.sort((a, b) => {
                const scoreA = a.relevanceScore || 0;
                const scoreB = b.relevanceScore || 0;
                if (scoreB !== scoreA)
                    return scoreB - scoreA;
                const exactA = a.hasExactPhrase ? 1 : 0;
                const exactB = b.hasExactPhrase ? 1 : 0;
                if (exactB !== exactA)
                    return exactB - exactA;
                return (b.viewCount || 0) - (a.viewCount || 0);
            });
        }
        return {
            documents: documentsWithTags,
            total,
            searchStats,
        };
    }
    createQueryBuilder() {
        return this.knowledgeDocumentRepository
            .createQueryBuilder("doc")
            .leftJoinAndSelect("doc.documentType", "type")
            .leftJoinAndSelect("doc.createdByUser", "createdByUser")
            .leftJoinAndSelect("doc.tagRelations", "tagRelations")
            .leftJoinAndSelect("tagRelations.tag", "tags");
    }
    applyFilters(queryBuilder, query) {
        if (query.search) {
            queryBuilder.andWhere(`(unaccent(lower(doc.title)) LIKE unaccent(lower(:search)) 
          OR unaccent(lower(doc.content)) LIKE unaccent(lower(:search)))`, { search: `%${query.search}%` });
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
    applyPermissionFilters(queryBuilder, userId, userPermissions) {
        if (!userId || !userPermissions) {
            queryBuilder.andWhere("doc.isPublished = :published", {
                published: true,
            });
            queryBuilder.andWhere("doc.isArchived = :archived", { archived: false });
            return;
        }
        const hasAllEditPermissions = userPermissions.some((p) => p.includes("knowledge.update.all") || p.includes("knowledge.delete.all"));
        const hasTeamEditPermissions = userPermissions.some((p) => p.includes("knowledge.update.team") ||
            p.includes("knowledge.delete.team"));
        const hasOwnEditPermissions = userPermissions.some((p) => p.includes("knowledge.update.own") || p.includes("knowledge.delete.own"));
        const hasAllReadPermissions = userPermissions.some((p) => p.includes("knowledge.read.all"));
        const hasTeamReadPermissions = userPermissions.some((p) => p.includes("knowledge.read.team"));
        const hasOwnReadPermissions = userPermissions.some((p) => p.includes("knowledge.read.own"));
        queryBuilder.andWhere("doc.isArchived = :archived", { archived: false });
        if (hasAllEditPermissions) {
            console.log(`🔓 Usuario ${userId} tiene permisos de EDICIÓN ALL - puede ver todos los documentos`);
        }
        else if (hasTeamEditPermissions) {
            console.log(`👥 Usuario ${userId} tiene permisos de EDICIÓN TEAM - aplicando filtros apropiados`);
            queryBuilder.andWhere("(doc.createdBy = :userId OR doc.isPublished = :published)", { userId, published: true });
        }
        else if (hasOwnEditPermissions || hasOwnReadPermissions) {
            console.log(`👤 Usuario ${userId} tiene permisos OWN - puede ver sus documentos + documentos publicados de otros`);
            queryBuilder.andWhere("(doc.createdBy = :userId OR doc.isPublished = :published)", { userId, published: true });
        }
        else if (hasAllReadPermissions || hasTeamReadPermissions) {
            console.log(`📖 Usuario ${userId} tiene solo permisos de LECTURA - solo documentos publicados + propios`);
            queryBuilder.andWhere("(doc.createdBy = :userId OR doc.isPublished = :published)", { userId, published: true });
        }
        else {
            console.log(`🔒 Usuario ${userId} sin permisos específicos - solo documentos publicados`);
            queryBuilder.andWhere("doc.isPublished = :published", {
                published: true,
            });
        }
    }
    applySorting(queryBuilder, query) {
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
        }
        else {
            queryBuilder.orderBy("doc.createdAt", "DESC");
        }
    }
    async updateTags(documentId, tagNames, userId) {
        console.log(`[updateTags] Updating tags for document ${documentId}:`, tagNames);
        console.log(`[updateTags] User ID:`, userId);
        await this.knowledgeTagService.assignTagsToDocument(documentId, tagNames, userId);
        console.log(`[updateTags] Tags updated successfully for document ${documentId}`);
    }
    async loadDocumentTags(document) {
        console.log("🔍 [KnowledgeDocumentService] loadDocumentTags - Loading tags for document:", document.id);
        const tags = await this.knowledgeTagService.getDocumentTags(document.id);
        document.tags = tags.map((tag) => ({
            id: tag.id,
            tagName: tag.tagName,
            color: tag.color,
            category: tag.category,
            description: tag.description,
            isActive: tag.isActive,
            createdBy: tag.createdBy,
            createdAt: tag.createdAt,
            updatedAt: tag.updatedAt,
            documentId: document.id,
        }));
        console.log("✅ [KnowledgeDocumentService] loadDocumentTags - Loaded", document.tags.length, "tags");
        return document;
    }
    async createVersion(documentId, versionData, userId) {
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
exports.KnowledgeDocumentService = KnowledgeDocumentService;
