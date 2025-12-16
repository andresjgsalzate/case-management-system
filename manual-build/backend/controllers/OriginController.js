"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OriginController = void 0;
const OriginService_1 = require("../services/OriginService");
class OriginController {
    constructor() {
        this.originService = new OriginService_1.OriginService();
    }
    async getAllOrigins(req, res) {
        try {
            const { page = 1, limit = 10, search, activo, sortBy = "nombre", sortOrder = "ASC", } = req.query;
            const filters = {
                page: parseInt(page),
                limit: parseInt(limit),
                search: search,
                activo: activo === "true" ? true : activo === "false" ? false : undefined,
                sortBy: sortBy,
                sortOrder: sortOrder,
            };
            const result = await this.originService.getAllOrigins(filters);
            res.json({
                success: true,
                data: result,
                message: "Orígenes obtenidos correctamente",
            });
        }
        catch (error) {
            console.error("Error al obtener orígenes:", error);
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async getOriginById(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "ID del origen es requerido",
                });
            }
            const origin = await this.originService.getOriginById(id);
            if (!origin) {
                return res.status(404).json({
                    success: false,
                    error: "Origen no encontrado",
                });
            }
            res.json({
                success: true,
                data: origin,
                message: "Origen obtenido correctamente",
            });
        }
        catch (error) {
            console.error("Error al obtener origen:", error);
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async createOrigin(req, res) {
        try {
            const originData = req.body;
            if (!originData.nombre || originData.nombre.trim() === "") {
                return res.status(400).json({
                    success: false,
                    error: "El nombre es requerido",
                });
            }
            const origin = await this.originService.createOrigin(originData);
            res.status(201).json({
                success: true,
                data: origin,
                message: "Origen creado correctamente",
            });
        }
        catch (error) {
            console.error("Error al crear origen:", error);
            if (error instanceof Error) {
                if (error.message === "Ya existe un origen con este nombre") {
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
    async updateOrigin(req, res) {
        try {
            const { id } = req.params;
            const originData = req.body;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "ID del origen es requerido",
                });
            }
            if (originData.nombre && originData.nombre.trim() === "") {
                return res.status(400).json({
                    success: false,
                    error: "El nombre no puede estar vacío",
                });
            }
            const origin = await this.originService.updateOrigin(id, originData);
            res.json({
                success: true,
                data: origin,
                message: "Origen actualizado correctamente",
            });
        }
        catch (error) {
            console.error("Error al actualizar origen:", error);
            if (error instanceof Error) {
                if (error.message === "Origen no encontrado") {
                    return res.status(404).json({
                        success: false,
                        error: error.message,
                    });
                }
                if (error.message === "Ya existe un origen con este nombre") {
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
    async deleteOrigin(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "ID del origen es requerido",
                });
            }
            await this.originService.deleteOrigin(id);
            res.json({
                success: true,
                message: "Origen eliminado correctamente",
            });
        }
        catch (error) {
            console.error("Error al eliminar origen:", error);
            if (error instanceof Error) {
                if (error.message === "Origen no encontrado") {
                    return res.status(404).json({
                        success: false,
                        error: error.message,
                    });
                }
                if (error.message.includes("casos asociados")) {
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
    async searchOrigins(req, res) {
        try {
            const { search, activo } = req.query;
            const filters = {
                search: search,
                activo: activo === "true" ? true : activo === "false" ? false : undefined,
            };
            const origins = await this.originService.searchOrigins(filters);
            res.json({
                success: true,
                data: origins,
                message: "Búsqueda completada correctamente",
            });
        }
        catch (error) {
            console.error("Error al buscar orígenes:", error);
            res.status(500).json({
                success: false,
                error: "Error interno del servidor",
            });
        }
    }
    async getOriginStats(req, res) {
        try {
            const stats = await this.originService.getOriginStats();
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
    async checkCanDeleteOrigin(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "ID del origen es requerido",
                });
            }
            const result = await this.originService.canDeleteOrigin(id);
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
}
exports.OriginController = OriginController;
