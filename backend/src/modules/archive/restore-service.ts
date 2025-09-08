import { AppDataSource } from "../../config/database";
import { ArchivedCase } from "../../entities/ArchivedCase";
import { ArchivedTodo } from "../../entities/archive/ArchivedTodo.entity";
import { Case, EstadoCase } from "../../entities/Case";
import { Todo } from "../../entities/Todo";
import { CaseControl } from "../../entities/CaseControl";
import { CaseStatusControl } from "../../entities/CaseStatusControl";
import { TodoControl } from "../../entities/TodoControl";
import { ManualTimeEntry } from "../../entities/ManualTimeEntry";
import { TimeEntry } from "../../entities/TimeEntry";
import { TodoManualTimeEntry } from "../../entities/TodoManualTimeEntry";
import { In } from "typeorm";
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
        where: { id: archivedCaseId },
      });

      if (!archivedCase) {
        throw new Error("Caso archivado no encontrado");
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
      // Obtener los metadatos originales
      const originalData = archivedCase.metadata;

      if (!originalData) {
        throw new Error("Los datos originales del caso no están disponibles");
      }

      const newCase = queryRunner.manager.create(Case, {
        id: archivedCase.originalCaseId, // ✅ USAR EL UUID ORIGINAL CORRECTO
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
        clasificacion:
          originalData.clasificacion || archivedCase.classification,
        estado: EstadoCase.RESTAURADO, // ✅ Estado RESTAURADO para casos restaurados
        prioridad: originalData.prioridad || archivedCase.priority,
        userId: archivedCase.createdBy,
        assignedUserId: archivedCase.assignedTo,
        assignedToId: archivedCase.assignedTo, // ✅ Restaurar el usuario asignado
        createdByUserId: archivedCase.createdBy,
        applicationId: originalData.applicationId,
        originId: originalData.originId,
      });

      const savedCase = await queryRunner.manager.save(Case, newCase);

      // 2. Recrear el control del caso desde los metadatos
      let savedCaseControl = null;
      const controlData = originalData?.caseControlRecords?.[0];

      if (controlData) {
        // Buscar el estado PENDIENTE para el Control de Casos restaurado
        const pendienteStatus = await queryRunner.manager.findOne(
          CaseStatusControl,
          {
            where: { name: "PENDIENTE" },
          }
        );

        console.log(
          `🔄 Restaurando CaseControl con estado: ${
            pendienteStatus ? "PENDIENTE" : "ORIGINAL"
          } (ID: ${pendienteStatus?.id || controlData.statusId})`
        );

        const newCaseControl = new CaseControl();
        newCaseControl.caseId = savedCase.id;
        newCaseControl.userId = archivedCase.createdBy;
        newCaseControl.statusId = pendienteStatus?.id || controlData.statusId; // PENDIENTE o fallback al original
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
        newCaseControl.isTimerActive = false; // Siempre restaurar con timer inactivo
        newCaseControl.timerStartAt = undefined;

        savedCaseControl = await queryRunner.manager.save(newCaseControl);

        // 3. Recrear entradas de tiempo manuales si existen
        if (
          controlData.manualTimeEntries &&
          Array.isArray(controlData.manualTimeEntries)
        ) {
          for (const timeEntry of controlData.manualTimeEntries) {
            const newTimeEntry = queryRunner.manager.create(ManualTimeEntry, {
              caseControlId: savedCaseControl.id,
              userId: restoredBy,
              date: timeEntry.date || new Date().toISOString().split("T")[0],
              durationMinutes:
                timeEntry.minutes || timeEntry.durationMinutes || 0,
              description: timeEntry.description || "Entrada restaurada",
              createdBy: timeEntry.createdBy || restoredBy,
            });

            await queryRunner.manager.save(newTimeEntry);
          }
        }

        // 4. Recrear entradas de tiempo automáticas si existen
        if (controlData.timeEntries && Array.isArray(controlData.timeEntries)) {
          for (const timeEntry of controlData.timeEntries) {
            const newTimeEntry = new TimeEntry();
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

      // 5. Restaurar entradas de tiempo desde los campos JSONB directos de ArchivedCase
      if (savedCaseControl) {
        // Restaurar entradas de tiempo manuales desde el campo JSONB
        if (
          archivedCase.manualTimeEntries &&
          Array.isArray(archivedCase.manualTimeEntries)
        ) {
          for (const timeEntry of archivedCase.manualTimeEntries) {
            const newTimeEntry = queryRunner.manager.create(ManualTimeEntry, {
              id: timeEntry.id, // Usar UUID original
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

        // Restaurar entradas de tiempo automáticas desde el campo JSONB
        if (
          archivedCase.timerEntries &&
          Array.isArray(archivedCase.timerEntries)
        ) {
          for (const timeEntry of archivedCase.timerEntries) {
            const newTimeEntry = new TimeEntry();
            newTimeEntry.id = timeEntry.id; // Usar UUID original
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
        }
      }

      // 7. Marcar el caso como restaurado en lugar de eliminarlo (para seguridad)
      archivedCase.isRestored = true;
      await queryRunner.manager.save(ArchivedCase, archivedCase);

      // Confirmar transacción
      await queryRunner.commitTransaction();

      // 7. Verificar que la restauración fue exitosa antes de eliminar del archivo
      try {
        await this.verifyRestoration(savedCase.id, archivedCase);

        // Si la verificación es exitosa, eliminar el registro archivado
        await AppDataSource.getRepository(ArchivedCase).remove(archivedCase);

        console.log(
          `✅ Caso ${archivedCase.caseNumber} verificado y eliminado del archivo exitosamente`
        );
      } catch (verificationError: any) {
        console.error(
          `⚠️ Error en verificación post-restauración: ${verificationError.message}`
        );
        console.log(
          `El caso ${archivedCase.caseNumber} se restauró pero se mantiene en archivo para revisión`
        );
      }

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
        where: { id: archivedTodoId },
      });

      if (!archivedTodo) {
        throw new Error("Todo archivado no encontrado");
      }

      // 1. Recrear el todo principal desde los datos originales
      const originalData = archivedTodo.originalData;

      if (!originalData) {
        throw new Error("Los datos originales del todo no están disponibles");
      }

      const newTodo = new Todo();
      newTodo.id = archivedTodo.originalTodoId; // Usar el ID original para mantener relaciones
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
      // Restaurar como incompleto para poder volver a trabajarlo
      newTodo.isCompleted = false;
      newTodo.completedAt = undefined;

      const savedTodo = await queryRunner.manager.save(Todo, newTodo);

      // 2. Recrear el control del todo si existe
      let savedTodoControl = null;
      const controlData = archivedTodo.controlData;

      if (controlData) {
        // Buscar un status por defecto para el control
        const defaultStatus = await queryRunner.manager.findOne(
          CaseStatusControl,
          {
            where: { isActive: true },
            order: { displayOrder: "ASC" },
          }
        );

        if (!defaultStatus) {
          throw new Error(
            "No se encontró ningún status activo para asignar al control del TODO"
          );
        }

        const newTodoControl = new TodoControl();
        newTodoControl.todoId = savedTodo.id;
        newTodoControl.userId = archivedTodo.createdByUserId;
        newTodoControl.statusId = defaultStatus.id; // Usar siempre el status por defecto (pendiente)
        newTodoControl.totalTimeMinutes = controlData.totalTimeMinutes || 0;
        newTodoControl.assignedAt = controlData.assignedAt
          ? new Date(controlData.assignedAt)
          : new Date();
        newTodoControl.startedAt = undefined; // Resetear como no iniciado
        newTodoControl.completedAt = undefined; // Resetear como no completado
        newTodoControl.isTimerActive = false; // Siempre restaurar con timer inactivo
        newTodoControl.timerStartAt = undefined;

        savedTodoControl = await queryRunner.manager.save(newTodoControl);

        // 3. Restaurar entradas de tiempo desde controlData si existen
        if (
          controlData.timerEntries &&
          Array.isArray(controlData.timerEntries)
        ) {
          for (const timerEntry of controlData.timerEntries) {
            const newTimeEntry = new TodoTimeEntry();
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

            await queryRunner.manager.save(TodoTimeEntry, newTimeEntry);
          }
        }

        // 4. Restaurar entradas de tiempo manuales desde controlData si existen
        if (
          controlData.manualEntries &&
          Array.isArray(controlData.manualEntries)
        ) {
          for (const manualEntry of controlData.manualEntries) {
            const newManualEntry = new TodoManualTimeEntry();
            newManualEntry.todoControlId = savedTodoControl.id;
            newManualEntry.userId = manualEntry.userId || restoredBy;
            newManualEntry.date = manualEntry.date
              ? new Date(manualEntry.date)
              : new Date();
            newManualEntry.durationMinutes = manualEntry.durationMinutes || 0;
            newManualEntry.description =
              manualEntry.description || "Entrada manual restaurada";

            await queryRunner.manager.save(TodoManualTimeEntry, newManualEntry);
          }
        }
      }

      // 5. Marcar el TODO archivado como restaurado
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

  /**
   * Verifica que todos los datos fueron restaurados correctamente
   */
  private async verifyRestoration(
    caseId: string,
    archivedCase: ArchivedCase
  ): Promise<void> {
    try {
      // Verificar que el caso existe
      const restoredCase = await AppDataSource.getRepository(Case).findOne({
        where: { id: caseId },
      });

      if (!restoredCase) {
        throw new Error(
          "El caso restaurado no se encuentra en la base de datos"
        );
      }

      // Verificar que existe al menos un CaseControl
      const caseControls = await AppDataSource.getRepository(CaseControl).find({
        where: { caseId: caseId },
      });

      if (caseControls.length === 0) {
        throw new Error("No se encontraron registros CaseControl restaurados");
      }

      // Verificar entradas de tiempo si existían en el archivo
      if (archivedCase.timerEntries && archivedCase.timerEntries.length > 0) {
        const caseControlIds = caseControls.map((cc) => cc.id);
        const restoredTimerEntries = await AppDataSource.getRepository(
          TimeEntry
        ).find({
          where: { caseControlId: In(caseControlIds) },
        });

        if (restoredTimerEntries.length !== archivedCase.timerEntries.length) {
          throw new Error(
            `Falta restaurar entradas de tiempo: esperadas ${archivedCase.timerEntries.length}, encontradas ${restoredTimerEntries.length}`
          );
        }
      }

      // Verificar entradas de tiempo manuales si existían en el archivo
      if (
        archivedCase.manualTimeEntries &&
        archivedCase.manualTimeEntries.length > 0
      ) {
        const caseControlIds = caseControls.map((cc) => cc.id);
        const restoredManualEntries = await AppDataSource.getRepository(
          ManualTimeEntry
        ).find({
          where: { caseControlId: In(caseControlIds) },
        });

        if (
          restoredManualEntries.length !== archivedCase.manualTimeEntries.length
        ) {
          throw new Error(
            `Falta restaurar entradas de tiempo manuales: esperadas ${archivedCase.manualTimeEntries.length}, encontradas ${restoredManualEntries.length}`
          );
        }
      }

      console.log(
        `✅ Verificación completa: Caso ${archivedCase.caseNumber} restaurado correctamente`
      );
      console.log(`   - Caso principal: ✅`);
      console.log(`   - CaseControls: ${caseControls.length} ✅`);
      console.log(
        `   - Timer entries: ${archivedCase.timerEntries?.length || 0} ✅`
      );
      console.log(
        `   - Manual entries: ${archivedCase.manualTimeEntries?.length || 0} ✅`
      );
    } catch (error: any) {
      console.error(
        `❌ Error en verificación de restauración: ${error.message}`
      );
      throw error;
    }
  }
}
