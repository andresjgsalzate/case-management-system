import { Router } from "express";
import { NoteController } from "../../controllers/NoteController";
import { authenticateToken } from "../../middleware/auth";
import { AuditMiddleware } from "../../middleware/auditMiddleware";

const router = Router();
const noteController = new NoteController();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Aplicar middleware de auditoría después de la autenticación
router.use(AuditMiddleware.initializeAuditContext);

// Rutas CRUD básicas
router.get("/", noteController.getAllNotes);
router.get("/stats", noteController.getNotesStats);
router.post(
  "/",
  AuditMiddleware.auditCreate("notes"),
  noteController.createNote
);
router.put(
  "/:id",
  AuditMiddleware.auditUpdate("notes"),
  noteController.updateNote
);
router.delete(
  "/:id",
  AuditMiddleware.auditDelete("notes"),
  noteController.deleteNote
);
router.patch(
  "/:id/archive",
  AuditMiddleware.auditUpdate("notes"),
  noteController.toggleArchiveNote
);

export default router;
