import { Router, Request, Response, NextFunction } from "express";
import {
  getArchiveStats,
  getArchivedItems,
  archiveCase,
  archiveTodo,
  restoreArchivedItem,
  deleteArchivedItem,
  searchArchivedItems,
} from "./archive.controller";
import { authenticateToken } from "../../middleware/auth";
import { AuditMiddleware } from "../../middleware/auditMiddleware";

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Aplicar middleware de auditoría después de la autenticación
router.use(AuditMiddleware.initializeAuditContext);

// GET /api/archive/stats - Obtener estadísticas del archivo
router.get("/stats", getArchiveStats);

// GET /api/archive/items - Obtener elementos archivados
router.get("/items", getArchivedItems);

// GET /api/archive/search - Buscar elementos archivados
router.get("/search", searchArchivedItems);

// POST /api/archive/case/:caseId - Archivar un caso
router.post(
  "/case/:caseId",
  AuditMiddleware.auditCreate("archived_cases"),
  archiveCase
);

// POST /api/archive/todo/:todoId - Archivar un todo
router.post(
  "/todo/:todoId",
  AuditMiddleware.auditCreate("archived_todos"),
  archiveTodo
);

// POST /api/archive/:type/:id/restore - Restaurar elemento archivado
router.post(
  "/:type/:id/restore",
  AuditMiddleware.auditUpdate("archived_items"),
  restoreArchivedItem
);

// DELETE /api/archive/todos/:id - Eliminar permanentemente TODO archivado (ruta específica)
router.delete(
  "/todos/:id",
  AuditMiddleware.auditDelete("archived_todos"),
  (req: Request, res: Response, next: NextFunction) => {
    // Transformar el parámetro para que funcione con deleteArchivedItem
    req.params.type = "todo"; // Cambiar 'todos' a 'todo'
    deleteArchivedItem(req, res, next);
  }
);

// DELETE /api/archive/:type/:id - Eliminar permanentemente elemento archivado
router.delete("/:type/:id", deleteArchivedItem);

export default router;
