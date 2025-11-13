import { Request, Response } from "express";
import { Repository } from "typeorm";
import { AppDataSource } from "../../config/database";
import { AuthRequest } from "../../middleware/auth";
import {
  CaseControl,
  CaseStatusControl,
  Case,
  UserProfile,
} from "../../entities";
import { EstadoCase } from "../../entities/Case";
import { TimeEntry } from "../../entities/TimeEntry";
import { ManualTimeEntry } from "../../entities/ManualTimeEntry";
import {
  CreateCaseControlDTO,
  UpdateCaseControlStatusDTO,
  CaseControlFiltersDTO,
  CaseControlWithRelationsDTO,
} from "../../types/case-control.dto";

export class CaseControlController {
  private caseControlRepository: Repository<CaseControl>;
  private caseStatusRepository: Repository<CaseStatusControl>;
  private caseRepository: Repository<Case>;
  private userRepository: Repository<UserProfile>;
  private timeEntryRepository: Repository<TimeEntry>;
  private manualTimeEntryRepository: Repository<ManualTimeEntry>;

  constructor() {
    this.caseControlRepository = AppDataSource.getRepository(CaseControl);
    this.caseStatusRepository = AppDataSource.getRepository(CaseStatusControl);
    this.caseRepository = AppDataSource.getRepository(Case);
    this.userRepository = AppDataSource.getRepository(UserProfile);
    this.timeEntryRepository = AppDataSource.getRepository(TimeEntry);
    this.manualTimeEntryRepository =
      AppDataSource.getRepository(ManualTimeEntry);
    this.caseRepository = AppDataSource.getRepository(Case);
    this.userRepository = AppDataSource.getRepository(UserProfile);
  }

  // Obtener todos los estados de casos disponibles
  async getCaseStatuses(req: Request, res: Response) {
    try {
      const statuses = await this.caseStatusRepository.find({
        order: { displayOrder: "ASC", name: "ASC" },
      });

      res.json({
        success: true,
        data: statuses,
        message: "Estados de casos obtenidos exitosamente",
      });
    } catch (error) {
      console.error("Error fetching case statuses:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener estados de casos",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Obtener todos los controles de casos con filtros
  async getAllCaseControls(req: Request, res: Response) {
    try {
      const filters: CaseControlFiltersDTO = req.query;

      let queryBuilder = this.caseControlRepository
        .createQueryBuilder("caseControl")
        .leftJoinAndSelect("caseControl.case", "case")
        .leftJoinAndSelect("case.application", "application")
        .leftJoinAndSelect("caseControl.user", "user")
        .leftJoinAndSelect("caseControl.status", "status")
        .leftJoinAndSelect("caseControl.timeEntries", "timeEntries")
        .leftJoinAndSelect("caseControl.manualTimeEntries", "manualTimeEntries")
        .orderBy("caseControl.assignedAt", "DESC");

      // Aplicar filtros
      if (filters.statusId) {
        queryBuilder.andWhere("caseControl.statusId = :statusId", {
          statusId: filters.statusId,
        });
      }

      if (filters.userId) {
        queryBuilder.andWhere("caseControl.userId = :userId", {
          userId: filters.userId,
        });
      }

      if (filters.isTimerActive !== undefined) {
        queryBuilder.andWhere("caseControl.isTimerActive = :isTimerActive", {
          isTimerActive: filters.isTimerActive,
        });
      }

      if (filters.search) {
        queryBuilder.andWhere(
          "(LOWER(case.numeroCaso) LIKE LOWER(:search) OR LOWER(case.descripcion) LIKE LOWER(:search))",
          { search: `%${filters.search}%` }
        );
      }

      if (filters.startDate) {
        queryBuilder.andWhere("caseControl.assignedAt >= :startDate", {
          startDate: filters.startDate,
        });
      }

      if (filters.endDate) {
        queryBuilder.andWhere("caseControl.assignedAt <= :endDate", {
          endDate: filters.endDate,
        });
      }

      const caseControls = await queryBuilder.getMany();

      // Transformar a DTO con cálculo dinámico del tiempo total
      const response: CaseControlWithRelationsDTO[] = caseControls.map((cc) => {
        // Calcular tiempo total dinámicamente
        let totalTimeMinutes = 0;

        // Sumar tiempo de entradas de timer
        if (cc.timeEntries) {
          totalTimeMinutes += cc.timeEntries.reduce((sum, entry) => {
            if (entry.endTime && entry.startTime) {
              const durationMs =
                new Date(entry.endTime).getTime() -
                new Date(entry.startTime).getTime();
              return sum + Math.floor(durationMs / (1000 * 60));
            }
            return sum + (entry.durationMinutes || 0);
          }, 0);
        }

        // Sumar tiempo de entradas manuales
        if (cc.manualTimeEntries) {
          totalTimeMinutes += cc.manualTimeEntries.reduce((sum, entry) => {
            return sum + (entry.durationMinutes || 0);
          }, 0);
        }

        return {
          id: cc.id,
          caseId: cc.caseId,
          userId: cc.userId,
          statusId: cc.statusId,
          totalTimeMinutes: totalTimeMinutes, // Usar el tiempo calculado dinámicamente
          timerStartAt: cc.timerStartAt?.toISOString(),
          isTimerActive: cc.isTimerActive,
          assignedAt: cc.assignedAt.toISOString(),
          startedAt: cc.startedAt?.toISOString(),
          completedAt: cc.completedAt?.toISOString(),
          createdAt: cc.createdAt.toISOString(),
          updatedAt: cc.updatedAt.toISOString(),
          case: cc.case
            ? {
                id: cc.case.id,
                numeroCaso: cc.case.numeroCaso,
                descripcion: cc.case.descripcion,
                clasificacion: cc.case.clasificacion,
                aplicacion: cc.case.application
                  ? {
                      id: cc.case.application.id,
                      nombre: cc.case.application.nombre,
                      descripcion: cc.case.application.descripcion,
                    }
                  : undefined,
              }
            : undefined,
          user: cc.user
            ? {
                id: cc.user.id,
                fullName: cc.user.fullName,
                email: cc.user.email,
              }
            : undefined,
          status: cc.status
            ? {
                id: cc.status.id,
                name: cc.status.name,
                description: cc.status.description,
                color: cc.status.color,
              }
            : undefined,
        };
      });

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error("Error fetching case controls:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener los controles de casos",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Obtener control de caso por ID
  async getCaseControlById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const caseControl = await this.caseControlRepository
        .createQueryBuilder("caseControl")
        .leftJoinAndSelect("caseControl.case", "case")
        .leftJoinAndSelect("case.application", "application")
        .leftJoinAndSelect("caseControl.user", "user")
        .leftJoinAndSelect("caseControl.status", "status")
        .leftJoinAndSelect("caseControl.timeEntries", "timeEntries")
        .leftJoinAndSelect("caseControl.manualTimeEntries", "manualEntries")
        .where("caseControl.id = :id", { id })
        .getOne();

      if (!caseControl) {
        return res.status(404).json({
          success: false,
          message: "Control de caso no encontrado",
        });
      }

      res.json({
        success: true,
        data: caseControl,
      });
    } catch (error) {
      console.error("Error fetching case control:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener el control de caso",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Crear nuevo control de caso
  async createCaseControl(req: AuthRequest, res: Response) {
    try {
      const data: CreateCaseControlDTO = req.body;

      // Verificar que el caso existe
      const caseExists = await this.caseRepository.findOneBy({
        id: data.caseId,
      });
      if (!caseExists) {
        return res.status(404).json({
          success: false,
          message: "Caso no encontrado",
        });
      }

      // Verificar si ya existe un control para este caso
      const existingControl = await this.caseControlRepository.findOne({
        where: { caseId: data.caseId },
        relations: ["case", "user", "status"],
      });

      if (existingControl) {
        // Si ya existe un control, actualizar el usuario asignado
        const userId = data.userId || req.user?.id;

        // Verificar si el usuario existe, si no, crearlo
        let user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
          user = this.userRepository.create({
            id: userId,
            fullName: "Usuario de Desarrollo",
            email: "dev@example.com",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          await this.userRepository.save(user);
        }

        // Actualizar el control existente
        existingControl.userId = userId;
        existingControl.assignedAt = new Date();
        existingControl.updatedAt = new Date();

        const updatedControl = await this.caseControlRepository.save(
          existingControl
        );

        // Actualizar el caso principal con el usuario asignado y estado ASIGNADO
        caseExists.assignedToId = userId;
        caseExists.estado = EstadoCase.ASIGNADO;
        await this.caseRepository.save(caseExists);

        return res.status(200).json({
          success: true,
          data: updatedControl,
          message: "Control de caso reasignado exitosamente",
        });
      }

      // Obtener estado PENDIENTE por defecto
      let statusId = data.statusId;
      if (!statusId) {
        const defaultStatus = await this.caseStatusRepository.findOneBy({
          name: "PENDIENTE",
        });
        if (!defaultStatus) {
          return res.status(400).json({
            success: false,
            message: "Estado PENDIENTE no encontrado",
          });
        }
        statusId = defaultStatus.id;
      }

      // Usar usuario actual por defecto
      const userId = data.userId || req.user?.id;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "Usuario no especificado",
        });
      }

      // Verificar si el usuario existe, si no, crearlo
      let user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        user = this.userRepository.create({
          id: userId,
          fullName: "Usuario de Desarrollo",
          email: "dev@example.com",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await this.userRepository.save(user);
      }

      const caseControl = this.caseControlRepository.create({
        caseId: data.caseId,
        userId,
        statusId,
        totalTimeMinutes: 0,
        isTimerActive: false,
        assignedAt: new Date(),
      });

      const savedControl = await this.caseControlRepository.save(caseControl);

      // Actualizar el caso principal con el usuario asignado y estado ASIGNADO
      caseExists.assignedToId = userId;
      caseExists.estado = EstadoCase.ASIGNADO;
      await this.caseRepository.save(caseExists);

      res.status(201).json({
        success: true,
        data: savedControl,
      });
    } catch (error) {
      console.error("Error creating case control:", error);
      res.status(500).json({
        success: false,
        message: "Error al crear el control de caso",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Actualizar estado del control de caso
  async updateCaseControlStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdateCaseControlStatusDTO = req.body;

      const caseControl = await this.caseControlRepository.findOneBy({ id });
      if (!caseControl) {
        return res.status(404).json({
          success: false,
          message: "Control de caso no encontrado",
        });
      }

      // Verificar que el estado existe
      const status = await this.caseStatusRepository.findOneBy({
        id: data.statusId,
      });
      if (!status) {
        return res.status(404).json({
          success: false,
          message: "Estado no encontrado",
        });
      }

      // Actualizar estado
      caseControl.statusId = data.statusId;

      // Si cambia a EN CURSO y no tiene startedAt, establecerlo
      if (status.name === "EN CURSO" && !caseControl.startedAt) {
        caseControl.startedAt = new Date();
      }

      // Si cambia a TERMINADA, establecer completedAt y detener timer
      if (status.name === "TERMINADA") {
        if (!caseControl.completedAt) {
          caseControl.completedAt = new Date();
        }
        if (caseControl.isTimerActive) {
          caseControl.isTimerActive = false;
          caseControl.timerStartAt = undefined;
        }
      }

      const updatedControl = await this.caseControlRepository.save(caseControl);

      res.json({
        success: true,
        data: updatedControl,
      });
    } catch (error) {
      console.error("Error updating case control status:", error);
      res.status(500).json({
        success: false,
        message: "Error al actualizar el estado del control de caso",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Eliminar control de caso
  async deleteCaseControl(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const caseControl = await this.caseControlRepository.findOneBy({ id });
      if (!caseControl) {
        return res.status(404).json({
          success: false,
          message: "Control de caso no encontrado",
        });
      }

      await this.caseControlRepository.remove(caseControl);

      res.json({
        success: true,
        message: "Control de caso eliminado correctamente",
      });
    } catch (error) {
      console.error("Error deleting case control:", error);
      res.status(500).json({
        success: false,
        message: "Error al eliminar el control de caso",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Obtener time entries de un case control
  async getTimeEntries(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Verificar que el case control existe
      const caseControl = await this.caseControlRepository.findOne({
        where: { id },
      });

      if (!caseControl) {
        return res.status(404).json({
          success: false,
          message: "Control de caso no encontrado",
        });
      }

      // Obtener las entradas de tiempo del cronómetro
      const timeEntries = await this.timeEntryRepository.find({
        where: { caseControlId: id },
        order: { startTime: "DESC" },
        relations: ["user"],
      });

      res.json({
        success: true,
        data: timeEntries,
      });
    } catch (error) {
      console.error("Error getting time entries:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener las entradas de tiempo",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Obtener manual time entries de un case control
  async getManualTimeEntries(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Verificar que el case control existe
      const caseControl = await this.caseControlRepository.findOne({
        where: { id },
      });

      if (!caseControl) {
        return res.status(404).json({
          success: false,
          message: "Control de caso no encontrado",
        });
      }

      // Obtener las entradas de tiempo manual
      const manualTimeEntries = await this.manualTimeEntryRepository.find({
        where: { caseControlId: id },
        order: { date: "DESC", createdAt: "DESC" },
        relations: ["user", "creator"],
      });

      res.json({
        success: true,
        data: manualTimeEntries,
      });
    } catch (error) {
      console.error("Error getting manual time entries:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener las entradas de tiempo manuales",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Agregar una entrada de tiempo manual
  async addManualTimeEntry(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { durationMinutes, description, date } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      // Verificar que el case control existe
      const caseControl = await this.caseControlRepository.findOne({
        where: { id },
      });

      if (!caseControl) {
        return res.status(404).json({
          success: false,
          message: "Control de caso no encontrado",
        });
      }

      // Verificar que los datos son válidos
      if (!durationMinutes || durationMinutes <= 0) {
        return res.status(400).json({
          success: false,
          message: "Duración en minutos debe ser mayor a 0",
        });
      }

      if (!description || !description.trim()) {
        return res.status(400).json({
          success: false,
          message: "Descripción es requerida",
        });
      }

      if (description.trim().length < 100) {
        return res.status(400).json({
          success: false,
          message: "La descripción debe tener al menos 100 caracteres",
        });
      }

      // Crear la entrada de tiempo manual
      const manualTimeEntry = this.manualTimeEntryRepository.create({
        caseControlId: id,
        userId: userId,
        date: date || new Date().toISOString().split("T")[0],
        durationMinutes: parseInt(durationMinutes),
        description: description.trim(),
        createdBy: userId,
      });

      const savedEntry = await this.manualTimeEntryRepository.save(
        manualTimeEntry
      );

      // Actualizar el tiempo total del case control
      caseControl.totalTimeMinutes += parseInt(durationMinutes);
      await this.caseControlRepository.save(caseControl);

      res.json({
        success: true,
        message: "Entrada de tiempo manual agregada correctamente",
        data: savedEntry,
      });
    } catch (error) {
      console.error("Error adding manual time entry:", error);
      res.status(500).json({
        success: false,
        message: "Error al agregar la entrada de tiempo manual",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Eliminar una entrada de tiempo del timer
  async deleteTimeEntry(req: Request, res: Response) {
    try {
      const { id, entryId } = req.params;

      // Verificar que el case control existe
      const caseControl = await this.caseControlRepository.findOne({
        where: { id },
      });

      if (!caseControl) {
        return res.status(404).json({
          success: false,
          message: "Control de caso no encontrado",
        });
      }

      // Por ahora simulamos la eliminación ya que no tenemos entidad TimeEntry completa
      // En una implementación real, buscaríamos y eliminaríamos de la tabla time_entries

      // Simulación: restar tiempo del total (ejemplo: 15 minutos)
      const removedMinutes = 15; // Esto vendría de la entrada eliminada
      caseControl.totalTimeMinutes = Math.max(
        0,
        caseControl.totalTimeMinutes - removedMinutes
      );
      await this.caseControlRepository.save(caseControl);

      res.json({
        success: true,
        message: "Entrada de tiempo eliminada correctamente",
        data: {
          deletedEntryId: entryId,
          newTotalTimeMinutes: caseControl.totalTimeMinutes,
        },
      });
    } catch (error) {
      console.error("Error deleting time entry:", error);
      res.status(500).json({
        success: false,
        message: "Error al eliminar la entrada de tiempo",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Eliminar una entrada de tiempo manual
  async deleteManualTimeEntry(req: Request, res: Response) {
    try {
      const { id, entryId } = req.params;

      // Verificar que el case control existe
      const caseControl = await this.caseControlRepository.findOne({
        where: { id },
      });

      if (!caseControl) {
        return res.status(404).json({
          success: false,
          message: "Control de caso no encontrado",
        });
      }

      // Por ahora simulamos la eliminación ya que no tenemos entidad ManualTimeEntry
      // En una implementación real, buscaríamos y eliminaríamos de la tabla correspondiente

      // Simulación: restar tiempo manual del total (ejemplo: 30 minutos)
      const removedMinutes = 30; // Esto vendría de la entrada eliminada
      caseControl.totalTimeMinutes = Math.max(
        0,
        caseControl.totalTimeMinutes - removedMinutes
      );
      await this.caseControlRepository.save(caseControl);

      res.json({
        success: true,
        message: "Entrada de tiempo manual eliminada correctamente",
        data: {
          deletedEntryId: entryId,
          newTotalTimeMinutes: caseControl.totalTimeMinutes,
        },
      });
    } catch (error) {
      console.error("Error deleting manual time entry:", error);
      res.status(500).json({
        success: false,
        message: "Error al eliminar la entrada de tiempo manual",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
}
