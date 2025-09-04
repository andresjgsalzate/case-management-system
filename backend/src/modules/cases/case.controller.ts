import { Request, Response, NextFunction } from "express";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";
import { CaseService } from "./case.service";
import { CreateCaseDto, UpdateCaseDto, CaseFiltersDto } from "./case.dto";
import { createError } from "../../middleware/errorHandler";

export class CaseController {
  private caseService: CaseService;

  constructor() {
    this.caseService = new CaseService();
  }

  async createCase(req: Request, res: Response, next: NextFunction) {
    try {
      const createCaseDto = plainToClass(CreateCaseDto, req.body);
      const errors = await validate(createCaseDto);

      if (errors.length > 0) {
        const errorMessages = errors
          .map((error) => Object.values(error.constraints || {}).join(", "))
          .join("; ");
        throw createError(errorMessages, 400);
      }

      // Temporal: usar un userId dummy hasta que tengamos autenticación
      const userId = "temp-user-id"; // req.user?.id;
      // if (!userId) {
      //   throw createError("Usuario no autenticado", 401);
      // }

      const newCase = await this.caseService.createCase(createCaseDto, userId);

      res.status(201).json({
        success: true,
        message: "Caso creado exitosamente",
        data: newCase,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCases(req: Request, res: Response, next: NextFunction) {
    try {
      const filtersDto = plainToClass(CaseFiltersDto, req.query);
      const errors = await validate(filtersDto);

      if (errors.length > 0) {
        const errorMessages = errors
          .map((error) => Object.values(error.constraints || {}).join(", "))
          .join("; ");
        throw createError(errorMessages, 400);
      }

      const userId = "temp-user-id"; // req.user?.id;
      const cases = await this.caseService.getCases(filtersDto, userId);

      res.json({
        success: true,
        data: cases,
        total: cases.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCaseById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError("ID del caso es requerido", 400);
      }

      const userId = "temp-user-id"; // req.user?.id;
      const caseData = await this.caseService.getCaseById(id, userId);

      res.json({
        success: true,
        data: caseData,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCase(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError("ID del caso es requerido", 400);
      }

      const updateCaseDto = plainToClass(UpdateCaseDto, req.body);
      const errors = await validate(updateCaseDto);

      if (errors.length > 0) {
        const errorMessages = errors
          .map((error) => Object.values(error.constraints || {}).join(", "))
          .join("; ");
        throw createError(errorMessages, 400);
      }

      const userId = "temp-user-id"; // req.user?.id;
      // if (!userId) {
      //   throw createError("Usuario no autenticado", 401);
      // }

      const updatedCase = await this.caseService.updateCase(
        id,
        updateCaseDto,
        userId
      );

      res.json({
        success: true,
        message: "Caso actualizado exitosamente",
        data: updatedCase,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCase(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError("ID del caso es requerido", 400);
      }

      const userId = "temp-user-id"; // req.user?.id;
      // if (!userId) {
      //   throw createError("Usuario no autenticado", 401);
      // }

      await this.caseService.deleteCase(id, userId);

      res.json({
        success: true,
        message: "Caso eliminado exitosamente",
      });
    } catch (error) {
      next(error);
    }
  }

  async getCaseStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await this.caseService.getCaseStats();

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
const caseController = new CaseController();

// Exportar métodos con bind para mantener el contexto
export const createCase = caseController.createCase.bind(caseController);
export const getCases = caseController.getCases.bind(caseController);
export const getCaseById = caseController.getCaseById.bind(caseController);
export const updateCase = caseController.updateCase.bind(caseController);
export const deleteCase = caseController.deleteCase.bind(caseController);
export const getCaseStats = caseController.getCaseStats.bind(caseController);
