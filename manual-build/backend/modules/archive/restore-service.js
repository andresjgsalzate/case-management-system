"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestoreService = void 0;
const database_1 = require("../../config/database");
const ArchivedCase_1 = require("../../entities/ArchivedCase");
const ArchivedTodo_entity_1 = require("../../entities/archive/ArchivedTodo.entity");
const Case_1 = require("../../entities/Case");
const Todo_1 = require("../../entities/Todo");
const CaseControl_1 = require("../../entities/CaseControl");
const CaseStatusControl_1 = require("../../entities/CaseStatusControl");
const TodoControl_1 = require("../../entities/TodoControl");
const ManualTimeEntry_1 = require("../../entities/ManualTimeEntry");
const TimeEntry_1 = require("../../entities/TimeEntry");
const TodoManualTimeEntry_1 = require("../../entities/TodoManualTimeEntry");
const typeorm_1 = require("typeorm");
const TodoTimeEntry_1 = require("../../entities/TodoTimeEntry");
class RestoreService {
    async restoreCase(archivedCaseId, restoredBy) {
        const queryRunner = database_1.AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const archivedCase = await queryRunner.manager.findOne(ArchivedCase_1.ArchivedCase, {
                where: { id: archivedCaseId },
            });
            if (!archivedCase) {
                throw new Error("Caso archivado no encontrado");
            }
            const existingCase = await queryRunner.manager.findOne(Case_1.Case, {
                where: { numeroCaso: archivedCase.caseNumber },
            });
            if (existingCase) {
                throw new Error(`Ya existe un caso activo con el número ${archivedCase.caseNumber}`);
            }
            const originalData = archivedCase.metadata;
            if (!originalData) {
                throw new Error("Los datos originales del caso no están disponibles");
            }
            const newCase = queryRunner.manager.create(Case_1.Case, {
                id: archivedCase.originalCaseId,
                numeroCaso: archivedCase.caseNumber,
                descripcion: originalData.descripcion || archivedCase.description,
                fecha: originalData.fecha ? new Date(originalData.fecha) : new Date(),
                historialCaso: originalData.historialCaso || 1,
                conocimientoModulo: originalData.conocimientoModulo || 1,
                manipulacionDatos: originalData.manipulacionDatos || 1,
                claridadDescripcion: originalData.claridadDescripcion || 1,
                causaFallo: originalData.causaFallo || 1,
                puntuacion: originalData.puntuacion || "5.00",
                complejidadTecnica: originalData.complejidadTecnica || 1,
                tiempoEstimado: originalData.tiempoEstimado || 60,
                clasificacion: originalData.clasificacion || archivedCase.classification,
                estado: Case_1.EstadoCase.RESTAURADO,
                prioridad: originalData.prioridad || archivedCase.priority,
                userId: archivedCase.createdBy,
                assignedUserId: archivedCase.assignedTo,
                assignedToId: archivedCase.assignedTo,
                createdByUserId: archivedCase.createdBy,
                applicationId: originalData.applicationId,
                originId: originalData.originId,
            });
            const savedCase = await queryRunner.manager.save(Case_1.Case, newCase);
            let savedCaseControl = null;
            const controlData = originalData?.caseControlRecords?.[0];
            if (controlData) {
                const pendienteStatus = await queryRunner.manager.findOne(CaseStatusControl_1.CaseStatusControl, {
                    where: { name: "PENDIENTE" },
                });
                console.log(`🔄 Restaurando CaseControl con estado: ${pendienteStatus ? "PENDIENTE" : "ORIGINAL"} (ID: ${pendienteStatus?.id || controlData.statusId})`);
                const newCaseControl = new CaseControl_1.CaseControl();
                newCaseControl.caseId = savedCase.id;
                newCaseControl.userId = archivedCase.createdBy;
                newCaseControl.statusId = pendienteStatus?.id || controlData.statusId;
                newCaseControl.totalTimeMinutes = controlData.totalTimeMinutes || 0;
                newCaseControl.assignedAt = controlData.assignedAt
                    ? new Date(controlData.assignedAt)
                    : new Date();
                newCaseControl.startedAt = controlData.startedAt
                    ? new Date(controlData.startedAt)
                    : undefined;
                newCaseControl.completedAt = controlData.completedAt
                    ? new Date(controlData.completedAt)
                    : undefined;
                newCaseControl.isTimerActive = false;
                newCaseControl.timerStartAt = undefined;
                savedCaseControl = await queryRunner.manager.save(newCaseControl);
                if (controlData.manualTimeEntries &&
                    Array.isArray(controlData.manualTimeEntries)) {
                    for (const timeEntry of controlData.manualTimeEntries) {
                        const newTimeEntry = queryRunner.manager.create(ManualTimeEntry_1.ManualTimeEntry, {
                            caseControlId: savedCaseControl.id,
                            userId: restoredBy,
                            date: timeEntry.date || new Date().toISOString().split("T")[0],
                            durationMinutes: timeEntry.minutes || timeEntry.durationMinutes || 0,
                            description: timeEntry.description || "Entrada restaurada",
                            createdBy: timeEntry.createdBy || restoredBy,
                        });
                        await queryRunner.manager.save(newTimeEntry);
                    }
                }
                if (controlData.timeEntries && Array.isArray(controlData.timeEntries)) {
                    for (const timeEntry of controlData.timeEntries) {
                        const newTimeEntry = new TimeEntry_1.TimeEntry();
                        newTimeEntry.caseControlId = savedCaseControl.id;
                        newTimeEntry.userId = archivedCase.createdBy;
                        newTimeEntry.startTime = new Date(timeEntry.startTime);
                        newTimeEntry.endTime = timeEntry.endTime
                            ? new Date(timeEntry.endTime)
                            : undefined;
                        newTimeEntry.durationMinutes =
                            timeEntry.totalMinutes || timeEntry.durationMinutes || 0;
                        newTimeEntry.description = timeEntry.description;
                        await queryRunner.manager.save(newTimeEntry);
                    }
                }
            }
            if (savedCaseControl) {
                console.log(`🔍 Restaurando entradas de tiempo para CASO ${archivedCase.caseNumber}:`, {
                    timerEntriesCount: archivedCase.timerEntries?.length || 0,
                    manualEntriesCount: archivedCase.manualTimeEntries?.length || 0,
                });
                if (archivedCase.manualTimeEntries &&
                    Array.isArray(archivedCase.manualTimeEntries) &&
                    archivedCase.manualTimeEntries.length > 0) {
                    for (const timeEntry of archivedCase.manualTimeEntries) {
                        const newTimeEntry = queryRunner.manager.create(ManualTimeEntry_1.ManualTimeEntry, {
                            id: timeEntry.id,
                            caseControlId: savedCaseControl.id,
                            userId: timeEntry.userId,
                            date: timeEntry.date
                                ? typeof timeEntry.date === "string"
                                    ? timeEntry.date
                                    : new Date(timeEntry.date).toISOString().split("T")[0]
                                : new Date().toISOString().split("T")[0],
                            durationMinutes: timeEntry.durationMinutes || 0,
                            description: timeEntry.description || "Entrada restaurada",
                            createdBy: timeEntry.createdBy || restoredBy,
                            createdAt: timeEntry.createdAt
                                ? new Date(timeEntry.createdAt)
                                : new Date(),
                            updatedAt: timeEntry.updatedAt
                                ? new Date(timeEntry.updatedAt)
                                : new Date(),
                        });
                        await queryRunner.manager.save(newTimeEntry);
                    }
                }
                if (archivedCase.timerEntries &&
                    Array.isArray(archivedCase.timerEntries) &&
                    archivedCase.timerEntries.length > 0) {
                    for (const timeEntry of archivedCase.timerEntries) {
                        const newTimeEntry = new TimeEntry_1.TimeEntry();
                        newTimeEntry.id = timeEntry.id;
                        newTimeEntry.caseControlId = savedCaseControl.id;
                        newTimeEntry.userId = timeEntry.userId;
                        newTimeEntry.startTime = new Date(timeEntry.startTime);
                        newTimeEntry.endTime = timeEntry.endTime
                            ? new Date(timeEntry.endTime)
                            : undefined;
                        newTimeEntry.durationMinutes = timeEntry.durationMinutes || 0;
                        newTimeEntry.description =
                            timeEntry.description || "Entrada automática restaurada";
                        newTimeEntry.createdAt = new Date(timeEntry.createdAt);
                        newTimeEntry.updatedAt = new Date(timeEntry.updatedAt);
                        await queryRunner.manager.save(newTimeEntry);
                    }
                    console.log(`✅ Restauradas ${archivedCase.timerEntries.length} entradas de timer para CASO`);
                }
                if (archivedCase.manualTimeEntries &&
                    archivedCase.manualTimeEntries.length > 0) {
                    console.log(`✅ Restauradas ${archivedCase.manualTimeEntries.length} entradas manuales para CASO`);
                }
            }
            archivedCase.isRestored = true;
            archivedCase.restoredAt = new Date();
            archivedCase.restoredBy = restoredBy;
            await queryRunner.manager.save(ArchivedCase_1.ArchivedCase, archivedCase);
            await queryRunner.commitTransaction();
            try {
                await this.verifyRestoration(savedCase.id, archivedCase);
                await database_1.AppDataSource.getRepository(ArchivedCase_1.ArchivedCase).remove(archivedCase);
                console.log(`✅ Caso ${archivedCase.caseNumber} verificado y eliminado del archivo exitosamente`);
            }
            catch (verificationError) {
                console.error(`⚠️ Error en verificación post-restauración: ${verificationError.message}`);
                console.log(`El caso ${archivedCase.caseNumber} se restauró pero se mantiene en archivo para revisión`);
            }
            return {
                success: true,
                caseId: savedCase.id,
                message: `Caso ${archivedCase.caseNumber} restaurado exitosamente con todas sus entidades`,
            };
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            console.error("Error restaurando caso:", error);
            throw new Error(`Error restaurando caso: ${error.message}`);
        }
        finally {
            await queryRunner.release();
        }
    }
    async restoreTodo(archivedTodoId, restoredBy) {
        const queryRunner = database_1.AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const archivedTodo = await queryRunner.manager.findOne(ArchivedTodo_entity_1.ArchivedTodo, {
                where: { id: archivedTodoId },
            });
            if (!archivedTodo) {
                throw new Error("Todo archivado no encontrado");
            }
            const originalData = archivedTodo.originalData;
            if (!originalData) {
                throw new Error("Los datos originales del todo no están disponibles");
            }
            const newTodo = new Todo_1.Todo();
            newTodo.id = archivedTodo.originalTodoId;
            newTodo.title = originalData.title || archivedTodo.title;
            newTodo.description =
                originalData.description || archivedTodo.description;
            newTodo.priorityId = originalData.priorityId || originalData.priority;
            newTodo.assignedUserId = archivedTodo.assignedUserId;
            newTodo.createdByUserId = archivedTodo.createdByUserId;
            newTodo.dueDate =
                originalData.dueDate || archivedTodo.dueDate
                    ? new Date(originalData.dueDate || archivedTodo.dueDate)
                    : undefined;
            newTodo.estimatedMinutes = originalData.estimatedMinutes || 0;
            newTodo.isCompleted = false;
            newTodo.completedAt = undefined;
            const savedTodo = await queryRunner.manager.save(Todo_1.Todo, newTodo);
            let savedTodoControl = null;
            const controlData = archivedTodo.controlData;
            if (controlData) {
                const defaultStatus = await queryRunner.manager.findOne(CaseStatusControl_1.CaseStatusControl, {
                    where: { isActive: true },
                    order: { displayOrder: "ASC" },
                });
                if (!defaultStatus) {
                    throw new Error("No se encontró ningún status activo para asignar al control del TODO");
                }
                const newTodoControl = new TodoControl_1.TodoControl();
                newTodoControl.todoId = savedTodo.id;
                newTodoControl.userId = archivedTodo.createdByUserId;
                newTodoControl.statusId = defaultStatus.id;
                newTodoControl.totalTimeMinutes = controlData.totalTimeMinutes || 0;
                newTodoControl.assignedAt = controlData.assignedAt
                    ? new Date(controlData.assignedAt)
                    : new Date();
                newTodoControl.startedAt = undefined;
                newTodoControl.completedAt = undefined;
                newTodoControl.isTimerActive = false;
                newTodoControl.timerStartAt = undefined;
                savedTodoControl = await queryRunner.manager.save(newTodoControl);
            }
            if (savedTodoControl) {
                console.log(`🔍 Restaurando entradas de tiempo para TODO ${archivedTodo.title}:`, {
                    timerEntriesCount: archivedTodo.timerEntries?.length || 0,
                    manualEntriesCount: archivedTodo.manualTimeEntries?.length || 0,
                });
                if (archivedTodo.timerEntries &&
                    Array.isArray(archivedTodo.timerEntries) &&
                    archivedTodo.timerEntries.length > 0) {
                    for (const timerEntry of archivedTodo.timerEntries) {
                        const newTimeEntry = new TodoTimeEntry_1.TodoTimeEntry();
                        newTimeEntry.id = timerEntry.id;
                        newTimeEntry.todoControlId = savedTodoControl.id;
                        newTimeEntry.userId = timerEntry.userId || restoredBy;
                        newTimeEntry.startTime = new Date(timerEntry.startTime);
                        newTimeEntry.endTime = timerEntry.endTime
                            ? new Date(timerEntry.endTime)
                            : undefined;
                        newTimeEntry.durationMinutes = timerEntry.durationMinutes || 0;
                        newTimeEntry.entryType = timerEntry.entryType || "automatic";
                        newTimeEntry.description =
                            timerEntry.description || "Entrada de timer restaurada";
                        newTimeEntry.createdAt = timerEntry.createdAt
                            ? new Date(timerEntry.createdAt)
                            : new Date();
                        newTimeEntry.updatedAt = timerEntry.updatedAt
                            ? new Date(timerEntry.updatedAt)
                            : new Date();
                        await queryRunner.manager.save(TodoTimeEntry_1.TodoTimeEntry, newTimeEntry);
                    }
                    console.log(`✅ Restauradas ${archivedTodo.timerEntries.length} entradas de timer para TODO`);
                }
                if (archivedTodo.manualTimeEntries &&
                    Array.isArray(archivedTodo.manualTimeEntries) &&
                    archivedTodo.manualTimeEntries.length > 0) {
                    for (const manualEntry of archivedTodo.manualTimeEntries) {
                        const newManualEntry = new TodoManualTimeEntry_1.TodoManualTimeEntry();
                        newManualEntry.id = manualEntry.id;
                        newManualEntry.todoControlId = savedTodoControl.id;
                        newManualEntry.userId = manualEntry.userId || restoredBy;
                        newManualEntry.date = manualEntry.date
                            ? new Date(manualEntry.date)
                            : new Date();
                        newManualEntry.durationMinutes = manualEntry.durationMinutes || 0;
                        newManualEntry.description =
                            manualEntry.description || "Entrada manual restaurada";
                        newManualEntry.createdBy = manualEntry.createdBy || restoredBy;
                        newManualEntry.createdAt = manualEntry.createdAt
                            ? new Date(manualEntry.createdAt)
                            : new Date();
                        await queryRunner.manager.save(TodoManualTimeEntry_1.TodoManualTimeEntry, newManualEntry);
                    }
                    console.log(`✅ Restauradas ${archivedTodo.manualTimeEntries.length} entradas manuales para TODO`);
                }
            }
            archivedTodo.isRestored = true;
            archivedTodo.restoredAt = new Date();
            archivedTodo.restoredBy = restoredBy;
            await queryRunner.manager.save(ArchivedTodo_entity_1.ArchivedTodo, archivedTodo);
            await queryRunner.commitTransaction();
            return {
                success: true,
                todoId: savedTodo.id,
                message: `Todo "${archivedTodo.title}" restaurado exitosamente con todas sus entidades`,
            };
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            console.error("Error restaurando todo:", error);
            throw new Error(`Error restaurando todo: ${error.message}`);
        }
        finally {
            await queryRunner.release();
        }
    }
    async verifyRestoration(caseId, archivedCase) {
        try {
            const restoredCase = await database_1.AppDataSource.getRepository(Case_1.Case).findOne({
                where: { id: caseId },
            });
            if (!restoredCase) {
                throw new Error("El caso restaurado no se encuentra en la base de datos");
            }
            const caseControls = await database_1.AppDataSource.getRepository(CaseControl_1.CaseControl).find({
                where: { caseId: caseId },
            });
            if (caseControls.length === 0) {
                throw new Error("No se encontraron registros CaseControl restaurados");
            }
            if (archivedCase.timerEntries && archivedCase.timerEntries.length > 0) {
                const caseControlIds = caseControls.map((cc) => cc.id);
                const restoredTimerEntries = await database_1.AppDataSource.getRepository(TimeEntry_1.TimeEntry).find({
                    where: { caseControlId: (0, typeorm_1.In)(caseControlIds) },
                });
                if (restoredTimerEntries.length !== archivedCase.timerEntries.length) {
                    throw new Error(`Falta restaurar entradas de tiempo: esperadas ${archivedCase.timerEntries.length}, encontradas ${restoredTimerEntries.length}`);
                }
            }
            if (archivedCase.manualTimeEntries &&
                archivedCase.manualTimeEntries.length > 0) {
                const caseControlIds = caseControls.map((cc) => cc.id);
                const restoredManualEntries = await database_1.AppDataSource.getRepository(ManualTimeEntry_1.ManualTimeEntry).find({
                    where: { caseControlId: (0, typeorm_1.In)(caseControlIds) },
                });
                if (restoredManualEntries.length !== archivedCase.manualTimeEntries.length) {
                    throw new Error(`Falta restaurar entradas de tiempo manuales: esperadas ${archivedCase.manualTimeEntries.length}, encontradas ${restoredManualEntries.length}`);
                }
            }
            console.log(`✅ Verificación completa: Caso ${archivedCase.caseNumber} restaurado correctamente`);
            console.log(`   - Caso principal: ✅`);
            console.log(`   - CaseControls: ${caseControls.length} ✅`);
            console.log(`   - Timer entries: ${archivedCase.timerEntries?.length || 0} ✅`);
            console.log(`   - Manual entries: ${archivedCase.manualTimeEntries?.length || 0} ✅`);
        }
        catch (error) {
            console.error(`❌ Error en verificación de restauración: ${error.message}`);
            throw error;
        }
    }
}
exports.RestoreService = RestoreService;
