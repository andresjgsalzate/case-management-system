"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaseStatusController = void 0;
const database_1 = require("../../config/database");
const entities_1 = require("../../entities");
class CaseStatusController {
    constructor() {
        this.caseStatusRepository = database_1.AppDataSource.getRepository(entities_1.CaseStatusControl);
    }
    async getAllStatuses(req, res) {
        try {
            const statuses = await this.caseStatusRepository.find({
                where: { isActive: true },
                order: { displayOrder: "ASC", name: "ASC" },
            });
            res.json({
                success: true,
                data: statuses,
            });
        }
        catch (error) {
            console.error("Error fetching case statuses:", error);
            res.status(500).json({
                success: false,
                message: "Error al obtener los estados",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async getStatusById(req, res) {
        try {
            const { id } = req.params;
            const status = await this.caseStatusRepository.findOneBy({ id });
            if (!status) {
                return res.status(404).json({
                    success: false,
                    message: "Estado no encontrado",
                });
            }
            res.json({
                success: true,
                data: status,
            });
        }
        catch (error) {
            console.error("Error fetching case status:", error);
            res.status(500).json({
                success: false,
                message: "Error al obtener el estado",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async createStatus(req, res) {
        try {
            const data = req.body;
            const existingStatus = await this.caseStatusRepository.findOneBy({
                name: data.name,
            });
            if (existingStatus) {
                return res.status(400).json({
                    success: false,
                    message: "Ya existe un estado con ese nombre",
                });
            }
            const status = this.caseStatusRepository.create({
                name: data.name,
                description: data.description,
                color: data.color || "#6B7280",
                displayOrder: data.displayOrder || 0,
                isActive: data.isActive !== undefined ? data.isActive : true,
            });
            const savedStatus = await this.caseStatusRepository.save(status);
            res.status(201).json({
                success: true,
                data: savedStatus,
            });
        }
        catch (error) {
            console.error("Error creating case status:", error);
            res.status(500).json({
                success: false,
                message: "Error al crear el estado",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;
            const status = await this.caseStatusRepository.findOneBy({ id });
            if (!status) {
                return res.status(404).json({
                    success: false,
                    message: "Estado no encontrado",
                });
            }
            if (data.name && data.name !== status.name) {
                const existingStatus = await this.caseStatusRepository.findOneBy({
                    name: data.name,
                });
                if (existingStatus) {
                    return res.status(400).json({
                        success: false,
                        message: "Ya existe un estado con ese nombre",
                    });
                }
            }
            if (data.name)
                status.name = data.name;
            if (data.description !== undefined)
                status.description = data.description;
            if (data.color)
                status.color = data.color;
            if (data.displayOrder !== undefined)
                status.displayOrder = data.displayOrder;
            if (data.isActive !== undefined)
                status.isActive = data.isActive;
            const updatedStatus = await this.caseStatusRepository.save(status);
            res.json({
                success: true,
                data: updatedStatus,
            });
        }
        catch (error) {
            console.error("Error updating case status:", error);
            res.status(500).json({
                success: false,
                message: "Error al actualizar el estado",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async deleteStatus(req, res) {
        try {
            const { id } = req.params;
            const status = await this.caseStatusRepository.findOneBy({ id });
            if (!status) {
                return res.status(404).json({
                    success: false,
                    message: "Estado no encontrado",
                });
            }
            status.isActive = false;
            await this.caseStatusRepository.save(status);
            res.json({
                success: true,
                message: "Estado desactivado correctamente",
            });
        }
        catch (error) {
            console.error("Error deleting case status:", error);
            res.status(500).json({
                success: false,
                message: "Error al eliminar el estado",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async initializeDefaultStatuses(req, res) {
        try {
            const defaultStatuses = [
                {
                    name: "PENDIENTE",
                    description: "Caso asignado pero no iniciado",
                    color: "#6B7280",
                    displayOrder: 1,
                },
                {
                    name: "EN CURSO",
                    description: "Caso siendo trabajado activamente",
                    color: "#3B82F6",
                    displayOrder: 2,
                },
                {
                    name: "ESCALADA",
                    description: "Caso escalado a nivel superior",
                    color: "#F59E0B",
                    displayOrder: 3,
                },
                {
                    name: "TERMINADA",
                    description: "Caso completado exitosamente",
                    color: "#10B981",
                    displayOrder: 4,
                },
            ];
            const createdStatuses = [];
            for (const statusData of defaultStatuses) {
                const existingStatus = await this.caseStatusRepository.findOneBy({
                    name: statusData.name,
                });
                if (!existingStatus) {
                    const status = this.caseStatusRepository.create(statusData);
                    const savedStatus = await this.caseStatusRepository.save(status);
                    createdStatuses.push(savedStatus);
                }
            }
            res.json({
                success: true,
                data: createdStatuses,
                message: `${createdStatuses.length} estados creados`,
            });
        }
        catch (error) {
            console.error("Error initializing default statuses:", error);
            res.status(500).json({
                success: false,
                message: "Error al inicializar los estados por defecto",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
}
exports.CaseStatusController = CaseStatusController;
