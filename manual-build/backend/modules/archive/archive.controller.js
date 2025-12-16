"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchArchivedItems = exports.deleteArchivedItem = exports.restoreArchivedItem = exports.archiveTodo = exports.archiveCase = exports.getArchivedItems = exports.getArchiveStats = exports.ArchiveController = void 0;
const archive_service_1 = require("./archive.service");
class ArchiveController {
    constructor() {
        this.archiveService = new archive_service_1.ArchiveServiceExpress();
    }
    async getArchiveStats(req, res, next) {
        try {
            const stats = await this.archiveService.getArchiveStats();
            res.json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            console.error("Error getting archive stats:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error obteniendo estadísticas del archivo",
            });
        }
    }
    async getArchivedItems(req, res, next) {
        try {
            const { page = 1, limit = 20, search, type, sortBy = "archivedAt", sortOrder = "DESC", } = req.query;
            const result = await this.archiveService.getArchivedItems(parseInt(page), parseInt(limit), search, type, sortBy, sortOrder);
            res.json({
                success: true,
                data: result.items,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: result.total,
                    totalPages: Math.ceil(result.total / parseInt(limit)),
                },
            });
        }
        catch (error) {
            console.error("Error getting archived items:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error obteniendo elementos archivados",
            });
        }
    }
    async archiveCase(req, res, next) {
        try {
            const { caseId } = req.params;
            const { reason } = req.body;
            const userId = req.user?.id;
            if (!caseId) {
                return res.status(400).json({
                    success: false,
                    message: "ID de caso requerido",
                });
            }
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Usuario no autenticado",
                });
            }
            const archivedCase = await this.archiveService.archiveCase(caseId, userId.toString(), reason);
            res.json({
                success: true,
                data: archivedCase,
                message: "Caso archivado exitosamente",
            });
        }
        catch (error) {
            console.error("Error archiving case:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error archivando caso",
            });
        }
    }
    async archiveTodo(req, res, next) {
        try {
            const { todoId } = req.params;
            const { reason } = req.body;
            const userId = req.user?.id;
            if (!todoId) {
                return res.status(400).json({
                    success: false,
                    message: "ID de todo requerido",
                });
            }
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Usuario no autenticado",
                });
            }
            const archivedTodo = await this.archiveService.archiveTodo(todoId, userId.toString(), reason);
            res.json({
                success: true,
                data: archivedTodo,
                message: "Todo archivado exitosamente",
            });
        }
        catch (error) {
            console.error("Error archiving todo:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error archivando todo",
            });
        }
    }
    async restoreArchivedItem(req, res, next) {
        try {
            const { type, id } = req.params;
            const userId = req.user?.id;
            if (!type || !id) {
                return res.status(400).json({
                    success: false,
                    message: "Tipo e ID requeridos",
                });
            }
            if (!["case", "todo"].includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: "Tipo de elemento inválido. Debe ser 'case' o 'todo'",
                });
            }
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Usuario no autenticado",
                });
            }
            let result;
            let restoredId;
            if (type === "case") {
                result = await this.archiveService.restoreCase(id, userId);
                restoredId = "caseId" in result ? result.caseId : undefined;
            }
            else {
                result = await this.archiveService.restoreTodo(id, userId);
                restoredId = "todoId" in result ? result.todoId : undefined;
            }
            res.json({
                success: result.success,
                data: {
                    id: restoredId,
                    type: type,
                    message: result.message,
                },
                message: result.message,
            });
        }
        catch (error) {
            console.error("Error restoring archived item:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error restaurando elemento",
            });
        }
    }
    async deleteArchivedTodo(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: "ID requerido",
                });
            }
            await this.archiveService.deleteArchivedItem("todo", id);
            res.json({
                success: true,
                message: "TODO eliminado permanentemente",
            });
        }
        catch (error) {
            console.error("Error deleting archived todo:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error eliminando TODO",
            });
        }
    }
    async deleteArchivedItem(req, res, next) {
        try {
            const { type, id } = req.params;
            console.log("DEBUG - DELETE params:", {
                type,
                id,
                allParams: req.params,
            });
            if (!type || !id) {
                return res.status(400).json({
                    success: false,
                    message: "Tipo e ID requeridos",
                });
            }
            if (!["case", "todo"].includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: "Tipo de elemento inválido. Debe ser 'case' o 'todo'",
                });
            }
            await this.archiveService.deleteArchivedItem(type, id);
            res.json({
                success: true,
                message: "Elemento eliminado permanentemente",
            });
        }
        catch (error) {
            console.error("Error deleting archived item:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error eliminando elemento",
            });
        }
    }
    async searchArchivedItems(req, res, next) {
        try {
            const { q: query, type, page = 1, limit = 20 } = req.query;
            if (!query) {
                return res.status(400).json({
                    success: false,
                    message: "Query de búsqueda requerido",
                });
            }
            const result = await this.archiveService.searchArchivedItems(query, type, parseInt(page), parseInt(limit));
            res.json({
                success: true,
                data: result.items,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: result.total,
                    totalPages: Math.ceil(result.total / parseInt(limit)),
                },
            });
        }
        catch (error) {
            console.error("Error searching archived items:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Error buscando elementos archivados",
            });
        }
    }
}
exports.ArchiveController = ArchiveController;
const archiveController = new ArchiveController();
const getArchiveStats = (req, res, next) => archiveController.getArchiveStats(req, res, next);
exports.getArchiveStats = getArchiveStats;
const getArchivedItems = (req, res, next) => archiveController.getArchivedItems(req, res, next);
exports.getArchivedItems = getArchivedItems;
const archiveCase = (req, res, next) => archiveController.archiveCase(req, res, next);
exports.archiveCase = archiveCase;
const archiveTodo = (req, res, next) => archiveController.archiveTodo(req, res, next);
exports.archiveTodo = archiveTodo;
const restoreArchivedItem = (req, res, next) => archiveController.restoreArchivedItem(req, res, next);
exports.restoreArchivedItem = restoreArchivedItem;
const deleteArchivedItem = (req, res, next) => archiveController.deleteArchivedItem(req, res, next);
exports.deleteArchivedItem = deleteArchivedItem;
const searchArchivedItems = (req, res, next) => archiveController.searchArchivedItems(req, res, next);
exports.searchArchivedItems = searchArchivedItems;
