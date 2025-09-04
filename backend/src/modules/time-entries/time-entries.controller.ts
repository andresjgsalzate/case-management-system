import { Request, Response } from "express";
import { AppDataSource } from "../../config/database";
import { TimeEntry } from "../../entities/TimeEntry";
import { CaseControl } from "../../entities/CaseControl";

// Extender Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        fullName?: string;
        role?: string;
        roleName?: string;
      };
    }
  }
}

export class TimeEntriesController {
  private timeEntryRepository = AppDataSource.getRepository(TimeEntry);
  private caseControlRepository = AppDataSource.getRepository(CaseControl);

  // Obtener todas las entradas de tiempo para un case control
  async getTimeEntriesByCaseControl(req: Request, res: Response) {
    try {
      const { caseControlId } = req.params;

      const timeEntries = await this.timeEntryRepository.find({
        where: { caseControlId },
        order: { startTime: "DESC" },
        relations: ["user"],
      });

      res.json(timeEntries);
    } catch (error) {
      console.error("Error fetching time entries:", error);
      res.status(500).json({
        message: "Error al obtener las entradas de tiempo",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Obtener una entrada de tiempo específica
  async getTimeEntry(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const timeEntry = await this.timeEntryRepository.findOne({
        where: { id },
        relations: ["user", "caseControl"],
      });

      if (!timeEntry) {
        return res
          .status(404)
          .json({ message: "Entrada de tiempo no encontrada" });
      }

      res.json(timeEntry);
    } catch (error) {
      console.error("Error fetching time entry:", error);
      res.status(500).json({
        message: "Error al obtener la entrada de tiempo",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Eliminar una entrada de tiempo
  async deleteTimeEntry(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role || req.user?.roleName;

      const timeEntry = await this.timeEntryRepository.findOne({
        where: { id },
        relations: ["caseControl", "user"],
      });

      if (!timeEntry) {
        return res
          .status(404)
          .json({ message: "Entrada de tiempo no encontrada" });
      }

      // Verificar permisos (el usuario que creó la entrada, admin o supervisor puede eliminarla)
      const isOwner = timeEntry.userId === userId;
      const isAdmin =
        userRole &&
        [
          "admin",
          "administrator",
          "supervisor",
          "Admin",
          "Administrator",
          "Supervisor",
        ].includes(userRole);

      console.log("Delete permission check:", {
        entryId: id,
        entryUserId: timeEntry.userId,
        currentUserId: userId,
        currentUserRole: userRole,
        isOwner,
        isAdmin,
        canDelete: isOwner || isAdmin,
      });

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          message: "No tienes permisos para eliminar esta entrada",
          details: {
            entryCreatedBy: timeEntry.user?.fullName || timeEntry.userId,
            yourRole: userRole,
          },
        });
      }

      // Actualizar el tiempo total del case control
      if (timeEntry.endTime) {
        const durationMinutes = Math.floor(
          (new Date(timeEntry.endTime).getTime() -
            new Date(timeEntry.startTime).getTime()) /
            (1000 * 60)
        );

        await this.caseControlRepository.update(
          { id: timeEntry.caseControlId },
          {
            totalTimeMinutes: () => `"totalTimeMinutes" - ${durationMinutes}`,
          }
        );
      }

      await this.timeEntryRepository.remove(timeEntry);

      res.json({ message: "Entrada de tiempo eliminada exitosamente" });
    } catch (error) {
      console.error("Error deleting time entry:", error);
      res.status(500).json({
        message: "Error al eliminar la entrada de tiempo",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Obtener todas las entradas de tiempo de un usuario
  async getTimeEntriesByUser(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { startDate, endDate } = req.query;

      let whereCondition: any = { userId };

      if (startDate || endDate) {
        whereCondition.startTime = {};
        if (startDate) {
          whereCondition.startTime.gte = new Date(startDate as string);
        }
        if (endDate) {
          whereCondition.startTime.lte = new Date(endDate as string);
        }
      }

      const timeEntries = await this.timeEntryRepository.find({
        where: whereCondition,
        order: { startTime: "DESC" },
        relations: ["caseControl", "caseControl.case"],
      });

      res.json(timeEntries);
    } catch (error) {
      console.error("Error fetching user time entries:", error);
      res.status(500).json({
        message: "Error al obtener las entradas de tiempo del usuario",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
}
