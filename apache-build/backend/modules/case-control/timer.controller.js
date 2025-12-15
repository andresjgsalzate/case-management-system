"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimerController = void 0;
const database_1 = require("../../config/database");
const entities_1 = require("../../entities");
class TimerController {
    constructor() {
        this.caseControlRepository = database_1.AppDataSource.getRepository(entities_1.CaseControl);
        this.timeEntryRepository = database_1.AppDataSource.getRepository(entities_1.TimeEntry);
    }
    async startTimer(req, res) {
        try {
            const { caseControlId } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Usuario no autenticado",
                });
            }
            const caseControl = await this.caseControlRepository.findOneBy({
                id: caseControlId,
            });
            if (!caseControl) {
                return res.status(404).json({
                    success: false,
                    message: "Control de caso no encontrado",
                });
            }
            if (caseControl.isTimerActive) {
                return res.status(400).json({
                    success: false,
                    message: "El timer ya está activo",
                });
            }
            const now = new Date();
            caseControl.isTimerActive = true;
            caseControl.timerStartAt = now;
            if (!caseControl.startedAt) {
                caseControl.startedAt = now;
            }
            await this.caseControlRepository.save(caseControl);
            const timeEntry = this.timeEntryRepository.create({
                caseControlId,
                userId,
                startTime: now,
                durationMinutes: 0,
            });
            await this.timeEntryRepository.save(timeEntry);
            res.json({
                success: true,
                data: caseControl,
                message: "Timer iniciado correctamente",
            });
        }
        catch (error) {
            console.error("Error starting timer:", error);
            res.status(500).json({
                success: false,
                message: "Error al iniciar el timer",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async stopTimer(req, res) {
        try {
            const { caseControlId, description } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Usuario no autenticado",
                });
            }
            if (description) {
                if (!description.trim()) {
                    return res.status(400).json({
                        success: false,
                        message: "Descripción es requerida",
                    });
                }
                if (description.trim().length < 100) {
                    return res.status(400).json({
                        success: false,
                        message: "La descripción debe tener al menos 100 caracteres",
                    });
                }
            }
            const caseControl = await this.caseControlRepository.findOneBy({
                id: caseControlId,
            });
            if (!caseControl) {
                return res.status(404).json({
                    success: false,
                    message: "Control de caso no encontrado",
                });
            }
            if (!caseControl.isTimerActive) {
                return res.status(400).json({
                    success: false,
                    message: "El timer no está activo",
                });
            }
            const now = new Date();
            const startTime = caseControl.timerStartAt;
            const durationMs = now.getTime() - startTime.getTime();
            const durationMinutes = Math.round(durationMs / (1000 * 60));
            const activeTimeEntry = await this.timeEntryRepository.findOne({
                where: {
                    caseControlId,
                    userId,
                    endTime: null,
                },
                order: { startTime: "DESC" },
            });
            if (activeTimeEntry) {
                activeTimeEntry.endTime = now;
                activeTimeEntry.durationMinutes = durationMinutes;
                if (description && description.trim()) {
                    activeTimeEntry.description = description.trim();
                }
                await this.timeEntryRepository.save(activeTimeEntry);
            }
            caseControl.isTimerActive = false;
            caseControl.timerStartAt = undefined;
            caseControl.totalTimeMinutes += durationMinutes;
            await this.caseControlRepository.save(caseControl);
            res.json({
                success: true,
                data: {
                    caseControl,
                    durationMinutes,
                    totalMinutes: caseControl.totalTimeMinutes,
                    description: description?.trim() || null,
                },
                message: `Timer detenido. Tiempo registrado: ${durationMinutes} minutos`,
            });
        }
        catch (error) {
            console.error("Error stopping timer:", error);
            res.status(500).json({
                success: false,
                message: "Error al detener el timer",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async pauseTimer(req, res) {
        try {
            const { caseControlId, description } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Usuario no autenticado",
                });
            }
            if (description) {
                if (!description.trim()) {
                    return res.status(400).json({
                        success: false,
                        message: "Descripción es requerida",
                    });
                }
                if (description.trim().length < 100) {
                    return res.status(400).json({
                        success: false,
                        message: "La descripción debe tener al menos 100 caracteres",
                    });
                }
            }
            const caseControl = await this.caseControlRepository.findOneBy({
                id: caseControlId,
            });
            if (!caseControl) {
                return res.status(404).json({
                    success: false,
                    message: "Control de caso no encontrado",
                });
            }
            if (!caseControl.isTimerActive) {
                return res.status(400).json({
                    success: false,
                    message: "El timer no está activo",
                });
            }
            const now = new Date();
            const startTime = caseControl.timerStartAt;
            const durationMs = now.getTime() - startTime.getTime();
            const durationMinutes = Math.round(durationMs / (1000 * 60));
            const activeTimeEntry = await this.timeEntryRepository.findOne({
                where: {
                    caseControlId,
                    userId,
                    endTime: null,
                },
                order: { startTime: "DESC" },
            });
            if (activeTimeEntry) {
                activeTimeEntry.endTime = now;
                activeTimeEntry.durationMinutes = durationMinutes;
                if (description && description.trim()) {
                    activeTimeEntry.description = description.trim();
                }
                await this.timeEntryRepository.save(activeTimeEntry);
            }
            caseControl.isTimerActive = false;
            caseControl.timerStartAt = undefined;
            caseControl.totalTimeMinutes += durationMinutes;
            await this.caseControlRepository.save(caseControl);
            res.json({
                success: true,
                data: {
                    caseControl,
                    durationMinutes,
                    totalMinutes: caseControl.totalTimeMinutes,
                    description: description?.trim() || null,
                },
                message: `Timer pausado. Tiempo registrado: ${durationMinutes} minutos`,
            });
        }
        catch (error) {
            console.error("Error pausing timer:", error);
            res.status(500).json({
                success: false,
                message: "Error al pausar el timer",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
    async getActiveTime(req, res) {
        try {
            const { caseControlId } = req.params;
            const caseControl = await this.caseControlRepository.findOneBy({
                id: caseControlId,
            });
            if (!caseControl) {
                return res.status(404).json({
                    success: false,
                    message: "Control de caso no encontrado",
                });
            }
            let currentSessionMinutes = 0;
            if (caseControl.isTimerActive && caseControl.timerStartAt) {
                const now = new Date();
                const durationMs = now.getTime() - caseControl.timerStartAt.getTime();
                currentSessionMinutes = Math.round(durationMs / (1000 * 60));
            }
            res.json({
                success: true,
                data: {
                    isTimerActive: caseControl.isTimerActive,
                    timerStartAt: caseControl.timerStartAt?.toISOString(),
                    totalTimeMinutes: caseControl.totalTimeMinutes,
                    currentSessionMinutes,
                },
            });
        }
        catch (error) {
            console.error("Error getting active time:", error);
            res.status(500).json({
                success: false,
                message: "Error al obtener el tiempo activo",
                error: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }
}
exports.TimerController = TimerController;
