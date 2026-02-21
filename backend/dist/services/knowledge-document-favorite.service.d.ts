import { DataSource } from "typeorm";
import { KnowledgeDocument } from "../entities/KnowledgeDocument";
export declare class KnowledgeDocumentFavoriteService {
    private favoriteRepository;
    private documentRepository;
    constructor(dataSource?: DataSource);
    toggleFavorite(documentId: string, userId: string): Promise<{
        isFavorite: boolean;
        favoriteCount: number;
    }>;
    checkFavorite(documentId: string, userId: string): Promise<{
        isFavorite: boolean;
        favoriteCount: number;
    }>;
    getUserFavorites(userId: string, page?: number, limit?: number): Promise<{
        documents: KnowledgeDocument[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getFavoriteCount(documentId: string): Promise<number>;
    getMostFavorited(limit?: number): Promise<Array<{
        documentId: string;
        favoriteCount: number;
        document?: KnowledgeDocument;
    }>>;
}
