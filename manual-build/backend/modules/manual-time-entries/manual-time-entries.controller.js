"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManualTimeEntriesController = void 0;
const database_1 = require("../../config/database");
const ManualTimeEntry_1 = require("../../entities/ManualTimeEntry");
const CaseControl_1 = require("../../entities/CaseControl");
class ManualTimeEntriesController {
    constructor() {
        this.manualTimeEntryRepository = database_1.AppDataSource.getRepository(ManualTimeEntry_1.ManualTimeEntry);
        this.caseControlRepository = database_1.AppDataSource.getRepository(CaseControl_1.CaseControl);
    }
    async getManualTimeEntriesByCaseControl(req, res) {
        try {
            const { caseControlId } = req.params;
            const manualTimeEntries = await this.manualTimeEntryRepository.find({
                where: { caseControlId },
                order: { date: "DESC", createdAt: "DESC" },
                relations: ["user"],
            });
            res.json(manualTimeEntries);
        }
        catch (error) {
            console.error("Error fetching manual time entries:", error);
            res.status(500).json({
                message: "Error al obtener las entradas de tiempo manual",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async createManualTimeEntry(req, res) {
        try {
            const { caseControlId, description, durationMinutes, date } = req.body;
            const userId = req.user?.id;
            if (!caseControlId ||
                !description ||
                durationMinutes === undefined ||
                !date) {
                return res.status(400).json({
                    message: "Faltan campos requeridos: caseControlId, description, durationMinutes, date",
                });
            }
            const caseControl = await this.caseControlRepository.findOne({
                where: { id: caseControlId },
            });
            if (!caseControl) {
                return res.status(404).json({ message: "Case control no encontrado" });
            }
            const manualTimeEntry = this.manualTimeEntryRepository.create({
                caseControlId,
                userId,
                description,
                durationMinutes: parseInt(durationMinutes),
                date: date,
                createdBy: userId,
            });
            const savedEntry = await this.manualTimeEntryRepository.save(manualTimeEntry);
            await this.caseControlRepository.update({ id: caseControlId }, {
                totalTimeMinutes: () => `"totalTimeMinutes" + ${durationMinutes}`,
            });
            const createdEntry = await this.manualTimeEntryRepository.findOne({
                where: { id: savedEntry.id },
                relations: ["user"],
            });
            res.status(201).json(createdEntry);
        }
        catch (error) {
            console.error("Error creating manual time entry:", error);
            res.status(500).json({
                message: "Error al crear la entrada de tiempo manual",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async getManualTimeEntry(req, res) {
        try {
            const { id } = req.params;
            const manualTimeEntry = await this.manualTimeEntryRepository.findOne({
                where: { id },
                relations: ["user", "caseControl"],
            });
            if (!manualTimeEntry) {
                return res
                    .status(404)
                    .json({ message: "Entrada de tiempo manual no encontrada" });
            }
            res.json(manualTimeEntry);
        }
        catch (error) {
            console.error("Error fetching manual time entry:", error);
            res.status(500).json({
                message: "Error al obtener la entrada de tiempo manual",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async updateManualTimeEntry(req, res) {
        try {
            const { id } = req.params;
            const { description, durationMinutes, date } = req.body;
            const userId = req.user?.id;
            const manualTimeEntry = await this.manualTimeEntryRepository.findOne({
                where: { id },
                relations: ["caseControl"],
            });
            if (!manualTimeEntry) {
                return res
                    .status(404)
                    .json({ message: "Entrada de tiempo manual no encontrada" });
            }
            if (manualTimeEntry.userId !== userId) {
                return res
                    .status(403)
                    .json({ message: "No tienes permisos para editar esta entrada" });
            }
            const oldDuration = manualTimeEntry.durationMinutes;
            const newDuration = durationMinutes !== undefined ? parseInt(durationMinutes) : oldDuration;
            if (description !== undefined)
                manualTimeEntry.description = description;
            if (durationMinutes !== undefined)
                manualTimeEntry.durationMinutes = newDuration;
            if (date !== undefined)
                manualTimeEntry.date = date;
            await this.manualTimeEntryRepository.save(manualTimeEntry);
            if (oldDuration !== newDuration) {
                const difference = newDuration - oldDuration;
                await this.caseControlRepository.update({ id: manualTimeEntry.caseControlId }, {
                    totalTimeMinutes: () => `"totalTimeMinutes" + ${difference}`,
                });
            }
            const updatedEntry = await this.manualTimeEntryRepository.findOne({
                where: { id },
                relations: ["user"],
            });
            res.json(updatedEntry);
        }
        catch (error) {
            console.error("Error updating manual time entry:", error);
            res.status(500).json({
                message: "Error al actualizar la entrada de tiempo manual",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async deleteManualTimeEntry(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const userRole = req.user?.role || req.user?.roleName;
            const manualTimeEntry = await this.manualTimeEntryRepository.findOne({
                where: { id },
                relations: ["caseControl", "user"],
            });
            if (!manualTimeEntry) {
                return res
                    .status(404)
                    .json({ message: "Entrada de tiempo manual no encontrada" });
            }
            const isOwner = manualTimeEntry.userId === userId;
            const isAdmin = userRole &&
                [
                    "admin",
                    "administrator",
                    "supervisor",
                    "Admin",
                    "Administrator",
                    "Supervisor",
                ].includes(userRole);
            console.log("Delete manual time entry permission check:", {
                entryId: id,
                entryUserId: manualTimeEntry.userId,
                currentUserId: userId,
                currentUserRole: userRole,
                isOwner,
                isAdmin,
                canDelete: isOwner || isAdmin,
            });
            if (!isOwner && !isAdmin) {
                return res.status(403).json({
                    message: "No tienes permisos para eliminar esta entrada",
                    details: {
                        entryCreatedBy: manualTimeEntry.user?.fullName || manualTimeEntry.userId,
                        yourRole: userRole,
                    },
                });
            }
            await this.caseControlRepository.update({ id: manualTimeEntry.caseControlId }, {
                totalTimeMinutes: () => `"totalTimeMinutes" - ${manualTimeEntry.durationMinutes}`,
            });
            await this.manualTimeEntryRepository.remove(manualTimeEntry);
            res.json({ message: "Entrada de tiempo manual eliminada exitosamente" });
        }
        catch (error) {
            console.error("Error deleting manual time entry:", error);
            res.status(500).json({
                message: "Error al eliminar la entrada de tiempo manual",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async getManualTimeEntriesByUser(req, res) {
        try {
            const userId = req.user?.id;
            const { startDate, endDate } = req.query;
            let whereCondition = { userId };
            if (startDate || endDate) {
                whereCondition.date = {};
                if (startDate) {
                    whereCondition.date.gte = new Date(startDate);
                }
                if (endDate) {
                    whereCondition.date.lte = new Date(endDate);
                }
            }
            const manualTimeEntries = await this.manualTimeEntryRepository.find({
                where: whereCondition,
                order: { date: "DESC", createdAt: "DESC" },
                relations: ["caseControl", "caseControl.case"],
            });
            res.json(manualTimeEntries);
        }
        catch (error) {
            console.error("Error fetching user manual time entries:", error);
            res.status(500).json({
                message: "Error al obtener las entradas de tiempo manual del usuario",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
}
exports.ManualTimeEntriesController = ManualTimeEntriesController;
