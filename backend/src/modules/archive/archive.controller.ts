import { Request, Response, NextFunction } from "express";
import { ArchiveServiceExpress } from "./archive.service";

export class ArchiveController {
  private archiveService: ArchiveServiceExpress;

  constructor() {
    this.archiveService = new ArchiveServiceExpress();
  }

  async getArchiveStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await this.archiveService.getArchiveStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error("Error getting archive stats:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error obteniendo estadísticas del archivo",
      });
    }
  }

  async getArchivedItems(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        type,
        sortBy = "archivedAt",
        sortOrder = "DESC",
      } = req.query;

      const result = await this.archiveService.getArchivedItems(
        parseInt(page as string),
        parseInt(limit as string),
        search as string,
        type as "case" | "todo",
        sortBy as "createdAt" | "title" | "archivedAt",
        sortOrder as "ASC" | "DESC"
      );

      res.json({
        success: true,
        data: result.items,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total,
          totalPages: Math.ceil(result.total / parseInt(limit as string)),
        },
      });
    } catch (error: any) {
      console.error("Error getting archived items:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error obteniendo elementos archivados",
      });
    }
  }

  async archiveCase(req: Request, res: Response, next: NextFunction) {
    try {
      const { caseId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;

      if (!caseId) {
        return res.status(400).json({
          success: false,
          message: "ID de caso requerido",
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const archivedCase = await this.archiveService.archiveCase(
        caseId, // No usar parseInt() porque es un UUID
        userId.toString(),
        reason
      );

      res.json({
        success: true,
        data: archivedCase,
        message: "Caso archivado exitosamente",
      });
    } catch (error: any) {
      console.error("Error archiving case:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error archivando caso",
      });
    }
  }

  async archiveTodo(req: Request, res: Response, next: NextFunction) {
    try {
      const { todoId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;

      if (!todoId) {
        return res.status(400).json({
          success: false,
          message: "ID de todo requerido",
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const archivedTodo = await this.archiveService.archiveTodo(
        todoId,
        userId.toString(),
        reason
      );

      res.json({
        success: true,
        data: archivedTodo,
        message: "Todo archivado exitosamente",
      });
    } catch (error: any) {
      console.error("Error archiving todo:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error archivando todo",
      });
    }
  }

  async restoreArchivedItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, id } = req.params;
      const userId = req.user?.id; // Asumiendo que el middleware de auth añade user al request

      if (!type || !id) {
        return res.status(400).json({
          success: false,
          message: "Tipo e ID requeridos",
        });
      }

      if (!["case", "todo"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Tipo de elemento inválido. Debe ser 'case' o 'todo'",
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      let result;
      let restoredId: string | undefined;

      if (type === "case") {
        result = await this.archiveService.restoreCase(id, userId);
        restoredId = "caseId" in result ? result.caseId : undefined;
      } else {
        result = await this.archiveService.restoreTodo(id, userId);
        restoredId = "todoId" in result ? result.todoId : undefined;
      }

      res.json({
        success: result.success,
        data: {
          id: restoredId,
          type: type,
          message: result.message,
        },
        message: result.message,
      });
    } catch (error: any) {
      console.error("Error restoring archived item:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error restaurando elemento",
      });
    }
  }

  async deleteArchivedTodo(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "ID requerido",
        });
      }

      await this.archiveService.deleteArchivedItem("todo", id);

      res.json({
        success: true,
        message: "TODO eliminado permanentemente",
      });
    } catch (error: any) {
      console.error("Error deleting archived todo:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error eliminando TODO",
      });
    }
  }

  async deleteArchivedItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, id } = req.params;
      console.log("DEBUG - DELETE params:", {
        type,
        id,
        allParams: req.params,
      });

      if (!type || !id) {
        return res.status(400).json({
          success: false,
          message: "Tipo e ID requeridos",
        });
      }

      if (!["case", "todo"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Tipo de elemento inválido. Debe ser 'case' o 'todo'",
        });
      }

      await this.archiveService.deleteArchivedItem(
        type as "case" | "todo",
        id as string
      );

      res.json({
        success: true,
        message: "Elemento eliminado permanentemente",
      });
    } catch (error: any) {
      console.error("Error deleting archived item:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error eliminando elemento",
      });
    }
  }

  async searchArchivedItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { q: query, type, page = 1, limit = 20 } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: "Query de búsqueda requerido",
        });
      }

      const result = await this.archiveService.searchArchivedItems(
        query as string,
        type as "case" | "todo",
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: result.items,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total,
          totalPages: Math.ceil(result.total / parseInt(limit as string)),
        },
      });
    } catch (error: any) {
      console.error("Error searching archived items:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error buscando elementos archivados",
      });
    }
  }
}

// Crear instancia del controlador
const archiveController = new ArchiveController();

// Exportar métodos como funciones para compatibilidad con Express routes
export const getArchiveStats = (
  req: Request,
  res: Response,
  next: NextFunction
) => archiveController.getArchiveStats(req, res, next);

export const getArchivedItems = (
  req: Request,
  res: Response,
  next: NextFunction
) => archiveController.getArchivedItems(req, res, next);

export const archiveCase = (req: Request, res: Response, next: NextFunction) =>
  archiveController.archiveCase(req, res, next);

export const archiveTodo = (req: Request, res: Response, next: NextFunction) =>
  archiveController.archiveTodo(req, res, next);

export const restoreArchivedItem = (
  req: Request,
  res: Response,
  next: NextFunction
) => archiveController.restoreArchivedItem(req, res, next);

export const deleteArchivedItem = (
  req: Request,
  res: Response,
  next: NextFunction
) => archiveController.deleteArchivedItem(req, res, next);

export const searchArchivedItems = (
  req: Request,
  res: Response,
  next: NextFunction
) => archiveController.searchArchivedItems(req, res, next);
