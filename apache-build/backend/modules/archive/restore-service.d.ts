export declare class RestoreService {
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
    private verifyRestoration;
}
