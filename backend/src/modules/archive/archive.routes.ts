import { Router } from "express";
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

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// GET /api/archive/stats - Obtener estadísticas del archivo
router.get("/stats", getArchiveStats);

// GET /api/archive/items - Obtener elementos archivados
router.get("/items", getArchivedItems);

// GET /api/archive/search - Buscar elementos archivados
router.get("/search", searchArchivedItems);

// POST /api/archive/case/:caseId - Archivar un caso
router.post("/case/:caseId", archiveCase);

// POST /api/archive/todo/:todoId - Archivar un todo
router.post("/todo/:todoId", archiveTodo);

// POST /api/archive/:type/:id/restore - Restaurar elemento archivado
router.post("/:type/:id/restore", restoreArchivedItem);

// DELETE /api/archive/:type/:id - Eliminar permanentemente elemento archivado
router.delete("/:type/:id", deleteArchivedItem);

export default router;
