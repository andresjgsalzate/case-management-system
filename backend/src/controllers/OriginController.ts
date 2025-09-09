import { Request, Response } from "express";
import {
  OriginService,
  CreateOriginDto,
  UpdateOriginDto,
  OriginFilterParams,
} from "../services/OriginService";

export class OriginController {
  private originService: OriginService;

  constructor() {
    this.originService = new OriginService();
  }

  /**
   * Obtener todos los orígenes
   */
  async getAllOrigins(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        activo,
        sortBy = "nombre",
        sortOrder = "ASC",
      } = req.query;

      const filters: OriginFilterParams = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        activo:
          activo === "true" ? true : activo === "false" ? false : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as "ASC" | "DESC",
      };

      const result = await this.originService.getAllOrigins(filters);

      res.json({
        success: true,
        data: result,
        message: "Orígenes obtenidos correctamente",
      });
    } catch (error) {
      console.error("Error al obtener orígenes:", error);

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener origen por ID
   */
  async getOriginById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "ID del origen es requerido",
        });
      }

      const origin = await this.originService.getOriginById(id);

      if (!origin) {
        return res.status(404).json({
          success: false,
          error: "Origen no encontrado",
        });
      }

      res.json({
        success: true,
        data: origin,
        message: "Origen obtenido correctamente",
      });
    } catch (error) {
      console.error("Error al obtener origen:", error);

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Crear nuevo origen
   */
  async createOrigin(req: Request, res: Response) {
    try {
      const originData: CreateOriginDto = req.body;

      if (!originData.nombre || originData.nombre.trim() === "") {
        return res.status(400).json({
          success: false,
          error: "El nombre es requerido",
        });
      }

      const origin = await this.originService.createOrigin(originData);

      res.status(201).json({
        success: true,
        data: origin,
        message: "Origen creado correctamente",
      });
    } catch (error) {
      console.error("Error al crear origen:", error);

      if (error instanceof Error) {
        if (error.message === "Ya existe un origen con este nombre") {
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
   * Actualizar origen
   */
  async updateOrigin(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const originData: UpdateOriginDto = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "ID del origen es requerido",
        });
      }

      if (originData.nombre && originData.nombre.trim() === "") {
        return res.status(400).json({
          success: false,
          error: "El nombre no puede estar vacío",
        });
      }

      const origin = await this.originService.updateOrigin(id, originData);

      res.json({
        success: true,
        data: origin,
        message: "Origen actualizado correctamente",
      });
    } catch (error) {
      console.error("Error al actualizar origen:", error);

      if (error instanceof Error) {
        if (error.message === "Origen no encontrado") {
          return res.status(404).json({
            success: false,
            error: error.message,
          });
        }

        if (error.message === "Ya existe un origen con este nombre") {
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
   * Eliminar origen
   */
  async deleteOrigin(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "ID del origen es requerido",
        });
      }

      await this.originService.deleteOrigin(id);

      res.json({
        success: true,
        message: "Origen eliminado correctamente",
      });
    } catch (error) {
      console.error("Error al eliminar origen:", error);

      if (error instanceof Error) {
        if (error.message === "Origen no encontrado") {
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
   * Buscar orígenes
   */
  async searchOrigins(req: Request, res: Response) {
    try {
      const { search, activo } = req.query;

      const filters: OriginFilterParams = {
        search: search as string,
        activo:
          activo === "true" ? true : activo === "false" ? false : undefined,
      };

      const origins = await this.originService.searchOrigins(filters);

      res.json({
        success: true,
        data: origins,
        message: "Búsqueda completada correctamente",
      });
    } catch (error) {
      console.error("Error al buscar orígenes:", error);

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener estadísticas de orígenes
   */
  async getOriginStats(req: Request, res: Response) {
    try {
      const stats = await this.originService.getOriginStats();

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
   * Verificar si se puede eliminar un origen
   */
  async checkCanDeleteOrigin(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "ID del origen es requerido",
        });
      }

      const result = await this.originService.canDeleteOrigin(id);

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
