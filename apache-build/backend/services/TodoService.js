"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodoService = void 0;
const database_1 = require("../config/database");
const Todo_1 = require("../entities/Todo");
const TodoControl_1 = require("../entities/TodoControl");
const TodoPriority_1 = require("../entities/TodoPriority");
class TodoService {
    constructor() {
        this.todoRepository = database_1.AppDataSource.getRepository(Todo_1.Todo);
        this.todoControlRepository = database_1.AppDataSource.getRepository(TodoControl_1.TodoControl);
        this.todoPriorityRepository = database_1.AppDataSource.getRepository(TodoPriority_1.TodoPriority);
    }
    async getAllTodos(filters) {
        try {
            const simpleTodos = await this.todoRepository.find();
            let query = this.todoRepository
                .createQueryBuilder("todo")
                .leftJoinAndSelect("todo.priority", "priority")
                .orderBy("todo.createdAt", "DESC");
            if (filters) {
                query = this.applyFilters(query, filters);
            }
            const todos = await query.getMany();
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
        if (todo) {
            if (todo.controls && todo.controls.length > 0) {
                const firstControl = todo.controls[0];
            }
        }
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
        const result = await this.todoRepository.delete(id);
        return (result.affected || 0) > 0;
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
                WHEN tte."end_time" IS NOT NULL AND tte."start_time" IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (tte."end_time" - tte."start_time")) / 60
                ELSE COALESCE(tte."duration_minutes", 0)
              END
            ) FROM todo_time_entries tte WHERE tte."todo_control_id" = tc.id), 0
          ) +
          -- Tiempo de manual entries
          COALESCE(
            (SELECT SUM(tmte."duration_minutes") 
             FROM todo_manual_time_entries tmte 
             WHERE tmte."todo_control_id" = tc.id), 0
          )
        ), 0) as total_time_minutes
      FROM todo_controls tc
    `);
        const totalTimeMinutes = parseInt(totalTimeResult[0]?.total_time_minutes || 0);
        const result = {
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
        return result;
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
        return {
            id: todo.id,
            title: todo.title,
            description: todo.description,
            priorityId: todo.priorityId,
            assignedUserId: todo.assignedUserId,
            createdByUserId: todo.createdByUserId,
            dueDate: todo.dueDate?.toISOString().split("T")[0],
            estimatedMinutes: todo.estimatedMinutes,
            isCompleted: todo.isCompleted,
            completedAt: todo.completedAt?.toISOString(),
            createdAt: todo.createdAt.toISOString(),
            updatedAt: todo.updatedAt.toISOString(),
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
            assignedUser: todo.assignedUser
                ? {
                    id: todo.assignedUser.id,
                    email: todo.assignedUser.email,
                    fullName: todo.assignedUser.fullName,
                    isActive: todo.assignedUser.isActive,
                }
                : undefined,
            createdByUser: todo.createdByUser
                ? {
                    id: todo.createdByUser.id,
                    email: todo.createdByUser.email,
                    fullName: todo.createdByUser.fullName,
                    isActive: todo.createdByUser.isActive,
                }
                : undefined,
            control: todo.controls && todo.controls.length > 0
                ? (() => {
                    const firstControl = todo.controls[0];
                    return {
                        id: firstControl.id,
                        todoId: firstControl.todoId,
                        userId: firstControl.userId,
                        statusId: firstControl.statusId,
                        totalTimeMinutes: firstControl.totalTimeMinutes,
                        timerStartAt: firstControl.timerStartAt?.toISOString(),
                        isTimerActive: firstControl.isTimerActive,
                        assignedAt: firstControl.assignedAt.toISOString(),
                        startedAt: firstControl.startedAt?.toISOString(),
                        completedAt: firstControl.completedAt?.toISOString(),
                        createdAt: firstControl.createdAt.toISOString(),
                        updatedAt: firstControl.updatedAt.toISOString(),
                    };
                })()
                : undefined,
        };
    }
    async addManualTimeEntry(todoId, data) {
        try {
            const todo = await this.todoRepository.findOne({
                where: { id: todoId },
                relations: ["control"],
            });
            if (!todo) {
                return null;
            }
            let todoControl = todo.control;
            if (!todoControl) {
                const { CaseStatusControl } = require("../entities/CaseStatusControl");
                const statusRepository = database_1.AppDataSource.getRepository(CaseStatusControl);
                const defaultStatus = await statusRepository.findOneBy({
                    name: "PENDIENTE",
                });
                if (!defaultStatus) {
                    console.error("Estado PENDIENTE no encontrado");
                    throw new Error("Estado PENDIENTE no encontrado");
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
            const { TodoManualTimeEntry, } = require("../entities/TodoManualTimeEntry");
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
            todoControl.totalTimeMinutes += data.durationMinutes;
            await this.todoControlRepository.save(todoControl);
            return {
                id: savedEntry.id,
                todoControlId: savedEntry.todoControlId,
                userId: savedEntry.userId,
                date: savedEntry.date,
                durationMinutes: savedEntry.durationMinutes,
                description: savedEntry.description,
                createdBy: savedEntry.createdBy,
                createdAt: savedEntry.createdAt,
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
                relations: ["control"],
            });
            if (!todo) {
                return [];
            }
            let todoControl = todo.control;
            if (!todoControl) {
                const { CaseStatusControl } = require("../entities/CaseStatusControl");
                const statusRepository = database_1.AppDataSource.getRepository(CaseStatusControl);
                const defaultStatus = await statusRepository.findOneBy({
                    name: "PENDIENTE",
                });
                if (!defaultStatus) {
                    console.error("Estado PENDIENTE no encontrado");
                    return [];
                }
                const userId = todo.createdByUserId || "550e8400-e29b-41d4-a716-446655440001";
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
            const { TodoManualTimeEntry, } = require("../entities/TodoManualTimeEntry");
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
                        username: entry.user.username,
                        fullName: entry.user.fullName,
                    }
                    : null,
                creator: entry.creator
                    ? {
                        id: entry.creator.id,
                        username: entry.creator.username,
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
    async updateManualTimeEntry(entryId, data) {
        try {
            const { TodoManualTimeEntry, } = require("../entities/TodoManualTimeEntry");
            const manualEntryRepository = database_1.AppDataSource.getRepository(TodoManualTimeEntry);
            const entry = await manualEntryRepository.findOne({
                where: { id: entryId },
                relations: ["todoControl"],
            });
            if (!entry) {
                return null;
            }
            const oldDuration = entry.durationMinutes;
            if (data.description !== undefined) {
                entry.description = data.description;
            }
            if (data.durationMinutes !== undefined) {
                entry.durationMinutes = data.durationMinutes;
            }
            if (data.date !== undefined) {
                entry.date = new Date(data.date);
            }
            const updatedEntry = await manualEntryRepository.save(entry);
            if (data.durationMinutes !== undefined &&
                data.durationMinutes !== oldDuration) {
                const control = entry.todoControl;
                control.totalTimeMinutes =
                    control.totalTimeMinutes - oldDuration + data.durationMinutes;
                await this.todoControlRepository.save(control);
            }
            return {
                id: updatedEntry.id,
                todoControlId: updatedEntry.todoControlId,
                userId: updatedEntry.userId,
                date: updatedEntry.date,
                durationMinutes: updatedEntry.durationMinutes,
                description: updatedEntry.description,
                createdBy: updatedEntry.createdBy,
                createdAt: updatedEntry.createdAt,
            };
        }
        catch (error) {
            console.error("Error updating manual time entry:", error);
            throw error;
        }
    }
    async deleteManualTimeEntry(entryId) {
        try {
            const { TodoManualTimeEntry, } = require("../entities/TodoManualTimeEntry");
            const manualEntryRepository = database_1.AppDataSource.getRepository(TodoManualTimeEntry);
            const entry = await manualEntryRepository.findOne({
                where: { id: entryId },
                relations: ["todoControl"],
            });
            if (!entry) {
                return false;
            }
            const durationToSubtract = entry.durationMinutes;
            const control = entry.todoControl;
            await manualEntryRepository.remove(entry);
            control.totalTimeMinutes -= durationToSubtract;
            await this.todoControlRepository.save(control);
            return true;
        }
        catch (error) {
            console.error("Error deleting manual time entry:", error);
            throw error;
        }
    }
    async startTimer(todoId, userId) {
        try {
            let control = await this.todoControlRepository.findOne({
                where: { todoId, userId },
            });
            if (!control) {
                const { CaseStatusControl } = require("../entities/CaseStatusControl");
                const statusRepository = database_1.AppDataSource.getRepository(CaseStatusControl);
                const pendingStatus = await statusRepository.findOne({
                    where: { name: "PENDIENTE" },
                });
                if (!pendingStatus) {
                    throw new Error("Status PENDIENTE not found");
                }
                control = this.todoControlRepository.create({
                    todoId,
                    userId,
                    statusId: pendingStatus.id,
                    totalTimeMinutes: 0,
                    isTimerActive: false,
                    assignedAt: new Date(),
                });
                control = await this.todoControlRepository.save(control);
            }
            if (control.isTimerActive) {
                throw new Error("Timer is already active for this TODO");
            }
            control.isTimerActive = true;
            control.timerStartAt = new Date();
            if (!control.startedAt) {
                control.startedAt = new Date();
            }
            await this.todoControlRepository.save(control);
            const { TodoTimeEntry } = require("../entities/TodoTimeEntry");
            const timeEntryRepository = database_1.AppDataSource.getRepository(TodoTimeEntry);
            const timeEntry = timeEntryRepository.create({
                todoControlId: control.id,
                userId,
                startTime: new Date(),
                entryType: "automatic",
            });
            await timeEntryRepository.save(timeEntry);
            const updatedTodo = await this.getTodoById(todoId);
            return updatedTodo;
        }
        catch (error) {
            console.error("Error starting timer:", error);
            throw error;
        }
    }
    async pauseTimer(todoId, userId) {
        try {
            const control = await this.todoControlRepository.findOne({
                where: { todoId, userId },
            });
            if (!control) {
                throw new Error("Control not found for this TODO and user");
            }
            if (!control.isTimerActive) {
                throw new Error("Timer is not active for this TODO");
            }
            control.isTimerActive = false;
            const endTime = new Date();
            const durationMinutes = control.timerStartAt
                ? Math.round((endTime.getTime() - control.timerStartAt.getTime()) / (1000 * 60))
                : 0;
            control.totalTimeMinutes += durationMinutes;
            control.timerStartAt = undefined;
            await this.todoControlRepository.save(control);
            const { TodoTimeEntry } = require("../entities/TodoTimeEntry");
            const timeEntryRepository = database_1.AppDataSource.getRepository(TodoTimeEntry);
            const activeTimeEntry = await timeEntryRepository.findOne({
                where: {
                    todoControlId: control.id,
                    endTime: null,
                },
                order: { startTime: "DESC" },
            });
            if (activeTimeEntry) {
                activeTimeEntry.endTime = endTime;
                activeTimeEntry.durationMinutes = durationMinutes;
                await timeEntryRepository.save(activeTimeEntry);
            }
            const updatedTodo = await this.getTodoById(todoId);
            return updatedTodo;
        }
        catch (error) {
            console.error("Error pausing timer:", error);
            throw error;
        }
    }
    async getTimeEntries(todoId) {
        try {
            const { TodoTimeEntry } = require("../entities/TodoTimeEntry");
            const { TodoManualTimeEntry, } = require("../entities/TodoManualTimeEntry");
            const timeEntryRepository = database_1.AppDataSource.getRepository(TodoTimeEntry);
            const manualTimeEntryRepository = database_1.AppDataSource.getRepository(TodoManualTimeEntry);
            const control = await this.todoControlRepository.findOne({
                where: { todoId },
            });
            if (!control) {
                return [];
            }
            const automaticEntries = await timeEntryRepository.find({
                where: { todoControlId: control.id },
                relations: ["user"],
                order: { startTime: "DESC" },
            });
            const manualEntries = await manualTimeEntryRepository.find({
                where: { todoControlId: control.id },
                relations: ["user"],
                order: { date: "DESC" },
            });
            const allEntries = [
                ...automaticEntries.map((entry) => ({
                    id: entry.id,
                    type: "automatic",
                    startTime: entry.startTime,
                    endTime: entry.endTime,
                    duration: entry.durationMinutes,
                    description: entry.description,
                    user: entry.user
                        ? {
                            id: entry.user.id,
                            fullName: entry.user.fullName,
                            email: entry.user.email,
                        }
                        : null,
                })),
                ...manualEntries.map((entry) => ({
                    id: entry.id,
                    type: "manual",
                    date: entry.date,
                    duration: entry.durationMinutes,
                    description: entry.description,
                    user: entry.user
                        ? {
                            id: entry.user.id,
                            fullName: entry.user.fullName,
                            email: entry.user.email,
                        }
                        : null,
                })),
            ];
            return allEntries;
        }
        catch (error) {
            console.error("Error getting time entries:", error);
            throw error;
        }
    }
}
exports.TodoService = TodoService;
