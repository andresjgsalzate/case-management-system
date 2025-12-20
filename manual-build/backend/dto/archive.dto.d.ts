export declare class CreateArchivedCaseDto {
    originalCaseId: string;
    caseNumber: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    classification: string;
    userId: string;
    assignedUserId?: string;
    createdByUserId: string;
    originalCreatedAt: string;
    originalUpdatedAt: string;
    completedAt?: string;
    archiveReason?: string;
    originalData: any;
    controlData: any;
    totalTimeMinutes?: number;
}
export declare class CreateArchivedTodoDto {
    originalTodoId: string;
    title: string;
    description?: string;
    priority: string;
    category?: string;
    isCompleted?: boolean;
    dueDate?: string;
    originalCreatedAt: string;
    originalUpdatedAt: string;
    completedAt?: string;
    createdByUserId: string;
    assignedUserId?: string;
    caseId?: string;
    archiveReason?: string;
    originalData: any;
    controlData: any;
    totalTimeMinutes?: number;
}
export declare class RestoreArchivedItemDto {
    reason?: string;
}
export declare class DeleteArchivedItemDto {
    reason?: string;
}
export declare class ArchiveStatsDto {
    totalArchivedCases: number;
    totalArchivedTodos: number;
    totalArchivedTimeMinutes: number;
    archivedThisMonth: number;
    restoredThisMonth: number;
}
export declare class ArchiveFiltersDto {
    type?: "cases" | "todos" | "all";
    archivedBy?: string;
    dateFrom?: string;
    dateTo?: string;
    classification?: string;
    priority?: string;
    search?: string;
    showRestored?: boolean;
    limit?: number;
    offset?: number;
}
export declare class ArchivedCaseResponseDto {
    id: string;
    originalCaseId: string;
    caseNumber: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    classification: string;
    assignedTo?: string;
    createdBy?: string;
    originalCreatedAt: string;
    originalUpdatedAt?: string;
    archivedAt: string;
    archivedBy: string;
    archivedReason?: string;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
    assignedToUser?: {
        id: string;
        fullName?: string;
        email: string;
    };
    createdByUser?: {
        id: string;
        fullName?: string;
        email: string;
    };
    archivedByUser?: {
        id: string;
        fullName?: string;
        email: string;
    };
}
export declare class ArchivedTodoResponseDto {
    id: string;
    originalTodoId: string;
    title: string;
    description?: string;
    priority: string;
    category?: string;
    isCompleted: boolean;
    dueDate?: string;
    originalCreatedAt: string;
    originalUpdatedAt: string;
    completedAt?: string;
    createdByUserId: string;
    assignedUserId?: string;
    caseId?: string;
    archivedAt: string;
    archivedBy: string;
    archiveReason?: string;
    restoredAt?: string;
    restoredBy?: string;
    isRestored: boolean;
    totalTimeMinutes: number;
    timerTimeMinutes: number;
    manualTimeMinutes: number;
    createdAt: string;
    updatedAt: string;
    createdByUser?: {
        id: string;
        fullName?: string;
        email: string;
    };
    assignedUser?: {
        id: string;
        fullName?: string;
        email: string;
    };
    archivedByUser?: {
        id: string;
        fullName?: string;
        email: string;
    };
    restoredByUser?: {
        id: string;
        fullName?: string;
        email: string;
    };
}
export declare class ArchivedItemResponseDto {
    id: string;
    itemType: "case" | "todo";
    originalId: string;
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    archivedAt: string;
    archivedBy: string;
    archivedReason?: string;
    createdAt: string;
    updatedAt: string;
    isRestored: boolean;
    totalTimeMinutes: number;
    timerTimeMinutes?: number;
    manualTimeMinutes?: number;
    caseNumber?: string;
    classification?: string;
    archivedByUser?: {
        id: string;
        fullName?: string;
        email: string;
        displayName?: string;
    };
}
export declare class ArchiveStatsResponseDto {
    totalArchivedCases: number;
    totalArchivedTodos: number;
    totalArchivedTimeMinutes: number;
    archivedThisMonth: number;
    restoredThisMonth: number;
}
