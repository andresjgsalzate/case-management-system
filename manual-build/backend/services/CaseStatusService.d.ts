import { CaseStatusControl } from "../entities/CaseStatusControl";
export interface CreateCaseStatusDto {
    name: string;
    description?: string;
    color: string;
    isActive?: boolean;
    displayOrder?: number;
}
export interface UpdateCaseStatusDto {
    name?: string;
    description?: string;
    color?: string;
    isActive?: boolean;
    displayOrder?: number;
}
export interface CaseStatusFilterParams {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
}
export interface CaseStatusFilterParams {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
}
export declare class CaseStatusService {
    private statusRepository;
    constructor();
    findAll(): Promise<CaseStatusControl[]>;
    findById(id: string): Promise<CaseStatusControl | null>;
    create(data: Partial<CaseStatusControl>): Promise<CaseStatusControl>;
    update(id: string, data: Partial<CaseStatusControl>): Promise<CaseStatusControl | null>;
    delete(id: string): Promise<{
        success: boolean;
    }>;
    getAllStatuses(filters?: CaseStatusFilterParams): Promise<{
        statuses: CaseStatusControl[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getStatusById(id: string): Promise<CaseStatusControl | null>;
    createStatus(data: Partial<CaseStatusControl>): Promise<CaseStatusControl>;
    updateStatus(id: string, data: Partial<CaseStatusControl>): Promise<CaseStatusControl | null>;
    deleteStatus(id: string): Promise<{
        success: boolean;
    }>;
    searchStatuses(filters: any): Promise<CaseStatusControl[]>;
    getStatusStats(): Promise<{
        totalStatuses: number;
        activeStatuses: number;
        inactiveStatuses: number;
        recentStatuses: number;
    }>;
    reorderStatuses(statusOrders: any[]): Promise<{
        success: boolean;
    }>;
    canDeleteStatus(id: string): Promise<{
        canDelete: boolean;
        casesCount: number;
        reason: string;
    }>;
    getActiveStatusesOrdered(): Promise<CaseStatusControl[]>;
    getStats(): Promise<{
        totalStatuses: number;
        activeStatuses: number;
        inactiveStatuses: number;
        recentStatuses: number;
    }>;
    getCaseStatusStats(): Promise<{
        totalStatuses: number;
        activeStatuses: number;
        inactiveStatuses: number;
        recentStatuses: number;
    }>;
}
export declare const caseStatusService: CaseStatusService;
