import { Application } from "../entities/Application";
export interface CreateApplicationDto {
    nombre: string;
    descripcion?: string;
    version?: string;
    activo?: boolean;
}
export interface UpdateApplicationDto {
    nombre?: string;
    descripcion?: string;
    version?: string;
    activo?: boolean;
}
export interface ApplicationFilterParams {
    search?: string;
    activo?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
}
export interface ApplicationStats {
    totalApplications: number;
    activeApplications: number;
    inactiveApplications: number;
    casesCount: number;
    recentlyCreated: number;
}
export declare class ApplicationService {
    private applicationRepository;
    constructor();
    findAll(filters?: ApplicationFilterParams): Promise<{
        applications: Application[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findById(id: string): Promise<Application | null>;
    create(data: CreateApplicationDto): Promise<Application>;
    update(id: string, data: UpdateApplicationDto): Promise<Application | null>;
    delete(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    canDelete(id: string): Promise<{
        canDelete: boolean;
        casesCount: number;
        reason: string;
    }>;
    getStats(): Promise<ApplicationStats>;
    getAllApplications(filters?: ApplicationFilterParams): Promise<{
        applications: Application[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getApplicationById(id: string): Promise<Application | null>;
    createApplication(data: CreateApplicationDto): Promise<Application>;
    updateApplication(id: string, data: UpdateApplicationDto): Promise<Application | null>;
    deleteApplication(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    searchApplications(filters: ApplicationFilterParams): Promise<{
        applications: Application[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getApplicationStats(): Promise<ApplicationStats>;
    canDeleteApplication(id: string): Promise<{
        canDelete: boolean;
        casesCount: number;
        reason: string;
    }>;
}
export declare const applicationService: ApplicationService;
