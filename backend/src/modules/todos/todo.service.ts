import { Repository, SelectQueryBuilder } from "typeorm";
import { AppDataSource } from "../../config/database";
import { Todo } from "../../entities/Todo";
import { TodoControl } from "../../entities/TodoControl";
import { TodoPriority } from "../../entities/TodoPriority";
import { TodoTimeEntry } from "../../entities/TodoTimeEntry";
import { TodoManualTimeEntry } from "../../entities/TodoManualTimeEntry";
import {
  CreateTodoDto,
  UpdateTodoDto,
  TodoResponseDto,
  TodoFiltersDto,
  TodoMetricsDto,
  CreateTodoControlDto,
  UpdateTodoControlDto,
} from "../../dto/todo.dto";

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
      // Probar solo con priority JOIN primero
      console.log("Attempting query with priority JOIN only...");
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
    return (result.affected ?? 0) > 0;
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

    return {
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
    console.log("Mapping todo:", todo.id);

    try {
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
        createdAt:
          typeof todo.createdAt === "string"
            ? todo.createdAt
            : todo.createdAt.toISOString(),
        updatedAt:
          typeof todo.updatedAt === "string"
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
        assignedUser: undefined, // Simplified for now
        createdByUser: undefined, // Simplified for now
        control: undefined, // Simplified for now
      };

      console.log("Mapped todo successfully");
      return result;
    } catch (error) {
      console.error("Error mapping todo:", error);
      throw error;
    }
  }

  // ============= TIMER CONTROL METHODS =============

  async startTimer(todoId: string): Promise<TodoResponseDto | null> {
    try {
      console.log("Starting timer for TODO:", todoId);

      // Buscar el TODO
      const todo = await this.todoRepository.findOne({
        where: { id: todoId },
        relations: ["controls", "priority"],
      });

      if (!todo) {
        console.log("TODO not found:", todoId);
        return null;
      }

      let control = todo.control;

      // Si no existe control, crearlo
      if (!control) {
        console.log("Creating new control for TODO:", todoId);
        control = this.todoControlRepository.create({
          todoId: todoId,
          userId: todo.createdByUserId, // Usar el creador por ahora
          statusId: "default-status-id", // TODO: obtener status por defecto
          totalTimeMinutes: 0,
          isTimerActive: false,
          assignedAt: new Date(),
        });
        control = await this.todoControlRepository.save(control);
      }

      // Pausar cualquier otro timer activo del usuario
      await this.todoControlRepository.update(
        {
          userId: control.userId,
          isTimerActive: true,
        },
        {
          isTimerActive: false,
          timerStartAt: undefined,
        }
      );

      // Iniciar el timer de este TODO
      control.isTimerActive = true;
      control.timerStartAt = new Date();
      if (!control.startedAt) {
        control.startedAt = new Date();
      }

      await this.todoControlRepository.save(control);

      console.log("Timer started successfully for TODO:", todoId);

      // Retornar el TODO actualizado
      return this.getTodoById(todoId);
    } catch (error) {
      console.error("Error starting timer:", error);
      throw error;
    }
  }

  async pauseTimer(todoId: string): Promise<TodoResponseDto | null> {
    try {
      console.log("Pausing timer for TODO:", todoId);

      // Buscar el TODO con su control
      const todo = await this.todoRepository.findOne({
        where: { id: todoId },
        relations: ["controls", "priority"],
      });

      if (!todo || !todo.control) {
        console.log("TODO or control not found:", todoId);
        return null;
      }

      const control = todo.control;

      if (!control.isTimerActive || !control.timerStartAt) {
        console.log("Timer is not active for TODO:", todoId);
        return null;
      }

      // Calcular tiempo transcurrido
      const now = new Date();
      const timeSpentMinutes = Math.floor(
        (now.getTime() - control.timerStartAt.getTime()) / (1000 * 60)
      );

      // Crear entrada de tiempo automática
      const { TodoTimeEntry } = require("../../entities/TodoTimeEntry");
      const timeEntryRepository = AppDataSource.getRepository(TodoTimeEntry);

      const timeEntry = timeEntryRepository.create({
        todoControlId: control.id,
        startTime: control.timerStartAt,
        endTime: now,
        durationMinutes: timeSpentMinutes,
        description: "Sesión de trabajo automática",
      });

      await timeEntryRepository.save(timeEntry);

      // Actualizar el tiempo total y pausar timer
      control.totalTimeMinutes += timeSpentMinutes;
      control.isTimerActive = false;
      control.timerStartAt = undefined;

      await this.todoControlRepository.save(control);

      console.log(
        `Timer paused for TODO: ${todoId}, time added: ${timeSpentMinutes} minutes`
      );

      // Retornar el TODO actualizado
      return this.getTodoById(todoId);
    } catch (error) {
      console.error("Error pausing timer:", error);
      throw error;
    }
  }

  async getTodoTimeEntries(todoId: string): Promise<any[]> {
    try {
      const todo = await this.todoRepository.findOne({
        where: { id: todoId },
        relations: ["controls"],
      });

      if (!todo) {
        return [];
      }

      // If no controls exist, return empty array (no time entries possible)
      if (!todo.controls || todo.controls.length === 0) {
        return [];
      }

      const todoControl = todo.controls[0];
      if (!todoControl) {
        return [];
      }

      const { TodoTimeEntry } = require("../../entities/TodoTimeEntry");
      const {
        TodoManualTimeEntry,
      } = require("../../entities/TodoManualTimeEntry");

      const timeEntryRepository = AppDataSource.getRepository(TodoTimeEntry);
      const manualEntryRepository =
        AppDataSource.getRepository(TodoManualTimeEntry);

      const [timeEntries, manualEntries] = await Promise.all([
        timeEntryRepository.find({
          where: { todoControlId: todoControl.id },
          order: { startTime: "DESC" },
        }),
        manualEntryRepository.find({
          where: { todoControlId: todoControl.id },
          order: { date: "DESC" },
        }),
      ]);

      // Combinar y formatear entradas
      const allEntries = [
        ...timeEntries.map((entry) => ({
          id: entry.id,
          type: "automatic",
          startTime: entry.startTime,
          endTime: entry.endTime,
          durationMinutes: entry.durationMinutes,
          description: entry.description,
          createdAt: entry.createdAt,
        })),
        ...manualEntries.map((entry) => ({
          id: entry.id,
          type: "manual",
          date: entry.date,
          durationMinutes: entry.durationMinutes,
          description: entry.description,
          createdAt: entry.createdAt,
        })),
      ];

      // Ordenar por fecha de creación
      return allEntries.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error("Error fetching time entries:", error);
      throw error;
    }
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
        relations: ["controls"],
      });

      if (!todo) {
        console.log("TODO not found for manual time entry:", todoId);
        return null;
      }

      let todoControl =
        todo.controls && todo.controls.length > 0
          ? todo.controls[0]
          : undefined;

      // Si no existe control, crearlo
      if (!todoControl) {
        console.log("Creating new control for manual time entry:", todoId);

        // Obtener estado PENDIENTE por defecto
        const {
          CaseStatusControl,
        } = require("../../entities/CaseStatusControl");
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
      } = require("../../entities/TodoManualTimeEntry");
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
        relations: ["controls"],
      });

      if (!todo) {
        console.log("TODO not found for manual time entries:", todoId);
        return [];
      }

      let todoControl =
        todo.controls && todo.controls.length > 0
          ? todo.controls[0]
          : undefined;

      // Si no existe control, crearlo
      if (!todoControl) {
        console.log("Creating new control for manual time entries:", todoId);

        // Obtener estado PENDIENTE por defecto
        const {
          CaseStatusControl,
        } = require("../../entities/CaseStatusControl");
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
      } = require("../../entities/TodoManualTimeEntry");
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
    } catch (error) {
      console.error("Error getting manual time entries:", error);
      throw error;
    }
  }

  async deleteManualTimeEntry(entryId: string): Promise<boolean> {
    try {
      const {
        TodoManualTimeEntry,
      } = require("../../entities/TodoManualTimeEntry");
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

      // Actualizar tiempo total del control
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
    } catch (error) {
      console.error("Error deleting manual time entry:", error);
      throw error;
    }
  }
}
