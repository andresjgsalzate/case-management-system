import { ArchiveStatsResponseDto, ArchivedCaseResponseDto, ArchivedTodoResponseDto, ArchivedItemResponseDto } from "../dto/archive.dto";
export declare class ArchiveServiceExpress {
    constructor();
    getArchiveStats(): Promise<ArchiveStatsResponseDto>;
    getArchivedItems(page?: number, limit?: number, search?: string, type?: "case" | "todo", sortBy?: "createdAt" | "title" | "archivedAt", sortOrder?: "ASC" | "DESC"): Promise<{
        items: ArchivedItemResponseDto[];
        total: number;
    }>;
    archiveCase(caseId: number, userId: number, reason?: string): Promise<ArchivedCaseResponseDto>;
    archiveTodo(todoId: number, userId: number, reason?: string): Promise<ArchivedTodoResponseDto>;
    restoreArchivedItem(type: "case" | "todo", archivedId: number): Promise<any>;
    deleteArchivedItem(type: "case" | "todo", archivedId: number): Promise<void>;
    searchArchivedItems(query: string, type?: "case" | "todo", page?: number, limit?: number): Promise<{
        items: ArchivedItemResponseDto[];
        total: number;
    }>;
}
