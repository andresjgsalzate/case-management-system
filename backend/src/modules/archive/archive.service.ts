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
import {
  ArchivedTodo,
  ArchivedTodoStatus,
  ArchivedTodoPriority,
} from "../../entities/ArchivedTodo";
import { Todo } from "../../entities/Todo";
import { CaseControl } from "../../entities/CaseControl";
import { TimeEntry } from "../../entities/TimeEntry";
import { ManualTimeEntry } from "../../entities/ManualTimeEntry";
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

      // Contar casos archivados
      const totalArchivedCases = await archivedCaseRepository.count();

      // Contar todos archivados
      const totalArchivedTodos = await archivedTodoRepository.count();

      // Para ahora, el tiempo total será 0 ya que no tenemos esta propiedad en ArchivedCase
      const totalArchivedTimeMinutes = 0;

      // Contar archivados este mes
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const archivedThisMonth = await archivedCaseRepository
        .createQueryBuilder("archived_case")
        .where("archived_case.archivedAt >= :startOfMonth", {
          startOfMonth: currentMonth,
        })
        .getCount();

      // Contar restaurados este mes (por implementar cuando tengamos la funcionalidad)
      const restoredThisMonth = 0;

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
          .leftJoinAndSelect("archived_case.archivedByUser", "archivedByUser");

        if (search) {
          queryBuilder.where(
            "archived_case.title ILIKE :search OR archived_case.caseNumber ILIKE :search",
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

      // TODO: Implementar lógica similar para todos si es necesario

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

      // Recolectar todas las entradas de tiempo automáticas
      const timerEntries = [];
      const manualEntries = [];

      for (const caseControl of caseControlRecords) {
        // Entradas de tiempo automáticas (cronómetro)
        const automaticEntries = await timeEntriesRepository.find({
          where: { caseControlId: caseControl.id },
          relations: ["user"],
        });

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
   * Archiva un todo
   */
  async archiveTodo(
    todoId: number,
    userId: number,
    reason?: string
  ): Promise<ArchivedTodoResponseDto> {
    try {
      // Mock response for now
      const mockArchivedTodo: ArchivedTodoResponseDto = {
        id: "mock-id",
        originalTodoId: todoId.toString(),
        title: "Todo archivado",
        description: "Descripción del todo archivado",
        priority: "ALTA",
        isCompleted: true,
        createdByUserId: userId.toString(),
        originalCreatedAt: new Date().toISOString(),
        originalUpdatedAt: new Date().toISOString(),
        archivedAt: new Date().toISOString(),
        archivedBy: userId.toString(),
        archiveReason: reason,
        isRestored: false,
        totalTimeMinutes: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return mockArchivedTodo;
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
    archivedId: number
  ): Promise<void> {
    try {
      // Mock implementation for now
      console.log(`Deleted archived ${type} with id: ${archivedId}`);
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
