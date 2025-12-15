"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemParameterController = void 0;
const SystemParameter_1 = require("../entities/SystemParameter");
class SystemParameterController {
    constructor(systemParameterService) {
        this.systemParameterService = systemParameterService;
    }
    async getAllParameters(req, res) {
        try {
            const parameters = await this.systemParameterService.findAll();
            const safeParameters = parameters.map((param) => ({
                ...param,
                parameterValue: param.isEncrypted ? "***" : param.parameterValue,
            }));
            res.json({
                success: true,
                data: safeParameters,
                message: "Parámetros obtenidos exitosamente",
            });
        }
        catch (error) {
            console.error("Error getting parameters:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async getParametersByCategory(req, res) {
        try {
            const { category } = req.params;
            if (!Object.values(SystemParameter_1.ParameterCategory).includes(category)) {
                res.status(400).json({
                    success: false,
                    message: `Categoría inválida. Categorías válidas: ${Object.values(SystemParameter_1.ParameterCategory).join(", ")}`,
                });
                return;
            }
            const parameters = await this.systemParameterService.findByCategory(category);
            const safeParameters = parameters.map((param) => ({
                ...param,
                parameterValue: param.isEncrypted ? "***" : param.parameterValue,
            }));
            res.json({
                success: true,
                data: safeParameters,
                message: `Parámetros de la categoría ${category} obtenidos exitosamente`,
            });
        }
        catch (error) {
            console.error("Error getting parameters by category:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async getParameterByKey(req, res) {
        try {
            const { key } = req.params;
            if (!key) {
                res.status(400).json({
                    success: false,
                    message: "La clave del parámetro es requerida",
                });
                return;
            }
            const parameter = await this.systemParameterService.findByKey(key);
            if (!parameter) {
                res.status(404).json({
                    success: false,
                    message: `Parámetro con clave '${key}' no encontrado`,
                });
                return;
            }
            const safeParameter = {
                ...parameter,
                parameterValue: parameter.isEncrypted
                    ? "***"
                    : parameter.parameterValue,
            };
            res.json({
                success: true,
                data: safeParameter,
                message: "Parámetro obtenido exitosamente",
            });
        }
        catch (error) {
            console.error("Error getting parameter by key:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async getParameterValue(req, res) {
        try {
            const { key } = req.params;
            if (!key) {
                res.status(400).json({
                    success: false,
                    message: "La clave del parámetro es requerida",
                });
                return;
            }
            const value = await this.systemParameterService.getValue(key);
            if (value === null) {
                res.status(404).json({
                    success: false,
                    message: `Parámetro con clave '${key}' no encontrado`,
                });
                return;
            }
            res.json({
                success: true,
                data: { key, value },
                message: "Valor del parámetro obtenido exitosamente",
            });
        }
        catch (error) {
            console.error("Error getting parameter value:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async createParameter(req, res) {
        try {
            const createDto = req.body;
            const userId = req.user?.id;
            const parameter = await this.systemParameterService.create(createDto, userId);
            res.status(201).json({
                success: true,
                data: parameter,
                message: "Parámetro creado exitosamente",
            });
        }
        catch (error) {
            console.error("Error creating parameter:", error);
            if (error instanceof Error) {
                if (error.name === "BadRequestException") {
                    res.status(400).json({
                        success: false,
                        message: error.message,
                    });
                    return;
                }
            }
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async updateParameter(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    success: false,
                    message: "El ID del parámetro es requerido",
                });
                return;
            }
            const updateDto = req.body;
            const userId = req.user?.id;
            const parameter = await this.systemParameterService.update(parseInt(id), updateDto, userId);
            res.json({
                success: true,
                data: parameter,
                message: "Parámetro actualizado exitosamente",
            });
        }
        catch (error) {
            console.error("Error updating parameter:", error);
            if (error instanceof Error) {
                if (error.name === "NotFoundException") {
                    res.status(404).json({
                        success: false,
                        message: error.message,
                    });
                    return;
                }
                if (error.name === "BadRequestException") {
                    res.status(400).json({
                        success: false,
                        message: error.message,
                    });
                    return;
                }
            }
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async setParameterValue(req, res) {
        try {
            const { key } = req.params;
            if (!key) {
                res.status(400).json({
                    success: false,
                    message: "La clave del parámetro es requerida",
                });
                return;
            }
            const { value } = req.body;
            const userId = req.user?.id;
            const parameter = await this.systemParameterService.setValue(key, value, userId);
            res.json({
                success: true,
                data: parameter,
                message: "Valor del parámetro actualizado exitosamente",
            });
        }
        catch (error) {
            console.error("Error setting parameter value:", error);
            if (error instanceof Error) {
                if (error.name === "NotFoundException") {
                    res.status(404).json({
                        success: false,
                        message: error.message,
                    });
                    return;
                }
                if (error.name === "BadRequestException") {
                    res.status(400).json({
                        success: false,
                        message: error.message,
                    });
                    return;
                }
            }
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async deleteParameter(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    success: false,
                    message: "El ID del parámetro es requerido",
                });
                return;
            }
            const userId = req.user?.id;
            await this.systemParameterService.remove(parseInt(id), userId);
            res.json({
                success: true,
                message: "Parámetro eliminado exitosamente",
            });
        }
        catch (error) {
            console.error("Error deleting parameter:", error);
            if (error instanceof Error) {
                if (error.name === "NotFoundException") {
                    res.status(404).json({
                        success: false,
                        message: error.message,
                    });
                    return;
                }
            }
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async getConfigByCategory(req, res) {
        try {
            const { category } = req.params;
            if (!Object.values(SystemParameter_1.ParameterCategory).includes(category)) {
                res.status(400).json({
                    success: false,
                    message: `Categoría inválida. Categorías válidas: ${Object.values(SystemParameter_1.ParameterCategory).join(", ")}`,
                });
                return;
            }
            const config = await this.systemParameterService.getConfigByCategory(category);
            res.json({
                success: true,
                data: config,
                message: `Configuración de la categoría ${category} obtenida exitosamente`,
            });
        }
        catch (error) {
            console.error("Error getting config by category:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async validateConfiguration(req, res) {
        try {
            const errors = await this.systemParameterService.validateRequiredParameters();
            res.json({
                success: errors.length === 0,
                data: {
                    isValid: errors.length === 0,
                    errors: errors,
                },
                message: errors.length === 0
                    ? "Todas las configuraciones requeridas están completas"
                    : `Se encontraron ${errors.length} configuraciones faltantes`,
            });
        }
        catch (error) {
            console.error("Error validating configuration:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async getConfigurationStats(req, res) {
        try {
            const stats = await this.systemParameterService.getConfigurationStats();
            res.json({
                success: true,
                data: stats,
                message: "Estadísticas de configuración obtenidas exitosamente",
            });
        }
        catch (error) {
            console.error("Error getting configuration stats:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async refreshCache(req, res) {
        try {
            await this.systemParameterService.refreshCache();
            res.json({
                success: true,
                message: "Cache de parámetros refrescado exitosamente",
            });
        }
        catch (error) {
            console.error("Error refreshing cache:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
}
exports.SystemParameterController = SystemParameterController;
