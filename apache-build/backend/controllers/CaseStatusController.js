"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaseStatusController = void 0;
const CaseStatusService_1 = require("../services/CaseStatusService");
class CaseStatusController {
    constructor() {
        this.caseStatusService = new CaseStatusService_1.CaseStatusService();
    }
    async getAllStatuses(req, res) {
        try {
            const { page = 1, limit = 10, search, isActive, sortBy = "displayOrder", sortOrder = "ASC", } = req.query;
            const filters = {
                page: parseInt(page),
                limit: parseInt(limit),
                search: search,
                isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
                sortBy: sortBy,
                sortOrder: sortOrder,
            };
            const result = await this.caseStatusService.getAllStatuses(filters);
            res.json({
                success: true,
                data: result,
                message: "Estados obtenidos correctamente",
            });
        }
        catch (error) {
            console.error("Error al obtener estados:", error);
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async getStatusById(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "ID del estado es requerido",
                });
            }
            const status = await this.caseStatusService.getStatusById(id);
            if (!status) {
                return res.status(404).json({
                    success: false,
                    error: "Estado no encontrado",
                });
            }
            res.json({
                success: true,
                data: status,
                message: "Estado obtenido correctamente",
            });
        }
        catch (error) {
            console.error("Error al obtener estado:", error);
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async createStatus(req, res) {
        try {
            const statusData = req.body;
            if (!statusData.name || statusData.name.trim() === "") {
                return res.status(400).json({
                    success: false,
                    error: "El nombre es requerido",
                });
            }
            const status = await this.caseStatusService.createStatus(statusData);
            res.status(201).json({
                success: true,
                data: status,
                message: "Estado creado correctamente",
            });
        }
        catch (error) {
            console.error("Error al crear estado:", error);
            if (error instanceof Error) {
                if (error.message === "Ya existe un estado con este nombre") {
                    return res.status(409).json({
                        success: false,
                        error: error.message,
                    });
                }
            }
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const statusData = req.body;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "ID del estado es requerido",
                });
            }
            if (statusData.name && statusData.name.trim() === "") {
                return res.status(400).json({
                    success: false,
                    error: "El nombre no puede estar vacío",
                });
            }
            const status = await this.caseStatusService.updateStatus(id, statusData);
            res.json({
                success: true,
                data: status,
                message: "Estado actualizado correctamente",
            });
        }
        catch (error) {
            console.error("Error al actualizar estado:", error);
            if (error instanceof Error) {
                if (error.message === "Estado no encontrado") {
                    return res.status(404).json({
                        success: false,
                        error: error.message,
                    });
                }
                if (error.message === "Ya existe un estado con este nombre") {
                    return res.status(409).json({
                        success: false,
                        error: error.message,
                    });
                }
            }
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async deleteStatus(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "ID del estado es requerido",
                });
            }
            await this.caseStatusService.deleteStatus(id);
            res.json({
                success: true,
                message: "Estado eliminado correctamente",
            });
        }
        catch (error) {
            console.error("Error al eliminar estado:", error);
            if (error instanceof Error) {
                if (error.message === "Estado no encontrado") {
                    return res.status(404).json({
                        success: false,
                        error: error.message,
                    });
                }
            }
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async searchStatuses(req, res) {
        try {
            const { search, isActive } = req.query;
            const filters = {
                search: search,
                isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
            };
            const statuses = await this.caseStatusService.searchStatuses(filters);
            res.json({
                success: true,
                data: statuses,
                message: "Búsqueda completada correctamente",
            });
        }
        catch (error) {
            console.error("Error al buscar estados:", error);
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async getStatusStats(req, res) {
        try {
            const stats = await this.caseStatusService.getStatusStats();
            res.json({
                success: true,
                data: stats,
                message: "Estadísticas obtenidas correctamente",
            });
        }
        catch (error) {
            console.error("Error al obtener estadísticas:", error);
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async reorderStatuses(req, res) {
        try {
            const { statusOrders } = req.body;
            if (!Array.isArray(statusOrders)) {
                return res.status(400).json({
                    success: false,
                    error: "Se requiere un array de órdenes de estados",
                });
            }
            await this.caseStatusService.reorderStatuses(statusOrders);
            res.json({
                success: true,
                message: "Estados reordenados correctamente",
            });
        }
        catch (error) {
            console.error("Error al reordenar estados:", error);
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async checkCanDeleteStatus(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "ID del estado es requerido",
                });
            }
            const result = await this.caseStatusService.canDeleteStatus(id);
            res.json({
                success: true,
                data: result,
                message: "Verificación completada correctamente",
            });
        }
        catch (error) {
            console.error("Error al verificar eliminación:", error);
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async getActiveStatusesOrdered(req, res) {
        try {
            const statuses = await this.caseStatusService.getActiveStatusesOrdered();
            res.json({
                success: true,
                data: statuses,
                message: "Estados activos obtenidos correctamente",
            });
        }
        catch (error) {
            console.error("Error al obtener estados activos:", error);
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
}
exports.CaseStatusController = CaseStatusController;
