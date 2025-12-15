"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeEntriesController = void 0;
const database_1 = require("../../config/database");
const TimeEntry_1 = require("../../entities/TimeEntry");
const CaseControl_1 = require("../../entities/CaseControl");
class TimeEntriesController {
    constructor() {
        this.timeEntryRepository = database_1.AppDataSource.getRepository(TimeEntry_1.TimeEntry);
        this.caseControlRepository = database_1.AppDataSource.getRepository(CaseControl_1.CaseControl);
    }
    async getTimeEntriesByCaseControl(req, res) {
        try {
            const { caseControlId } = req.params;
            const timeEntries = await this.timeEntryRepository.find({
                where: { caseControlId },
                order: { startTime: "DESC" },
                relations: ["user"],
            });
            res.json(timeEntries);
        }
        catch (error) {
            console.error("Error fetching time entries:", error);
            res.status(500).json({
                message: "Error al obtener las entradas de tiempo",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async getTimeEntry(req, res) {
        try {
            const { id } = req.params;
            const timeEntry = await this.timeEntryRepository.findOne({
                where: { id },
                relations: ["user", "caseControl"],
            });
            if (!timeEntry) {
                return res
                    .status(404)
                    .json({ message: "Entrada de tiempo no encontrada" });
            }
            res.json(timeEntry);
        }
        catch (error) {
            console.error("Error fetching time entry:", error);
            res.status(500).json({
                message: "Error al obtener la entrada de tiempo",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async deleteTimeEntry(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const userRole = req.user?.role || req.user?.roleName;
            const timeEntry = await this.timeEntryRepository.findOne({
                where: { id },
                relations: ["caseControl", "user"],
            });
            if (!timeEntry) {
                return res
                    .status(404)
                    .json({ message: "Entrada de tiempo no encontrada" });
            }
            const isOwner = timeEntry.userId === userId;
            const isAdmin = userRole &&
                [
                    "admin",
                    "administrator",
                    "supervisor",
                    "Admin",
                    "Administrator",
                    "Supervisor",
                ].includes(userRole);
            console.log("Delete permission check:", {
                entryId: id,
                entryUserId: timeEntry.userId,
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
                        entryCreatedBy: timeEntry.user?.fullName || timeEntry.userId,
                        yourRole: userRole,
                    },
                });
            }
            if (timeEntry.endTime) {
                const durationMinutes = Math.floor((new Date(timeEntry.endTime).getTime() -
                    new Date(timeEntry.startTime).getTime()) /
                    (1000 * 60));
                await this.caseControlRepository.update({ id: timeEntry.caseControlId }, {
                    totalTimeMinutes: () => `"totalTimeMinutes" - ${durationMinutes}`,
                });
            }
            await this.timeEntryRepository.remove(timeEntry);
            res.json({ message: "Entrada de tiempo eliminada exitosamente" });
        }
        catch (error) {
            console.error("Error deleting time entry:", error);
            res.status(500).json({
                message: "Error al eliminar la entrada de tiempo",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async getTimeEntriesByUser(req, res) {
        try {
            const userId = req.user?.id;
            const { startDate, endDate } = req.query;
            let whereCondition = { userId };
            if (startDate || endDate) {
                whereCondition.startTime = {};
                if (startDate) {
                    whereCondition.startTime.gte = new Date(startDate);
                }
                if (endDate) {
                    whereCondition.startTime.lte = new Date(endDate);
                }
            }
            const timeEntries = await this.timeEntryRepository.find({
                where: whereCondition,
                order: { startTime: "DESC" },
                relations: ["caseControl", "caseControl.case"],
            });
            res.json(timeEntries);
        }
        catch (error) {
            console.error("Error fetching user time entries:", error);
            res.status(500).json({
                message: "Error al obtener las entradas de tiempo del usuario",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
}
exports.TimeEntriesController = TimeEntriesController;
