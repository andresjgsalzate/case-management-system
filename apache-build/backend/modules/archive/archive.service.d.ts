import { ArchiveStatsResponseDto, ArchivedCaseResponseDto, ArchivedTodoResponseDto, ArchivedItemResponseDto } from "../../dto/archive.dto";
export declare class ArchiveServiceExpress {
    private restoreService;
    constructor();
    private mapToStatus;
    private mapToClassification;
    private mapToPriority;
    getArchiveStats(): Promise<ArchiveStatsResponseDto>;
    getArchivedItems(page?: number, limit?: number, search?: string, type?: "case" | "todo" | "all", sortBy?: "createdAt" | "title" | "archivedAt", sortOrder?: "ASC" | "DESC"): Promise<{
        items: ArchivedItemResponseDto[];
        total: number;
    }>;
    archiveCase(caseId: string, userId: string, reason?: string): Promise<ArchivedCaseResponseDto>;
    archiveTodo(todoId: string, userId: string, reason?: string): Promise<ArchivedTodoResponseDto>;
    restoreArchivedItem(type: "case" | "todo", archivedId: number): Promise<any>;
    deleteArchivedItem(type: "case" | "todo", archivedId: string): Promise<void>;
    searchArchivedItems(query: string, type?: "case" | "todo", page?: number, limit?: number): Promise<{
        items: ArchivedItemResponseDto[];
        total: number;
    }>;
    restoreCase(archivedCaseId: string, restoredBy: string): Promise<{
        success: boolean;
        caseId?: string;
        message: string;
    }>;
    restoreTodo(archivedTodoId: string, restoredBy: string): Promise<{
        success: boolean;
        todoId?: string;
        message: string;
    }>;
}
