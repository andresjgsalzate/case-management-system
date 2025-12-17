"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodoService = void 0;
const database_1 = require("../../config/database");
const Todo_1 = require("../../entities/Todo");
const TodoControl_1 = require("../../entities/TodoControl");
const TodoPriority_1 = require("../../entities/TodoPriority");
const TodoTimeEntry_1 = require("../../entities/TodoTimeEntry");
const TodoManualTimeEntry_1 = require("../../entities/TodoManualTimeEntry");
class TodoService {
    constructor() {
        this.todoRepository = database_1.AppDataSource.getRepository(Todo_1.Todo);
        this.todoControlRepository = database_1.AppDataSource.getRepository(TodoControl_1.TodoControl);
        this.todoPriorityRepository = database_1.AppDataSource.getRepository(TodoPriority_1.TodoPriority);
    }
    async getAllTodos(filters) {
        console.log("TodoService.getAllTodos - Starting...");
        try {
            console.log("Attempting query with priority and controls JOIN...");
            let query = this.todoRepository
                .createQueryBuilder("todo")
                .leftJoinAndSelect("todo.priority", "priority")
                .leftJoinAndSelect("todo.controls", "controls")
                .leftJoinAndSelect("controls.user", "controlUser")
                .leftJoinAndSelect("controls.status", "controlStatus")
                .orderBy("todo.createdAt", "DESC");
            if (filters) {
                query = this.applyFilters(query, filters);
            }
            const todos = await query.getMany();
            console.log("Todos with priority and controls JOIN count:", todos.length);
            return todos.map((todo) => this.mapToResponseDto(todo));
        }
        catch (error) {
            console.error("Error in getAllTodos:", error);
            throw error;
        }
    }
    async getTodoById(id) {
        const todo = await this.todoRepository
            .createQueryBuilder("todo")
            .leftJoinAndSelect("todo.priority", "priority")
            .leftJoinAndSelect("todo.assignedUser", "assignedUser")
            .leftJoinAndSelect("todo.createdByUser", "createdByUser")
            .leftJoinAndSelect("todo.controls", "controls")
            .leftJoinAndSelect("controls.user", "controlUser")
            .leftJoinAndSelect("controls.status", "controlStatus")
            .where("todo.id = :id", { id })
            .getOne();
        return todo ? this.mapToResponseDto(todo) : null;
    }
    async createTodo(createTodoDto, createdByUserId) {
        const todo = this.todoRepository.create({
            ...createTodoDto,
            createdByUserId,
            dueDate: createTodoDto.dueDate
                ? new Date(createTodoDto.dueDate)
                : undefined,
        });
        const savedTodo = await this.todoRepository.save(todo);
        return this.mapToResponseDto(savedTodo);
    }
    async updateTodo(id, updateTodoDto) {
        const todo = await this.todoRepository.findOne({ where: { id } });
        if (!todo) {
            return null;
        }
        Object.assign(todo, {
            ...updateTodoDto,
            dueDate: updateTodoDto.dueDate
                ? new Date(updateTodoDto.dueDate)
                : todo.dueDate,
        });
        const savedTodo = await this.todoRepository.save(todo);
        return this.mapToResponseDto(savedTodo);
    }
    async deleteTodo(id) {
        try {
            const todo = await this.todoRepository.findOne({ where: { id } });
            if (!todo) {
                return false;
            }
            const manualTimeEntryRepo = database_1.AppDataSource.getRepository(TodoManualTimeEntry_1.TodoManualTimeEntry);
            await manualTimeEntryRepo
                .createQueryBuilder()
                .delete()
                .where("todo_control_id IN (SELECT id FROM todo_control WHERE todo_id = :todoId)", { todoId: id })
                .execute();
            const timeEntryRepo = database_1.AppDataSource.getRepository(TodoTimeEntry_1.TodoTimeEntry);
            await timeEntryRepo
                .createQueryBuilder()
                .delete()
                .where("todo_control_id IN (SELECT id FROM todo_control WHERE todo_id = :todoId)", { todoId: id })
                .execute();
            await this.todoControlRepository
                .createQueryBuilder()
                .delete()
                .where("todo_id = :todoId", { todoId: id })
                .execute();
            const result = await this.todoRepository.delete(id);
            return (result.affected ?? 0) > 0;
        }
        catch (error) {
            console.error("Error deleting todo and related data:", error);
            throw error;
        }
    }
    async completeTodo(id) {
        const todo = await this.todoRepository.findOne({ where: { id } });
        if (!todo) {
            return null;
        }
        todo.isCompleted = true;
        todo.completedAt = new Date();
        const savedTodo = await this.todoRepository.save(todo);
        const control = await this.todoControlRepository.findOne({
            where: { todoId: id },
        });
        if (control) {
            control.completedAt = new Date();
            control.isTimerActive = false;
            control.timerStartAt = undefined;
            await this.todoControlRepository.save(control);
        }
        return this.mapToResponseDto(savedTodo);
    }
    async reactivateTodo(id) {
        const todo = await this.todoRepository.findOne({ where: { id } });
        if (!todo) {
            return null;
        }
        todo.isCompleted = false;
        todo.completedAt = undefined;
        const savedTodo = await this.todoRepository.save(todo);
        const control = await this.todoControlRepository.findOne({
            where: { todoId: id },
        });
        if (control) {
            control.completedAt = undefined;
            await this.todoControlRepository.save(control);
        }
        return this.mapToResponseDto(savedTodo);
    }
    async archiveTodo(id) {
        try {
            console.log(`DEBUG - Archiving TODO with ID: ${id}`);
            const todo = await this.todoRepository.findOne({
                where: { id },
                relations: ["priority", "assignedUser", "createdByUser", "controls"],
            });
            if (!todo) {
                console.log(`DEBUG - TODO not found with ID: ${id}`);
                return null;
            }
            console.log(`DEBUG - TODO found:`, {
                id: todo.id,
                title: todo.title,
                isCompleted: todo.isCompleted,
                priority: todo.priority?.name,
            });
            if (!todo.isCompleted) {
                console.log(`DEBUG - TODO is not completed, cannot archive`);
                throw new Error("Solo se pueden archivar TODOs completados");
            }
            const { ArchivedTodo, } = require("../../entities/archive/ArchivedTodo.entity");
            const archivedTodoRepository = database_1.AppDataSource.getRepository(ArchivedTodo);
            const archivedTodo = archivedTodoRepository.create({
                originalTodoId: todo.id,
                title: todo.title,
                description: todo.description,
                priority: todo.priority?.name || "MEDIUM",
                category: "General",
                isCompleted: todo.isCompleted,
                dueDate: todo.dueDate,
                originalCreatedAt: todo.createdAt,
                originalUpdatedAt: todo.updatedAt,
                completedAt: todo.completedAt,
                createdByUserId: todo.createdByUserId,
                assignedUserId: todo.assignedUserId,
                caseId: null,
                archivedBy: todo.createdByUserId,
                archiveReason: "TODO completado y archivado automáticamente",
                originalData: todo,
                controlData: todo.controls || [],
                totalTimeMinutes: todo.estimatedMinutes,
            });
            console.log(`DEBUG - Created archived todo object:`, {
                originalTodoId: archivedTodo.originalTodoId,
                title: archivedTodo.title,
                priority: archivedTodo.priority,
            });
            await archivedTodoRepository.save(archivedTodo);
            console.log(`DEBUG - Archived todo saved successfully`);
            console.log(`DEBUG - Deleting dependent relations for TODO ID: ${todo.id}`);
            const todoControlIds = await database_1.AppDataSource.getRepository("TodoControl")
                .createQueryBuilder("control")
                .select("control.id")
                .where("control.todo_id = :todoId", { todoId: todo.id })
                .getRawMany();
            const controlIds = todoControlIds.map((item) => item.control_id);
            console.log(`DEBUG - Found ${controlIds.length} todo_control records to delete`);
            if (controlIds.length > 0) {
                await database_1.AppDataSource.getRepository("TodoTimeEntry")
                    .createQueryBuilder()
                    .delete()
                    .where("todo_control_id IN (:...controlIds)", { controlIds })
                    .execute();
                console.log(`DEBUG - Deleted todo_time_entries records`);
                await database_1.AppDataSource.getRepository("TodoManualTimeEntry")
                    .createQueryBuilder()
                    .delete()
                    .where("todo_control_id IN (:...controlIds)", { controlIds })
                    .execute();
                console.log(`DEBUG - Deleted todo_manual_time_entries records`);
            }
            await database_1.AppDataSource.getRepository("TodoControl")
                .createQueryBuilder()
                .delete()
                .where("todo_id = :todoId", { todoId: todo.id })
                .execute();
            console.log(`DEBUG - Deleted todo_control records`);
            await this.todoRepository.remove(todo);
            console.log(`DEBUG - Original todo removed successfully`);
            return this.mapToResponseDto(todo);
        }
        catch (error) {
            console.error("ERROR in archiveTodo:", error);
            throw error;
        }
    }
    async getTodoMetrics() {
        const totalTodos = await this.todoRepository.count();
        const activeTodos = await this.todoRepository.count({
            where: { isCompleted: false },
        });
        const completedTodos = await this.todoRepository.count({
            where: { isCompleted: true },
        });
        const overdueTodos = await this.todoRepository
            .createQueryBuilder("todo")
            .where("todo.dueDate < :today", { today: new Date() })
            .andWhere("todo.isCompleted = :completed", { completed: false })
            .getCount();
        const todosByPriority = await this.todoRepository
            .createQueryBuilder("todo")
            .leftJoin("todo.priority", "priority")
            .select([
            "priority.id as priorityId",
            "priority.name as priorityName",
            "COUNT(todo.id) as count",
        ])
            .groupBy("priority.id, priority.name")
            .getRawMany();
        const todosByUser = await this.todoRepository
            .createQueryBuilder("todo")
            .leftJoin("todo.assignedUser", "user")
            .select([
            "user.id as userId",
            "user.fullName as userName",
            "COUNT(todo.id) as assigned",
            "SUM(CASE WHEN todo.isCompleted = true THEN 1 ELSE 0 END) as completed",
        ])
            .where("todo.assignedUserId IS NOT NULL")
            .groupBy("user.id, user.fullName")
            .getRawMany();
        const totalTimeResult = await database_1.AppDataSource.query(`
      SELECT 
        COALESCE(SUM(
          -- Tiempo de timer entries
          COALESCE(
            (SELECT SUM(
              CASE 
                WHEN tte.end_time IS NOT NULL AND tte.start_time IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (tte.end_time - tte.start_time)) / 60
                ELSE COALESCE(tte.duration_minutes, 0)
              END
            ) FROM todo_time_entries tte WHERE tte.todo_control_id = tc.id), 0
          ) +
          -- Tiempo de manual entries
          COALESCE(
            (SELECT SUM(tmte.duration_minutes) 
             FROM todo_manual_time_entries tmte 
             WHERE tmte.todo_control_id = tc.id), 0
          )
        ), 0) as total_time_minutes
      FROM todo_control tc
    `);
        const totalTimeMinutes = parseInt(totalTimeResult[0]?.total_time_minutes || 0);
        return {
            totalTodos,
            activeTodos,
            completedTodos,
            overdueTodos,
            totalTimeMinutes,
            averageCompletionTime: 0,
            todosByPriority: todosByPriority.map((item) => ({
                priorityId: item.priorityId,
                priorityName: item.priorityName,
                count: parseInt(item.count),
            })),
            todosByUser: todosByUser.map((item) => ({
                userId: item.userId,
                userName: item.userName,
                assigned: parseInt(item.assigned),
                completed: parseInt(item.completed),
            })),
        };
    }
    async getAllPriorities() {
        return this.todoPriorityRepository.find({
            where: { isActive: true },
            order: { displayOrder: "ASC" },
        });
    }
    applyFilters(query, filters) {
        if (filters.priorityId) {
            query = query.andWhere("todo.priorityId = :priorityId", {
                priorityId: filters.priorityId,
            });
        }
        if (filters.assignedUserId) {
            query = query.andWhere("todo.assignedUserId = :assignedUserId", {
                assignedUserId: filters.assignedUserId,
            });
        }
        if (filters.createdByUserId) {
            query = query.andWhere("todo.createdByUserId = :createdByUserId", {
                createdByUserId: filters.createdByUserId,
            });
        }
        if (filters.dueDateFrom) {
            query = query.andWhere("todo.dueDate >= :dueDateFrom", {
                dueDateFrom: filters.dueDateFrom,
            });
        }
        if (filters.dueDateTo) {
            query = query.andWhere("todo.dueDate <= :dueDateTo", {
                dueDateTo: filters.dueDateTo,
            });
        }
        if (filters.search) {
            query = query.andWhere("(todo.title LIKE :search OR todo.description LIKE :search)", { search: `%${filters.search}%` });
        }
        if (filters.showCompleted === false) {
            query = query.andWhere("todo.isCompleted = :completed", {
                completed: false,
            });
        }
        else if (filters.showCompleted === true) {
            query = query.andWhere("todo.isCompleted = :completed", {
                completed: true,
            });
        }
        return query;
    }
    mapToResponseDto(todo) {
        console.log("Mapping todo:", todo.id);
        try {
            const control = todo.controls && todo.controls.length > 0
                ? todo.controls[0]
                : undefined;
            const result = {
                id: todo.id,
                title: todo.title,
                description: todo.description,
                priorityId: todo.priorityId,
                assignedUserId: todo.assignedUserId,
                createdByUserId: todo.createdByUserId,
                dueDate: todo.dueDate
                    ? typeof todo.dueDate === "string"
                        ? todo.dueDate
                        : todo.dueDate.toISOString().split("T")[0]
                    : undefined,
                estimatedMinutes: todo.estimatedMinutes,
                isCompleted: todo.isCompleted,
                completedAt: todo.completedAt
                    ? typeof todo.completedAt === "string"
                        ? todo.completedAt
                        : todo.completedAt.toISOString()
                    : undefined,
                createdAt: typeof todo.createdAt === "string"
                    ? todo.createdAt
                    : todo.createdAt.toISOString(),
                updatedAt: typeof todo.updatedAt === "string"
                    ? todo.updatedAt
                    : todo.updatedAt.toISOString(),
                priority: todo.priority
                    ? {
                        id: todo.priority.id,
                        name: todo.priority.name,
                        description: todo.priority.description,
                        color: todo.priority.color,
                        level: todo.priority.level,
                        isActive: todo.priority.isActive,
                        displayOrder: todo.priority.displayOrder,
                    }
                    : undefined,
                assignedUser: undefined,
                createdByUser: undefined,
                control: control
                    ? {
                        id: control.id,
                        todoId: control.todoId,
                        userId: control.userId,
                        statusId: control.statusId,
                        totalTimeMinutes: control.totalTimeMinutes,
                        timerStartAt: control.timerStartAt
                            ? typeof control.timerStartAt === "string"
                                ? control.timerStartAt
                                : control.timerStartAt.toISOString()
                            : undefined,
                        isTimerActive: control.isTimerActive,
                        assignedAt: typeof control.assignedAt === "string"
                            ? control.assignedAt
                            : control.assignedAt.toISOString(),
                        startedAt: control.startedAt
                            ? typeof control.startedAt === "string"
                                ? control.startedAt
                                : control.startedAt.toISOString()
                            : undefined,
                        completedAt: control.completedAt
                            ? typeof control.completedAt === "string"
                                ? control.completedAt
                                : control.completedAt.toISOString()
                            : undefined,
                        createdAt: typeof control.createdAt === "string"
                            ? control.createdAt
                            : control.createdAt.toISOString(),
                        updatedAt: typeof control.updatedAt === "string"
                            ? control.updatedAt
                            : control.updatedAt.toISOString(),
                        user: control.user
                            ? {
                                id: control.user.id,
                                email: control.user.email,
                                fullName: control.user.fullName,
                                isActive: control.user.isActive,
                            }
                            : undefined,
                        status: control.status
                            ? {
                                id: control.status.id,
                                name: control.status.name,
                                description: control.status.description,
                                color: control.status.color,
                                isActive: control.status.isActive,
                                displayOrder: control.status.displayOrder,
                            }
                            : undefined,
                    }
                    : undefined,
            };
            console.log("Mapped todo successfully");
            return result;
        }
        catch (error) {
            console.error("Error mapping todo:", error);
            throw error;
        }
    }
    async startTimer(todoId, userId) {
        try {
            console.log("Starting timer for TODO:", todoId, "by user:", userId);
            const todo = await this.todoRepository.findOne({
                where: { id: todoId },
                relations: ["controls", "priority"],
            });
            if (!todo) {
                console.log("TODO not found:", todoId);
                return null;
            }
            let control = todo.controls && todo.controls.length > 0
                ? todo.controls[0]
                : undefined;
            if (!control) {
                console.log("Creating new control for TODO:", todoId);
                const { CaseStatusControl, } = require("../../entities/CaseStatusControl");
                const statusRepository = database_1.AppDataSource.getRepository(CaseStatusControl);
                let enCursoStatus = await statusRepository.findOne({
                    where: { name: "EN CURSO", isActive: true },
                });
                if (!enCursoStatus) {
                    enCursoStatus = await statusRepository.findOne({
                        where: { isActive: true },
                        order: { displayOrder: "ASC" },
                    });
                }
                if (!enCursoStatus) {
                    console.error("No se encontró ningún estado activo");
                    throw new Error("No se encontró ningún estado activo para crear el control");
                }
                control = this.todoControlRepository.create({
                    todoId: todoId,
                    userId: userId,
                    statusId: enCursoStatus.id,
                    totalTimeMinutes: 0,
                    isTimerActive: false,
                    assignedAt: new Date(),
                });
                control = await this.todoControlRepository.save(control);
            }
            else {
                if (control.userId !== userId) {
                    console.log(`Transferring control from user ${control.userId} to user ${userId}`);
                    control.userId = userId;
                    control.assignedAt = new Date();
                    await this.todoControlRepository.save(control);
                }
            }
            await this.todoControlRepository.update({
                userId: userId,
                isTimerActive: true,
            }, {
                isTimerActive: false,
                timerStartAt: undefined,
            });
            control.isTimerActive = true;
            control.timerStartAt = new Date();
            if (!control.startedAt) {
                control.startedAt = new Date();
            }
            await this.todoControlRepository.save(control);
            const { TodoTimeEntry } = require("../../entities/TodoTimeEntry");
            const timeEntryRepository = database_1.AppDataSource.getRepository(TodoTimeEntry);
            const timeEntry = timeEntryRepository.create({
                todoControlId: control.id,
                userId: userId,
                startTime: new Date(),
                durationMinutes: 0,
            });
            await timeEntryRepository.save(timeEntry);
            console.log("Timer started successfully for TODO:", todoId, "with time entry created");
            return this.getTodoById(todoId);
        }
        catch (error) {
            console.error("Error starting timer:", error);
            throw error;
        }
    }
    async pauseTimer(todoId, userId) {
        try {
            console.log("Pausing timer for TODO:", todoId, "by user:", userId);
            const todo = await this.todoRepository.findOne({
                where: { id: todoId },
                relations: ["controls", "priority"],
            });
            if (!todo) {
                console.log("TODO not found:", todoId);
                return null;
            }
            const control = todo.controls && todo.controls.length > 0
                ? todo.controls[0]
                : undefined;
            if (!control) {
                console.log("Control not found for TODO:", todoId);
                return null;
            }
            if (control.userId !== userId) {
                console.log(`Control is assigned to different user. Control user: ${control.userId}, Current user: ${userId}`);
                return null;
            }
            if (!control.isTimerActive || !control.timerStartAt) {
                console.log("Timer is not active for TODO:", todoId);
                return null;
            }
            const now = new Date();
            const timeSpentMinutes = Math.floor((now.getTime() - control.timerStartAt.getTime()) / (1000 * 60));
            const { TodoTimeEntry } = require("../../entities/TodoTimeEntry");
            const timeEntryRepository = database_1.AppDataSource.getRepository(TodoTimeEntry);
            const activeTimeEntry = await timeEntryRepository.findOne({
                where: {
                    todoControlId: control.id,
                    userId: userId,
                    endTime: null,
                },
                order: { startTime: "DESC" },
            });
            if (activeTimeEntry) {
                activeTimeEntry.endTime = now;
                activeTimeEntry.durationMinutes = timeSpentMinutes;
                await timeEntryRepository.save(activeTimeEntry);
            }
            control.totalTimeMinutes += timeSpentMinutes;
            control.isTimerActive = false;
            control.timerStartAt = undefined;
            await this.todoControlRepository.save(control);
            console.log(`Timer paused for TODO: ${todoId}, time added: ${timeSpentMinutes} minutes`);
            return this.getTodoById(todoId);
        }
        catch (error) {
            console.error("Error pausing timer:", error);
            throw error;
        }
    }
    async getTodoTimeEntries(todoId) {
        try {
            const todoControl = await this.todoControlRepository.findOne({
                where: { todoId: todoId },
            });
            if (!todoControl) {
                return [];
            }
            const { TodoTimeEntry } = require("../../entities/TodoTimeEntry");
            const timeEntryRepository = database_1.AppDataSource.getRepository(TodoTimeEntry);
            const timeEntries = await timeEntryRepository.find({
                where: { todoControlId: todoControl.id },
                order: { startTime: "DESC" },
            });
            console.log(`DEBUG - TodoControl ID: ${todoControl.id}`);
            console.log(`DEBUG - Automatic entries found: ${timeEntries.length}`);
            timeEntries.forEach((entry, index) => {
                console.log(`DEBUG - Automatic entry ${index + 1}:`, {
                    id: entry.id,
                    durationMinutes: entry.durationMinutes,
                    startTime: entry.startTime,
                    endTime: entry.endTime,
                    createdAt: entry.createdAt,
                });
            });
            return timeEntries.map((entry) => ({
                id: entry.id,
                type: "automatic",
                startTime: entry.startTime,
                endTime: entry.endTime,
                durationMinutes: entry.durationMinutes,
                description: entry.description,
                createdAt: entry.createdAt,
            }));
        }
        catch (error) {
            console.error("Error getting todo time entries:", error);
            throw error;
        }
    }
    async addManualTimeEntry(todoId, data) {
        try {
            const todo = await this.todoRepository.findOne({
                where: { id: todoId },
                relations: ["controls"],
            });
            if (!todo) {
                console.log("TODO not found for manual time entry:", todoId);
                return null;
            }
            let todoControl = todo.controls && todo.controls.length > 0
                ? todo.controls[0]
                : undefined;
            if (!todoControl) {
                console.log("Creating new control for manual time entry:", todoId);
                const { CaseStatusControl, } = require("../../entities/CaseStatusControl");
                const statusRepository = database_1.AppDataSource.getRepository(CaseStatusControl);
                let defaultStatus = await statusRepository.findOne({
                    where: { name: "PENDIENTE", isActive: true },
                });
                if (!defaultStatus) {
                    defaultStatus = await statusRepository.findOne({
                        where: { isActive: true },
                        order: { displayOrder: "ASC" },
                    });
                }
                if (!defaultStatus) {
                    console.error("No se encontró ningún estado activo");
                    throw new Error("No se encontró ningún estado activo para crear el control");
                }
                todoControl = this.todoControlRepository.create({
                    todoId: todoId,
                    userId: data.userId,
                    statusId: defaultStatus.id,
                    totalTimeMinutes: 0,
                    isTimerActive: false,
                    assignedAt: new Date(),
                });
                todoControl = await this.todoControlRepository.save(todoControl);
            }
            const { TodoManualTimeEntry, } = require("../../entities/TodoManualTimeEntry");
            const manualEntryRepository = database_1.AppDataSource.getRepository(TodoManualTimeEntry);
            const manualEntry = manualEntryRepository.create({
                todoControlId: todoControl.id,
                userId: data.userId,
                date: new Date(data.date),
                durationMinutes: data.durationMinutes,
                description: data.description,
                createdBy: data.userId,
            });
            const savedEntry = await manualEntryRepository.save(manualEntry);
            console.log("DEBUG - Manual entry created:", {
                id: savedEntry.id,
                todoControlId: savedEntry.todoControlId,
                durationMinutes: savedEntry.durationMinutes,
                description: savedEntry.description,
                date: savedEntry.date,
                type: "MANUAL_ONLY",
            });
            todoControl.totalTimeMinutes += data.durationMinutes;
            await this.todoControlRepository.save(todoControl);
            console.log(`Manual time entry added: ${data.durationMinutes} minutes for TODO ${todoId}`);
            return {
                id: savedEntry.id,
                todoControlId: savedEntry.todoControlId,
                userId: savedEntry.userId,
                date: savedEntry.date.toISOString().split("T")[0],
                durationMinutes: savedEntry.durationMinutes,
                description: savedEntry.description,
                createdBy: savedEntry.createdBy,
                createdAt: savedEntry.createdAt.toISOString(),
            };
        }
        catch (error) {
            console.error("Error adding manual time entry:", error);
            throw error;
        }
    }
    async getManualTimeEntries(todoId) {
        try {
            const todo = await this.todoRepository.findOne({
                where: { id: todoId },
                relations: ["controls"],
            });
            if (!todo) {
                console.log("TODO not found for manual time entries:", todoId);
                return [];
            }
            let todoControl = todo.controls && todo.controls.length > 0
                ? todo.controls[0]
                : undefined;
            if (!todoControl) {
                console.log("Creating new control for manual time entries:", todoId);
                const { CaseStatusControl, } = require("../../entities/CaseStatusControl");
                const statusRepository = database_1.AppDataSource.getRepository(CaseStatusControl);
                let defaultStatus = await statusRepository.findOne({
                    where: { name: "PENDIENTE", isActive: true },
                });
                if (!defaultStatus) {
                    defaultStatus = await statusRepository.findOne({
                        where: { isActive: true },
                        order: { displayOrder: "ASC" },
                    });
                }
                if (!defaultStatus) {
                    console.error("No se encontró ningún estado activo");
                    return [];
                }
                if (!todo.createdByUserId) {
                    console.error("No se puede crear control sin usuario creador");
                    return [];
                }
                const userId = todo.createdByUserId;
                todoControl = this.todoControlRepository.create({
                    todoId: todoId,
                    userId: userId,
                    statusId: defaultStatus.id,
                    totalTimeMinutes: 0,
                    isTimerActive: false,
                    assignedAt: new Date(),
                });
                todoControl = await this.todoControlRepository.save(todoControl);
            }
            const { TodoManualTimeEntry, } = require("../../entities/TodoManualTimeEntry");
            const manualEntryRepository = database_1.AppDataSource.getRepository(TodoManualTimeEntry);
            const entries = await manualEntryRepository.find({
                where: { todoControlId: todoControl.id },
                relations: ["user", "creator"],
                order: { date: "DESC", createdAt: "DESC" },
            });
            return entries.map((entry) => ({
                id: entry.id,
                todoControlId: entry.todoControlId,
                userId: entry.userId,
                date: entry.date,
                durationMinutes: entry.durationMinutes,
                description: entry.description,
                createdBy: entry.createdBy,
                createdAt: entry.createdAt,
                user: entry.user
                    ? {
                        id: entry.user.id,
                        email: entry.user.email,
                        fullName: entry.user.fullName,
                    }
                    : null,
                creator: entry.creator
                    ? {
                        id: entry.creator.id,
                        email: entry.creator.email,
                        fullName: entry.creator.fullName,
                    }
                    : null,
            }));
        }
        catch (error) {
            console.error("Error getting manual time entries:", error);
            throw error;
        }
    }
    async deleteTimeEntry(entryId) {
        try {
            const { TodoTimeEntry } = require("../../entities/TodoTimeEntry");
            const timeEntryRepository = database_1.AppDataSource.getRepository(TodoTimeEntry);
            const entry = await timeEntryRepository.findOne({
                where: { id: entryId },
                relations: ["todoControl"],
            });
            if (!entry) {
                console.log("Time entry not found:", entryId);
                return false;
            }
            const control = await this.todoControlRepository.findOne({
                where: { id: entry.todoControlId },
            });
            if (control) {
                control.totalTimeMinutes = Math.max(0, control.totalTimeMinutes - (entry.durationMinutes || 0));
                await this.todoControlRepository.save(control);
            }
            await timeEntryRepository.remove(entry);
            console.log(`Time entry deleted: ${entryId}`);
            return true;
        }
        catch (error) {
            console.error("Error deleting time entry:", error);
            throw error;
        }
    }
    async deleteManualTimeEntry(entryId) {
        try {
            const { TodoManualTimeEntry, } = require("../../entities/TodoManualTimeEntry");
            const manualEntryRepository = database_1.AppDataSource.getRepository(TodoManualTimeEntry);
            const entry = await manualEntryRepository.findOne({
                where: { id: entryId },
                relations: ["todoControl"],
            });
            if (!entry) {
                console.log("Manual time entry not found:", entryId);
                return false;
            }
            const control = await this.todoControlRepository.findOne({
                where: { id: entry.todoControlId },
            });
            if (control) {
                control.totalTimeMinutes -= entry.durationMinutes;
                await this.todoControlRepository.save(control);
            }
            await manualEntryRepository.remove(entry);
            console.log(`Manual time entry deleted: ${entryId}`);
            return true;
        }
        catch (error) {
            console.error("Error deleting manual time entry:", error);
            throw error;
        }
    }
}
exports.TodoService = TodoService;
