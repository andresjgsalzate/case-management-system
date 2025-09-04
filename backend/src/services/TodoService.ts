import { Repository, SelectQueryBuilder } from "typeorm";
import { AppDataSource } from "../config/database";
import { Todo } from "../entities/Todo";
import { TodoControl } from "../entities/TodoControl";
import { TodoPriority } from "../entities/TodoPriority";
import {
  CreateTodoDto,
  UpdateTodoDto,
  TodoResponseDto,
  TodoFiltersDto,
  TodoMetricsDto,
  CreateTodoControlDto,
  UpdateTodoControlDto,
} from "../dto/todo.dto";

export class TodoService {
  private todoRepository: Repository<Todo>;
  private todoControlRepository: Repository<TodoControl>;
  private todoPriorityRepository: Repository<TodoPriority>;

  constructor() {
    this.todoRepository = AppDataSource.getRepository(Todo);
    this.todoControlRepository = AppDataSource.getRepository(TodoControl);
    this.todoPriorityRepository = AppDataSource.getRepository(TodoPriority);
  }

  async getAllTodos(filters?: TodoFiltersDto): Promise<TodoResponseDto[]> {
    console.log("TodoService.getAllTodos - Starting...");

    try {
      // Primero probar sin JOINs para ver si ese es el problema
      console.log("Attempting simple query without JOINs...");
      const simpleTodos = await this.todoRepository.find();
      console.log("Simple todos count:", simpleTodos.length);

      // Si funciona sin JOINs, intentar con JOINs uno por uno
      console.log("Attempting query with JOINs...");
      let query = this.todoRepository
        .createQueryBuilder("todo")
        .leftJoinAndSelect("todo.priority", "priority")
        .orderBy("todo.createdAt", "DESC");

      if (filters) {
        query = this.applyFilters(query, filters);
      }

      const todos = await query.getMany();
      console.log("Todos with priority JOIN count:", todos.length);
      return todos.map((todo) => this.mapToResponseDto(todo));
    } catch (error) {
      console.error("Error in getAllTodos:", error);
      throw error;
    }
  }

  async getTodoById(id: string): Promise<TodoResponseDto | null> {
    const todo = await this.todoRepository
      .createQueryBuilder("todo")
      .leftJoinAndSelect("todo.priority", "priority")
      .leftJoinAndSelect("todo.assignedUser", "assignedUser")
      .leftJoinAndSelect("todo.createdByUser", "createdByUser")
      .leftJoinAndSelect("todo.control", "control")
      .leftJoinAndSelect("control.user", "controlUser")
      .leftJoinAndSelect("control.status", "controlStatus")
      .where("todo.id = :id", { id })
      .getOne();

    return todo ? this.mapToResponseDto(todo) : null;
  }

  async createTodo(
    createTodoDto: CreateTodoDto,
    createdByUserId: string
  ): Promise<TodoResponseDto> {
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

  async updateTodo(
    id: string,
    updateTodoDto: UpdateTodoDto
  ): Promise<TodoResponseDto | null> {
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

  async deleteTodo(id: string): Promise<boolean> {
    const result = await this.todoRepository.delete(id);
    return (result.affected || 0) > 0;
  }

  async completeTodo(id: string): Promise<TodoResponseDto | null> {
    const todo = await this.todoRepository.findOne({ where: { id } });
    if (!todo) {
      return null;
    }

    todo.isCompleted = true;
    todo.completedAt = new Date();

    const savedTodo = await this.todoRepository.save(todo);

    // También actualizar el control si existe
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

  async reactivateTodo(id: string): Promise<TodoResponseDto | null> {
    const todo = await this.todoRepository.findOne({ where: { id } });
    if (!todo) {
      return null;
    }

    todo.isCompleted = false;
    todo.completedAt = undefined;

    const savedTodo = await this.todoRepository.save(todo);

    // También actualizar el control si existe
    const control = await this.todoControlRepository.findOne({
      where: { todoId: id },
    });
    if (control) {
      control.completedAt = undefined;
      await this.todoControlRepository.save(control);
    }

    return this.mapToResponseDto(savedTodo);
  }

  async getTodoMetrics(): Promise<TodoMetricsDto> {
    console.log("Starting TodoService.getTodoMetrics...");

    const totalTodos = await this.todoRepository.count();
    console.log("Total TODOs:", totalTodos);

    const activeTodos = await this.todoRepository.count({
      where: { isCompleted: false },
    });
    console.log("Active TODOs:", activeTodos);

    const completedTodos = await this.todoRepository.count({
      where: { isCompleted: true },
    });
    console.log("Completed TODOs:", completedTodos);

    console.log("Calculating overdue TODOs...");
    const overdueTodos = await this.todoRepository
      .createQueryBuilder("todo")
      .where("todo.dueDate < :today", { today: new Date() })
      .andWhere("todo.isCompleted = :completed", { completed: false })
      .getCount();
    console.log("Overdue TODOs:", overdueTodos);

    console.log("Getting metrics by priority...");
    // Métricas por prioridad
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
    console.log("TODOs by priority:", todosByPriority);

    console.log("Getting metrics by user...");
    // Métricas por usuario
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
    console.log("TODOs by user:", todosByUser);

    const result = {
      totalTodos,
      activeTodos,
      completedTodos,
      overdueTodos,
      totalTimeMinutes: 0, // TODO: Calcular desde time entries
      averageCompletionTime: 0, // TODO: Calcular
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

    console.log("Final metrics result:", result);
    return result;
  }

  async getAllPriorities(): Promise<TodoPriority[]> {
    return this.todoPriorityRepository.find({
      where: { isActive: true },
      order: { displayOrder: "ASC" },
    });
  }

  private applyFilters(
    query: SelectQueryBuilder<Todo>,
    filters: TodoFiltersDto
  ): SelectQueryBuilder<Todo> {
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
      query = query.andWhere(
        "(todo.title LIKE :search OR todo.description LIKE :search)",
        { search: `%${filters.search}%` }
      );
    }

    if (filters.showCompleted === false) {
      query = query.andWhere("todo.isCompleted = :completed", {
        completed: false,
      });
    } else if (filters.showCompleted === true) {
      query = query.andWhere("todo.isCompleted = :completed", {
        completed: true,
      });
    }

    return query;
  }

  private mapToResponseDto(todo: Todo): TodoResponseDto {
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
      control: todo.control
        ? {
            id: todo.control.id,
            todoId: todo.control.todoId,
            userId: todo.control.userId,
            statusId: todo.control.statusId,
            totalTimeMinutes: todo.control.totalTimeMinutes,
            timerStartAt: todo.control.timerStartAt?.toISOString(),
            isTimerActive: todo.control.isTimerActive,
            assignedAt: todo.control.assignedAt.toISOString(),
            startedAt: todo.control.startedAt?.toISOString(),
            completedAt: todo.control.completedAt?.toISOString(),
            createdAt: todo.control.createdAt.toISOString(),
            updatedAt: todo.control.updatedAt.toISOString(),
          }
        : undefined,
    };
  }

  async addManualTimeEntry(
    todoId: string,
    data: {
      description: string;
      durationMinutes: number;
      date: string; // formato YYYY-MM-DD
      userId: string;
    }
  ): Promise<any | null> {
    try {
      const todo = await this.todoRepository.findOne({
        where: { id: todoId },
        relations: ["control"],
      });

      if (!todo) {
        console.log("TODO not found for manual time entry:", todoId);
        return null;
      }

      let todoControl = todo.control;

      // Si no existe control, crearlo
      if (!todoControl) {
        console.log("Creating new control for manual time entry:", todoId);

        // Obtener estado PENDIENTE por defecto
        const { CaseStatusControl } = require("../entities/CaseStatusControl");
        const statusRepository = AppDataSource.getRepository(CaseStatusControl);
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

      const {
        TodoManualTimeEntry,
      } = require("../entities/TodoManualTimeEntry");
      const manualEntryRepository =
        AppDataSource.getRepository(TodoManualTimeEntry);

      const manualEntry = manualEntryRepository.create({
        todoControlId: todoControl.id,
        userId: data.userId,
        date: new Date(data.date),
        durationMinutes: data.durationMinutes,
        description: data.description,
        createdBy: data.userId,
      });

      const savedEntry = await manualEntryRepository.save(manualEntry);

      // Actualizar tiempo total
      todoControl.totalTimeMinutes += data.durationMinutes;
      await this.todoControlRepository.save(todoControl);

      console.log(
        `Manual time entry added: ${data.durationMinutes} minutes for TODO ${todoId}`
      );

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
    } catch (error) {
      console.error("Error adding manual time entry:", error);
      throw error;
    }
  }

  async getManualTimeEntries(todoId: string): Promise<any[]> {
    try {
      const todo = await this.todoRepository.findOne({
        where: { id: todoId },
        relations: ["control"],
      });

      if (!todo) {
        console.log("TODO not found for manual time entries:", todoId);
        return [];
      }

      let todoControl = todo.control;

      // Si no existe control, crearlo
      if (!todoControl) {
        console.log("Creating new control for manual time entries:", todoId);

        // Obtener estado PENDIENTE por defecto
        const { CaseStatusControl } = require("../entities/CaseStatusControl");
        const statusRepository = AppDataSource.getRepository(CaseStatusControl);
        const defaultStatus = await statusRepository.findOneBy({
          name: "PENDIENTE",
        });

        if (!defaultStatus) {
          console.error("Estado PENDIENTE no encontrado");
          // Si no hay estado por defecto, devolver array vacío pero no fallar
          return [];
        }

        // Para consultar entradas manuales, necesitamos determinar el userId
        // Como no tenemos usuario en este contexto, buscaremos el creador del TODO
        const userId =
          todo.createdByUserId || "550e8400-e29b-41d4-a716-446655440001";

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

      const {
        TodoManualTimeEntry,
      } = require("../entities/TodoManualTimeEntry");
      const manualEntryRepository =
        AppDataSource.getRepository(TodoManualTimeEntry);

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
    } catch (error) {
      console.error("Error getting manual time entries:", error);
      throw error;
    }
  }

  async updateManualTimeEntry(
    entryId: string,
    data: {
      description?: string;
      durationMinutes?: number;
      date?: string;
    }
  ): Promise<any | null> {
    try {
      const {
        TodoManualTimeEntry,
      } = require("../entities/TodoManualTimeEntry");
      const manualEntryRepository =
        AppDataSource.getRepository(TodoManualTimeEntry);

      const entry = await manualEntryRepository.findOne({
        where: { id: entryId },
        relations: ["todoControl"],
      });

      if (!entry) {
        console.log("Manual time entry not found:", entryId);
        return null;
      }

      const oldDuration = entry.durationMinutes;

      // Actualizar campos
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

      // Actualizar tiempo total si cambió la duración
      if (
        data.durationMinutes !== undefined &&
        data.durationMinutes !== oldDuration
      ) {
        const control = entry.todoControl;
        control.totalTimeMinutes =
          control.totalTimeMinutes - oldDuration + data.durationMinutes;
        await this.todoControlRepository.save(control);
      }

      console.log(`Manual time entry updated: ${entryId}`);

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
    } catch (error) {
      console.error("Error updating manual time entry:", error);
      throw error;
    }
  }

  async deleteManualTimeEntry(entryId: string): Promise<boolean> {
    try {
      const {
        TodoManualTimeEntry,
      } = require("../entities/TodoManualTimeEntry");
      const manualEntryRepository =
        AppDataSource.getRepository(TodoManualTimeEntry);

      const entry = await manualEntryRepository.findOne({
        where: { id: entryId },
        relations: ["todoControl"],
      });

      if (!entry) {
        console.log("Manual time entry not found:", entryId);
        return false;
      }

      const durationToSubtract = entry.durationMinutes;
      const control = entry.todoControl;

      // Eliminar entrada
      await manualEntryRepository.remove(entry);

      // Actualizar tiempo total
      control.totalTimeMinutes -= durationToSubtract;
      await this.todoControlRepository.save(control);

      console.log(`Manual time entry deleted: ${entryId}`);
      return true;
    } catch (error) {
      console.error("Error deleting manual time entry:", error);
      throw error;
    }
  }
}
