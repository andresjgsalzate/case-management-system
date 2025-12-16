"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArchiveServiceExpress = void 0;
class ArchiveServiceExpress {
    constructor() {
    }
    async getArchiveStats() {
        try {
            return {
                totalArchivedCases: 0,
                totalArchivedTodos: 0,
                totalArchivedTimeMinutes: 0,
                archivedThisMonth: 0,
                restoredThisMonth: 0,
            };
        }
        catch (error) {
            console.error("Error getting archive stats:", error);
            throw new Error("Error obteniendo estadísticas del archivo");
        }
    }
    async getArchivedItems(page = 1, limit = 20, search, type, sortBy = "archivedAt", sortOrder = "DESC") {
        try {
            const items = [];
            return {
                items,
                total: 0,
            };
        }
        catch (error) {
            console.error("Error getting archived items:", error);
            throw new Error("Error obteniendo elementos archivados");
        }
    }
    async archiveCase(caseId, userId, reason) {
        try {
            const mockArchivedCase = {
                id: "mock-id",
                originalCaseId: caseId.toString(),
                caseNumber: "CASE-001",
                title: "Caso archivado",
                description: "Descripción del caso archivado",
                priority: "ALTA",
                status: "COMPLETADO",
                classification: "ALTA",
                createdBy: userId.toString(),
                originalCreatedAt: new Date().toISOString(),
                originalUpdatedAt: new Date().toISOString(),
                archivedAt: new Date().toISOString(),
                archivedBy: userId.toString(),
                archivedReason: reason,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            return mockArchivedCase;
        }
        catch (error) {
            console.error("Error archiving case:", error);
            throw new Error(`Error archivando caso: ${error.message}`);
        }
    }
    async archiveTodo(todoId, userId, reason) {
        try {
            const mockArchivedTodo = {
                id: "mock-id",
                originalTodoId: todoId.toString(),
                title: "Todo archivado",
                description: "Descripción del todo archivado",
                priority: "ALTA",
                isCompleted: true,
                createdByUserId: userId.toString(),
                originalCreatedAt: new Date().toISOString(),
                originalUpdatedAt: new Date().toISOString(),
                archivedAt: new Date().toISOString(),
                archivedBy: userId.toString(),
                archiveReason: reason,
                isRestored: false,
                totalTimeMinutes: 0,
                timerTimeMinutes: 0,
                manualTimeMinutes: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            return mockArchivedTodo;
        }
        catch (error) {
            console.error("Error archiving todo:", error);
            throw new Error(`Error archivando todo: ${error.message}`);
        }
    }
    async restoreArchivedItem(type, archivedId) {
        try {
            return {
                id: archivedId.toString(),
                type: type,
                message: "Elemento restaurado exitosamente",
            };
        }
        catch (error) {
            console.error("Error restoring archived item:", error);
            throw new Error(`Error restaurando elemento: ${error.message}`);
        }
    }
    async deleteArchivedItem(type, archivedId) {
        try {
        }
        catch (error) {
            console.error("Error deleting archived item:", error);
            throw new Error(`Error eliminando elemento archivado: ${error.message}`);
        }
    }
    async searchArchivedItems(query, type, page = 1, limit = 20) {
        try {
            const items = [];
            return { items, total: 0 };
        }
        catch (error) {
            console.error("Error searching archived items:", error);
            throw new Error("Error buscando elementos archivados");
        }
    }
}
exports.ArchiveServiceExpress = ArchiveServiceExpress;
