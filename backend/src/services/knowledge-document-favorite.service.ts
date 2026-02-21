import { Repository, DataSource } from "typeorm";
import { KnowledgeDocumentFavorite } from "../entities/KnowledgeDocumentFavorite";
import { KnowledgeDocument } from "../entities/KnowledgeDocument";
import { AppDataSource } from "../config/database";

export class KnowledgeDocumentFavoriteService {
  private favoriteRepository: Repository<KnowledgeDocumentFavorite>;
  private documentRepository: Repository<KnowledgeDocument>;

  constructor(dataSource?: DataSource) {
    const ds = dataSource || AppDataSource;
    this.favoriteRepository = ds.getRepository(KnowledgeDocumentFavorite);
    this.documentRepository = ds.getRepository(KnowledgeDocument);
  }

  /**
   * Toggle favorite status for a document
   */
  async toggleFavorite(
    documentId: string,
    userId: string,
  ): Promise<{ isFavorite: boolean; favoriteCount: number }> {
    // Check if document exists
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error("Documento no encontrado");
    }

    // Check if already favorited
    const existingFavorite = await this.favoriteRepository.findOne({
      where: { documentId, userId },
    });

    let isFavorite: boolean;

    if (existingFavorite) {
      // Remove favorite
      await this.favoriteRepository.remove(existingFavorite);
      isFavorite = false;
    } else {
      // Add favorite
      const favorite = this.favoriteRepository.create({
        documentId,
        userId,
      });
      await this.favoriteRepository.save(favorite);
      isFavorite = true;
    }

    // Get updated count
    const favoriteCount = await this.favoriteRepository.count({
      where: { documentId },
    });

    return { isFavorite, favoriteCount };
  }

  /**
   * Check if a document is favorited by a user
   */
  async checkFavorite(
    documentId: string,
    userId: string,
  ): Promise<{ isFavorite: boolean; favoriteCount: number }> {
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

  /**
   * Get all favorites for a user
   */
  async getUserFavorites(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    documents: KnowledgeDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
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

    const documents = await Promise.all(
      favorites.map(async (fav) => {
        const doc = fav.document;
        const createdByUser = await doc.createdByUser;
        const documentType = await doc.documentType;

        // Map tags
        const tags =
          doc.tagRelations && doc.tagRelations.length > 0
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
        } as any;
      }),
    );

    return {
      documents,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get favorite count for a document
   */
  async getFavoriteCount(documentId: string): Promise<number> {
    return this.favoriteRepository.count({
      where: { documentId },
    });
  }

  /**
   * Get most favorited documents
   */
  async getMostFavorited(limit: number = 10): Promise<
    Array<{
      documentId: string;
      favoriteCount: number;
      document?: KnowledgeDocument;
    }>
  > {
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
