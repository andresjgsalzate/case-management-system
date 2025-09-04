import { Request, Response, NextFunction } from "express";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";
import { DispositionService } from "./disposition.service";
import {
  CreateDispositionDto,
  UpdateDispositionDto,
  DispositionFiltersDto,
} from "../../dto/disposition.dto";
import { createError } from "../../middleware/errorHandler";
import { AppDataSource } from "../../config/database";
import { UserProfile } from "../../entities/UserProfile";

export class DispositionController {
  private dispositionService: DispositionService;

  constructor() {
    this.dispositionService = new DispositionService();
  }

  async createDisposition(req: Request, res: Response, next: NextFunction) {
    try {
      const createDispositionDto = plainToClass(CreateDispositionDto, req.body);
      const errors = await validate(createDispositionDto as object);

      if (errors.length > 0) {
        const errorMessages = errors
          .map((error) => Object.values(error.constraints || {}).join(", "))
          .join("; ");
        throw createError(errorMessages, 400);
      }

      // Temporal: usar el primer usuario de la base de datos hasta que tengamos autenticación
      const userRepository = AppDataSource.getRepository(UserProfile);
      const firstUser = await userRepository.findOne({ where: {} });

      if (!firstUser) {
        throw createError("No hay usuarios disponibles en el sistema", 500);
      }

      const userId = firstUser.id;

      const newDisposition = await this.dispositionService.create(
        createDispositionDto,
        userId
      );

      res.status(201).json({
        success: true,
        message: "Disposición creada exitosamente",
        data: newDisposition,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllDispositions(req: Request, res: Response, next: NextFunction) {
    try {
      const filtersDto = plainToClass(DispositionFiltersDto, req.query);
      const errors = await validate(filtersDto as object);

      if (errors.length > 0) {
        const errorMessages = errors
          .map((error) => Object.values(error.constraints || {}).join(", "))
          .join("; ");
        throw createError(errorMessages, 400);
      }

      // Temporal: no usar userId hasta que tengamos autenticación
      const userId = undefined; // req.user?.id;

      const dispositions = await this.dispositionService.findAll(
        filtersDto,
        userId
      );

      res.json({
        success: true,
        data: dispositions,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDispositionById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError("ID de disposición requerido", 400);
      }

      const disposition = await this.dispositionService.findOne(id);

      if (!disposition) {
        throw createError("Disposición no encontrada", 404);
      }

      res.json({
        success: true,
        data: disposition,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateDisposition(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError("ID de disposición requerido", 400);
      }

      const updateDispositionDto = plainToClass(UpdateDispositionDto, req.body);
      const errors = await validate(updateDispositionDto as object);

      if (errors.length > 0) {
        const errorMessages = errors
          .map((error) => Object.values(error.constraints || {}).join(", "))
          .join("; ");
        throw createError(errorMessages, 400);
      }

      const updatedDisposition = await this.dispositionService.update(
        id,
        updateDispositionDto
      );

      res.json({
        success: true,
        message: "Disposición actualizada exitosamente",
        data: updatedDisposition,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteDisposition(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError("ID de disposición requerido", 400);
      }

      await this.dispositionService.remove(id);

      res.json({
        success: true,
        message: "Disposición eliminada exitosamente",
      });
    } catch (error) {
      next(error);
    }
  }

  async getAvailableYears(req: Request, res: Response, next: NextFunction) {
    try {
      const years = await this.dispositionService.getAvailableYears();

      res.json({
        success: true,
        data: years,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMonthlyStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { year, month } = req.params;

      if (!year || !month) {
        throw createError("Año y mes son requeridos", 400);
      }

      const yearNum = parseInt(year);
      const monthNum = parseInt(month);

      if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        throw createError("Año y mes deben ser números válidos", 400);
      }

      const stats = await this.dispositionService.getMonthlyStats(
        yearNum,
        monthNum
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

// Crear instancia del controlador
const dispositionController = new DispositionController();

// Exportar métodos como funciones para compatibilidad con Express routes
export const createDisposition = (
  req: Request,
  res: Response,
  next: NextFunction
) => dispositionController.createDisposition(req, res, next);

export const getAllDispositions = (
  req: Request,
  res: Response,
  next: NextFunction
) => dispositionController.getAllDispositions(req, res, next);

export const getDispositionById = (
  req: Request,
  res: Response,
  next: NextFunction
) => dispositionController.getDispositionById(req, res, next);

export const updateDisposition = (
  req: Request,
  res: Response,
  next: NextFunction
) => dispositionController.updateDisposition(req, res, next);

export const deleteDisposition = (
  req: Request,
  res: Response,
  next: NextFunction
) => dispositionController.deleteDisposition(req, res, next);

export const getAvailableYears = (
  req: Request,
  res: Response,
  next: NextFunction
) => dispositionController.getAvailableYears(req, res, next);

export const getMonthlyStats = (
  req: Request,
  res: Response,
  next: NextFunction
) => dispositionController.getMonthlyStats(req, res, next);
