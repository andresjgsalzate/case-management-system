"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArchiveServiceExpress = void 0;
const database_1 = require("../../config/database");
const Case_1 = require("../../entities/Case");
const ArchivedCase_1 = require("../../entities/ArchivedCase");
const ArchivedTodo_entity_1 = require("../../entities/archive/ArchivedTodo.entity");
const Todo_1 = require("../../entities/Todo");
const CaseControl_1 = require("../../entities/CaseControl");
const TimeEntry_1 = require("../../entities/TimeEntry");
const ManualTimeEntry_1 = require("../../entities/ManualTimeEntry");
const Disposition_1 = require("../../entities/Disposition");
const restore_service_1 = require("./restore-service");
class ArchiveServiceExpress {
    constructor() {
        this.restoreService = new restore_service_1.RestoreService();
    }
    mapToStatus(estado) {
        switch (estado) {
            case Case_1.EstadoCase.NUEVO:
                return ArchivedCase_1.ArchivedCaseStatus.OPEN;
            case Case_1.EstadoCase.EN_PROGRESO:
                return ArchivedCase_1.ArchivedCaseStatus.IN_PROGRESS;
            case Case_1.EstadoCase.PENDIENTE:
                return ArchivedCase_1.ArchivedCaseStatus.PENDING;
            case Case_1.EstadoCase.RESUELTO:
                return ArchivedCase_1.ArchivedCaseStatus.RESOLVED;
            case Case_1.EstadoCase.CERRADO:
                return ArchivedCase_1.ArchivedCaseStatus.CLOSED;
            case Case_1.EstadoCase.CANCELADO:
                return ArchivedCase_1.ArchivedCaseStatus.CANCELLED;
            default:
                return ArchivedCase_1.ArchivedCaseStatus.OPEN;
        }
    }
    mapToClassification(clasificacion) {
        switch (clasificacion) {
            case Case_1.ClasificacionCase.BAJA:
                return ArchivedCase_1.ArchivedCaseClassification.REQUEST;
            case Case_1.ClasificacionCase.MEDIA:
                return ArchivedCase_1.ArchivedCaseClassification.INCIDENT;
            case Case_1.ClasificacionCase.ALTA:
                return ArchivedCase_1.ArchivedCaseClassification.PROBLEM;
            default:
                return ArchivedCase_1.ArchivedCaseClassification.REQUEST;
        }
    }
    mapToPriority(clasificacion) {
        switch (clasificacion) {
            case Case_1.ClasificacionCase.BAJA:
                return ArchivedCase_1.ArchivedCasePriority.LOW;
            case Case_1.ClasificacionCase.MEDIA:
                return ArchivedCase_1.ArchivedCasePriority.MEDIUM;
            case Case_1.ClasificacionCase.ALTA:
                return ArchivedCase_1.ArchivedCasePriority.HIGH;
            default:
                return ArchivedCase_1.ArchivedCasePriority.MEDIUM;
        }
    }
    async getArchiveStats() {
        try {
            const archivedCaseRepository = database_1.AppDataSource.getRepository(ArchivedCase_1.ArchivedCase);
            const archivedTodoRepository = database_1.AppDataSource.getRepository(ArchivedTodo_entity_1.ArchivedTodo);
            const totalArchivedCases = await archivedCaseRepository.count({
                where: { isRestored: false },
            });
            const totalArchivedTodos = await archivedTodoRepository.count({
                where: { isRestored: false },
            });
            const totalArchivedTimeMinutes = 0;
            const currentMonth = new Date();
            currentMonth.setDate(1);
            currentMonth.setHours(0, 0, 0, 0);
            const archivedThisMonth = await archivedCaseRepository
                .createQueryBuilder("archived_case")
                .where("archived_case.archivedAt >= :startOfMonth", {
                startOfMonth: currentMonth,
            })
                .andWhere("archived_case.isRestored = :isRestored", {
                isRestored: false,
            })
                .getCount();
            const restoredThisMonth = await archivedCaseRepository
                .createQueryBuilder("archived_case")
                .where("archived_case.restoredAt >= :startOfMonth", {
                startOfMonth: currentMonth,
            })
                .andWhere("archived_case.isRestored = :isRestored", {
                isRestored: true,
            })
                .getCount();
            return {
                totalArchivedCases,
                totalArchivedTodos,
                totalArchivedTimeMinutes,
                archivedThisMonth,
                restoredThisMonth,
            };
        }
        catch (error) {
            console.error("Error getting archive stats:", error);
            throw new Error("Error obteniendo estadísticas del archivo");
        }
    }
    async getArchivedItems(page = 1, limit = 20, search, type, sortBy = "archivedAt", sortOrder = "DESC") {
        try {
            const archivedCaseRepository = database_1.AppDataSource.getRepository(ArchivedCase_1.ArchivedCase);
            const archivedTodoRepository = database_1.AppDataSource.getRepository(ArchivedTodo_entity_1.ArchivedTodo);
            const items = [];
            let total = 0;
            if (!type || type === "case" || type === "all") {
                const queryBuilder = archivedCaseRepository
                    .createQueryBuilder("archived_case")
                    .leftJoinAndSelect("archived_case.archivedByUser", "archivedByUser")
                    .where("archived_case.isRestored = :isRestored", {
                    isRestored: false,
                });
                if (search) {
                    queryBuilder.andWhere("(archived_case.title ILIKE :search OR archived_case.caseNumber ILIKE :search)", { search: `%${search}%` });
                }
                if (sortBy === "title") {
                    queryBuilder.orderBy("archived_case.title", sortOrder);
                }
                else if (sortBy === "archivedAt") {
                    queryBuilder.orderBy("archived_case.archivedAt", sortOrder);
                }
                else {
                    queryBuilder.orderBy("archived_case.createdAt", sortOrder);
                }
                queryBuilder.skip((page - 1) * limit).take(limit);
                const [archivedCases, caseCount] = await queryBuilder.getManyAndCount();
                total += caseCount;
                for (const archivedCase of archivedCases) {
                    const timerTimeMinutes = (archivedCase.metadata?.timeEntries || []).reduce((total, entry) => total + (entry.durationMinutes || 0), 0);
                    const manualTimeMinutes = (archivedCase.metadata?.manualTimeEntries || []).reduce((total, entry) => total + (entry.durationMinutes || 0), 0);
                    const totalTimeMinutes = timerTimeMinutes + manualTimeMinutes;
                    items.push({
                        id: archivedCase.id,
                        itemType: "case",
                        originalId: archivedCase.originalCaseId,
                        title: archivedCase.title,
                        description: archivedCase.description,
                        status: archivedCase.status,
                        priority: archivedCase.priority,
                        archivedAt: archivedCase.archivedAt.toISOString(),
                        archivedBy: archivedCase.archivedBy,
                        archivedReason: archivedCase.archivedReason,
                        caseNumber: archivedCase.caseNumber,
                        classification: archivedCase.classification,
                        createdAt: archivedCase.createdAt.toISOString(),
                        updatedAt: archivedCase.updatedAt.toISOString(),
                        isRestored: false,
                        totalTimeMinutes,
                        timerTimeMinutes,
                        manualTimeMinutes,
                        archivedByUser: archivedCase.archivedByUser
                            ? {
                                id: (await archivedCase.archivedByUser).id,
                                fullName: (await archivedCase.archivedByUser).fullName,
                                email: (await archivedCase.archivedByUser).email,
                                displayName: (await archivedCase.archivedByUser).fullName ||
                                    (await archivedCase.archivedByUser).email,
                            }
                            : undefined,
                    });
                }
            }
            if (type === "todo" || type === "all") {
                const todoQueryBuilder = archivedTodoRepository
                    .createQueryBuilder("archived_todo")
                    .leftJoinAndSelect("archived_todo.archivedByUser", "archivedByUser")
                    .where("archived_todo.isRestored = :isRestored", {
                    isRestored: false,
                });
                if (search) {
                    todoQueryBuilder.andWhere("(archived_todo.title ILIKE :search OR archived_todo.description ILIKE :search)", { search: `%${search}%` });
                }
                if (sortBy === "title") {
                    todoQueryBuilder.orderBy("archived_todo.title", sortOrder);
                }
                else if (sortBy === "archivedAt") {
                    todoQueryBuilder.orderBy("archived_todo.archivedAt", sortOrder);
                }
                else {
                    todoQueryBuilder.orderBy("archived_todo.originalCreatedAt", sortOrder);
                }
                todoQueryBuilder.skip((page - 1) * limit).take(limit);
                const [archivedTodos, todoCount] = await todoQueryBuilder.getManyAndCount();
                total += todoCount;
                for (const archivedTodo of archivedTodos) {
                    const timerTimeMinutes = (archivedTodo.timerEntries || []).reduce((total, entry) => total + (entry.durationMinutes || 0), 0);
                    const manualTimeMinutes = (archivedTodo.manualTimeEntries || []).reduce((total, entry) => total + (entry.durationMinutes || 0), 0);
                    const totalTimeMinutes = timerTimeMinutes + manualTimeMinutes;
                    items.push({
                        id: archivedTodo.id,
                        itemType: "todo",
                        originalId: archivedTodo.originalTodoId,
                        title: archivedTodo.title,
                        description: archivedTodo.description || undefined,
                        status: archivedTodo.isCompleted ? "completed" : "pending",
                        priority: archivedTodo.priority,
                        archivedAt: archivedTodo.archivedAt.toISOString(),
                        archivedBy: archivedTodo.archivedBy,
                        archivedReason: archivedTodo.archiveReason,
                        createdAt: archivedTodo.createdAt.toISOString(),
                        updatedAt: archivedTodo.updatedAt.toISOString(),
                        isRestored: archivedTodo.isRestored || false,
                        totalTimeMinutes,
                        timerTimeMinutes,
                        manualTimeMinutes,
                        archivedByUser: archivedTodo.archivedByUser
                            ? {
                                id: (await archivedTodo.archivedByUser).id,
                                fullName: (await archivedTodo.archivedByUser).fullName,
                                email: (await archivedTodo.archivedByUser).email,
                                displayName: (await archivedTodo.archivedByUser).fullName ||
                                    (await archivedTodo.archivedByUser).email,
                            }
                            : undefined,
                    });
                }
            }
            return { items, total };
        }
        catch (error) {
            console.error("Error getting archived items:", error);
            throw new Error("Error obteniendo elementos archivados");
        }
    }
    async archiveCase(caseId, userId, reason) {
        try {
            const caseRepository = database_1.AppDataSource.getRepository(Case_1.Case);
            const archivedCaseRepository = database_1.AppDataSource.getRepository(ArchivedCase_1.ArchivedCase);
            const caseControlRepository = database_1.AppDataSource.getRepository(CaseControl_1.CaseControl);
            const timeEntriesRepository = database_1.AppDataSource.getRepository(TimeEntry_1.TimeEntry);
            const manualTimeEntriesRepository = database_1.AppDataSource.getRepository(ManualTimeEntry_1.ManualTimeEntry);
            const originalCase = await caseRepository.findOne({
                where: { id: caseId },
                relations: ["user", "assignedTo"],
            });
            if (!originalCase) {
                throw new Error(`Caso con ID ${caseId} no encontrado`);
            }
            const caseControlRecords = await caseControlRepository.find({
                where: { caseId: caseId },
                relations: ["user", "status"],
            });
            console.log(`🔍 Archivando CASO ${caseId} (${originalCase.numeroCaso}):`, {
                caseControlRecordsFound: caseControlRecords.length,
                caseControlIds: caseControlRecords.map((cc) => cc.id),
            });
            const timerEntries = [];
            const manualEntries = [];
            for (const caseControl of caseControlRecords) {
                console.log(`🔍 Buscando entradas de tiempo para CaseControl ${caseControl.id}`);
                const automaticEntries = await timeEntriesRepository.find({
                    where: { caseControlId: caseControl.id },
                    relations: ["user"],
                });
                console.log(`   - Timer entries encontradas: ${automaticEntries.length}`);
                for (const entry of automaticEntries) {
                    timerEntries.push({
                        id: entry.id,
                        caseControlId: entry.caseControlId,
                        userId: entry.userId,
                        userEmail: entry.user?.email || undefined,
                        startTime: entry.startTime,
                        endTime: entry.endTime,
                        durationMinutes: entry.durationMinutes,
                        description: entry.description,
                        createdAt: entry.createdAt,
                        updatedAt: entry.updatedAt,
                    });
                }
                const manualTimeEntries = await manualTimeEntriesRepository.find({
                    where: { caseControlId: caseControl.id },
                    relations: ["user", "creator"],
                });
                console.log(`   - Manual entries encontradas: ${manualTimeEntries.length}`);
                for (const entry of manualTimeEntries) {
                    manualEntries.push({
                        id: entry.id,
                        caseControlId: entry.caseControlId,
                        userId: entry.userId,
                        userEmail: entry.user?.email || undefined,
                        date: new Date(entry.date),
                        durationMinutes: entry.durationMinutes,
                        description: entry.description,
                        createdBy: entry.createdBy,
                        createdByEmail: entry.creator?.email || undefined,
                        createdAt: entry.createdAt,
                        updatedAt: entry.updatedAt,
                    });
                }
            }
            console.log(`📊 Resumen de entradas recolectadas para CASO:`, {
                timerEntriesTotal: timerEntries.length,
                manualEntriesTotal: manualEntries.length,
            });
            const timerTimeMinutes = timerEntries.reduce((total, entry) => total + (entry.durationMinutes || 0), 0);
            const manualTimeMinutes = manualEntries.reduce((total, entry) => total + (entry.durationMinutes || 0), 0);
            const calculatedTotalTime = timerTimeMinutes + manualTimeMinutes;
            console.log(`⏱️ Tiempos calculados para CASO:`, {
                timerTimeMinutes,
                manualTimeMinutes,
                calculatedTotalTime,
            });
            const archivedCase = new ArchivedCase_1.ArchivedCase();
            archivedCase.originalCaseId = caseId;
            archivedCase.caseNumber = originalCase.numeroCaso;
            archivedCase.title = originalCase.numeroCaso;
            archivedCase.description = originalCase.descripcion;
            archivedCase.priority = this.mapToPriority(originalCase.clasificacion);
            archivedCase.status = this.mapToStatus(originalCase.estado);
            archivedCase.classification = this.mapToClassification(originalCase.clasificacion);
            archivedCase.assignedTo = originalCase.assignedToId || undefined;
            archivedCase.createdBy = originalCase.userId || userId;
            archivedCase.updatedBy = undefined;
            archivedCase.originalCreatedAt = originalCase.createdAt;
            archivedCase.originalUpdatedAt = originalCase.updatedAt;
            archivedCase.archivedAt = new Date();
            archivedCase.archivedBy = userId;
            archivedCase.archivedReason = reason || "Sin razón especificada";
            const metadata = {
                historialCaso: originalCase.historialCaso,
                conocimientoModulo: originalCase.conocimientoModulo,
                manipulacionDatos: originalCase.manipulacionDatos,
                claridadDescripcion: originalCase.claridadDescripcion,
                causaFallo: originalCase.causaFallo,
                puntuacion: originalCase.puntuacion,
                observaciones: originalCase.observaciones,
                fechaVencimiento: originalCase.fechaVencimiento,
                fechaResolucion: originalCase.fechaResolucion,
                applicationId: originalCase.applicationId,
                originId: originalCase.originId,
                caseControlRecords: caseControlRecords.map((cc) => ({
                    id: cc.id,
                    userId: cc.userId,
                    statusId: cc.statusId,
                    totalTimeMinutes: cc.totalTimeMinutes,
                    timerStartAt: cc.timerStartAt,
                    isTimerActive: cc.isTimerActive,
                    assignedAt: cc.assignedAt,
                    startedAt: cc.startedAt,
                    completedAt: cc.completedAt,
                    createdAt: cc.createdAt,
                    updatedAt: cc.updatedAt,
                })),
                timeEntries: timerEntries,
                manualTimeEntries: manualEntries,
            };
            archivedCase.metadata = { ...originalCase, ...metadata };
            archivedCase.timerEntries = timerEntries;
            archivedCase.manualTimeEntries = manualEntries;
            const result = await database_1.AppDataSource.transaction(async (manager) => {
                const savedArchivedCase = await manager.save(ArchivedCase_1.ArchivedCase, archivedCase);
                for (const caseControl of caseControlRecords) {
                    await manager.delete(ManualTimeEntry_1.ManualTimeEntry, {
                        caseControlId: caseControl.id,
                    });
                    await manager.delete(TimeEntry_1.TimeEntry, { caseControlId: caseControl.id });
                }
                await manager.delete(CaseControl_1.CaseControl, { caseId: caseId });
                await manager.update(Disposition_1.Disposition, { caseId: caseId }, { caseId: null });
                await manager.delete(Case_1.Case, { id: caseId });
                return savedArchivedCase;
            });
            const response = {
                id: result.id,
                originalCaseId: result.originalCaseId,
                caseNumber: result.caseNumber,
                title: result.title,
                description: result.description,
                priority: result.priority,
                status: result.status,
                classification: result.classification,
                assignedTo: result.assignedTo,
                createdBy: result.createdBy,
                originalCreatedAt: result.originalCreatedAt.toISOString(),
                originalUpdatedAt: result.originalUpdatedAt?.toISOString(),
                archivedAt: result.archivedAt.toISOString(),
                archivedBy: result.archivedBy,
                archivedReason: result.archivedReason,
                metadata: result.metadata,
                createdAt: result.createdAt.toISOString(),
                updatedAt: result.updatedAt.toISOString(),
            };
            console.log(`✅ Caso ${originalCase.numeroCaso} archivado exitosamente:`, {
                caseId,
                archivedCaseId: result.id,
                timerEntriesCount: timerEntries.length,
                manualEntriesCount: manualEntries.length,
                caseControlRecordsCount: caseControlRecords.length,
            });
            return response;
        }
        catch (error) {
            console.error("Error archiving case:", error);
            throw new Error(`Error archivando caso: ${error.message}`);
        }
    }
    async archiveTodo(todoId, userId, reason) {
        try {
            const todoIdStr = todoId;
            const userIdStr = userId;
            const todoRepository = database_1.AppDataSource.getRepository(Todo_1.Todo);
            const archivedTodoRepository = database_1.AppDataSource.getRepository(ArchivedTodo_entity_1.ArchivedTodo);
            const { TodoControl } = await Promise.resolve().then(() => __importStar(require("../../entities/TodoControl")));
            const { TodoTimeEntry } = await Promise.resolve().then(() => __importStar(require("../../entities/TodoTimeEntry")));
            const { TodoManualTimeEntry } = await Promise.resolve().then(() => __importStar(require("../../entities/TodoManualTimeEntry")));
            const todoControlRepository = database_1.AppDataSource.getRepository(TodoControl);
            const todoTimeEntriesRepository = database_1.AppDataSource.getRepository(TodoTimeEntry);
            const todoManualTimeEntriesRepository = database_1.AppDataSource.getRepository(TodoManualTimeEntry);
            const originalTodo = await todoRepository.findOne({
                where: { id: todoIdStr },
                relations: ["priority", "assignedUser", "createdByUser"],
            });
            if (!originalTodo) {
                throw new Error(`TODO con ID ${todoIdStr} no encontrado`);
            }
            if (!originalTodo.isCompleted) {
                throw new Error("Solo se pueden archivar TODOs completados");
            }
            const todoControlRecords = await todoControlRepository.find({
                where: { todoId: todoIdStr },
                relations: ["user", "status"],
            });
            console.log(`🔍 Archivando TODO ${todoIdStr}:`, {
                todoControlRecordsFound: todoControlRecords.length,
                todoControlIds: todoControlRecords.map((tc) => tc.id),
            });
            const timerEntries = [];
            const manualEntries = [];
            for (const todoControl of todoControlRecords) {
                console.log(`🔍 Buscando entradas de tiempo para TodoControl ${todoControl.id}`);
                const automaticEntries = await todoTimeEntriesRepository.find({
                    where: { todoControlId: todoControl.id },
                    relations: ["user"],
                });
                console.log(`   - Timer entries encontradas: ${automaticEntries.length}`);
                for (const entry of automaticEntries) {
                    timerEntries.push({
                        id: entry.id,
                        todoControlId: entry.todoControlId,
                        userId: entry.userId,
                        userEmail: entry.user?.email || undefined,
                        startTime: entry.startTime,
                        endTime: entry.endTime,
                        durationMinutes: entry.durationMinutes,
                        description: entry.description,
                        createdAt: entry.createdAt,
                        updatedAt: entry.updatedAt,
                    });
                }
                const manualTimeEntries = await todoManualTimeEntriesRepository.find({
                    where: { todoControlId: todoControl.id },
                    relations: ["user"],
                });
                console.log(`   - Manual entries encontradas: ${manualTimeEntries.length}`);
                for (const entry of manualTimeEntries) {
                    manualEntries.push({
                        id: entry.id,
                        todoControlId: entry.todoControlId,
                        userId: entry.userId,
                        userEmail: entry.user?.email || undefined,
                        date: entry.date,
                        durationMinutes: entry.durationMinutes,
                        description: entry.description,
                        createdBy: entry.createdBy,
                        createdAt: entry.createdAt,
                    });
                }
            }
            console.log(`📊 Resumen de entradas recolectadas:`, {
                timerEntriesTotal: timerEntries.length,
                manualEntriesTotal: manualEntries.length,
            });
            const timerTimeMinutes = timerEntries.reduce((total, entry) => total + (entry.durationMinutes || 0), 0);
            const manualTimeMinutes = manualEntries.reduce((total, entry) => total + (entry.durationMinutes || 0), 0);
            const totalTimeMinutes = timerTimeMinutes + manualTimeMinutes;
            console.log(`⏱️ Tiempos calculados:`, {
                timerTimeMinutes,
                manualTimeMinutes,
                totalTimeMinutes,
            });
            const archivedTodo = new ArchivedTodo_entity_1.ArchivedTodo();
            archivedTodo.originalTodoId = todoIdStr;
            archivedTodo.title = originalTodo.title;
            archivedTodo.description = originalTodo.description || "";
            archivedTodo.priority = originalTodo.priority?.name || "MEDIUM";
            archivedTodo.isCompleted = originalTodo.isCompleted;
            if (originalTodo.dueDate) {
                archivedTodo.dueDate = originalTodo.dueDate;
            }
            archivedTodo.originalCreatedAt = originalTodo.createdAt;
            archivedTodo.originalUpdatedAt =
                originalTodo.updatedAt || originalTodo.createdAt;
            if (originalTodo.completedAt) {
                archivedTodo.completedAt = originalTodo.completedAt;
            }
            archivedTodo.createdByUserId = originalTodo.createdByUserId;
            if (originalTodo.assignedUserId) {
                archivedTodo.assignedUserId = originalTodo.assignedUserId;
            }
            archivedTodo.archivedAt = new Date();
            archivedTodo.archivedBy = userIdStr;
            archivedTodo.archiveReason =
                reason || "TODO archivado a través del sistema de archivos";
            archivedTodo.isRestored = false;
            archivedTodo.totalTimeMinutes = totalTimeMinutes;
            archivedTodo.timerTimeMinutes = timerTimeMinutes;
            archivedTodo.manualTimeMinutes = manualTimeMinutes;
            archivedTodo.originalData = {
                ...originalTodo,
                priority: originalTodo.priority,
                assignedUser: originalTodo.assignedUser,
                createdByUser: originalTodo.createdByUser,
            };
            archivedTodo.controlData = {
                todoControlRecords: todoControlRecords.map((tc) => ({
                    id: tc.id,
                    todoId: tc.todoId,
                    userId: tc.userId,
                    statusId: tc.statusId,
                    totalTimeMinutes: tc.totalTimeMinutes,
                    timerStartAt: tc.timerStartAt,
                    isTimerActive: tc.isTimerActive,
                    assignedAt: tc.assignedAt,
                    startedAt: tc.startedAt,
                    completedAt: tc.completedAt,
                    createdAt: tc.createdAt,
                    updatedAt: tc.updatedAt,
                })),
                timerEntries,
                manualEntries,
            };
            archivedTodo.timerEntries = timerEntries;
            archivedTodo.manualTimeEntries = manualEntries;
            const metadata = {
                estimatedMinutes: originalTodo.estimatedMinutes,
                todoControlRecords: todoControlRecords.map((tc) => ({
                    id: tc.id,
                    userId: tc.userId,
                    statusId: tc.statusId,
                    totalTimeMinutes: tc.totalTimeMinutes,
                    timerStartAt: tc.timerStartAt,
                    isTimerActive: tc.isTimerActive,
                    assignedAt: tc.assignedAt,
                    startedAt: tc.startedAt,
                    completedAt: tc.completedAt,
                    createdAt: tc.createdAt,
                    updatedAt: tc.updatedAt,
                })),
                timeEntries: timerEntries,
                manualTimeEntries: manualEntries,
            };
            archivedTodo.metadata = { ...originalTodo, ...metadata };
            const result = await database_1.AppDataSource.transaction(async (manager) => {
                const savedArchivedTodo = await manager.save(ArchivedTodo_entity_1.ArchivedTodo, archivedTodo);
                for (const todoControl of todoControlRecords) {
                    await manager.delete(TodoManualTimeEntry, {
                        todoControlId: todoControl.id,
                    });
                    await manager.delete(TodoTimeEntry, {
                        todoControlId: todoControl.id,
                    });
                }
                await manager.delete(TodoControl, { todoId: todoIdStr });
                await manager.delete(Todo_1.Todo, { id: todoIdStr });
                return savedArchivedTodo;
            });
            const response = {
                id: result.id,
                originalTodoId: result.originalTodoId,
                title: result.title,
                description: result.description,
                priority: result.priority,
                isCompleted: result.isCompleted,
                createdByUserId: result.createdByUserId,
                originalCreatedAt: result.originalCreatedAt.toISOString(),
                originalUpdatedAt: result.originalUpdatedAt.toISOString(),
                archivedAt: result.archivedAt.toISOString(),
                archivedBy: result.archivedBy,
                archiveReason: result.archiveReason || "",
                isRestored: result.isRestored,
                totalTimeMinutes: totalTimeMinutes,
                timerTimeMinutes: timerTimeMinutes,
                manualTimeMinutes: manualTimeMinutes,
                createdAt: result.createdAt.toISOString(),
                updatedAt: result.updatedAt.toISOString(),
            };
            console.log(`✅ TODO ${originalTodo.title} archivado exitosamente:`, {
                todoId: todoIdStr,
                archivedTodoId: result.id,
                timerEntriesCount: timerEntries.length,
                manualEntriesCount: manualEntries.length,
                todoControlRecordsCount: todoControlRecords.length,
                totalTimeMinutes,
                timerTimeMinutes,
                manualTimeMinutes,
            });
            return response;
        }
        catch (error) {
            console.error("Error archiving todo:", error);
            throw new Error(`Error archivando todo: ${error.message}`);
        }
    }
    async restoreArchivedItem(type, archivedId) {
        try {
            return {
                id: archivedId.toString(),
                type: type,
                message: "Elemento restaurado exitosamente",
            };
        }
        catch (error) {
            console.error("Error restoring archived item:", error);
            throw new Error(`Error restaurando elemento: ${error.message}`);
        }
    }
    async deleteArchivedItem(type, archivedId) {
        try {
            if (type === "case") {
                const archivedCaseRepository = database_1.AppDataSource.getRepository(ArchivedCase_1.ArchivedCase);
                const archivedCase = await archivedCaseRepository.findOne({
                    where: { id: archivedId },
                });
                if (!archivedCase) {
                    throw new Error("Caso archivado no encontrado");
                }
                await archivedCaseRepository.remove(archivedCase);
                console.log(`Caso archivado eliminado permanentemente: ${archivedId}`);
            }
            else if (type === "todo") {
                const archivedTodoRepository = database_1.AppDataSource.getRepository(ArchivedTodo_entity_1.ArchivedTodo);
                const archivedTodo = await archivedTodoRepository.findOne({
                    where: { id: archivedId },
                });
                if (!archivedTodo) {
                    throw new Error("TODO archivado no encontrado");
                }
                await archivedTodoRepository.remove(archivedTodo);
                console.log(`TODO archivado eliminado permanentemente: ${archivedId}`);
            }
        }
        catch (error) {
            console.error("Error deleting archived item:", error);
            throw new Error(`Error eliminando elemento archivado: ${error.message}`);
        }
    }
    async searchArchivedItems(query, type, page = 1, limit = 20) {
        try {
            const items = [];
            return { items, total: 0 };
        }
        catch (error) {
            console.error("Error searching archived items:", error);
            throw new Error("Error buscando elementos archivados");
        }
    }
    async restoreCase(archivedCaseId, restoredBy) {
        return this.restoreService.restoreCase(archivedCaseId, restoredBy);
    }
    async restoreTodo(archivedTodoId, restoredBy) {
        return this.restoreService.restoreTodo(archivedTodoId, restoredBy);
    }
}
exports.ArchiveServiceExpress = ArchiveServiceExpress;
