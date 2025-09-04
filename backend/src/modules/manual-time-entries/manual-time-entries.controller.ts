import { Request, Response } from "express";
import { AppDataSource } from "../../config/database";
import { ManualTimeEntry } from "../../entities/ManualTimeEntry";
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

export class ManualTimeEntriesController {
  private manualTimeEntryRepository =
    AppDataSource.getRepository(ManualTimeEntry);
  private caseControlRepository = AppDataSource.getRepository(CaseControl);

  // Obtener todas las entradas de tiempo manual para un case control
  async getManualTimeEntriesByCaseControl(req: Request, res: Response) {
    try {
      const { caseControlId } = req.params;

      const manualTimeEntries = await this.manualTimeEntryRepository.find({
        where: { caseControlId },
        order: { date: "DESC", createdAt: "DESC" },
        relations: ["user"],
      });

      res.json(manualTimeEntries);
    } catch (error) {
      console.error("Error fetching manual time entries:", error);
      res.status(500).json({
        message: "Error al obtener las entradas de tiempo manual",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Crear una nueva entrada de tiempo manual
  async createManualTimeEntry(req: Request, res: Response) {
    try {
      const { caseControlId, description, durationMinutes, date } = req.body;
      const userId = req.user?.id;

      if (
        !caseControlId ||
        !description ||
        durationMinutes === undefined ||
        !date
      ) {
        return res.status(400).json({
          message:
            "Faltan campos requeridos: caseControlId, description, durationMinutes, date",
        });
      }

      // Verificar que el case control existe
      const caseControl = await this.caseControlRepository.findOne({
        where: { id: caseControlId },
      });

      if (!caseControl) {
        return res.status(404).json({ message: "Case control no encontrado" });
      }

      // Crear la entrada de tiempo manual
      const manualTimeEntry = this.manualTimeEntryRepository.create({
        caseControlId,
        userId,
        description,
        durationMinutes: parseInt(durationMinutes),
        date: date, // Ya es string
        createdBy: userId,
      });

      const savedEntry = await this.manualTimeEntryRepository.save(
        manualTimeEntry
      );

      // Actualizar el tiempo total del case control
      await this.caseControlRepository.update(
        { id: caseControlId },
        {
          totalTimeMinutes: () => `"totalTimeMinutes" + ${durationMinutes}`,
        }
      );

      // Obtener la entrada creada con relaciones
      const createdEntry = await this.manualTimeEntryRepository.findOne({
        where: { id: savedEntry.id },
        relations: ["user"],
      });

      res.status(201).json(createdEntry);
    } catch (error) {
      console.error("Error creating manual time entry:", error);
      res.status(500).json({
        message: "Error al crear la entrada de tiempo manual",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Obtener una entrada de tiempo manual específica
  async getManualTimeEntry(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const manualTimeEntry = await this.manualTimeEntryRepository.findOne({
        where: { id },
        relations: ["user", "caseControl"],
      });

      if (!manualTimeEntry) {
        return res
          .status(404)
          .json({ message: "Entrada de tiempo manual no encontrada" });
      }

      res.json(manualTimeEntry);
    } catch (error) {
      console.error("Error fetching manual time entry:", error);
      res.status(500).json({
        message: "Error al obtener la entrada de tiempo manual",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Actualizar una entrada de tiempo manual
  async updateManualTimeEntry(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { description, durationMinutes, date } = req.body;
      const userId = req.user?.id;

      const manualTimeEntry = await this.manualTimeEntryRepository.findOne({
        where: { id },
        relations: ["caseControl"],
      });

      if (!manualTimeEntry) {
        return res
          .status(404)
          .json({ message: "Entrada de tiempo manual no encontrada" });
      }

      // Verificar permisos
      if (manualTimeEntry.userId !== userId) {
        return res
          .status(403)
          .json({ message: "No tienes permisos para editar esta entrada" });
      }

      const oldDuration = manualTimeEntry.durationMinutes;
      const newDuration =
        durationMinutes !== undefined ? parseInt(durationMinutes) : oldDuration;

      // Actualizar campos
      if (description !== undefined) manualTimeEntry.description = description;
      if (durationMinutes !== undefined)
        manualTimeEntry.durationMinutes = newDuration;
      if (date !== undefined) manualTimeEntry.date = date; // date ya es string

      await this.manualTimeEntryRepository.save(manualTimeEntry);

      // Actualizar el tiempo total del case control si cambió la duración
      if (oldDuration !== newDuration) {
        const difference = newDuration - oldDuration;
        await this.caseControlRepository.update(
          { id: manualTimeEntry.caseControlId },
          {
            totalTimeMinutes: () => `"totalTimeMinutes" + ${difference}`,
          }
        );
      }

      // Obtener la entrada actualizada con relaciones
      const updatedEntry = await this.manualTimeEntryRepository.findOne({
        where: { id },
        relations: ["user"],
      });

      res.json(updatedEntry);
    } catch (error) {
      console.error("Error updating manual time entry:", error);
      res.status(500).json({
        message: "Error al actualizar la entrada de tiempo manual",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Eliminar una entrada de tiempo manual
  async deleteManualTimeEntry(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role || req.user?.roleName;

      const manualTimeEntry = await this.manualTimeEntryRepository.findOne({
        where: { id },
        relations: ["caseControl", "user"],
      });

      if (!manualTimeEntry) {
        return res
          .status(404)
          .json({ message: "Entrada de tiempo manual no encontrada" });
      }

      // Verificar permisos (el usuario que creó la entrada, admin o supervisor puede eliminarla)
      const isOwner = manualTimeEntry.userId === userId;
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

      console.log("Delete manual time entry permission check:", {
        entryId: id,
        entryUserId: manualTimeEntry.userId,
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
            entryCreatedBy:
              manualTimeEntry.user?.fullName || manualTimeEntry.userId,
            yourRole: userRole,
          },
        });
      }

      // Actualizar el tiempo total del case control
      await this.caseControlRepository.update(
        { id: manualTimeEntry.caseControlId },
        {
          totalTimeMinutes: () =>
            `"totalTimeMinutes" - ${manualTimeEntry.durationMinutes}`,
        }
      );

      await this.manualTimeEntryRepository.remove(manualTimeEntry);

      res.json({ message: "Entrada de tiempo manual eliminada exitosamente" });
    } catch (error) {
      console.error("Error deleting manual time entry:", error);
      res.status(500).json({
        message: "Error al eliminar la entrada de tiempo manual",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Obtener todas las entradas de tiempo manual de un usuario
  async getManualTimeEntriesByUser(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { startDate, endDate } = req.query;

      let whereCondition: any = { userId };

      if (startDate || endDate) {
        whereCondition.date = {};
        if (startDate) {
          whereCondition.date.gte = new Date(startDate as string);
        }
        if (endDate) {
          whereCondition.date.lte = new Date(endDate as string);
        }
      }

      const manualTimeEntries = await this.manualTimeEntryRepository.find({
        where: whereCondition,
        order: { date: "DESC", createdAt: "DESC" },
        relations: ["caseControl", "caseControl.case"],
      });

      res.json(manualTimeEntries);
    } catch (error) {
      console.error("Error fetching user manual time entries:", error);
      res.status(500).json({
        message: "Error al obtener las entradas de tiempo manual del usuario",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
}
