import { Repository, SelectQueryBuilder } from "typeorm";
import { AppDataSource } from "../../config/database";
import { Todo } from "../../entities/Todo";
import { TodoControl } from "../../entities/TodoControl";
import { TodoPriority } from "../../entities/TodoPriority";
import { TodoTimeEntry } from "../../entities/TodoTimeEntry";
import { TodoManualTimeEntry } from "../../entities/TodoManualTimeEntry";
import { ArchivedTodo } from "../../entities/archive/ArchivedTodo.entity";
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
      // Incluir la relación controls para mostrar el estado del timer correctamente
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
      .leftJoinAndSelect("todo.controls", "controls")
      .leftJoinAndSelect("controls.user", "controlUser")
      .leftJoinAndSelect("controls.status", "controlStatus")
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
    try {
      // Verificar que el TODO existe
      const todo = await this.todoRepository.findOne({ where: { id } });
      if (!todo) {
        return false;
      }

      // 1. Eliminar todas las entradas de tiempo manuales asociadas
      const manualTimeEntryRepo =
        AppDataSource.getRepository(TodoManualTimeEntry);
      await manualTimeEntryRepo
        .createQueryBuilder()
        .delete()
        .where(
          "todo_control_id IN (SELECT id FROM todo_control WHERE todo_id = :todoId)",
          { todoId: id }
        )
        .execute();

      // 2. Eliminar todas las entradas de tiempo automáticas asociadas
      const timeEntryRepo = AppDataSource.getRepository(TodoTimeEntry);
      await timeEntryRepo
        .createQueryBuilder()
        .delete()
        .where(
          "todo_control_id IN (SELECT id FROM todo_control WHERE todo_id = :todoId)",
          { todoId: id }
        )
        .execute();

      // 3. Eliminar el control del TODO
      await this.todoControlRepository
        .createQueryBuilder()
        .delete()
        .where("todo_id = :todoId", { todoId: id })
        .execute();

      // 4. Finalmente eliminar el TODO
      const result = await this.todoRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting todo and related data:", error);
      throw error;
    }
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

  async archiveTodo(id: string): Promise<TodoResponseDto | null> {
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

      // Solo se pueden archivar TODOs completados
      if (!todo.isCompleted) {
        console.log(`DEBUG - TODO is not completed, cannot archive`);
        throw new Error("Solo se pueden archivar TODOs completados");
      }

      const {
        ArchivedTodo,
      } = require("../../entities/archive/ArchivedTodo.entity");
      const archivedTodoRepository = AppDataSource.getRepository(ArchivedTodo);

      // Crear el registro archivado usando los campos correctos
      const archivedTodo = archivedTodoRepository.create({
        originalTodoId: todo.id,
        title: todo.title,
        description: todo.description,
        priority: todo.priority?.name || "MEDIUM",
        category: "General", // Campo requerido, valor por defecto
        isCompleted: todo.isCompleted,
        dueDate: todo.dueDate,
        originalCreatedAt: todo.createdAt,
        originalUpdatedAt: todo.updatedAt,
        completedAt: todo.completedAt,
        createdByUserId: todo.createdByUserId,
        assignedUserId: todo.assignedUserId,
        caseId: null, // Campo opcional para TODOs no relacionados con casos
        archivedBy: todo.createdByUserId, // Por ahora usar el creador
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

      // Guardar en tabla de archivados
      await archivedTodoRepository.save(archivedTodo);
      console.log(`DEBUG - Archived todo saved successfully`);

      // Eliminar relaciones dependientes antes del TODO principal
      console.log(
        `DEBUG - Deleting dependent relations for TODO ID: ${todo.id}`
      );

      // Primero obtener los IDs de los controles del TODO
      const todoControlIds = await AppDataSource.getRepository("TodoControl")
        .createQueryBuilder("control")
        .select("control.id")
        .where("control.todo_id = :todoId", { todoId: todo.id })
        .getRawMany();

      const controlIds = todoControlIds.map((item) => item.control_id);
      console.log(
        `DEBUG - Found ${controlIds.length} todo_control records to delete`
      );

      if (controlIds.length > 0) {
        // Eliminar registros de todo_time_entries que referencian estos controles
        await AppDataSource.getRepository("TodoTimeEntry")
          .createQueryBuilder()
          .delete()
          .where("todo_control_id IN (:...controlIds)", { controlIds })
          .execute();
        console.log(`DEBUG - Deleted todo_time_entries records`);

        // Eliminar registros de todo_manual_time_entries que referencian estos controles
        await AppDataSource.getRepository("TodoManualTimeEntry")
          .createQueryBuilder()
          .delete()
          .where("todo_control_id IN (:...controlIds)", { controlIds })
          .execute();
        console.log(`DEBUG - Deleted todo_manual_time_entries records`);
      }

      // Ahora eliminar registros de todo_control
      await AppDataSource.getRepository("TodoControl")
        .createQueryBuilder()
        .delete()
        .where("todo_id = :todoId", { todoId: todo.id })
        .execute();
      console.log(`DEBUG - Deleted todo_control records`);

      // Ahora eliminar el TODO original
      await this.todoRepository.remove(todo);
      console.log(`DEBUG - Original todo removed successfully`);

      // Retornar el TODO original para la respuesta
      return this.mapToResponseDto(todo);
    } catch (error) {
      console.error("ERROR in archiveTodo:", error);
      throw error;
    }
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

    // Calcular tiempo total dinámicamente como en Control de casos
    const totalTimeResult = await AppDataSource.query(`
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

    const totalTimeMinutes = parseInt(
      totalTimeResult[0]?.total_time_minutes || 0
    );

    return {
      totalTodos,
      activeTodos,
      completedTodos,
      overdueTodos,
      totalTimeMinutes, // Usar el tiempo calculado dinámicamente
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
      // Get the first control if exists (there can only be one due to unique constraint)
      const control =
        todo.controls && todo.controls.length > 0
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
              assignedAt:
                typeof control.assignedAt === "string"
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
              createdAt:
                typeof control.createdAt === "string"
                  ? control.createdAt
                  : control.createdAt.toISOString(),
              updatedAt:
                typeof control.updatedAt === "string"
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
    } catch (error) {
      console.error("Error mapping todo:", error);
      throw error;
    }
  }

  // ============= TIMER CONTROL METHODS =============

  async startTimer(
    todoId: string,
    userId: string
  ): Promise<TodoResponseDto | null> {
    try {
      console.log("Starting timer for TODO:", todoId, "by user:", userId);

      // Buscar el TODO
      const todo = await this.todoRepository.findOne({
        where: { id: todoId },
        relations: ["controls", "priority"],
      });

      if (!todo) {
        console.log("TODO not found:", todoId);
        return null;
      }

      // Buscar si existe un control para este TODO (solo puede haber uno por la restricción unique)
      let control =
        todo.controls && todo.controls.length > 0
          ? todo.controls[0]
          : undefined;

      // Si no existe control para este TODO, crearlo
      if (!control) {
        console.log("Creating new control for TODO:", todoId);

        // Obtener estado "EN CURSO" para cuando se inicia el timer
        const {
          CaseStatusControl,
        } = require("../../entities/CaseStatusControl");
        const statusRepository = AppDataSource.getRepository(CaseStatusControl);

        let enCursoStatus = await statusRepository.findOne({
          where: { name: "EN CURSO", isActive: true },
        });

        // Si no existe "EN CURSO", buscar otro estado apropiado
        if (!enCursoStatus) {
          enCursoStatus = await statusRepository.findOne({
            where: { isActive: true },
            order: { displayOrder: "ASC" },
          });
        }

        if (!enCursoStatus) {
          console.error("No se encontró ningún estado activo");
          throw new Error(
            "No se encontró ningún estado activo para crear el control"
          );
        }

        control = this.todoControlRepository.create({
          todoId: todoId,
          userId: userId, // Usar el usuario que inicia el timer
          statusId: enCursoStatus.id,
          totalTimeMinutes: 0,
          isTimerActive: false,
          assignedAt: new Date(),
        });
        control = await this.todoControlRepository.save(control);
      } else {
        // Si existe control pero es de otro usuario, transferirlo al usuario actual
        if (control.userId !== userId) {
          console.log(
            `Transferring control from user ${control.userId} to user ${userId}`
          );
          control.userId = userId;
          control.assignedAt = new Date();
          await this.todoControlRepository.save(control);
        }
      }

      // Pausar cualquier otro timer activo del usuario
      await this.todoControlRepository.update(
        {
          userId: userId,
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

      // Crear nueva entrada de tiempo automática (igual que en Control de Casos)
      const { TodoTimeEntry } = require("../../entities/TodoTimeEntry");
      const timeEntryRepository = AppDataSource.getRepository(TodoTimeEntry);

      const timeEntry = timeEntryRepository.create({
        todoControlId: control.id,
        userId: userId,
        startTime: new Date(),
        durationMinutes: 0, // Inicialmente 0, se actualiza al pausar
      });

      await timeEntryRepository.save(timeEntry);

      console.log(
        "Timer started successfully for TODO:",
        todoId,
        "with time entry created"
      );

      // Retornar el TODO actualizado
      return this.getTodoById(todoId);
    } catch (error) {
      console.error("Error starting timer:", error);
      throw error;
    }
  }

  async pauseTimer(
    todoId: string,
    userId: string
  ): Promise<TodoResponseDto | null> {
    try {
      console.log("Pausing timer for TODO:", todoId, "by user:", userId);

      // Buscar el TODO con su control
      const todo = await this.todoRepository.findOne({
        where: { id: todoId },
        relations: ["controls", "priority"],
      });

      if (!todo) {
        console.log("TODO not found:", todoId);
        return null;
      }

      // Buscar el control del TODO (solo puede haber uno)
      const control =
        todo.controls && todo.controls.length > 0
          ? todo.controls[0]
          : undefined;

      if (!control) {
        console.log("Control not found for TODO:", todoId);
        return null;
      }

      // Verificar que el usuario actual es quien tiene asignado el control
      if (control.userId !== userId) {
        console.log(
          `Control is assigned to different user. Control user: ${control.userId}, Current user: ${userId}`
        );
        return null;
      }

      if (!control.isTimerActive || !control.timerStartAt) {
        console.log("Timer is not active for TODO:", todoId);
        return null;
      }

      // Calcular tiempo transcurrido
      const now = new Date();
      const timeSpentMinutes = Math.floor(
        (now.getTime() - control.timerStartAt.getTime()) / (1000 * 60)
      );

      // Buscar y actualizar la entrada de tiempo activa (igual que Control de Casos)
      const { TodoTimeEntry } = require("../../entities/TodoTimeEntry");
      const timeEntryRepository = AppDataSource.getRepository(TodoTimeEntry);

      const activeTimeEntry = await timeEntryRepository.findOne({
        where: {
          todoControlId: control.id,
          userId: userId,
          endTime: null as any, // Buscar la entrada sin endTime (activa)
        },
        order: { startTime: "DESC" },
      });

      if (activeTimeEntry) {
        // Actualizar la entrada existente
        activeTimeEntry.endTime = now;
        activeTimeEntry.durationMinutes = timeSpentMinutes;
        await timeEntryRepository.save(activeTimeEntry);
      }

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
      // Buscar el control del todo
      const todoControl = await this.todoControlRepository.findOne({
        where: { todoId: todoId },
      });

      if (!todoControl) {
        return [];
      }

      const { TodoTimeEntry } = require("../../entities/TodoTimeEntry");
      const timeEntryRepository = AppDataSource.getRepository(TodoTimeEntry);

      // Solo devolver entradas automáticas (no manuales) ya que hay un endpoint separado para manuales
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

      // Solo formatear entradas automáticas
      return timeEntries.map((entry) => ({
        id: entry.id,
        type: "automatic",
        startTime: entry.startTime,
        endTime: entry.endTime,
        durationMinutes: entry.durationMinutes,
        description: entry.description,
        createdAt: entry.createdAt,
      }));
    } catch (error) {
      console.error("Error getting todo time entries:", error);
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

        // Obtener estado por defecto (primero intentar PENDIENTE, sino el primero disponible)
        const {
          CaseStatusControl,
        } = require("../../entities/CaseStatusControl");
        const statusRepository = AppDataSource.getRepository(CaseStatusControl);

        let defaultStatus = await statusRepository.findOne({
          where: { name: "PENDIENTE", isActive: true },
        });

        // Si no existe PENDIENTE, buscar otro estado por defecto
        if (!defaultStatus) {
          defaultStatus = await statusRepository.findOne({
            where: { isActive: true },
            order: { displayOrder: "ASC" },
          });
        }

        if (!defaultStatus) {
          console.error("No se encontró ningún estado activo");
          throw new Error(
            "No se encontró ningún estado activo para crear el control"
          );
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

      console.log("DEBUG - Manual entry created:", {
        id: savedEntry.id,
        todoControlId: savedEntry.todoControlId,
        durationMinutes: savedEntry.durationMinutes,
        description: savedEntry.description,
        date: savedEntry.date,
        type: "MANUAL_ONLY",
      });

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
        date: savedEntry.date.toISOString().split("T")[0], // Convertir a formato YYYY-MM-DD
        durationMinutes: savedEntry.durationMinutes,
        description: savedEntry.description,
        createdBy: savedEntry.createdBy,
        createdAt: savedEntry.createdAt.toISOString(),
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

        // Obtener estado por defecto (primero intentar PENDIENTE, sino el primero disponible)
        const {
          CaseStatusControl,
        } = require("../../entities/CaseStatusControl");
        const statusRepository = AppDataSource.getRepository(CaseStatusControl);

        let defaultStatus = await statusRepository.findOne({
          where: { name: "PENDIENTE", isActive: true },
        });

        // Si no existe PENDIENTE, buscar otro estado por defecto
        if (!defaultStatus) {
          defaultStatus = await statusRepository.findOne({
            where: { isActive: true },
            order: { displayOrder: "ASC" },
          });
        }

        if (!defaultStatus) {
          console.error("No se encontró ningún estado activo");
          // Si no hay estado por defecto, devolver array vacío pero no fallar
          return [];
        }

        // Para consultar entradas manuales, necesitamos determinar el userId
        // Como no tenemos usuario en este contexto, usaremos el creador del TODO
        // Si no hay creador, no podemos crear el control
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

  async deleteTimeEntry(entryId: string): Promise<boolean> {
    try {
      const { TodoTimeEntry } = require("../../entities/TodoTimeEntry");
      const timeEntryRepository = AppDataSource.getRepository(TodoTimeEntry);

      const entry = await timeEntryRepository.findOne({
        where: { id: entryId },
        relations: ["todoControl"],
      });

      if (!entry) {
        console.log("Time entry not found:", entryId);
        return false;
      }

      // Actualizar tiempo total del control
      const control = await this.todoControlRepository.findOne({
        where: { id: entry.todoControlId },
      });

      if (control) {
        control.totalTimeMinutes = Math.max(
          0,
          control.totalTimeMinutes - (entry.durationMinutes || 0)
        );
        await this.todoControlRepository.save(control);
      }

      await timeEntryRepository.remove(entry);

      console.log(`Time entry deleted: ${entryId}`);
      return true;
    } catch (error) {
      console.error("Error deleting time entry:", error);
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
