import { Request, Response } from "express";
import {
  CaseStatusService,
  CreateCaseStatusDto,
  UpdateCaseStatusDto,
  CaseStatusFilterParams,
} from "../services/CaseStatusService";

export class CaseStatusController {
  private caseStatusService: CaseStatusService;

  constructor() {
    this.caseStatusService = new CaseStatusService();
  }

  /**
   * Obtener todos los estados
   */
  async getAllStatuses(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        isActive,
        sortBy = "displayOrder",
        sortOrder = "ASC",
      } = req.query;

      const filters: CaseStatusFilterParams = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        isActive:
          isActive === "true" ? true : isActive === "false" ? false : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as "ASC" | "DESC",
      };

      const result = await this.caseStatusService.getAllStatuses(filters);

      res.json({
        success: true,
        data: result,
        message: "Estados obtenidos correctamente",
      });
    } catch (error) {
      console.error("Error al obtener estados:", error);

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener estado por ID
   */
  async getStatusById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "ID del estado es requerido",
        });
      }

      const status = await this.caseStatusService.getStatusById(id);

      if (!status) {
        return res.status(404).json({
          success: false,
          error: "Estado no encontrado",
        });
      }

      res.json({
        success: true,
        data: status,
        message: "Estado obtenido correctamente",
      });
    } catch (error) {
      console.error("Error al obtener estado:", error);

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Crear nuevo estado
   */
  async createStatus(req: Request, res: Response) {
    try {
      const statusData: CreateCaseStatusDto = req.body;

      if (!statusData.name || statusData.name.trim() === "") {
        return res.status(400).json({
          success: false,
          error: "El nombre es requerido",
        });
      }

      const status = await this.caseStatusService.createStatus(statusData);

      res.status(201).json({
        success: true,
        data: status,
        message: "Estado creado correctamente",
      });
    } catch (error) {
      console.error("Error al crear estado:", error);

      if (error instanceof Error) {
        if (error.message === "Ya existe un estado con este nombre") {
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
   * Actualizar estado
   */
  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const statusData: UpdateCaseStatusDto = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "ID del estado es requerido",
        });
      }

      if (statusData.name && statusData.name.trim() === "") {
        return res.status(400).json({
          success: false,
          error: "El nombre no puede estar vacío",
        });
      }

      const status = await this.caseStatusService.updateStatus(id, statusData);

      res.json({
        success: true,
        data: status,
        message: "Estado actualizado correctamente",
      });
    } catch (error) {
      console.error("Error al actualizar estado:", error);

      if (error instanceof Error) {
        if (error.message === "Estado no encontrado") {
          return res.status(404).json({
            success: false,
            error: error.message,
          });
        }

        if (error.message === "Ya existe un estado con este nombre") {
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
   * Eliminar estado
   */
  async deleteStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "ID del estado es requerido",
        });
      }

      await this.caseStatusService.deleteStatus(id);

      res.json({
        success: true,
        message: "Estado eliminado correctamente",
      });
    } catch (error) {
      console.error("Error al eliminar estado:", error);

      if (error instanceof Error) {
        if (error.message === "Estado no encontrado") {
          return res.status(404).json({
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
   * Buscar estados
   */
  async searchStatuses(req: Request, res: Response) {
    try {
      const { search, isActive } = req.query;

      const filters: CaseStatusFilterParams = {
        search: search as string,
        isActive:
          isActive === "true" ? true : isActive === "false" ? false : undefined,
      };

      const statuses = await this.caseStatusService.searchStatuses(filters);

      res.json({
        success: true,
        data: statuses,
        message: "Búsqueda completada correctamente",
      });
    } catch (error) {
      console.error("Error al buscar estados:", error);

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener estadísticas de estados
   */
  async getStatusStats(req: Request, res: Response) {
    try {
      const stats = await this.caseStatusService.getStatusStats();

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
   * Reordenar estados
   */
  async reorderStatuses(req: Request, res: Response) {
    try {
      const { statusOrders } = req.body;

      if (!Array.isArray(statusOrders)) {
        return res.status(400).json({
          success: false,
          error: "Se requiere un array de órdenes de estados",
        });
      }

      await this.caseStatusService.reorderStatuses(statusOrders);

      res.json({
        success: true,
        message: "Estados reordenados correctamente",
      });
    } catch (error) {
      console.error("Error al reordenar estados:", error);

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }

  /**
   * Verificar si se puede eliminar un estado
   */
  async checkCanDeleteStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "ID del estado es requerido",
        });
      }

      const result = await this.caseStatusService.canDeleteStatus(id);

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

  /**
   * Obtener estados activos ordenados
   */
  async getActiveStatusesOrdered(req: Request, res: Response) {
    try {
      const statuses = await this.caseStatusService.getActiveStatusesOrdered();

      res.json({
        success: true,
        data: statuses,
        message: "Estados activos obtenidos correctamente",
      });
    } catch (error) {
      console.error("Error al obtener estados activos:", error);

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
      });
    }
  }
}
