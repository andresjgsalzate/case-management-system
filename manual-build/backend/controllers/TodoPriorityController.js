"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodoPriorityController = void 0;
const data_source_1 = __importDefault(require("../data-source"));
const TodoPriority_1 = require("../entities/TodoPriority");
const logger_1 = require("../utils/logger");
class TodoPriorityController {
    async getTodoPriorityRepository() {
        if (!data_source_1.default.isInitialized) {
            await data_source_1.default.initialize();
        }
        return data_source_1.default.getRepository(TodoPriority_1.TodoPriority);
    }
    async getAllPriorities(req, res) {
        try {
            const { page = 1, limit = 10, sortBy = "level", sortOrder = "ASC", search = "", isActive, } = req.query;
            const pageNumber = Math.max(1, parseInt(page));
            const limitNumber = Math.min(100, Math.max(1, parseInt(limit)));
            const offset = (pageNumber - 1) * limitNumber;
            const todoPriorityRepository = await this.getTodoPriorityRepository();
            const queryBuilder = todoPriorityRepository
                .createQueryBuilder("priority")
                .orderBy(`priority.${sortBy}`, sortOrder);
            if (search) {
                queryBuilder.where("LOWER(priority.name) LIKE LOWER(:search) OR LOWER(priority.description) LIKE LOWER(:search)", {
                    search: `%${search}%`,
                });
            }
            if (isActive !== undefined) {
                const isActiveBoolean = isActive === "true";
                if (search) {
                    queryBuilder.andWhere("priority.isActive = :isActive", {
                        isActive: isActiveBoolean,
                    });
                }
                else {
                    queryBuilder.where("priority.isActive = :isActive", {
                        isActive: isActiveBoolean,
                    });
                }
            }
            const [priorities, totalItems] = await queryBuilder
                .skip(offset)
                .take(limitNumber)
                .getManyAndCount();
            const totalPages = Math.ceil(totalItems / limitNumber);
            res.status(200).json({
                success: true,
                message: "Prioridades obtenidas exitosamente",
                data: {
                    priorities,
                    pagination: {
                        currentPage: pageNumber,
                        totalPages,
                        totalItems,
                        itemsPerPage: limitNumber,
                    },
                },
            });
        }
        catch (error) {
            logger_1.logger.error("Error al obtener prioridades:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async getPriorityStats(req, res) {
        try {
            const todoPriorityRepository = await this.getTodoPriorityRepository();
            const stats = await todoPriorityRepository
                .createQueryBuilder("priority")
                .select([
                "COUNT(*) as total",
                "COUNT(CASE WHEN priority.isActive = true THEN 1 END) as active",
                "COUNT(CASE WHEN priority.isActive = false THEN 1 END) as inactive",
            ])
                .getRawOne();
            res.status(200).json({
                success: true,
                message: "Estadísticas obtenidas exitosamente",
                data: {
                    total: parseInt(stats.total),
                    active: parseInt(stats.active),
                    inactive: parseInt(stats.inactive),
                },
            });
        }
        catch (error) {
            logger_1.logger.error("Error al obtener estadísticas de prioridades:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async getPriorityById(req, res) {
        try {
            const { id } = req.params;
            const todoPriorityRepository = await this.getTodoPriorityRepository();
            const priority = await todoPriorityRepository.findOne({
                where: { id },
            });
            if (!priority) {
                res.status(404).json({
                    success: false,
                    message: "Prioridad no encontrada",
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: "Prioridad obtenida exitosamente",
                data: priority,
            });
        }
        catch (error) {
            logger_1.logger.error("Error al obtener prioridad:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async createPriority(req, res) {
        try {
            const { name, description, color, level } = req.body;
            if (!name || typeof name !== "string" || name.trim().length === 0) {
                res.status(400).json({
                    success: false,
                    message: "El nombre es requerido y debe ser una cadena válida",
                });
                return;
            }
            if (!level || typeof level !== "number" || level < 1 || level > 10) {
                res.status(400).json({
                    success: false,
                    message: "El nivel es requerido y debe estar entre 1 y 10",
                });
                return;
            }
            const todoPriorityRepository = await this.getTodoPriorityRepository();
            const existingPriority = await todoPriorityRepository.findOne({
                where: { name: name.trim() },
            });
            if (existingPriority) {
                res.status(409).json({
                    success: false,
                    message: "Ya existe una prioridad con ese nombre",
                });
                return;
            }
            const priority = todoPriorityRepository.create({
                name: name.trim(),
                description: description?.trim() || null,
                color: color || "#6B7280",
                level,
                displayOrder: level,
            });
            const savedPriority = await todoPriorityRepository.save(priority);
            res.status(201).json({
                success: true,
                message: "Prioridad creada exitosamente",
                data: savedPriority,
            });
        }
        catch (error) {
            logger_1.logger.error("Error al crear prioridad:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async updatePriority(req, res) {
        try {
            const { id } = req.params;
            const { name, description, color, level } = req.body;
            const todoPriorityRepository = await this.getTodoPriorityRepository();
            const priority = await todoPriorityRepository.findOne({
                where: { id },
            });
            if (!priority) {
                res.status(404).json({
                    success: false,
                    message: "Prioridad no encontrada",
                });
                return;
            }
            if (name !== undefined) {
                if (typeof name !== "string" || name.trim().length === 0) {
                    res.status(400).json({
                        success: false,
                        message: "El nombre debe ser una cadena válida",
                    });
                    return;
                }
                const existingName = await todoPriorityRepository.findOne({
                    where: { name: name.trim() },
                });
                if (existingName && existingName.id !== id) {
                    res.status(409).json({
                        success: false,
                        message: "Ya existe una prioridad con ese nombre",
                    });
                    return;
                }
                priority.name = name.trim();
            }
            if (level !== undefined) {
                if (typeof level !== "number" || level < 1 || level > 10) {
                    res.status(400).json({
                        success: false,
                        message: "El nivel debe estar entre 1 y 10",
                    });
                    return;
                }
                const existingLevel = await todoPriorityRepository.findOne({
                    where: { level },
                });
                if (existingLevel && existingLevel.id !== id) {
                    res.status(409).json({
                        success: false,
                        message: "Ya existe una prioridad con ese nivel",
                    });
                    return;
                }
                priority.level = level;
            }
            if (description !== undefined) {
                priority.description = description?.trim() || null;
            }
            if (color !== undefined) {
                priority.color = color;
            }
            const updatedPriority = await todoPriorityRepository.save(priority);
            res.status(200).json({
                success: true,
                message: "Prioridad actualizada exitosamente",
                data: updatedPriority,
            });
        }
        catch (error) {
            logger_1.logger.error("Error al actualizar prioridad:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async togglePriorityStatus(req, res) {
        try {
            const { id } = req.params;
            const todoPriorityRepository = await this.getTodoPriorityRepository();
            const priority = await todoPriorityRepository.findOne({
                where: { id },
            });
            if (!priority) {
                res.status(404).json({
                    success: false,
                    message: "Prioridad no encontrada",
                });
                return;
            }
            priority.isActive = !priority.isActive;
            const updatedPriority = await todoPriorityRepository.save(priority);
            res.status(200).json({
                success: true,
                message: `Prioridad ${priority.isActive ? "activada" : "desactivada"} exitosamente`,
                data: updatedPriority,
            });
        }
        catch (error) {
            logger_1.logger.error("Error al cambiar estado de prioridad:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async deletePriority(req, res) {
        try {
            const { id } = req.params;
            const todoPriorityRepository = await this.getTodoPriorityRepository();
            const priority = await todoPriorityRepository.findOne({
                where: { id },
            });
            if (!priority) {
                res.status(404).json({
                    success: false,
                    message: "Prioridad no encontrada",
                });
                return;
            }
            await todoPriorityRepository.remove(priority);
            res.status(200).json({
                success: true,
                message: "Prioridad eliminada exitosamente",
            });
        }
        catch (error) {
            logger_1.logger.error("Error al eliminar prioridad:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async reorderPriorities(req, res) {
        try {
            const { priorities } = req.body;
            if (!Array.isArray(priorities)) {
                res.status(400).json({
                    success: false,
                    message: "Se requiere un array de prioridades",
                });
                return;
            }
            const todoPriorityRepository = await this.getTodoPriorityRepository();
            for (const item of priorities) {
                if (item.id && typeof item.displayOrder === "number") {
                    await todoPriorityRepository.update(item.id, {
                        displayOrder: item.displayOrder,
                    });
                }
            }
            res.status(200).json({
                success: true,
                message: "Prioridades reordenadas exitosamente",
            });
        }
        catch (error) {
            logger_1.logger.error("Error al reordenar prioridades:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
}
exports.TodoPriorityController = TodoPriorityController;
