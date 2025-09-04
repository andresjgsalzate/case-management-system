import { Request, Response } from "express";
import { Repository } from "typeorm";
import { AppDataSource } from "../../config/database";
import { AuthRequest } from "../../middleware/auth";
import { CaseControl, TimeEntry } from "../../entities";
import {
  StartTimerDTO,
  StopTimerDTO,
  PauseTimerDTO,
} from "../../types/case-control.dto";

export class TimerController {
  private caseControlRepository: Repository<CaseControl>;
  private timeEntryRepository: Repository<TimeEntry>;

  constructor() {
    this.caseControlRepository = AppDataSource.getRepository(CaseControl);
    this.timeEntryRepository = AppDataSource.getRepository(TimeEntry);
  }

  // Iniciar timer
  async startTimer(req: AuthRequest, res: Response) {
    try {
      const { caseControlId } = req.body as StartTimerDTO;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const caseControl = await this.caseControlRepository.findOneBy({
        id: caseControlId,
      });

      if (!caseControl) {
        return res.status(404).json({
          success: false,
          message: "Control de caso no encontrado",
        });
      }

      if (caseControl.isTimerActive) {
        return res.status(400).json({
          success: false,
          message: "El timer ya está activo",
        });
      }

      const now = new Date();

      // Actualizar el control de caso
      caseControl.isTimerActive = true;
      caseControl.timerStartAt = now;

      // Si no tiene startedAt, establecerlo
      if (!caseControl.startedAt) {
        caseControl.startedAt = now;
      }

      await this.caseControlRepository.save(caseControl);

      // Crear nueva entrada de tiempo
      const timeEntry = this.timeEntryRepository.create({
        caseControlId,
        userId,
        startTime: now,
        durationMinutes: 0,
      });

      await this.timeEntryRepository.save(timeEntry);

      res.json({
        success: true,
        data: caseControl,
        message: "Timer iniciado correctamente",
      });
    } catch (error) {
      console.error("Error starting timer:", error);
      res.status(500).json({
        success: false,
        message: "Error al iniciar el timer",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Detener timer
  async stopTimer(req: AuthRequest, res: Response) {
    try {
      const { caseControlId } = req.body as StopTimerDTO;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const caseControl = await this.caseControlRepository.findOneBy({
        id: caseControlId,
      });

      if (!caseControl) {
        return res.status(404).json({
          success: false,
          message: "Control de caso no encontrado",
        });
      }

      if (!caseControl.isTimerActive) {
        return res.status(400).json({
          success: false,
          message: "El timer no está activo",
        });
      }

      const now = new Date();
      const startTime = caseControl.timerStartAt!;
      const durationMs = now.getTime() - startTime.getTime();
      const durationMinutes = Math.round(durationMs / (1000 * 60));

      // Buscar la última entrada de tiempo activa
      const activeTimeEntry = await this.timeEntryRepository.findOne({
        where: {
          caseControlId,
          userId,
          endTime: null as any,
        },
        order: { startTime: "DESC" },
      });

      if (activeTimeEntry) {
        // Actualizar la entrada de tiempo
        activeTimeEntry.endTime = now;
        activeTimeEntry.durationMinutes = durationMinutes;
        await this.timeEntryRepository.save(activeTimeEntry);
      }

      // Actualizar el control de caso
      caseControl.isTimerActive = false;
      caseControl.timerStartAt = undefined;
      caseControl.totalTimeMinutes += durationMinutes;

      await this.caseControlRepository.save(caseControl);

      res.json({
        success: true,
        data: {
          caseControl,
          durationMinutes,
          totalMinutes: caseControl.totalTimeMinutes,
        },
        message: `Timer detenido. Tiempo registrado: ${durationMinutes} minutos`,
      });
    } catch (error) {
      console.error("Error stopping timer:", error);
      res.status(500).json({
        success: false,
        message: "Error al detener el timer",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Pausar timer (detener sin completar)
  async pauseTimer(req: AuthRequest, res: Response) {
    try {
      const { caseControlId } = req.body as PauseTimerDTO;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const caseControl = await this.caseControlRepository.findOneBy({
        id: caseControlId,
      });

      if (!caseControl) {
        return res.status(404).json({
          success: false,
          message: "Control de caso no encontrado",
        });
      }

      if (!caseControl.isTimerActive) {
        return res.status(400).json({
          success: false,
          message: "El timer no está activo",
        });
      }

      const now = new Date();
      const startTime = caseControl.timerStartAt!;
      const durationMs = now.getTime() - startTime.getTime();
      const durationMinutes = Math.round(durationMs / (1000 * 60));

      // Buscar la última entrada de tiempo activa
      const activeTimeEntry = await this.timeEntryRepository.findOne({
        where: {
          caseControlId,
          userId,
          endTime: null as any,
        },
        order: { startTime: "DESC" },
      });

      if (activeTimeEntry) {
        // Actualizar la entrada de tiempo
        activeTimeEntry.endTime = now;
        activeTimeEntry.durationMinutes = durationMinutes;
        await this.timeEntryRepository.save(activeTimeEntry);
      }

      // Actualizar el control de caso
      caseControl.isTimerActive = false;
      caseControl.timerStartAt = undefined;
      caseControl.totalTimeMinutes += durationMinutes;

      await this.caseControlRepository.save(caseControl);

      res.json({
        success: true,
        data: {
          caseControl,
          durationMinutes,
          totalMinutes: caseControl.totalTimeMinutes,
        },
        message: `Timer pausado. Tiempo registrado: ${durationMinutes} minutos`,
      });
    } catch (error) {
      console.error("Error pausing timer:", error);
      res.status(500).json({
        success: false,
        message: "Error al pausar el timer",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Obtener tiempo activo de un caso
  async getActiveTime(req: Request, res: Response) {
    try {
      const { caseControlId } = req.params;

      const caseControl = await this.caseControlRepository.findOneBy({
        id: caseControlId,
      });

      if (!caseControl) {
        return res.status(404).json({
          success: false,
          message: "Control de caso no encontrado",
        });
      }

      let currentSessionMinutes = 0;
      if (caseControl.isTimerActive && caseControl.timerStartAt) {
        const now = new Date();
        const durationMs = now.getTime() - caseControl.timerStartAt.getTime();
        currentSessionMinutes = Math.round(durationMs / (1000 * 60));
      }

      res.json({
        success: true,
        data: {
          isTimerActive: caseControl.isTimerActive,
          timerStartAt: caseControl.timerStartAt?.toISOString(),
          totalTimeMinutes: caseControl.totalTimeMinutes,
          currentSessionMinutes,
        },
      });
    } catch (error) {
      console.error("Error getting active time:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener el tiempo activo",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
}
