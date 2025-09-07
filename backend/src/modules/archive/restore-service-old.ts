import { AppDataSource } from "../../config/database";
import { ArchivedCase } from "../../entities/ArchivedCase";
import { ArchivedTodo } from "../../entities/ArchivedTodo";
import { Case } from "../../entities/Case";
import { Todo } from "../../entities/Todo";
import { CaseControl } from "../../entities/CaseControl";
import { TodoControl } from "../../entities/TodoControl";
import { ManualTimeEntry } from "../../entities/ManualTimeEntry";
import { TimeEntry } from "../../entities/TimeEntry";
import { TodoManualTimeEntry } from "../../entities/TodoManualTimeEntry";
import { TodoTimeEntry } from "../../entities/TodoTimeEntry";

export class RestoreService {
  /**
   * Restaura un caso archivado recreando todas las entidades originales
   */
  async restoreCase(
    archivedCaseId: string,
    restoredBy: string
  ): Promise<{ success: boolean; caseId?: string; message: string }> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Buscar el caso archivado
      const archivedCase = await queryRunner.manager.findOne(ArchivedCase, {
        where: { id: archivedCaseId, isRestored: false },
      });

      if (!archivedCase) {
        throw new Error("Caso archivado no encontrado o ya restaurado");
      }

      // Verificar si ya existe un caso activo con el mismo número
      const existingCase = await queryRunner.manager.findOne(Case, {
        where: { numeroCaso: archivedCase.caseNumber },
      });

      if (existingCase) {
        throw new Error(
          `Ya existe un caso activo con el número ${archivedCase.caseNumber}`
        );
      }

      // 1. Recrear el caso principal desde originalData
      const originalData = archivedCase.originalData;

      if (!originalData) {
        throw new Error("Los datos originales del caso no están disponibles");
      }

      const newCase = queryRunner.manager.create(Case, {
        numeroCaso: archivedCase.caseNumber,
        descripcion: originalData.descripcion || archivedCase.description,
        fecha: originalData.fecha ? new Date(originalData.fecha) : new Date(),
        historialCaso: originalData.historialCaso || 1,
        conocimientoModulo: originalData.conocimientoModulo || 1,
        complejidadTecnica: originalData.complejidadTecnica || 1,
        tiempoEstimado: originalData.tiempoEstimado || 60,
        clasificacion:
          originalData.clasificacion || archivedCase.classification,
        estado: originalData.estado || "NUEVO",
        prioridad: originalData.prioridad || archivedCase.priority,
        userId: archivedCase.userId,
        assignedUserId: archivedCase.assignedUserId,
        createdByUserId: archivedCase.createdByUserId,
        applicationId: originalData.applicationId,
        originId: originalData.originId,
      });

      const savedCase = await queryRunner.manager.save(Case, newCase);

      // 2. Recrear el control del caso desde controlData
      let savedCaseControl = null;
      const controlData = archivedCase.controlData;

      if (controlData) {
        const newCaseControl = new CaseControl();
        newCaseControl.caseId = savedCase.id;
        newCaseControl.userId = archivedCase.userId;
        newCaseControl.statusId = controlData.statusId;
        newCaseControl.totalTimeMinutes = archivedCase.totalTimeMinutes || 0;
        newCaseControl.assignedAt = controlData.assignedAt
          ? new Date(controlData.assignedAt)
          : new Date();
        newCaseControl.startedAt = controlData.startedAt
          ? new Date(controlData.startedAt)
          : undefined;
        newCaseControl.completedAt = archivedCase.completedAt
          ? new Date(archivedCase.completedAt)
          : undefined;
        newCaseControl.isTimerActive = false; // Siempre restaurar con timer inactivo
        newCaseControl.timerStartAt = undefined;

        savedCaseControl = await queryRunner.manager.save(newCaseControl);

        // 3. Recrear entradas de tiempo manuales si existen
        if (
          controlData.manualTimeEntries &&
          Array.isArray(controlData.manualTimeEntries)
        ) {
          for (const timeEntry of controlData.manualTimeEntries) {
            const newTimeEntry = new ManualTimeEntry();
            newTimeEntry.caseControlId = savedCaseControl.id;
            newTimeEntry.userId = restoredBy;
            newTimeEntry.date =
              timeEntry.date || new Date().toISOString().split("T")[0];
            newTimeEntry.durationMinutes =
              timeEntry.minutes || timeEntry.durationMinutes || 0;
            newTimeEntry.description =
              timeEntry.description || "Entrada restaurada";
            newTimeEntry.createdBy = timeEntry.createdBy || restoredBy;

            await queryRunner.manager.save(newTimeEntry);
          }
        }

        // 4. Recrear entradas de tiempo automáticas si existen
        if (controlData.timeEntries && Array.isArray(controlData.timeEntries)) {
          for (const timeEntry of controlData.timeEntries) {
            const newTimeEntry = new TimeEntry();
            newTimeEntry.caseControlId = savedCaseControl.id;
            newTimeEntry.userId = archivedCase.userId;
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

      // 5. Marcar el caso archivado como restaurado
      archivedCase.isRestored = true;
      archivedCase.restoredAt = new Date();
      archivedCase.restoredBy = restoredBy;

      await queryRunner.manager.save(ArchivedCase, archivedCase);

      // Confirmar transacción
      await queryRunner.commitTransaction();

      return {
        success: true,
        caseId: savedCase.id,
        message: `Caso ${archivedCase.caseNumber} restaurado exitosamente con todas sus entidades`,
      };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      console.error("Error restaurando caso:", error);
      throw new Error(`Error restaurando caso: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Restaura un todo archivado recreando todas las entidades originales
   */
  async restoreTodo(
    archivedTodoId: string,
    restoredBy: string
  ): Promise<{ success: boolean; todoId?: string; message: string }> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Buscar el todo archivado
      const archivedTodo = await queryRunner.manager.findOne(ArchivedTodo, {
        where: { id: archivedTodoId, isRestored: false },
      });

      if (!archivedTodo) {
        throw new Error("Todo archivado no encontrado o ya restaurado");
      }

      // 1. Recrear el todo principal desde originalData
      const originalData = archivedTodo.originalData;

      if (!originalData) {
        throw new Error("Los datos originales del todo no están disponibles");
      }

      const newTodo = queryRunner.manager.create(Todo, {
        titulo: originalData.titulo || archivedTodo.title,
        descripcion: originalData.descripcion || archivedTodo.description,
        fechaCreacion: originalData.fechaCreacion
          ? new Date(originalData.fechaCreacion)
          : archivedTodo.originalCreatedAt,
        fechaLimite:
          originalData.fechaLimite || archivedTodo.dueDate
            ? new Date(originalData.fechaLimite || archivedTodo.dueDate)
            : undefined,
        prioridad: originalData.prioridad || archivedTodo.priority,
        estado: originalData.estado || "NUEVO",
        completed: originalData.completed || archivedTodo.isCompleted,
        tags: originalData.tags || [],
        userId: archivedTodo.createdByUserId, // Usuario original que creó el todo
        assignedUserId: archivedTodo.assignedUserId,
        createdByUserId: archivedTodo.createdByUserId,
        caseId: archivedTodo.caseId, // Si está asociado a un caso
      });

      const savedTodo = await queryRunner.manager.save(Todo, newTodo);

      // 2. Recrear el control del todo si existe
      let savedTodoControl = null;
      const controlData = archivedTodo.controlData;

      if (controlData) {
        const newTodoControl = new TodoControl();
        newTodoControl.todoId = savedTodo.id;
        newTodoControl.userId = archivedTodo.createdByUserId;
        newTodoControl.totalTimeMinutes = archivedTodo.totalTimeMinutes || 0;
        newTodoControl.assignedAt = controlData.assignedAt
          ? new Date(controlData.assignedAt)
          : new Date();
        newTodoControl.startedAt = controlData.startedAt
          ? new Date(controlData.startedAt)
          : undefined;
        newTodoControl.completedAt = archivedTodo.completedAt
          ? new Date(archivedTodo.completedAt)
          : undefined;
        newTodoControl.isTimerActive = false; // Siempre restaurar con timer inactivo
        newTodoControl.timerStartAt = undefined;

        savedTodoControl = await queryRunner.manager.save(newTodoControl);

        // 3. Recrear entradas de tiempo manuales si existen
        if (
          controlData.manualTimeEntries &&
          Array.isArray(controlData.manualTimeEntries)
        ) {
          for (const timeEntry of controlData.manualTimeEntries) {
            const newTimeEntry = new TodoManualTimeEntry();
            newTimeEntry.todoControlId = savedTodoControl.id;
            newTimeEntry.userId = restoredBy;
            newTimeEntry.date = timeEntry.date
              ? new Date(timeEntry.date)
              : new Date();
            newTimeEntry.durationMinutes =
              timeEntry.minutes || timeEntry.durationMinutes || 0;
            newTimeEntry.description =
              timeEntry.description || "Entrada restaurada";

            await queryRunner.manager.save(newTimeEntry);
          }
        }

        // 4. Recrear entradas de tiempo automáticas si existen
        if (controlData.timeEntries && Array.isArray(controlData.timeEntries)) {
          for (const timeEntry of controlData.timeEntries) {
            const newTimeEntry = new TodoTimeEntry();
            newTimeEntry.todoControlId = savedTodoControl.id;
            newTimeEntry.startTime = new Date(timeEntry.startTime);
            newTimeEntry.endTime = timeEntry.endTime
              ? new Date(timeEntry.endTime)
              : undefined;
            newTimeEntry.durationMinutes =
              timeEntry.totalMinutes || timeEntry.durationMinutes || 0;

            await queryRunner.manager.save(newTimeEntry);
          }
        }
      }

      // 5. Marcar el todo archivado como restaurado
      archivedTodo.isRestored = true;
      archivedTodo.restoredAt = new Date();
      archivedTodo.restoredBy = restoredBy;

      await queryRunner.manager.save(ArchivedTodo, archivedTodo);

      // Confirmar transacción
      await queryRunner.commitTransaction();

      return {
        success: true,
        todoId: savedTodo.id,
        message: `Todo "${archivedTodo.title}" restaurado exitosamente con todas sus entidades`,
      };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      console.error("Error restaurando todo:", error);
      throw new Error(`Error restaurando todo: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }
}
