import { Router } from "express";
import {
  createCase,
  getCases,
  getCaseById,
  updateCase,
  deleteCase,
  getCaseStats,
} from "./case.controller";
import { authenticateToken } from "../../middleware/auth";

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Rutas para casos
router.get("/stats", getCaseStats);
router.get("/", getCases);
router.get("/:id", getCaseById);
router.post("/", createCase);
router.put("/:id", updateCase);
router.delete("/:id", deleteCase);

export default router;
