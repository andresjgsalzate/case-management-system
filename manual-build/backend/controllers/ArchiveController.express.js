"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArchiveController = void 0;
const archive_service_1 = require("../modules/archive/archive.service");
class ArchiveController {
    constructor() {
        this.getArchiveStats = async (req, res, next) => {
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
        };
        this.getArchivedItems = async (req, res, next) => {
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
        };
        this.getArchivedCases = async (req, res, next) => {
            try {
                const { page = 1, limit = 20, search, sortBy = "archivedAt", sortOrder = "DESC", } = req.query;
                const result = await this.archiveService.getArchivedItems(parseInt(page), parseInt(limit), search, "case", sortBy, sortOrder);
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
                console.error("Error getting archived cases:", error);
                res.status(500).json({
                    success: false,
                    message: error.message || "Error obteniendo casos archivados",
                });
            }
        };
        this.getArchivedTodos = async (req, res, next) => {
            try {
                const { page = 1, limit = 20, search, sortBy = "archivedAt", sortOrder = "DESC", } = req.query;
                const result = await this.archiveService.getArchivedItems(parseInt(page), parseInt(limit), search, "todo", sortBy, sortOrder);
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
                console.error("Error getting archived todos:", error);
                res.status(500).json({
                    success: false,
                    message: error.message || "Error obteniendo todos archivados",
                });
            }
        };
        this.archiveCase = async (req, res, next) => {
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
        };
        this.archiveTodo = async (req, res, next) => {
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
                const archivedTodo = await this.archiveService.archiveTodo(todoId, userId, reason);
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
        };
        this.restoreArchivedItem = async (req, res, next) => {
            try {
                const { type, id } = req.params;
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
                const restoredItem = await this.archiveService.restoreArchivedItem(type, parseInt(id));
                res.json({
                    success: true,
                    data: restoredItem,
                    message: "Elemento restaurado exitosamente",
                });
            }
            catch (error) {
                console.error("Error restoring archived item:", error);
                res.status(500).json({
                    success: false,
                    message: error.message || "Error restaurando elemento",
                });
            }
        };
        this.deleteArchivedItem = async (req, res, next) => {
            try {
                const { type, id } = req.params;
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
        };
        this.deleteArchivedCase = async (req, res, next) => {
            try {
                const { id } = req.params;
                if (!id) {
                    return res.status(400).json({
                        success: false,
                        message: "ID requerido",
                    });
                }
                await this.archiveService.deleteArchivedItem("case", id);
                res.json({
                    success: true,
                    message: "Caso eliminado permanentemente del archivo",
                });
            }
            catch (error) {
                console.error("Error deleting archived case:", error);
                res.status(500).json({
                    success: false,
                    message: error.message || "Error eliminando caso archivado",
                });
            }
        };
        this.deleteArchivedTodo = async (req, res, next) => {
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
        };
        this.searchArchivedItems = async (req, res, next) => {
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
        };
        this.archiveService = new archive_service_1.ArchiveServiceExpress();
    }
}
exports.ArchiveController = ArchiveController;
