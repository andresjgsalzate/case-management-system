import { Request, Response } from "express";
import {
  ApplicationService,
  CreateApplicationDto,
  UpdateApplicationDto,
  ApplicationFilterParams,
} from "../services/ApplicationService";

export class ApplicationController {
  private applicationService: ApplicationService;

  constructor() {
    this.applicationService = new ApplicationService();
  }

  /**
   * Obtener todas las aplicaciones
   */
  async getAllApplications(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        activo,
        sortBy = "nombre",
        sortOrder = "ASC",
      } = req.query;

      const filters: ApplicationFilterParams = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        activo:
          activo === "true" ? true : activo === "false" ? false : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as "ASC" | "DESC",
      };

      const result = await this.applicationService.getAllApplications(filters);

      res.json({
        success: true,
        data: result,
        message: "Aplicaciones obtenidas correctamente",
      });
    } catch (error) {
      console.error("Error al obtener aplicaciones:", error);

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener aplicación por ID
   */
  async getApplicationById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "ID de la aplicación es requerido",
        });
      }

      const application = await this.applicationService.getApplicationById(id);

      if (!application) {
        return res.status(404).json({
          success: false,
          error: "Aplicación no encontrada",
        });
      }

      res.json({
        success: true,
        data: application,
        message: "Aplicación obtenida correctamente",
      });
    } catch (error) {
      console.error("Error al obtener aplicación:", error);

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Crear nueva aplicación
   */
  async createApplication(req: Request, res: Response) {
    try {
      const applicationData: CreateApplicationDto = req.body;

      if (!applicationData.nombre || applicationData.nombre.trim() === "") {
        return res.status(400).json({
          success: false,
          error: "El nombre es requerido",
        });
      }

      const application = await this.applicationService.createApplication(
        applicationData
      );

      res.status(201).json({
        success: true,
        data: application,
        message: "Aplicación creada correctamente",
      });
    } catch (error) {
      console.error("Error al crear aplicación:", error);

      if (error instanceof Error) {
        if (error.message === "Ya existe una aplicación con este nombre") {
          return res.status(409).json({
            success: false,
            error: error.message,
          });
        }
      }

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Actualizar aplicación
   */
  async updateApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const applicationData: UpdateApplicationDto = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "ID de la aplicación es requerido",
        });
      }

      if (applicationData.nombre && applicationData.nombre.trim() === "") {
        return res.status(400).json({
          success: false,
          error: "El nombre no puede estar vacío",
        });
      }

      const application = await this.applicationService.updateApplication(
        id,
        applicationData
      );

      res.json({
        success: true,
        data: application,
        message: "Aplicación actualizada correctamente",
      });
    } catch (error) {
      console.error("Error al actualizar aplicación:", error);

      if (error instanceof Error) {
        if (error.message === "Aplicación no encontrada") {
          return res.status(404).json({
            success: false,
            error: error.message,
          });
        }

        if (error.message === "Ya existe una aplicación con este nombre") {
          return res.status(409).json({
            success: false,
            error: error.message,
          });
        }
      }

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Eliminar aplicación
   */
  async deleteApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "ID de la aplicación es requerido",
        });
      }

      await this.applicationService.deleteApplication(id);

      res.json({
        success: true,
        message: "Aplicación eliminada correctamente",
      });
    } catch (error) {
      console.error("Error al eliminar aplicación:", error);

      if (error instanceof Error) {
        if (error.message === "Aplicación no encontrada") {
          return res.status(404).json({
            success: false,
            error: error.message,
          });
        }

        if (error.message.includes("casos asociados")) {
          return res.status(409).json({
            success: false,
            error: error.message,
          });
        }
      }

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Buscar aplicaciones
   */
  async searchApplications(req: Request, res: Response) {
    try {
      const { search, activo } = req.query;

      const filters: ApplicationFilterParams = {
        search: search as string,
        activo:
          activo === "true" ? true : activo === "false" ? false : undefined,
      };

      const applications = await this.applicationService.searchApplications(
        filters
      );

      res.json({
        success: true,
        data: applications,
        message: "Búsqueda completada correctamente",
      });
    } catch (error) {
      console.error("Error al buscar aplicaciones:", error);

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener estadísticas de aplicaciones
   */
  async getApplicationStats(req: Request, res: Response) {
    try {
      const stats = await this.applicationService.getApplicationStats();

      res.json({
        success: true,
        data: stats,
        message: "Estadísticas obtenidas correctamente",
      });
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Verificar si se puede eliminar una aplicación
   */
  async checkCanDeleteApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "ID de la aplicación es requerido",
        });
      }

      const result = await this.applicationService.canDeleteApplication(id);

      res.json({
        success: true,
        data: result,
        message: "Verificación completada correctamente",
      });
    } catch (error) {
      console.error("Error al verificar eliminación:", error);

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }
}
