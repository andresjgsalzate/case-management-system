"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeTagService = void 0;
const KnowledgeTag_1 = require("../entities/KnowledgeTag");
const KnowledgeDocument_1 = require("../entities/KnowledgeDocument");
const KnowledgeDocumentTagRelation_1 = require("../entities/KnowledgeDocumentTagRelation");
const database_1 = require("../config/database");
class KnowledgeTagService {
    constructor(dataSource) {
        const ds = dataSource || database_1.AppDataSource;
        this.tagRepository = ds.getRepository(KnowledgeTag_1.KnowledgeTag);
        this.relationRepository = ds.getRepository(KnowledgeDocumentTagRelation_1.KnowledgeDocumentTagRelation);
        this.documentRepository = ds.getRepository(KnowledgeDocument_1.KnowledgeDocument);
    }
    async createTag(createDto, userId) {
        const existingTag = await this.tagRepository.findOne({
            where: { tagName: createDto.tagName },
        });
        if (existingTag) {
            throw new Error(`La etiqueta "${createDto.tagName}" ya existe`);
        }
        const tag = this.tagRepository.create({
            ...createDto,
            createdBy: userId,
        });
        return await this.tagRepository.save(tag);
    }
    async findOrCreateTag(tagName, userId) {
        let tag = await this.tagRepository.findOne({
            where: { tagName },
        });
        if (!tag) {
            const recentTags = await this.tagRepository.find({
                order: { createdAt: "DESC" },
                take: 3,
            });
            const recentColors = recentTags.map((tag) => tag.color);
            const TAG_COLORS = [
                "#EF4444",
                "#F97316",
                "#F59E0B",
                "#10B981",
                "#06B6D4",
                "#3B82F6",
                "#8B5CF6",
                "#EC4899",
                "#6B7280",
                "#84CC16",
                "#F472B6",
                "#A78BFA",
            ];
            const availableColors = TAG_COLORS.filter((c) => !recentColors.includes(c));
            const colorPool = availableColors.length > 0 ? availableColors : TAG_COLORS;
            const selectedColor = colorPool[Math.floor(Math.random() * colorPool.length)];
            let selectedCategory = KnowledgeTag_1.TagCategory.CUSTOM;
            const lowerName = tagName.toLowerCase();
            if (["bug", "error", "fix", "critical", "urgent"].some((k) => lowerName.includes(k))) {
                selectedCategory = KnowledgeTag_1.TagCategory.PRIORITY;
            }
            else if ([
                "react",
                "js",
                "css",
                "html",
                "typescript",
                "javascript",
                "vue",
                "angular",
            ].some((k) => lowerName.includes(k))) {
                selectedCategory = KnowledgeTag_1.TagCategory.TECHNOLOGY;
            }
            else if (["backend", "frontend", "api", "database", "server", "client"].some((k) => lowerName.includes(k))) {
                selectedCategory = KnowledgeTag_1.TagCategory.TECHNICAL;
            }
            else if (["user", "admin", "auth", "role", "permission"].some((k) => lowerName.includes(k))) {
                selectedCategory = KnowledgeTag_1.TagCategory.MODULE;
            }
            tag = await this.createTag({
                tagName,
                color: selectedColor,
                category: selectedCategory,
                description: `Etiqueta creada automáticamente`,
            }, userId);
        }
        return tag;
    }
    async findTagByName(tagName) {
        const result = await this.tagRepository
            .createQueryBuilder("tag")
            .leftJoin("tag.documentRelations", "relation")
            .leftJoin("relation.document", "document", "document.isArchived = false")
            .select([
            "tag.id",
            "tag.tagName",
            "tag.description",
            "tag.color",
            "tag.category",
            "tag.isActive",
            "tag.createdBy",
            "tag.createdAt",
            "tag.updatedAt",
        ])
            .addSelect("COUNT(DISTINCT document.id)", "usageCount")
            .where("LOWER(tag.tagName) = LOWER(:tagName)", { tagName })
            .groupBy("tag.id")
            .addGroupBy("tag.tagName")
            .addGroupBy("tag.description")
            .addGroupBy("tag.color")
            .addGroupBy("tag.category")
            .addGroupBy("tag.isActive")
            .addGroupBy("tag.createdBy")
            .addGroupBy("tag.createdAt")
            .addGroupBy("tag.updatedAt")
            .getRawOne();
        if (!result) {
            return null;
        }
        return {
            id: result.tag_id,
            tagName: result.tag_tagName,
            description: result.tag_description,
            color: result.tag_color,
            category: result.tag_category,
            isActive: result.tag_isActive,
            createdBy: result.tag_createdBy,
            createdAt: result.tag_createdAt,
            updatedAt: result.tag_updatedAt,
            documentRelations: [],
            usageCount: parseInt(result.usageCount) || 0,
        };
    }
    async getAllTagsWithUsage() {
        const result = await this.tagRepository
            .createQueryBuilder("tag")
            .leftJoin("tag.documentRelations", "relation")
            .leftJoin("relation.document", "document", "document.isArchived = false")
            .select([
            "tag.id",
            "tag.tagName",
            "tag.description",
            "tag.color",
            "tag.category",
            "tag.isActive",
            "tag.createdBy",
            "tag.createdAt",
            "tag.updatedAt",
        ])
            .addSelect("COUNT(DISTINCT document.id)", "usageCount")
            .groupBy("tag.id")
            .addGroupBy("tag.tagName")
            .addGroupBy("tag.description")
            .addGroupBy("tag.color")
            .addGroupBy("tag.category")
            .addGroupBy("tag.isActive")
            .addGroupBy("tag.createdBy")
            .addGroupBy("tag.createdAt")
            .addGroupBy("tag.updatedAt")
            .orderBy("COUNT(DISTINCT document.id)", "DESC")
            .addOrderBy("tag.tagName", "ASC")
            .getRawAndEntities();
        return result.entities.map((tag, index) => ({
            ...tag,
            usageCount: parseInt(result.raw[index].usageCount) || 0,
        }));
    }
    async getPopularTags(limit = 20) {
        const allTags = await this.getAllTagsWithUsage();
        return allTags.filter((tag) => tag.usageCount > 0).slice(0, limit);
    }
    async getTagById(id) {
        const tag = await this.tagRepository.findOne({
            where: { id },
        });
        if (!tag) {
            return null;
        }
        const usageCount = await this.relationRepository
            .createQueryBuilder("relation")
            .leftJoin("relation.document", "document")
            .where("relation.tagId = :tagId", { tagId: id })
            .andWhere("document.isArchived = false")
            .getCount();
        return {
            ...tag,
            usageCount,
        };
    }
    async assignTagsToDocument(documentId, tagNames, userId) {
        await this.relationRepository.delete({ documentId });
        if (tagNames.length === 0) {
            await this.updateDocumentTagsJson(documentId, []);
            return;
        }
        const tags = [];
        for (const tagName of tagNames) {
            const tag = await this.findOrCreateTag(tagName.trim(), userId);
            tags.push(tag);
        }
        const relations = tags.map((tag) => this.relationRepository.create({
            documentId,
            tagId: tag.id,
        }));
        await this.relationRepository.save(relations);
        const tagIds = tags.map((tag) => tag.id);
        await this.updateDocumentTagsJson(documentId, tagIds);
    }
    async updateDocumentTagsJson(documentId, tagIds) {
        await this.documentRepository.update({ id: documentId }, { tagsJson: tagIds });
    }
    async getDocumentTags(documentId) {
        const relations = await this.relationRepository.find({
            where: { documentId },
            relations: ["tag"],
        });
        return relations.map((relation) => relation.tag);
    }
    async deleteTag(tagId) {
        const tag = await this.tagRepository.findOne({ where: { id: tagId } });
        if (!tag) {
            throw new Error("Etiqueta no encontrada");
        }
        await this.tagRepository.delete(tagId);
    }
    async updateTag(tagId, updateData) {
        const tag = await this.tagRepository.findOne({ where: { id: tagId } });
        if (!tag) {
            throw new Error("Etiqueta no encontrada");
        }
        if (updateData.tagName && updateData.tagName !== tag.tagName) {
            const existingTag = await this.tagRepository.findOne({
                where: { tagName: updateData.tagName },
            });
            if (existingTag) {
                throw new Error(`La etiqueta "${updateData.tagName}" ya existe`);
            }
        }
        Object.assign(tag, updateData);
        return await this.tagRepository.save(tag);
    }
}
exports.KnowledgeTagService = KnowledgeTagService;
