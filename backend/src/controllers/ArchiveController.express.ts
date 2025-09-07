import { Request, Response, NextFunction } from "express";
import { ArchiveServiceExpress } from "../modules/archive/archive.service";

export class ArchiveController {
  private archiveService: ArchiveServiceExpress;

  constructor() {
    this.archiveService = new ArchiveServiceExpress();
  }

  /**
   * Obtener estadísticas del archivo
   */
  getArchiveStats = async (req: Request, res: Response, next: NextFunction) => {
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
  };

  /**
   * Obtener elementos archivados
   */
  getArchivedItems = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
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
  };

  /**
   * Obtener casos archivados específicamente
   */
  getArchivedCases = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        sortBy = "archivedAt",
        sortOrder = "DESC",
      } = req.query;

      const result = await this.archiveService.getArchivedItems(
        parseInt(page as string),
        parseInt(limit as string),
        search as string,
        "case",
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
      console.error("Error getting archived cases:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error obteniendo casos archivados",
      });
    }
  };

  /**
   * Obtener todos archivados específicamente
   */
  getArchivedTodos = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        sortBy = "archivedAt",
        sortOrder = "DESC",
      } = req.query;

      const result = await this.archiveService.getArchivedItems(
        parseInt(page as string),
        parseInt(limit as string),
        search as string,
        "todo",
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
      console.error("Error getting archived todos:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error obteniendo todos archivados",
      });
    }
  };

  /**
   * Archivar un caso
   */
  archiveCase = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { caseId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id; // Assuming user is attached to request via middleware

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
        parseInt(caseId),
        parseInt(userId.toString()),
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
  };

  /**
   * Archivar un todo
   */
  archiveTodo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { todoId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id; // Assuming user is attached to request via middleware

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
        parseInt(todoId),
        parseInt(userId.toString()),
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
  };

  /**
   * Restaurar un elemento archivado
   */
  restoreArchivedItem = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { type, id } = req.params;

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

      const restoredItem = await this.archiveService.restoreArchivedItem(
        type as "case" | "todo",
        parseInt(id)
      );

      res.json({
        success: true,
        data: restoredItem,
        message: "Elemento restaurado exitosamente",
      });
    } catch (error: any) {
      console.error("Error restoring archived item:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error restaurando elemento",
      });
    }
  };

  /**
   * Eliminar permanentemente un elemento archivado
   */
  deleteArchivedItem = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { type, id } = req.params;

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
        parseInt(id)
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
  };

  /**
   * Buscar elementos archivados
   */
  searchArchivedItems = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
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
  };
}
