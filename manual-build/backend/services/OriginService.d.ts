import { Origin } from "../entities/Origin";
export interface CreateOriginDto {
    nombre: string;
    descripcion?: string;
    activo?: boolean;
}
export interface UpdateOriginDto {
    nombre?: string;
    descripcion?: string;
    activo?: boolean;
}
export interface OriginFilterParams {
    search?: string;
    activo?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
}
export interface OriginListResponse {
    origins: Origin[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare class OriginService {
    private originRepository;
    constructor();
    getAllOrigins(filters?: OriginFilterParams): Promise<{
        origins: Origin[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getOriginById(id: string): Promise<Origin | null>;
    createOrigin(originData: CreateOriginDto): Promise<Origin>;
    updateOrigin(id: string, originData: UpdateOriginDto): Promise<Origin>;
    deleteOrigin(id: string): Promise<void>;
    searchOrigins(filters: OriginFilterParams): Promise<Origin[]>;
    getOriginStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        withCases: number;
    }>;
    canDeleteOrigin(id: string): Promise<{
        canDelete: boolean;
        reason?: string;
    }>;
}
