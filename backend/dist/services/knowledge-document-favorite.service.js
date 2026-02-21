"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeDocumentFavoriteService = void 0;
const KnowledgeDocumentFavorite_1 = require("../entities/KnowledgeDocumentFavorite");
const KnowledgeDocument_1 = require("../entities/KnowledgeDocument");
const database_1 = require("../config/database");
class KnowledgeDocumentFavoriteService {
    constructor(dataSource) {
        const ds = dataSource || database_1.AppDataSource;
        this.favoriteRepository = ds.getRepository(KnowledgeDocumentFavorite_1.KnowledgeDocumentFavorite);
        this.documentRepository = ds.getRepository(KnowledgeDocument_1.KnowledgeDocument);
    }
    async toggleFavorite(documentId, userId) {
        const document = await this.documentRepository.findOne({
            where: { id: documentId },
        });
        if (!document) {
            throw new Error("Documento no encontrado");
        }
        const existingFavorite = await this.favoriteRepository.findOne({
            where: { documentId, userId },
        });
        let isFavorite;
        if (existingFavorite) {
            await this.favoriteRepository.remove(existingFavorite);
            isFavorite = false;
        }
        else {
            const favorite = this.favoriteRepository.create({
                documentId,
                userId,
            });
            await this.favoriteRepository.save(favorite);
            isFavorite = true;
        }
        const favoriteCount = await this.favoriteRepository.count({
            where: { documentId },
        });
        return { isFavorite, favoriteCount };
    }
    async checkFavorite(documentId, userId) {
        const favorite = await this.favoriteRepository.findOne({
            where: { documentId, userId },
        });
        const favoriteCount = await this.favoriteRepository.count({
            where: { documentId },
        });
        return {
            isFavorite: !!favorite,
            favoriteCount,
        };
    }
    async getUserFavorites(userId, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const [favorites, total] = await this.favoriteRepository
            .createQueryBuilder("fav")
            .leftJoinAndSelect("fav.document", "doc")
            .leftJoinAndSelect("doc.documentType", "documentType")
            .leftJoinAndSelect("doc.createdByUser", "createdByUser")
            .leftJoinAndSelect("doc.tagRelations", "tagRelations")
            .leftJoinAndSelect("tagRelations.tag", "tag")
            .where("fav.userId = :userId", { userId })
            .andWhere("doc.isArchived = false")
            .orderBy("fav.createdAt", "DESC")
            .skip(offset)
            .take(limit)
            .getManyAndCount();
        const documents = await Promise.all(favorites.map(async (fav) => {
            const doc = fav.document;
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
                __createdByUser__: createdByUser
                    ? {
                        id: createdByUser.id,
                        email: createdByUser.email,
                        fullName: createdByUser.fullName,
                        roleName: createdByUser.roleName,
                    }
                    : null,
                tags,
                tagRelations: undefined,
                isFavorite: true,
            };
        }));
        return {
            documents,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getFavoriteCount(documentId) {
        return this.favoriteRepository.count({
            where: { documentId },
        });
    }
    async getMostFavorited(limit = 10) {
        const result = await this.favoriteRepository
            .createQueryBuilder("fav")
            .select("fav.document_id", "documentId")
            .addSelect("COUNT(*)", "favoriteCount")
            .leftJoin("fav.document", "doc")
            .where("doc.isArchived = false")
            .andWhere("doc.isPublished = true")
            .groupBy("fav.document_id")
            .orderBy('"favoriteCount"', "DESC")
            .limit(limit)
            .getRawMany();
        return result.map((r) => ({
            documentId: r.documentId,
            favoriteCount: parseInt(r.favoriteCount, 10),
        }));
    }
}
exports.KnowledgeDocumentFavoriteService = KnowledgeDocumentFavoriteService;
