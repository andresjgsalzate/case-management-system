import {
  ArchiveStatsResponseDto,
  ArchivedCaseResponseDto,
  ArchivedTodoResponseDto,
  ArchivedItemResponseDto,
} from "../../dto/archive.dto";
import { AppDataSource } from "../../config/database";
import { Case, EstadoCase, ClasificacionCase } from "../../entities/Case";
import {
  ArchivedCase,
  ArchivedCaseStatus,
  ArchivedCasePriority,
  ArchivedCaseClassification,
} from "../../entities/ArchivedCase";
import { ArchivedTodo } from "../../entities/archive/ArchivedTodo.entity";
import { Todo } from "../../entities/Todo";
import { CaseControl } from "../../entities/CaseControl";
import { TimeEntry } from "../../entities/TimeEntry";
import { ManualTimeEntry } from "../../entities/ManualTimeEntry";
import { Disposition } from "../../entities/Disposition";
import { RestoreService } from "./restore-service";

export class ArchiveServiceExpress {
  private restoreService: RestoreService;

  constructor() {
    this.restoreService = new RestoreService();
  }

  /**
   * Mapea EstadoCase a ArchivedCaseStatus
   */
  private mapToStatus(estado: EstadoCase): ArchivedCaseStatus {
    switch (estado) {
      case EstadoCase.NUEVO:
        return ArchivedCaseStatus.OPEN;
      case EstadoCase.EN_PROGRESO:
        return ArchivedCaseStatus.IN_PROGRESS;
      case EstadoCase.PENDIENTE:
        return ArchivedCaseStatus.PENDING;
      case EstadoCase.RESUELTO:
        return ArchivedCaseStatus.RESOLVED;
      case EstadoCase.CERRADO:
        return ArchivedCaseStatus.CLOSED;
      case EstadoCase.CANCELADO:
        return ArchivedCaseStatus.CANCELLED;
      default:
        return ArchivedCaseStatus.OPEN;
    }
  }

  /**
   * Mapea ClasificacionCase a ArchivedCaseClassification
   */
  private mapToClassification(
    clasificacion: ClasificacionCase
  ): ArchivedCaseClassification {
    switch (clasificacion) {
      case ClasificacionCase.BAJA:
        return ArchivedCaseClassification.REQUEST;
      case ClasificacionCase.MEDIA:
        return ArchivedCaseClassification.INCIDENT;
      case ClasificacionCase.ALTA:
        return ArchivedCaseClassification.PROBLEM;
      default:
        return ArchivedCaseClassification.REQUEST;
    }
  }

  /**
   * Mapea ClasificacionCase a ArchivedCasePriority
   */
  private mapToPriority(
    clasificacion: ClasificacionCase
  ): ArchivedCasePriority {
    switch (clasificacion) {
      case ClasificacionCase.BAJA:
        return ArchivedCasePriority.LOW;
      case ClasificacionCase.MEDIA:
        return ArchivedCasePriority.MEDIUM;
      case ClasificacionCase.ALTA:
        return ArchivedCasePriority.HIGH;
      default:
        return ArchivedCasePriority.MEDIUM;
    }
  }

  /**
   * Obtiene estadísticas del archivo
   */
  async getArchiveStats(): Promise<ArchiveStatsResponseDto> {
    try {
      const archivedCaseRepository = AppDataSource.getRepository(ArchivedCase);
      const archivedTodoRepository = AppDataSource.getRepository(ArchivedTodo);

      // Contar casos archivados (excluir restaurados)
      const totalArchivedCases = await archivedCaseRepository.count({
        where: { isRestored: false },
      });

      // Contar todos archivados (excluir restaurados)
      const totalArchivedTodos = await archivedTodoRepository.count({
        where: { isRestored: false },
      });

      // Para ahora, el tiempo total será 0 ya que no tenemos esta propiedad en ArchivedCase
      const totalArchivedTimeMinutes = 0;

      // Contar archivados este mes (excluir restaurados)
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

      // Contar restaurados este mes
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
    } catch (error: any) {
      console.error("Error getting archive stats:", error);
      throw new Error("Error obteniendo estadísticas del archivo");
    }
  }

  /**
   * Obtiene elementos archivados con paginación y filtros
   */
  async getArchivedItems(
    page: number = 1,
    limit: number = 20,
    search?: string,
    type?: "case" | "todo" | "all",
    sortBy: "createdAt" | "title" | "archivedAt" = "archivedAt",
    sortOrder: "ASC" | "DESC" = "DESC"
  ): Promise<{ items: ArchivedItemResponseDto[]; total: number }> {
    try {
      const archivedCaseRepository = AppDataSource.getRepository(ArchivedCase);
      const archivedTodoRepository = AppDataSource.getRepository(ArchivedTodo);

      const items: ArchivedItemResponseDto[] = [];
      let total = 0;

      // Si no se especifica tipo, se pide "case" o se pide "all", buscar casos archivados
      if (!type || type === "case" || type === "all") {
        const queryBuilder = archivedCaseRepository
          .createQueryBuilder("archived_case")
          .leftJoinAndSelect("archived_case.archivedByUser", "archivedByUser")
          .where("archived_case.isRestored = :isRestored", {
            isRestored: false,
          });

        if (search) {
          queryBuilder.andWhere(
            "(archived_case.title ILIKE :search OR archived_case.caseNumber ILIKE :search)",
            { search: `%${search}%` }
          );
        }

        if (sortBy === "title") {
          queryBuilder.orderBy("archived_case.title", sortOrder);
        } else if (sortBy === "archivedAt") {
          queryBuilder.orderBy("archived_case.archivedAt", sortOrder);
        } else {
          queryBuilder.orderBy("archived_case.createdAt", sortOrder);
        }

        queryBuilder.skip((page - 1) * limit).take(limit);

        const [archivedCases, caseCount] = await queryBuilder.getManyAndCount();
        total += caseCount;

        // Convertir casos archivados a DTOs
        for (const archivedCase of archivedCases) {
          // Calcular tiempo del cronómetro desde metadata
          const timerTimeMinutes = (
            archivedCase.metadata?.timeEntries || []
          ).reduce(
            (total: number, entry: any) => total + (entry.durationMinutes || 0),
            0
          );

          // Calcular tiempo manual desde metadata
          const manualTimeMinutes = (
            archivedCase.metadata?.manualTimeEntries || []
          ).reduce(
            (total: number, entry: any) => total + (entry.durationMinutes || 0),
            0
          );

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
            isRestored: false, // Por implementar
            totalTimeMinutes,
            timerTimeMinutes,
            manualTimeMinutes,
            archivedByUser: archivedCase.archivedByUser
              ? {
                  id: (await archivedCase.archivedByUser).id,
                  fullName: (await archivedCase.archivedByUser).fullName,
                  email: (await archivedCase.archivedByUser).email,
                  displayName:
                    (await archivedCase.archivedByUser).fullName ||
                    (await archivedCase.archivedByUser).email,
                }
              : undefined,
          });
        }
      }

      // Si se pide "todo" o "all", buscar TODOs archivados
      if (type === "todo" || type === "all") {
        const todoQueryBuilder = archivedTodoRepository
          .createQueryBuilder("archived_todo")
          .leftJoinAndSelect("archived_todo.archivedByUser", "archivedByUser")
          .where("archived_todo.isRestored = :isRestored", {
            isRestored: false,
          });

        if (search) {
          todoQueryBuilder.andWhere(
            "(archived_todo.title ILIKE :search OR archived_todo.description ILIKE :search)",
            { search: `%${search}%` }
          );
        }

        if (sortBy === "title") {
          todoQueryBuilder.orderBy("archived_todo.title", sortOrder);
        } else if (sortBy === "archivedAt") {
          todoQueryBuilder.orderBy("archived_todo.archivedAt", sortOrder);
        } else {
          todoQueryBuilder.orderBy(
            "archived_todo.originalCreatedAt",
            sortOrder
          );
        }

        todoQueryBuilder.skip((page - 1) * limit).take(limit);

        const [archivedTodos, todoCount] =
          await todoQueryBuilder.getManyAndCount();
        total += todoCount;

        // Convertir TODOs archivados a DTOs
        for (const archivedTodo of archivedTodos) {
          // Usar directamente los datos almacenados en los campos JSONB (igual que casos)
          const timerTimeMinutes = (archivedTodo.timerEntries || []).reduce(
            (total: number, entry: any) => total + (entry.durationMinutes || 0),
            0
          );

          const manualTimeMinutes = (
            archivedTodo.manualTimeEntries || []
          ).reduce(
            (total: number, entry: any) => total + (entry.durationMinutes || 0),
            0
          );

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
                  displayName:
                    (await archivedTodo.archivedByUser).fullName ||
                    (await archivedTodo.archivedByUser).email,
                }
              : undefined,
          });
        }
      }

      return { items, total };
    } catch (error: any) {
      console.error("Error getting archived items:", error);
      throw new Error("Error obteniendo elementos archivados");
    }
  }

  /**
   * Archiva un caso
   */
  async archiveCase(
    caseId: string,
    userId: string,
    reason?: string
  ): Promise<ArchivedCaseResponseDto> {
    try {
      // Obtener repositorios
      const caseRepository = AppDataSource.getRepository(Case);
      const archivedCaseRepository = AppDataSource.getRepository(ArchivedCase);
      const caseControlRepository = AppDataSource.getRepository(CaseControl);
      const timeEntriesRepository = AppDataSource.getRepository(TimeEntry);
      const manualTimeEntriesRepository =
        AppDataSource.getRepository(ManualTimeEntry);

      // Buscar el caso original
      const originalCase = await caseRepository.findOne({
        where: { id: caseId },
        relations: ["user", "assignedTo"],
      });

      if (!originalCase) {
        throw new Error(`Caso con ID ${caseId} no encontrado`);
      }

      // Buscar registros de control de caso
      const caseControlRecords = await caseControlRepository.find({
        where: { caseId: caseId },
        relations: ["user", "status"],
      });

      console.log(
        `🔍 Archivando CASO ${caseId} (${originalCase.numeroCaso}):`,
        {
          caseControlRecordsFound: caseControlRecords.length,
          caseControlIds: caseControlRecords.map((cc) => cc.id),
        }
      );

      // Recolectar todas las entradas de tiempo automáticas
      const timerEntries = [];
      const manualEntries = [];

      for (const caseControl of caseControlRecords) {
        console.log(
          `🔍 Buscando entradas de tiempo para CaseControl ${caseControl.id}`
        );

        // Entradas de tiempo automáticas (cronómetro)
        const automaticEntries = await timeEntriesRepository.find({
          where: { caseControlId: caseControl.id },
          relations: ["user"],
        });

        console.log(
          `   - Timer entries encontradas: ${automaticEntries.length}`
        );

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

        // Entradas de tiempo manuales
        const manualTimeEntries = await manualTimeEntriesRepository.find({
          where: { caseControlId: caseControl.id },
          relations: ["user", "creator"],
        });

        console.log(
          `   - Manual entries encontradas: ${manualTimeEntries.length}`
        );

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

      // Calcular tiempos totales
      const timerTimeMinutes = timerEntries.reduce(
        (total, entry) => total + (entry.durationMinutes || 0),
        0
      );
      const manualTimeMinutes = manualEntries.reduce(
        (total, entry) => total + (entry.durationMinutes || 0),
        0
      );
      const calculatedTotalTime = timerTimeMinutes + manualTimeMinutes;

      console.log(`⏱️ Tiempos calculados para CASO:`, {
        timerTimeMinutes,
        manualTimeMinutes,
        calculatedTotalTime,
      });

      // Crear el caso archivado con mapeo de tipos
      const archivedCase = new ArchivedCase();
      archivedCase.originalCaseId = caseId;
      archivedCase.caseNumber = originalCase.numeroCaso;
      archivedCase.title = originalCase.numeroCaso; // Usar numeroCaso como título
      archivedCase.description = originalCase.descripcion;
      archivedCase.priority = this.mapToPriority(originalCase.clasificacion);
      archivedCase.status = this.mapToStatus(originalCase.estado);
      archivedCase.classification = this.mapToClassification(
        originalCase.clasificacion
      );
      archivedCase.assignedTo = originalCase.assignedToId || undefined;
      archivedCase.createdBy = originalCase.userId || userId; // Siempre debe tener un valor válido
      archivedCase.updatedBy = undefined; // Por defecto undefined
      archivedCase.originalCreatedAt = originalCase.createdAt;
      archivedCase.originalUpdatedAt = originalCase.updatedAt;
      archivedCase.archivedAt = new Date();
      archivedCase.archivedBy = userId;
      archivedCase.archivedReason = reason || "Sin razón especificada";

      // Metadatos adicionales con información de control de caso (guardado en originalData)
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
        // Incluir las entradas de tiempo en originalData
        timeEntries: timerEntries,
        manualTimeEntries: manualEntries,
      };

      // Almacenar los datos originales completos en el campo metadata
      archivedCase.metadata = { ...originalCase, ...metadata };

      // Almacenar las entradas de tiempo directamente en los campos JSONB
      archivedCase.timerEntries = timerEntries;
      archivedCase.manualTimeEntries = manualEntries;

      // Usar transacción para garantizar consistencia
      const result = await AppDataSource.transaction(async (manager) => {
        // Guardar el caso archivado
        const savedArchivedCase = await manager.save(
          ArchivedCase,
          archivedCase
        );

        // Eliminar todas las entradas de tiempo manuales relacionadas
        for (const caseControl of caseControlRecords) {
          await manager.delete(ManualTimeEntry, {
            caseControlId: caseControl.id,
          });
          await manager.delete(TimeEntry, { caseControlId: caseControl.id });
        }

        // Eliminar registros de control de caso
        await manager.delete(CaseControl, { caseId: caseId });

        // Desvincular disposiciones del caso (mantener historial, solo quitar la relación)
        // El caseNumber ya está guardado en dispositions, así que el historial se mantiene
        await manager.update(
          Disposition,
          { caseId: caseId },
          { caseId: null as any }
        );

        // Finalmente, eliminar el caso original
        await manager.delete(Case, { id: caseId });

        return savedArchivedCase;
      });

      // Convertir a DTO de respuesta
      const response: ArchivedCaseResponseDto = {
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

      console.log(
        `✅ Caso ${originalCase.numeroCaso} archivado exitosamente:`,
        {
          caseId,
          archivedCaseId: result.id,
          timerEntriesCount: timerEntries.length,
          manualEntriesCount: manualEntries.length,
          caseControlRecordsCount: caseControlRecords.length,
        }
      );

      return response;
    } catch (error: any) {
      console.error("Error archiving case:", error);
      throw new Error(`Error archivando caso: ${error.message}`);
    }
  }

  /**
   * Archiva un todo (siguiendo el mismo patrón que archiveCase)
   */
  async archiveTodo(
    todoId: string,
    userId: string,
    reason?: string
  ): Promise<ArchivedTodoResponseDto> {
    try {
      // Los IDs ya son strings UUID
      const todoIdStr = todoId;
      const userIdStr = userId;

      // Obtener repositorios
      const todoRepository = AppDataSource.getRepository(Todo);
      const archivedTodoRepository = AppDataSource.getRepository(ArchivedTodo);
      const { TodoControl } = await import("../../entities/TodoControl");
      const { TodoTimeEntry } = await import("../../entities/TodoTimeEntry");
      const { TodoManualTimeEntry } = await import(
        "../../entities/TodoManualTimeEntry"
      );
      const todoControlRepository = AppDataSource.getRepository(TodoControl);
      const todoTimeEntriesRepository =
        AppDataSource.getRepository(TodoTimeEntry);
      const todoManualTimeEntriesRepository =
        AppDataSource.getRepository(TodoManualTimeEntry);

      // Buscar el TODO original con todas sus relaciones
      const originalTodo = await todoRepository.findOne({
        where: { id: todoIdStr },
        relations: ["priority", "assignedUser", "createdByUser"],
      });

      if (!originalTodo) {
        throw new Error(`TODO con ID ${todoIdStr} no encontrado`);
      }

      // Solo se pueden archivar TODOs completados
      if (!originalTodo.isCompleted) {
        throw new Error("Solo se pueden archivar TODOs completados");
      }

      // Buscar registros de control del TODO
      const todoControlRecords = await todoControlRepository.find({
        where: { todoId: todoIdStr },
        relations: ["user", "status"],
      });

      console.log(`🔍 Archivando TODO ${todoIdStr}:`, {
        todoControlRecordsFound: todoControlRecords.length,
        todoControlIds: todoControlRecords.map((tc) => tc.id),
      });

      // Recolectar todas las entradas de tiempo
      const timerEntries = [];
      const manualEntries = [];

      for (const todoControl of todoControlRecords) {
        console.log(
          `🔍 Buscando entradas de tiempo para TodoControl ${todoControl.id}`
        );

        // Entradas de tiempo automáticas (cronómetro)
        const automaticEntries = await todoTimeEntriesRepository.find({
          where: { todoControlId: todoControl.id },
          relations: ["user"],
        });

        console.log(
          `   - Timer entries encontradas: ${automaticEntries.length}`
        );

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

        // Entradas de tiempo manuales
        const manualTimeEntries = await todoManualTimeEntriesRepository.find({
          where: { todoControlId: todoControl.id },
          relations: ["user"],
        });

        console.log(
          `   - Manual entries encontradas: ${manualTimeEntries.length}`
        );

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

      // Calcular tiempos por separado
      const timerTimeMinutes = timerEntries.reduce(
        (total, entry) => total + (entry.durationMinutes || 0),
        0
      );

      const manualTimeMinutes = manualEntries.reduce(
        (total, entry) => total + (entry.durationMinutes || 0),
        0
      );

      // Calcular tiempo total
      const totalTimeMinutes = timerTimeMinutes + manualTimeMinutes;

      console.log(`⏱️ Tiempos calculados:`, {
        timerTimeMinutes,
        manualTimeMinutes,
        totalTimeMinutes,
      });

      // Crear el TODO archivado
      const archivedTodo = new ArchivedTodo();
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
      // caseId se deja undefined por defecto para TODOs no relacionados con casos
      archivedTodo.archivedAt = new Date();
      archivedTodo.archivedBy = userIdStr;
      archivedTodo.archiveReason =
        reason || "TODO archivado a través del sistema de archivos";
      archivedTodo.isRestored = false;
      archivedTodo.totalTimeMinutes = totalTimeMinutes;
      archivedTodo.timerTimeMinutes = timerTimeMinutes;
      archivedTodo.manualTimeMinutes = manualTimeMinutes;

      // Almacenar datos originales completos
      archivedTodo.originalData = {
        ...originalTodo,
        priority: originalTodo.priority,
        assignedUser: originalTodo.assignedUser,
        createdByUser: originalTodo.createdByUser,
      };

      // Almacenar datos de control
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

      // Almacenar las entradas de tiempo directamente en los campos JSONB (igual que casos)
      archivedTodo.timerEntries = timerEntries;
      archivedTodo.manualTimeEntries = manualEntries;

      // Metadatos adicionales con información de control de TODO
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
        // Incluir las entradas de tiempo en metadata
        timeEntries: timerEntries,
        manualTimeEntries: manualEntries,
      };

      // Almacenar los metadatos (igual que casos)
      archivedTodo.metadata = { ...originalTodo, ...metadata };

      // Usar transacción para garantizar consistencia
      const result = await AppDataSource.transaction(async (manager) => {
        // Guardar el TODO archivado
        const savedArchivedTodo = await manager.save(
          ArchivedTodo,
          archivedTodo
        );

        // Eliminar todas las entradas de tiempo relacionadas
        for (const todoControl of todoControlRecords) {
          await manager.delete(TodoManualTimeEntry, {
            todoControlId: todoControl.id,
          });
          await manager.delete(TodoTimeEntry, {
            todoControlId: todoControl.id,
          });
        }

        // Eliminar registros de control del TODO
        await manager.delete(TodoControl, { todoId: todoIdStr });

        // Finalmente, eliminar el TODO original
        await manager.delete(Todo, { id: todoIdStr });

        return savedArchivedTodo;
      });

      // Convertir a DTO de respuesta
      const response: ArchivedTodoResponseDto = {
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
    } catch (error: any) {
      console.error("Error archiving todo:", error);
      throw new Error(`Error archivando todo: ${error.message}`);
    }
  }

  /**
   * Restaura un elemento archivado
   */
  async restoreArchivedItem(
    type: "case" | "todo",
    archivedId: number
  ): Promise<any> {
    try {
      // Mock response for now
      return {
        id: archivedId.toString(),
        type: type,
        message: "Elemento restaurado exitosamente",
      };
    } catch (error: any) {
      console.error("Error restoring archived item:", error);
      throw new Error(`Error restaurando elemento: ${error.message}`);
    }
  }

  /**
   * Elimina permanentemente un elemento archivado
   */
  async deleteArchivedItem(
    type: "case" | "todo",
    archivedId: string
  ): Promise<void> {
    try {
      if (type === "case") {
        const archivedCaseRepository =
          AppDataSource.getRepository(ArchivedCase);
        const archivedCase = await archivedCaseRepository.findOne({
          where: { id: archivedId },
        });

        if (!archivedCase) {
          throw new Error("Caso archivado no encontrado");
        }

        await archivedCaseRepository.remove(archivedCase);
        console.log(`Caso archivado eliminado permanentemente: ${archivedId}`);
      } else if (type === "todo") {
        const archivedTodoRepository =
          AppDataSource.getRepository(ArchivedTodo);
        const archivedTodo = await archivedTodoRepository.findOne({
          where: { id: archivedId },
        });

        if (!archivedTodo) {
          throw new Error("TODO archivado no encontrado");
        }

        await archivedTodoRepository.remove(archivedTodo);
        console.log(`TODO archivado eliminado permanentemente: ${archivedId}`);
      }
    } catch (error: any) {
      console.error("Error deleting archived item:", error);
      throw new Error(`Error eliminando elemento archivado: ${error.message}`);
    }
  }

  /**
   * Busca elementos archivados
   */
  async searchArchivedItems(
    query: string,
    type?: "case" | "todo",
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: ArchivedItemResponseDto[]; total: number }> {
    try {
      // Mock response for now
      const items: ArchivedItemResponseDto[] = [];
      return { items, total: 0 };
    } catch (error: any) {
      console.error("Error searching archived items:", error);
      throw new Error("Error buscando elementos archivados");
    }
  }

  /**
   * Restaura un caso archivado
   */
  async restoreCase(
    archivedCaseId: string,
    restoredBy: string
  ): Promise<{ success: boolean; caseId?: string; message: string }> {
    return this.restoreService.restoreCase(archivedCaseId, restoredBy);
  }

  /**
   * Restaura un todo archivado
   */
  async restoreTodo(
    archivedTodoId: string,
    restoredBy: string
  ): Promise<{ success: boolean; todoId?: string; message: string }> {
    return this.restoreService.restoreTodo(archivedTodoId, restoredBy);
  }
}
