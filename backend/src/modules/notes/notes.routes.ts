import { Router } from "express";
import { NoteController } from "../../controllers/NoteController";
import { authenticateToken } from "../../middleware/auth";

const router = Router();
const noteController = new NoteController();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Rutas CRUD básicas
router.get("/", noteController.getAllNotes);
router.get("/stats", noteController.getNotesStats);
router.post("/", noteController.createNote);
router.put("/:id", noteController.updateNote);
router.delete("/:id", noteController.deleteNote);
router.patch("/:id/archive", noteController.toggleArchiveNote);

export default router;
