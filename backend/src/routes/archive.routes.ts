import express from "express";
import { authenticateToken } from "../middleware/auth";
import { requirePermission } from "../middleware/authorizationMiddleware";
import { ArchiveController } from "../controllers/ArchiveController.express";
import { RestoreService } from "../modules/archive/restore-service";
import {
  ArchiveFiltersDto,
  CreateArchivedCaseDto,
  CreateArchivedTodoDto,
  RestoreArchivedItemDto,
  DeleteArchivedItemDto,
} from "../dto/archive.dto";

const router = express.Router();
const archiveController = new ArchiveController();
const restoreService = new RestoreService();

// =============================================
// RUTAS PARA ESTADÍSTICAS
// =============================================

/**
 * GET /api/archive/stats
 * Obtener estadísticas del archivo
 */
router.get(
  "/stats",
  authenticateToken,
  requirePermission("archive.stats.all"),
  archiveController.getArchiveStats
);

// =============================================
// RUTAS PARA CASOS ARCHIVADOS
// =============================================

/**
 * GET /api/archive/cases
 * Obtener casos archivados con filtros
 */
router.get(
  "/cases",
  authenticateToken,
  requirePermission("archive.view.all"),
  async (req, res, next) => {
    try {
      // En una implementación real, usarías un servicio inyectado
      res.json({
        success: true,
        data: [],
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/archive/cases
 * Archivar un caso
 */
router.post(
  "/cases",
  authenticateToken,
  requirePermission("archive.create.own"),
  async (req, res, next) => {
    try {
      // En una implementación real, usarías un servicio inyectado
      res.status(201).json({
        success: true,
        data: { id: "placeholder" },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/archive/cases/:id
 * Obtener un caso archivado por ID
 */
router.get(
  "/cases/:id",
  authenticateToken,
  requirePermission("archive.view.own"),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      res.json({
        success: true,
        data: { id },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/archive/cases/:id/restore
 * Restaurar un caso archivado
 */
router.put(
  "/cases/:id/restore",
  authenticateToken,
  requirePermission("archive.restore.own"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = req.user as { id: string };

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "ID requerido",
        });
      }

      const result = await restoreService.restoreCase(
        id,
        (user.id || "system") as string
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: {
            id: result.caseId,
            restored: true,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/archive/cases/:id
 * Eliminar permanentemente un caso archivado
 */
router.delete(
  "/cases/:id",
  authenticateToken,
  requirePermission("archive.delete.own"),
  archiveController.deleteArchivedCase
);

// =============================================
// RUTAS PARA TODOS ARCHIVADOS
// =============================================

/**
 * GET /api/archive/todos
 * Obtener TODOs archivados con filtros
 */
router.get(
  "/todos",
  authenticateToken,
  requirePermission("archive.view.all"),
  async (req, res, next) => {
    try {
      res.json({
        success: true,
        data: [],
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/archive/todos
 * Archivar un TODO
 */
router.post(
  "/todos",
  authenticateToken,
  requirePermission("archive.create.own"),
  async (req, res, next) => {
    try {
      res.status(201).json({
        success: true,
        data: { id: "placeholder" },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/archive/todos/:id/restore
 * Restaurar un TODO archivado
 */
router.put(
  "/todos/:id/restore",
  authenticateToken,
  requirePermission("archive.restore.own"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = req.user as { id: string };

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "ID requerido",
        });
      }

      const result = await restoreService.restoreTodo(
        id,
        (user.id || "system") as string
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: {
            id: result.todoId,
            restored: true,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/archive/todos/:id
 * Eliminar permanentemente un TODO archivado
 */
router.delete(
  "/todos/:id",
  authenticateToken,
  requirePermission("archive.delete.own"),
  async (req, res, next) => {
    try {
      await archiveController.deleteArchivedTodo(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// =============================================
// RUTAS GENERALES
// =============================================

/**
 * GET /api/archive/items
 * Obtener todos los elementos archivados (casos y TODOs combinados)
 */
router.get(
  "/items",
  authenticateToken,
  requirePermission("archive.view.all"),
  archiveController.getArchivedItems
);

/**
 * GET /api/archive/search
 * Buscar en elementos archivados
 */
router.get(
  "/search",
  authenticateToken,
  requirePermission("archive.view.all"),
  async (req, res, next) => {
    try {
      res.json({
        success: true,
        data: [],
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
