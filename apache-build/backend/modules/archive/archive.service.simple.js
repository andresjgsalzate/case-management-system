"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArchiveServiceExpress = void 0;
const database_1 = require("../../config/database");
const ArchivedTodo_entity_1 = require("../../entities/archive/ArchivedTodo.entity");
class ArchiveServiceExpress {
    async getArchiveStats() {
        try {
            const archivedTodoRepository = database_1.AppDataSource.getRepository(ArchivedTodo_entity_1.ArchivedTodo);
            const totalArchivedTodos = await archivedTodoRepository.count();
            const totalArchivedCases = 0;
            const totalTimeMinutes = 0;
            return {
                totalArchivedCases,
                totalArchivedTodos,
                totalArchivedTimeMinutes: totalTimeMinutes,
                archivedThisMonth: 0,
                restoredThisMonth: 0,
            };
        }
        catch (error) {
            console.error("Error getting archive stats:", error);
            throw new Error("Error obteniendo estadísticas del archivo");
        }
    }
    async getArchivedItems(filters) {
        try {
            const { type = "all", showRestored = false, page = 1, limit = 50, } = filters;
            const offset = (page - 1) * limit;
            const items = [];
            if (type === "all" || type === "todos") {
                const archivedTodoRepository = database_1.AppDataSource.getRepository(ArchivedTodo_entity_1.ArchivedTodo);
                const queryBuilder = archivedTodoRepository.createQueryBuilder("archivedTodo");
                if (!showRestored) {
                    queryBuilder.where("archivedTodo.isRestored = :isRestored", {
                        isRestored: false,
                    });
                }
                const archivedTodos = await queryBuilder
                    .orderBy("archivedTodo.archivedAt", "DESC")
                    .skip(offset)
                    .take(limit)
                    .getMany();
                const todoItems = archivedTodos.map((todo) => ({
                    id: todo.id,
                    itemType: "todo",
                    originalId: todo.originalTodoId,
                    title: todo.title,
                    description: todo.description,
                    priority: todo.priority,
                    archivedAt: todo.archivedAt.toISOString(),
                    archivedBy: todo.archivedBy,
                    archivedReason: todo.archiveReason,
                    createdAt: todo.createdAt.toISOString(),
                    updatedAt: todo.updatedAt.toISOString(),
                    isRestored: todo.isRestored,
                    totalTimeMinutes: todo.totalTimeMinutes,
                }));
                items.push(...todoItems);
            }
            return items;
        }
        catch (error) {
            console.error("Error getting archived items:", error);
            throw new Error("Error obteniendo elementos archivados");
        }
    }
}
exports.ArchiveServiceExpress = ArchiveServiceExpress;
